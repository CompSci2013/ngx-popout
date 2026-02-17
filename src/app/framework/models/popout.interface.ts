/**
 * Pop-Out Window System Interfaces
 *
 * Type definitions for cross-window communication via BroadcastChannel API.
 * Supports MOVE semantics where panels move between main and pop-out windows.
 *
 * @example
 * ```typescript
 * // Send message from pop-out to main
 * const message: PopOutMessage = {
 *   type: 'PANEL_READY',
 *   timestamp: Date.now()
 * };
 * channel.postMessage(message);
 *
 * // Send message from main to pop-out
 * const message: PopOutMessage = {
 *   type: 'STATE_UPDATE',
 *   payload: { state: currentState },
 *   timestamp: Date.now()
 * };
 * channel.postMessage(message);
 * ```
 */

/**
 * Pop-Out Message
 *
 * Base message structure for BroadcastChannel communication.
 */
export interface PopOutMessage<T = any> {
  /**
   * Message type identifier
   * Used to route messages to appropriate handlers
   */
  type: PopOutMessageType;

  /**
   * Optional message payload
   * Type varies based on message type
   */
  payload?: T;

  /**
   * Message timestamp (milliseconds since epoch)
   * Automatically set by sender
   */
  timestamp?: number;
}

/**
 * Pop-Out Message Types
 *
 * Defines all supported message types for cross-window communication.
 */
export enum PopOutMessageType {
  // ============================================
  // Main Window → Pop-Out Messages
  // ============================================

  /**
   * Sync full application state to pop-out
   * Payload: { state: ResourceState<TFilters, TData> }
   */
  STATE_UPDATE = 'STATE_UPDATE',

  /**
   * Request pop-out window to close
   * Payload: none
   */
  CLOSE_POPOUT = 'CLOSE_POPOUT',

  // ============================================
  // Pop-Out → Main Window Messages
  // ============================================

  /**
   * Pop-out window initialized and ready
   * Sent immediately after BroadcastChannel setup
   * Payload: none
   */
  PANEL_READY = 'PANEL_READY',

  /**
   * Picker selection changed in pop-out
   * Payload: PickerSelectionPayload
   */
  PICKER_SELECTION_CHANGE = 'PICKER_SELECTION_CHANGE',

  /**
   * Add filter from Query Control in pop-out
   * Payload: QueryFilter
   */
  FILTER_ADD = 'FILTER_ADD',

  /**
   * Remove filter from Query Control in pop-out
   * Payload: { field: string, updates: Partial<QueryFilter> }
   */
  FILTER_REMOVE = 'FILTER_REMOVE',

  /**
   * Remove highlight from pop-out
   * Payload: string (highlight key)
   */
  HIGHLIGHT_REMOVE = 'HIGHLIGHT_REMOVE',

  /**
   * Clear all highlights from pop-out
   * Payload: none
   */
  CLEAR_HIGHLIGHTS = 'CLEAR_HIGHLIGHTS',

  /**
   * Clear all filters and highlights from pop-out
   * Main window should call urlState.clearParams()
   * Payload: none
   */
  CLEAR_ALL_FILTERS = 'CLEAR_ALL_FILTERS',

  /**
   * URL parameters changed in pop-out
   * Pop-out sends to main window to update URL
   * Payload: { params: Params }
   */
  URL_PARAMS_CHANGED = 'URL_PARAMS_CHANGED',

  /**
   * URL parameters updated from main window
   * Main window broadcasts to pop-outs after URL change
   * Payload: { params: Params }
   */
  URL_PARAMS_SYNC = 'URL_PARAMS_SYNC',

  /**
   * Chart click/selection from pop-out
   * Payload: { chartId: string, value: string, isHighlightMode: boolean }
   */
  CHART_CLICK = 'CHART_CLICK',
}

/**
 * Picker Selection Message Payload
 *
 * Sent when user changes selection in a picker within pop-out window.
 */
export interface PickerSelectionPayload {
  /**
   * Picker configuration ID
   */
  configId: string;

  /**
   * URL parameter name for this picker
   */
  urlParam: string;

  /**
   * Serialized URL parameter value
   * Format depends on picker configuration
   */
  urlValue: string;
}

/**
 * Pop-Out Window Reference
 *
 * Stored by main window to track and manage pop-out windows.
 */
export interface PopOutWindowRef {
  /**
   * Window reference
   * Used to check if window is still open
   */
  window: Window;

