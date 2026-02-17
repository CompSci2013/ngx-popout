import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, map, timeout, tap, finalize } from 'rxjs/operators';
import {
  ChatMessage,
  ChatSession,
  OllamaChatRequest,
  OllamaChatResponse,
  AiServiceConfig,
  ApiContext,
  ExtractedQuery,
  ImageAttachment
} from '../models/ai.models';

/**
 * AI Service for communicating with Ollama LLM on Mimir
 *
 * Phase 1: Basic chat functionality
 * Phase 2: Backend-aware query translation
 * Phase 3: Multimodal support with dynamic model selection
 */
@Injectable({
  providedIn: 'root'
})
export class AiService {
  /** Ollama host URL */
  private readonly OLLAMA_HOST = 'http://192.168.0.100:11434';

  /** Default text model for chat queries */
  private readonly TEXT_MODEL = 'qwen2.5-coder:14b';

  /** Vision model for image analysis */
  private readonly VISION_MODEL = 'llama4:scout';

  /** DeepSeek reasoning model */
  private readonly DEEPSEEK_MODEL = 'deepseek-r1:70b-llama-distill-q8_0';

  /** Default configuration for Mimir Ollama instance */
  private readonly defaultConfig: AiServiceConfig = {
    host: this.OLLAMA_HOST,
    model: this.TEXT_MODEL,
    timeout: 120000, // 2 minutes
    temperature: 0.7
  };

  /** Current configuration */
  private config$ = new BehaviorSubject<AiServiceConfig>(this.defaultConfig);

  /** Active chat session */
  private session$ = new BehaviorSubject<ChatSession>({
    id: this.generateSessionId(),
    messages: [],
    isLoading: false
  });

  /** API context for Phase 2 */
  private apiContext$ = new BehaviorSubject<ApiContext | null>(null);

  /** Track if models have been preloaded */
  private modelsPreloaded = false;

  /** DeepSeek mode toggle - uses reasoning model instead of default */
  private deepSeekMode$ = new BehaviorSubject<boolean>(false);

  /** Observable: current messages */
  public get messages$(): Observable<ChatMessage[]> {
    return this.session$.pipe(map(s => s.messages));
  }

  /** Observable: loading state */
  public get isLoading$(): Observable<boolean> {
    return this.session$.pipe(map(s => s.isLoading));
  }

  /** Observable: last error */
  public get error$(): Observable<string | undefined> {
    return this.session$.pipe(map(s => s.error));
  }

  /** Observable: has API context configured */
  public get hasApiContext$(): Observable<boolean> {
    return this.apiContext$.pipe(map(ctx => ctx !== null));
  }

  /** Observable: is DeepSeek mode enabled */
  public get isDeepSeekMode$(): Observable<boolean> {
    return this.deepSeekMode$.asObservable();
  }

  /** Synchronous getters for template compatibility */
  public get messages(): ChatMessage[] {
    return this.session$.getValue().messages;
  }

  public get isLoading(): boolean {
    return this.session$.getValue().isLoading;
  }

  public get error(): string | undefined {
    return this.session$.getValue().error;
  }

  public get hasApiContext(): boolean {
    return this.apiContext$.getValue() !== null;
  }

  public get isDeepSeekMode(): boolean {
    return this.deepSeekMode$.getValue();
  }

  /** Subject for streaming responses (future enhancement) */
  private responseStream$ = new Subject<string>();

  constructor(private http: HttpClient) {
    // Preload both models on service initialization
    this.preloadModels();
  }

  /**
   * Preload both text and vision models to keep them warm in memory
   * This prevents cold-start delays when switching between models
   */
  private preloadModels(): void {
    if (this.modelsPreloaded) return;

    console.log('🔄 Preloading AI models on Mimir...');

    // Preload text model with a minimal request
    this.preloadModel(this.TEXT_MODEL);

    // Preload vision model with a minimal request
    this.preloadModel(this.VISION_MODEL);

    this.modelsPreloaded = true;
  }

