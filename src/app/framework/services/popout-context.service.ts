import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, ReplaySubject } from 'rxjs';
import {
  PopOutMessage,
  PopOutMessageType,
  PopOutContext,
  parsePopOutRoute
} from '../models/popout.interface';

/**
 * PopOut Context Service
 *
 * Centralized service for pop-out window detection and cross-window communication.
 * Uses BroadcastChannel API for efficient cross-window messaging.
 *
 * **Architecture**:
 * - One BroadcastChannel per panel: `panel-${panelId}`
 * - Main window creates channel when opening pop-out
 * - Pop-out window creates channel in ngOnInit
 * - Both windows communicate via same channel name
 *
 * **Usage in Pop-Out Window**:
 * ```typescript
 * ngOnInit(): void {
 *   this.popOutContext.initializeAsPopOut(panelId);
 *   this.popOutContext.getMessages$()
 *     .subscribe(msg => this.handleMessage(msg));
 * }
 * ```
 *
 * **Usage in Main Window**:
 * ```typescript
 * ngOnInit(): void {
 *   this.popOutContext.initializeAsParent();
 *   this.popOutContext.getMessages$()
 *     .subscribe(msg => this.handlePopOutMessage(msg));
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Check if current window is a pop-out
 * if (this.popOutContext.isInPopOut()) {
 *   console.log('Running in pop-out window');
 * }
 *
 * // Send message from pop-out to main
 * this.popOutContext.sendMessage({
 *   type: PopOutMessageType.PANEL_READY
 * });
 *
 * // Send message from main to pop-out
 * this.popOutContext.sendMessage({
 *   type: PopOutMessageType.STATE_UPDATE,
 *   payload: { state: currentState }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class PopOutContextService implements OnDestroy {
  /**
   * BroadcastChannel for cross-window communication
   *
   * Holds the BroadcastChannel instance used for efficient cross-window messaging.
   * Null when not initialized. Created by setupChannel() and cleaned up on destroy.
   *
   * @private
   */
  private channel: BroadcastChannel | null = null;

  /**
   * Subject for received messages
   *
   * RxJS ReplaySubject that buffers PopOutMessage instances received via BroadcastChannel.
   * Buffers last 10 messages to handle late subscribers (e.g., QueryControlComponent initializing after
   * PanelPopoutComponent sends PANEL_READY). This prevents race conditions where STATE_UPDATE messages
   * arrive before child components subscribe.
   *
   * Subscribers use getMessages$() to receive observable stream.
   *
   * @private
   */
  private messagesSubject = new ReplaySubject<PopOutMessage>(10);

  /**
   * Current pop-out context
   *
   * Cached result of parsePopOutRoute(). Lazily initialized from router URL.
   * Identifies panel ID, panel type, and whether current window is a pop-out.
   *
   * @private
   */
  private context: PopOutContext | null = null;

  /**
   * Service initialization flag
   *
   * Prevents double initialization when initializeAsPopOut() or initializeAsParent()
   * is called multiple times. Set to true after first initialization.
   *
   * @private
   */
  private initialized = false;

  /**
   * Constructor for dependency injection
   *
   * Automatically parses the current router URL to detect if running in a pop-out.
   *
   * @param router - Angular Router for URL-based pop-out detection
   * @param ngZone - Angular NgZone for running BroadcastChannel callbacks in zone
   */
  constructor(
    private router: Router,
    private ngZone: NgZone
  ) {
    // Parse context on service creation
    this.context = parsePopOutRoute(this.router.url);
  }

  /**
   * Check if current window is a pop-out
   *
   * Detection: Checks if router.url starts with '/panel/'
   *
   * @returns True if current window is a pop-out
   *
   * @example
   * ```typescript
   * if (this.popOutContext.isInPopOut()) {
   *   // Hide certain UI elements in pop-out
   *   this.showNavigation = false;
   * }
   * ```
   */
  isInPopOut(): boolean {
    if (!this.context) {
      this.context = parsePopOutRoute(this.router.url);
    }
    return this.context?.isPopOut || false;
  }

  /**
   * Get current pop-out context
   *
   * @returns Pop-out context or null if not a pop-out
   *
   * @example
   * ```typescript
   * const context = this.popOutContext.getContext();
   * if (context) {
   *   console.log(`Panel: ${context.panelId}, Type: ${context.panelType}`);
   * }
   * ```
   */
  getContext(): PopOutContext | null {
    if (!this.context) {
      this.context = parsePopOutRoute(this.router.url);
    }
    return this.context;
  }

  /**
   * Initialize as pop-out window
   *
   * Called in PanelPopoutComponent ngOnInit.
   * Sets up BroadcastChannel and announces readiness to main window.
   *
   * @param panelId - Panel identifier
   *
   * @example
   * ```typescript
   * // In PanelPopoutComponent
   * ngOnInit(): void {
   *   this.route.params.subscribe(params => {
   *     const panelId = params['panelId'];
   *     this.popOutContext.initializeAsPopOut(panelId);
   *   });
   * }
   * ```
   */
  initializeAsPopOut(panelId: string): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.setupChannel(panelId);

    // Announce readiness to main window
    this.sendMessage({
      type: PopOutMessageType.PANEL_READY,
      timestamp: Date.now()
    });
  }

  /**
   * Initialize as parent (main) window
   *
   * Called in DiscoverComponent ngOnInit.
   * Prepares service to handle messages from multiple pop-outs.
   *
   * Note: Actual BroadcastChannel instances are created per pop-out
   * in the component's popOutPanel() method.
   *
   * @example
   * ```typescript
   * // In DiscoverComponent
   * ngOnInit(): void {
   *   this.popOutContext.initializeAsParent();
   * }
   * ```
   */
  initializeAsParent(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
  }

  /**
   * Set up BroadcastChannel for a specific panel
   *
   * @param panelId - Panel identifier
   * @private
   */
  private setupChannel(panelId: string): void {
    const channelName = `panel-${panelId}`;

    // Close existing channel if any
    if (this.channel) {
      this.channel.close();
    }

    // Create new channel
    this.channel = new BroadcastChannel(channelName);

    // Set up message handler
    // BroadcastChannel callbacks run outside Angular's zone
    this.channel.onmessage = (event: MessageEvent) => {
      const message = event.data as PopOutMessage;
      // Run in Angular zone to trigger change detection
      this.ngZone.run(() => {
        this.messagesSubject.next(message);
      });
    };

    // Set up error handler
    this.channel.onmessageerror = () => {
      // Silently ignore message errors
    };
  }

  /**
   * Send message to other window
   *
   * Uses BroadcastChannel.postMessage() for efficient cross-window communication.
   *
   * @param message - Message to send
   *
   * @example
   * ```typescript
   * // Send picker selection change
   * this.popOutContext.sendMessage({
   *   type: PopOutMessageType.PICKER_SELECTION_CHANGE,
   *   payload: {
   *     configId: 'vehicle-picker',
   *     urlParam: 'selectedVehicles',
   *     urlValue: '1,2,3'
   *   },
   *   timestamp: Date.now()
   * });
   * ```
   */
  sendMessage<T = any>(message: PopOutMessage<T>): void {
    if (!this.channel) {
      return;
    }

    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    try {
      this.channel.postMessage(message);
    } catch (error) {
      // Silently ignore send errors
    }
  }

  /**
   * Get observable of received messages
   *
   * @returns Observable that emits received messages
   *
   * @example
   * ```typescript
   * // Subscribe to all messages
   * this.popOutContext.getMessages$()
   *   .pipe(takeUntil(this.destroy$))
   *   .subscribe(msg => {
   *     switch (msg.type) {
   *       case PopOutMessageType.STATE_UPDATE:
   *         this.handleStateUpdate(msg.payload);
   *         break;
   *       case PopOutMessageType.PANEL_READY:
   *         this.sendInitialState();
   *         break;
   *     }
   *   });
   *
   * // Subscribe to specific message type
   * this.popOutContext.getMessages$()
   *   .pipe(
   *     filter(msg => msg.type === PopOutMessageType.PICKER_SELECTION_CHANGE),
   *     takeUntil(this.destroy$)
   *   )
   *   .subscribe(msg => {
   *     this.handlePickerChange(msg.payload);
   *   });
   * ```
   */
  getMessages$(): Observable<PopOutMessage> {
    return this.messagesSubject.asObservable();
  }

  /**
   * Create a channel for a specific panel (used by main window)
   *
   * Returns the BroadcastChannel instance so main window can manage
   * multiple channels (one per pop-out).
   *
   * @param panelId - Panel identifier
   * @returns BroadcastChannel instance
   *
   * @example
   * ```typescript
   * // In DiscoverComponent.popOutPanel()
   * const channel = this.popOutContext.createChannelForPanel(panelId);
   * channel.onmessage = (event) => {
   *   this.handlePopOutMessage(panelId, event.data);
   * };
   * ```
   */
  createChannelForPanel(panelId: string): BroadcastChannel {
    const channelName = `panel-${panelId}`;
    const channel = new BroadcastChannel(channelName);
    return channel;
  }

  /**
   * Close channel and clean up
   *
   * Automatically called on service destroy.
   * Can also be called manually for cleanup.
   *
   * @example
   * ```typescript
   * // Manual cleanup
   * this.popOutContext.close();
   * ```
   */
  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    this.initialized = false;
  }

  /**
   * Angular lifecycle hook - cleanup on destroy
   */
  ngOnDestroy(): void {
    this.close();
    this.messagesSubject.complete();
  }
}
