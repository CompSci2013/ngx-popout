/**
 * AI Service Models
 *
 * Interfaces for communication with Ollama LLM API on Mimir.
 */

/**
 * Role in a chat conversation
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * Image attachment for multimodal messages
 */
export interface ImageAttachment {
  /** Base64-encoded image data (without data URL prefix) */
  data: string;
  /** MIME type (e.g., 'image/png', 'image/jpeg') */
  mimeType: string;
}

/**
 * A single message in a chat conversation
 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp?: Date;
  /** Extracted query parameters from AI response (Phase 2) */
  extractedQuery?: ExtractedQuery;
  /** Image attachments for multimodal messages */
  images?: ImageAttachment[];
}

/**
 * Query parameters extracted from AI response (Phase 2)
 */
export interface ExtractedQuery {
  /** The filter parameters to apply */
  filters: Record<string, any>;
  /** Human-readable description of what this query does */
  description: string;
  /** Whether the query has been applied */
  applied?: boolean;
}

/**
 * Configuration for the AI service
 */
export interface AiServiceConfig {
  /** Ollama host URL (e.g., 'http://192.168.0.100:11434') */
  host: string;
  /** Model name (e.g., 'llama3.1:7b') */
  model: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Temperature for response randomness (0-1) */
  temperature?: number;
}

/**
 * Request body for Ollama /api/generate endpoint
 */
export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
    top_k?: number;
    top_p?: number;
  };
  system?: string;
  context?: number[];
}

/**
 * Response from Ollama /api/generate endpoint (non-streaming)
 */
export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Request body for Ollama /api/chat endpoint
 */
export interface OllamaChatRequest {
  model: string;
  messages: Array<{
    role: ChatRole;
    content: string;
    /** Base64-encoded images for multimodal models (e.g., llava) */
    images?: string[];
  }>;
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
    top_k?: number;
    top_p?: number;
  };
}

/**
 * Response from Ollama /api/chat endpoint (non-streaming)
 */
export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: ChatRole;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * State of an AI chat session
 */
export interface ChatSession {
  /** Unique session ID */
  id: string;
  /** Conversation history */
  messages: ChatMessage[];
  /** Whether a request is in flight */
  isLoading: boolean;
  /** Last error message if any */
  error?: string;
  /** Ollama context for conversation continuity */
  context?: number[];
}

/**
 * API context for Phase 2 - backend-aware AI
 */
export interface ApiContext {
  /** Base URL for the API */
  baseUrl: string;
  /** Available endpoints with their parameters */
  endpoints: ApiEndpointInfo[];
  /** Domain-specific field names and types */
  fields: ApiFieldInfo[];
}

/**
 * Information about an API endpoint
 */
export interface ApiEndpointInfo {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Endpoint path */
  path: string;
  /** Description of what this endpoint does */
  description: string;
  /** Available query parameters */
  parameters: ApiParameterInfo[];
}

/**
 * Information about an API parameter
 */
export interface ApiParameterInfo {
  name: string;
  type: 'string' | 'integer' | 'boolean' | 'array';
  required: boolean;
  description: string;
  example?: string | number | boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

/**
 * Information about a data field
 */
export interface ApiFieldInfo {
  name: string;
  type: string;
  description: string;
  examples?: string[];
}