  /**
   * Send a request to load a model and keep it in memory indefinitely
   * Uses keep_alive: -1 to prevent Ollama from unloading the model
   */
  private preloadModel(modelName: string): void {
    const endpoint = `${this.OLLAMA_HOST}/api/generate`;
    const request = {
      model: modelName,
      prompt: 'hi',
      stream: false,
      keep_alive: -1,  // Keep model loaded indefinitely
      options: {
        num_predict: 1  // Generate minimal tokens
      }
    };

    this.http.post(endpoint, request)
      .pipe(
        timeout(120000), // 2 minute timeout for loading large models
        catchError(error => {
          console.warn(`⚠️ Failed to preload model ${modelName}:`, error.message || error);
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          console.log(`✅ Model ${modelName} preloaded and pinned in memory`);
        }
      });
  }

  /**
   * Select the appropriate model based on whether images are present and DeepSeek mode
   */
  private selectModel(hasImages: boolean): string {
    if (this.deepSeekMode$.getValue()) {
      return this.DEEPSEEK_MODEL;
    }
    return hasImages ? this.VISION_MODEL : this.TEXT_MODEL;
  }

  /**
   * Get timeout based on current mode (DeepSeek needs extra time)
   */
  private getTimeout(): number {
    const baseTimeout = this.config$.getValue().timeout || 120000;
    // Add 2 minutes (120000ms) for DeepSeek - it's a larger, slower model
    return this.deepSeekMode$.getValue() ? baseTimeout + 120000 : baseTimeout;
  }

  /**
   * Configure the AI service
   */
  configure(config: Partial<AiServiceConfig>): void {
    const current = this.config$.getValue();
    this.config$.next({
      ...current,
      ...config
    });
  }

  /**
   * Set API context for Phase 2 backend-aware queries
   */
  setApiContext(context: ApiContext): void {
    this.apiContext$.next(context);
  }

  /**
   * Clear API context (reverts to basic chat mode)
   */
  clearApiContext(): void {
    this.apiContext$.next(null);
  }

  /**
   * Toggle DeepSeek reasoning model mode
   */
  toggleDeepSeekMode(): void {
    const current = this.deepSeekMode$.getValue();
    this.deepSeekMode$.next(!current);
    console.log(`🧠 DeepSeek mode: ${!current ? 'ON' : 'OFF'}`);
  }

  /**
   * Send a message and get a response
   * @param userMessage - The text message from the user
   * @param images - Optional image attachments for multimodal models
   */
  sendMessage(userMessage: string, images?: ImageAttachment[]): Observable<ChatMessage> {
    if (!userMessage.trim() && (!images || images.length === 0)) {
      return throwError(() => new Error('Message cannot be empty'));
    }

    const requestId = this.generateRequestId();
    const startTime = performance.now();

    // Log user question
    console.group(`🤖 AI Chat Request [${requestId}]`);
    console.log('📝 User Question:', userMessage.trim());
    if (images?.length) {
      console.log('🖼️ Images attached:', images.length);
    }
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Add user message to session
    const userChatMessage: ChatMessage = {
      role: 'user',
      content: userMessage.trim(),
      timestamp: new Date(),
      images: images
    };

    const currentSession = this.session$.getValue();
    this.session$.next({
      ...currentSession,
      messages: [...currentSession.messages, userChatMessage],
      isLoading: true,
      error: undefined
    });

    // Build the request
    const request = this.buildChatRequest(userMessage, images);
    const endpoint = `${this.config$.getValue().host}/api/chat`;

    // Log request details
    console.log('🌐 Endpoint:', endpoint);
    console.log('📤 Request Payload:', {
      model: request.model,
      stream: request.stream,
      options: request.options,
      messageCount: request.messages.length,
      messages: request.messages.map(m => ({
        role: m.role,
        contentLength: m.content.length,
        contentPreview: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '')
      }))
    });
    console.log('📤 Full Request (for debugging):', JSON.stringify(request, null, 2));

