import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import katex from 'katex';
import { AiService } from '../../services/ai.service';
import { ChatMessage, ImageAttachment } from '../../models/ai.models';

/**
 * AI Chat Component
 *
 * Provides a chat interface for interacting with the Ollama LLM on Mimir.
 * When on the Automobiles domain, the AI is aware of the backend API and can
 * translate natural language into database queries. On other domains or pages,
 * it operates as a general-purpose assistant.
 *
 * API context is managed by AppComponent based on the current route.
 */
@Component({
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  /** Output: emits when user closes the chat panel */
  @Output() closeChat = new EventEmitter<void>();

  private readonly destroy$ = new Subject<void>();

  /** Cache for rendered LaTeX content to avoid re-rendering */
  private readonly renderedCache = new Map<string, SafeHtml>();

  /** User's current message input (regular property for ngModel binding) */
  userMessage = '';

  /** Pending image attachment from clipboard paste */
  pendingImage: ImageAttachment | null = null;

  /** Whether the chat panel is expanded */
  isExpanded = true;

  /** Connection status to Ollama */
  connectionStatus: 'checking' | 'connected' | 'disconnected' = 'checking';

  constructor(
    public aiService: AiService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  /** Get messages from service */
  get messages(): ChatMessage[] {
    return this.aiService.messages;
  }

  /** Get loading state from service */
  get isLoading(): boolean {
    return this.aiService.isLoading;
  }

  /** Get error from service */
  get error(): string | undefined {
    return this.aiService.error;
  }

  /** Check if there are messages */
  get hasMessages(): boolean {
    return this.messages.length > 0;
  }

  /** Check if API context is active (Automobiles domain) */
  get hasApiContext(): boolean {
    return this.aiService.hasApiContext;
  }

  /** Check if DeepSeek mode is enabled */
  get isDeepSeekMode(): boolean {
    return this.aiService.isDeepSeekMode;
  }

  ngOnInit(): void {
    // API context is now managed by AppComponent based on route
    // Check connection to Ollama
    this.checkConnection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check connection to Ollama on Mimir
   */
  checkConnection(): void {
    this.connectionStatus = 'checking';
    this.aiService.checkHealth()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isConnected => {
        this.connectionStatus = isConnected ? 'connected' : 'disconnected';
        this.cdr.markForCheck();
      });
  }

  /**
   * Send the current message
   */
  sendMessage(): void {
    const message = this.userMessage.trim();
    const image = this.pendingImage;

    // Must have either message or image
    if ((!message && !image) || this.isLoading) {
      return;
    }

    this.userMessage = '';
    const images = image ? [image] : undefined;
    this.pendingImage = null;

    this.aiService.sendMessage(message || 'What is in this image?', images)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.scrollToBottom();
          this.cdr.markForCheck();
          // Note: Query extraction still works but cannot be auto-applied
          // since the chat is now global and not tied to a specific page
        },
        error: () => {
          // Error is handled by the service and displayed via error getter
          this.scrollToBottom();
          this.cdr.markForCheck();
        }
      });

    // Scroll to show user message immediately
    setTimeout(() => this.scrollToBottom(), 50);
  }

  /**
   * Handle keyboard events in the input
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Handle paste events to capture images from clipboard
   */
  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          this.processImageFile(file);
        }
        return;
      }
    }
  }

  /**
   * Process an image file and convert to base64
   */
  private processImageFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Extract base64 data without the data URL prefix
      const base64Data = dataUrl.split(',')[1];
      this.pendingImage = {
        data: base64Data,
        mimeType: file.type
      };
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove the pending image attachment
   */
  clearPendingImage(): void {
    this.pendingImage = null;
  }

  /**
   * Get data URL for displaying the pending image
   */
  getPendingImageUrl(): string | null {
    const image = this.pendingImage;
    if (!image) return null;
    return `data:${image.mimeType};base64,${image.data}`;
  }

  /**
   * Clear the chat session
   */
  clearChat(): void {
    this.aiService.clearSession();
    this.cdr.markForCheck();
  }

  /**
   * Close the chat panel completely
   */
  close(): void {
    this.closeChat.emit();
  }

  /**
   * Toggle chat panel expansion
   */
  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  /**
   * Retry connection to Ollama
   */
  retryConnection(): void {
    this.checkConnection();
  }

  /**
   * Toggle DeepSeek reasoning model
   */
  toggleDeepSeek(): void {
    this.aiService.toggleDeepSeekMode();
    this.cdr.markForCheck();
  }

  /**
   * Use an example query - populate input and send
   */
  useExampleQuery(query: string): void {
    if (this.isLoading || this.connectionStatus !== 'connected') {
      return;
    }

    this.userMessage = query;
    this.sendMessage();
  }

  /**
   * Get CSS class for message based on role
   */
  getMessageClass(message: ChatMessage): string {
    return `message message-${message.role}`;
  }

  /**
   * Format timestamp for display
   */
  formatTime(timestamp?: Date): string {
    if (!timestamp) return '';
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Render message content with LaTeX support
   * Converts \[...\] (display) and \(...\) (inline) LaTeX to rendered HTML
   */
  renderContent(content: string): SafeHtml {
    // Check cache first
    const cached = this.renderedCache.get(content);
    if (cached) {
      return cached;
    }

    let rendered = this.escapeHtml(content);

    // Render display math: \[...\]
    rendered = rendered.replace(/\\\[([\s\S]*?)\\\]/g, (_, latex) => {
      try {
        return katex.renderToString(latex.trim(), {
          displayMode: true,
          throwOnError: false,
          output: 'html'
        });
      } catch {
        return `\\[${latex}\\]`;
      }
    });

    // Render inline math: \(...\)
    rendered = rendered.replace(/\\\(([\s\S]*?)\\\)/g, (_, latex) => {
      try {
        return katex.renderToString(latex.trim(), {
          displayMode: false,
          throwOnError: false,
          output: 'html'
        });
      } catch {
        return `\\(${latex}\\)`;
      }
    });

    // Convert newlines to <br> for proper display
    rendered = rendered.replace(/\n/g, '<br>');

    const result = this.sanitizer.bypassSecurityTrustHtml(rendered);
    this.renderedCache.set(content, result);
    return result;
  }

  /**
   * Escape HTML special characters to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Scroll messages container to bottom
   */
  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer?.nativeElement) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}