  /**
   * BroadcastChannel for communication
   * One channel per panel
   */
  channel: BroadcastChannel;

  /**
   * Interval ID for close detection polling
   * Cleared when window closes
   */
  checkInterval: number;

  /**
   * Panel ID
   * Matches the channel name: `panel-${panelId}`
   */
  panelId: string;

  /**
   * Panel type
   * Used for routing and component resolution
   */
  panelType: string;
}

/**
 * Pop-Out Window Features
 *
 * Configuration for window.open() features parameter.
 */
export interface PopOutWindowFeatures {
  /**
   * Window width in pixels
   * @default 1200
   */
  width?: number;

  /**
   * Window height in pixels
   * @default 800
   */
  height?: number;

  /**
   * Window left position in pixels
   * @default 100
   */
  left?: number;

  /**
   * Window top position in pixels
   * @default 100
   */
  top?: number;

  /**
   * Show menubar
   * @default false
   */
  menubar?: boolean;

  /**
   * Show toolbar
   * @default false
   */
  toolbar?: boolean;

  /**
   * Show location bar
   * @default false
   */
  location?: boolean;

  /**
   * Show status bar
   * @default false
   */
  status?: boolean;

  /**
   * Enable resizing
   * @default true
   */
  resizable?: boolean;

  /**
   * Enable scrollbars
   * @default true
   */
  scrollbars?: boolean;
}

/**
 * Pop-Out Route Parameters
 *
 * URL parameters for pop-out routes.
 * Route format: `/panel/:gridId/:panelId/:type`
 */
export interface PopOutRouteParams {
  /**
   * Grid identifier
   * @example 'discover'
   */
  gridId: string;

  /**
   * Panel identifier
   * @example 'model-picker', 'query-control', 'vehicle-results'
   */
  panelId: string;

  /**
   * Panel type (determines which component to render)
   * @example 'picker', 'query-control', 'results', 'plotly-charts'
   */
  type: string;
}

/**
 * Pop-Out Context
 *
 * Context information for determining if current window is a pop-out.
 */
export interface PopOutContext {
  /**
   * Is current window a pop-out?
   */
  isPopOut: boolean;

  /**
   * Panel ID (if pop-out)
   */
  panelId?: string;

  /**
   * Grid ID (if pop-out)
   */
  gridId?: string;

  /**
   * Panel type (if pop-out)
   */
  panelType?: string;
}

/**
 * Utility function to build window.open() features string
 *
 * @param features - Window features configuration
 * @returns Formatted features string for window.open()
 *
 * @example
 * ```typescript
 * const features = buildWindowFeatures({
 *   width: 1200,
 *   height: 800,
 *   resizable: true
 * });
 * // Returns: "width=1200,height=800,resizable=yes"
 * ```
 */
export function buildWindowFeatures(features: PopOutWindowFeatures): string {
  const {
    width = 1200,
    height = 800,
    left = 100,
    top = 100,
    menubar = false,
    toolbar = false,
    location = false,
    status = false,
    resizable = true,
    scrollbars = true,
  } = features;

  const boolToYesNo = (val: boolean) => (val ? 'yes' : 'no');

  return [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    `menubar=${boolToYesNo(menubar)}`,
    `toolbar=${boolToYesNo(toolbar)}`,
    `location=${boolToYesNo(location)}`,
    `status=${boolToYesNo(status)}`,
    `resizable=${boolToYesNo(resizable)}`,
    `scrollbars=${boolToYesNo(scrollbars)}`,
  ].join(',');
}

/**
 * Utility function to parse pop-out route
 *
 * Checks if URL is a pop-out route and extracts parameters.
 *
 * @param url - Current URL path
 * @returns Pop-out context or null
 *
 * @example
 * ```typescript
 * const context = parsePopOutRoute('/panel/discover/model-picker/picker');
 * // Returns: {
 * //   isPopOut: true,
 * //   gridId: 'discover',
 * //   panelId: 'model-picker',
 * //   panelType: 'picker'
 * // }
 * ```
 */
export function parsePopOutRoute(url: string): PopOutContext | null {
  const match = url.match(/^\/panel\/([^/]+)\/([^/]+)\/([^/]+)/);

  if (!match) {
    return null;
  }

  return {
    isPopOut: true,
    gridId: match[1],
    panelId: match[2],
    panelType: match[3],
  };
}