    return this.http
      .post<OllamaChatResponse>(endpoint, request)
      .pipe(
        timeout(this.getTimeout()),
        tap(response => {
          const duration = ((performance.now() - startTime) / 1000).toFixed(2);
          console.log('📥 Response received after', duration, 'seconds');
          console.log('📥 Response Data:', {
            model: response.model,
            createdAt: response.created_at,
            totalDuration: response.total_duration,
            loadDuration: response.load_duration,
            promptEvalCount: response.prompt_eval_count,
            evalCount: response.eval_count,
            messageRole: response.message?.role,
            messageContentLength: response.message?.content?.length,
            messagePreview: response.message?.content?.substring(0, 200) + (response.message?.content?.length > 200 ? '...' : '')
          });
          console.log('📥 Full Response (for debugging):', JSON.stringify(response, null, 2));
        }),
        map(response => this.processResponse(response)),
        tap(assistantMessage => {
          console.log('✅ Assistant Response:', assistantMessage.content);
          console.groupEnd();

          const session = this.session$.getValue();
          this.session$.next({
            ...session,
            messages: [...session.messages, assistantMessage],
            isLoading: false
          });
        }),
        catchError(error => {
          console.error('❌ Request failed:', error);
          console.groupEnd();
          return this.handleError(error);
        }),
        finalize(() => {
          const session = this.session$.getValue();
          this.session$.next({
            ...session,
            isLoading: false
          });
        })
      );
  }

  /**
   * Summarize query results with a human-friendly response
   * This is called after Elasticsearch returns data
   */
  summarizeResults(resultsSummary: string): Observable<ChatMessage> {
    const requestId = this.generateRequestId();
    const startTime = performance.now();

    console.group(`🤖 AI Results Summary [${requestId}]`);
    console.log('📊 Results Summary:', resultsSummary);

    // Set loading state
    const currentSession = this.session$.getValue();
    this.session$.next({
      ...currentSession,
      isLoading: true,
      error: undefined
    });

    // Build request with results context
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      {
        role: 'system',
        content: `You are summarizing database query results for a user.
Given the query results below, provide a brief, friendly 1-2 sentence summary.
Focus on the total count and any interesting patterns in the data.
Do NOT include any JSON or technical details - just a natural language summary.
Do NOT use phrases like "Based on the query" - just state the results directly.`
      },
      {
        role: 'user',
        content: resultsSummary
      }
    ];

    const request: OllamaChatRequest = {
      model: this.config$.getValue().model,
      messages,
      stream: false,
      options: {
        temperature: 0.7
      }
    };

    const endpoint = `${this.config$.getValue().host}/api/chat`;

    return this.http
      .post<OllamaChatResponse>(endpoint, request)
      .pipe(
        timeout(this.getTimeout()),
        tap(response => {
          const duration = ((performance.now() - startTime) / 1000).toFixed(2);
          console.log('📥 Summary received after', duration, 'seconds');
        }),
        map(response => {
          const content = response.message.content;
          return {
            role: 'assistant' as const,
            content: content.trim(),
            timestamp: new Date()
          };
        }),
        tap(assistantMessage => {
          console.log('✅ Summary Response:', assistantMessage.content);
          console.groupEnd();

          // Replace the last assistant message (which was the placeholder)
          // with the actual summary
          const session = this.session$.getValue();
          const messages = [...session.messages];
          // Find and update the last assistant message
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'assistant') {
              messages[i] = assistantMessage;
              break;
            }
          }
          this.session$.next({
            ...session,
            messages,
            isLoading: false
          });
        }),
        catchError(error => {
          console.error('❌ Summary request failed:', error);
          console.groupEnd();
          return this.handleError(error);
        }),
        finalize(() => {
          const session = this.session$.getValue();
          this.session$.next({
            ...session,
            isLoading: false
          });
        })
      );
  }

  /**
   * Generate a unique request ID for logging
   */
  private generateRequestId(): string {
    return `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  }

  /**
   * Clear the chat session
   */
  clearSession(): void {
    this.session$.next({
      id: this.generateSessionId(),
      messages: [],
      isLoading: false
    });
  }

  /**
   * Get the current session
   */
  getSession(): ChatSession {
    return this.session$.getValue();
  }

  /**
   * Check if Ollama is available
   */
  checkHealth(): Observable<boolean> {
    const endpoint = `${this.config$.getValue().host}/api/tags`;
    console.log('🔍 AI Health Check:', endpoint);

    return this.http
      .get(`${this.config$.getValue().host}/api/tags`, { responseType: 'json' })
      .pipe(
        timeout(5000),
        tap(() => console.log('✅ AI Health Check: Connected')),
        map(() => true),
        catchError(error => {
          console.warn('⚠️ AI Health Check: Disconnected', error.message || error);
          return of(false);
        })
      );
  }

  /**
   * Get available models from Ollama
   */
  getAvailableModels(): Observable<string[]> {
    const endpoint = `${this.config$.getValue().host}/api/tags`;
    console.log('📋 Fetching available models from:', endpoint);

    return this.http
      .get<{ models: Array<{ name: string }> }>(endpoint)
      .pipe(
        timeout(10000),
        tap(response => console.log('📋 Available models:', response.models.map(m => m.name))),
        map(response => response.models.map(m => m.name)),
        catchError(error => {
          console.warn('⚠️ Failed to fetch models:', error.message || error);
          return of([]);
        })
      );
  }

  /**
   * Build the chat request with optional system context and images
   */
  private buildChatRequest(userMessage: string, images?: ImageAttachment[]): OllamaChatRequest {
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; images?: string[] }> = [];

    // Add system message with API context if available (Phase 2)
    const systemPrompt = this.buildSystemPrompt();
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    // Add conversation history (last 10 messages for context)
    const history = this.session$.getValue().messages.slice(-10);
    for (const msg of history) {
      const historyMsg: { role: 'user' | 'assistant' | 'system'; content: string; images?: string[] } = {
        role: msg.role,
        content: msg.content
      };
      // Include images from history if present
      if (msg.images?.length) {
        historyMsg.images = msg.images.map(img => img.data);
      }
      messages.push(historyMsg);
    }

    // Add current user message with images
    const userMsg: { role: 'user' | 'assistant' | 'system'; content: string; images?: string[] } = {
      role: 'user',
      content: userMessage
    };
    if (images?.length) {
      userMsg.images = images.map(img => img.data);
    }
    messages.push(userMsg);

    // Select model based on whether images are present
    const hasImages = !!(images?.length);
    const selectedModel = this.selectModel(hasImages);

    if (hasImages) {
      console.log(`🖼️ Using vision model: ${selectedModel}`);
    } else {
      console.log(`💬 Using text model: ${selectedModel}`);
    }

    return {
      model: selectedModel,
      messages,
      stream: false,
      options: {
        temperature: this.config$.getValue().temperature
      }
    };
  }

  /**
   * Build system prompt for Phase 2 API-aware queries
   */
  private buildSystemPrompt(): string | null {
    const context = this.apiContext$.getValue();

    if (!context) {
      // Generic assistant mode - no domain-specific context
      return `You are a helpful AI assistant.
Be concise and helpful in your responses.
You can answer general questions, help with coding, explain concepts, and have conversations.`;
    }

    // API-aware assistant
    return `You are an intelligent assistant for a vehicle database application.
You help users search and explore vehicle data using natural language.

## Available Data

The database contains vehicle specifications with these fields:
${context.fields.map(f => `- ${f.name}: ${f.description}${f.examples ? ` (e.g., ${f.examples.slice(0, 3).join(', ')})` : ''}`).join('\n')}

## How to Respond

When users ask about vehicles, you MUST:
1. Write a brief, friendly response describing what you're searching for
2. Include a hidden JSON query block that the system will parse (users won't see this)

IMPORTANT: Your visible response should be conversational and brief - just 1-2 sentences.
Do NOT explain the query parameters or show technical details to the user.

The JSON block format (this will be stripped from the displayed message):
\`\`\`json:query
{
  "filters": {
    "manufacturer": "value",
    "yearMin": 2020,
    "yearMax": 2024,
    "bodyClass": "value"
  },
  "description": "Brief description"
}
\`\`\`

Available filter parameters:
- manufacturer: Filter by manufacturer name (Chevrolet, Ford, GMC, Buick, etc.)
- model: Filter by model name
- yearMin/yearMax: Year range (database spans 1908-2024)
- bodyClass: Body type (Sedan, SUV, Pickup, Coupe, etc.)
- instanceCountMin/instanceCountMax: VIN record count range
- search: Global text search

## Example Responses

User: "Show me Ford trucks from 2020"
Response: "Searching for Ford trucks from 2020..."
\`\`\`json:query
{"filters":{"manufacturer":"Ford","bodyClass":"Pickup","yearMin":2020,"yearMax":2020},"description":"Ford pickup trucks from 2020"}
\`\`\`

User: "What Chevrolet models are available?"
Response: "Here are the available Chevrolet models in the database."
\`\`\`json:query
{"filters":{"manufacturer":"Chevrolet"},"description":"All Chevrolet vehicles"}
\`\`\`

Remember: Keep your visible response SHORT. The results will speak for themselves.`;
  }

  /**
   * Process the Ollama response
   */
  private processResponse(response: OllamaChatResponse): ChatMessage {
    const rawContent = response.message.content;
    const extractedQuery = this.extractQueryFromResponse(rawContent);

    // Strip the JSON query block from the displayed content
    const displayContent = this.stripQueryBlock(rawContent);

    if (extractedQuery) {
      console.log('🎯 Extracted Query:', extractedQuery);
    }

    return {
      role: 'assistant',
      content: displayContent,
      timestamp: new Date(),
      extractedQuery
    };
  }

  /**
   * Strip JSON query blocks from content so users don't see them
   */
  private stripQueryBlock(content: string): string {
    // Remove ```json:query ... ``` blocks
    let cleaned = content.replace(/```json:query\s*[\s\S]*?```/gi, '');

    // Also remove plain ```json blocks that look like queries
    cleaned = cleaned.replace(/```json\s*\{[\s\S]*?"filters"[\s\S]*?\}[\s\S]*?```/gi, '');

    // Clean up extra whitespace left behind
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    return cleaned;
  }

  /**
   * Extract JSON query block from AI response (Phase 2)
   * Looks for ```json:query ... ``` blocks
   */
  private extractQueryFromResponse(content: string): ExtractedQuery | undefined {
    // Match ```json:query ... ``` blocks
    const queryBlockRegex = /```json:query\s*([\s\S]*?)```/i;
    const match = content.match(queryBlockRegex);

    if (!match) {
      // Also try plain ```json blocks as fallback
      const fallbackRegex = /```json\s*([\s\S]*?)```/i;
      const fallbackMatch = content.match(fallbackRegex);
      if (fallbackMatch) {
        return this.parseQueryJson(fallbackMatch[1]);
      }
      return undefined;
    }

    return this.parseQueryJson(match[1]);
  }

  /**
   * Parse and validate query JSON
   */
  private parseQueryJson(jsonStr: string): ExtractedQuery | undefined {
    try {
      const parsed = JSON.parse(jsonStr.trim());

      // Validate structure
      if (!parsed.filters || typeof parsed.filters !== 'object') {
        console.warn('⚠️ Invalid query JSON: missing or invalid filters object');
        return undefined;
      }

      // Validate filter keys against known parameters
      const validKeys = [
        'manufacturer', 'model', 'yearMin', 'yearMax',
        'bodyClass', 'instanceCountMin', 'instanceCountMax',
        'search', 'models', 'page', 'size', 'sortBy', 'sortOrder'
      ];

      const filters: Record<string, any> = {};
      for (const [key, value] of Object.entries(parsed.filters)) {
        if (validKeys.includes(key) && value !== null && value !== undefined && value !== '') {
          filters[key] = value;
        } else if (!validKeys.includes(key)) {
          console.warn(`⚠️ Unknown filter key ignored: ${key}`);
        }
      }

      if (Object.keys(filters).length === 0) {
        console.warn('⚠️ No valid filters found in query JSON');
        return undefined;
      }

      return {
        filters,
        description: parsed.description || 'Query extracted from AI response',
        applied: false
      };
    } catch (e) {
      console.warn('⚠️ Failed to parse query JSON:', e);
      return undefined;
    }
  }

  /**
   * Handle errors from Ollama API
   */
  private handleError(error: HttpErrorResponse | Error): Observable<never> {
    let errorMessage = 'An error occurred communicating with the AI service';

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        errorMessage = 'Cannot connect to AI service. Please check if Ollama is running on Mimir.';
      } else if (error.status === 404) {
        errorMessage = `Model '${this.config$.getValue().model}' not found. Please ensure it is pulled on Mimir.`;
      } else if (error.status === 500) {
        errorMessage = 'AI service error. The model may be loading or out of memory.';
      } else {
        errorMessage = error.message || errorMessage;
      }
    } else if (error.name === 'TimeoutError') {
      errorMessage = 'AI request timed out. The model may be busy or the query too complex.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const session = this.session$.getValue();
    this.session$.next({
      ...session,
      error: errorMessage,
      isLoading: false
    });

    console.error('AI Service Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Factory function to create API context for the automobile domain
 *
 * NOTE: Examples are based on ACTUAL data from the Elasticsearch database.
 * Data was queried from the backend API:
 * - Manufacturers: /api/specs/v1/filters/manufacturers
 * - Body classes: /api/specs/v1/filters/body-classes
 * - Year range: /api/specs/v1/filters/year-range
 */
export function createAutomobileApiContext(): ApiContext {
  return {
    baseUrl: 'http://generic-prime.minilab/api/specs/v1',
    endpoints: [
      {
        method: 'GET',
        path: '/vehicles/details',
        description: 'Search and retrieve vehicle specifications',
        parameters: [
          { name: 'manufacturer', type: 'string', required: false, description: 'Filter by manufacturer name', example: 'Ford' },
          { name: 'model', type: 'string', required: false, description: 'Filter by model name', example: 'F-150' },
          { name: 'yearMin', type: 'integer', required: false, description: 'Minimum year (inclusive)', example: 2015, validation: { min: 1908 } },
          { name: 'yearMax', type: 'integer', required: false, description: 'Maximum year (inclusive)', example: 2024 },
          { name: 'bodyClass', type: 'string', required: false, description: 'Filter by body class', example: 'Pickup' },
          { name: 'instanceCountMin', type: 'integer', required: false, description: 'Minimum VIN instances', example: 10, validation: { min: 0, max: 10000 } },
          { name: 'instanceCountMax', type: 'integer', required: false, description: 'Maximum VIN instances', example: 1000, validation: { min: 0, max: 10000 } },
          { name: 'search', type: 'string', required: false, description: 'Global search across all fields', example: 'Ford F-150' },
          { name: 'models', type: 'string', required: false, description: 'Comma-separated manufacturer:model pairs', example: 'Ford:F-150,Chevrolet:Silverado' },
          { name: 'page', type: 'integer', required: false, description: 'Page number (1-indexed)', example: 1, validation: { min: 1 } },
          { name: 'size', type: 'integer', required: false, description: 'Results per page', example: 20, validation: { min: 1, max: 100 } },
          { name: 'sortBy', type: 'string', required: false, description: 'Field to sort by', example: 'manufacturer' },
          { name: 'sortOrder', type: 'string', required: false, description: 'Sort direction', example: 'asc', validation: { enum: ['asc', 'desc'] } }
        ]
      },
      {
        method: 'GET',
        path: '/filters/manufacturers',
        description: 'Get list of available manufacturers',
        parameters: []
      },
      {
        method: 'GET',
        path: '/filters/models',
        description: 'Get list of available models',
        parameters: []
      },
      {
        method: 'GET',
        path: '/filters/body-classes',
        description: 'Get list of available body classes',
        parameters: []
      },
      {
        method: 'GET',
        path: '/filters/year-range',
        description: 'Get available year range',
        parameters: []
      }
    ],
    fields: [
      { name: 'vehicle_id', type: 'string', description: 'Unique vehicle identifier' },
      {
        name: 'manufacturer',
        type: 'string',
        description: 'Vehicle manufacturer - American brands dominate the database',
        examples: ['Chevrolet', 'Ford', 'GMC', 'Buick', 'Cadillac', 'Pontiac', 'Dodge', 'Chrysler', 'Jeep', 'Lincoln', 'Ram', 'Tesla', 'Rivian']
      },
      {
        name: 'model',
        type: 'string',
        description: 'Vehicle model name',
        examples: ['F-150', 'Silverado', 'Sierra', 'Camaro', 'Mustang', 'Corvette', 'Model 3', 'Wrangler']
      },
      {
        name: 'year',
        type: 'integer',
        description: 'Model year (database spans 1908 to 2024)',
        examples: ['1908', '1950', '2000', '2020', '2024']
      },
      {
        name: 'body_class',
        type: 'string',
        description: 'Vehicle body type classification',
        examples: ['Sedan', 'SUV', 'Pickup', 'Coupe', 'Hatchback', 'Wagon', 'Van', 'Truck', 'Convertible', 'Sports Car']
      },
      { name: 'instance_count', type: 'integer', description: 'Number of VIN records for this vehicle configuration' },
      { name: 'drive_type', type: 'string', description: 'Drive configuration', examples: ['FWD', 'RWD', 'AWD', '4WD'] },
      { name: 'engine', type: 'string', description: 'Engine type', examples: ['I4', 'V6', 'V8', 'Electric'] },
      { name: 'transmission', type: 'string', description: 'Transmission type', examples: ['Automatic', 'Manual', 'CVT'] },
      { name: 'fuel_type', type: 'string', description: 'Fuel type', examples: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'] }
    ]
  };
}
