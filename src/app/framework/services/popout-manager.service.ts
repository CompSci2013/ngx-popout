/**
 * Pop-out Manager Service
 *
 * Encapsulates pop-out window lifecycle management including:
 * - Opening and tracking pop-out windows
 * - BroadcastChannel setup and message handling
 * - State broadcasting to pop-outs
 * - Window close detection
 *
 * This service extracts pop-out management from DiscoverComponent for cleaner code.
 */

import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import {
  buildWindowFeatures,
  PopOutMessage,
  PopOutMessageType,
  PopOutWindowFeatures,
  PopOutWindowRef
} from '../models/popout.interface';
import { PopOutContextService } from './popout-context.service';
import { FilterOptionsCache } from './filter-options.service';

@Injectable()
export class PopOutManagerService implements OnDestroy {
  private gridId = '';
  private poppedOutPanels = new Set<string>();
  private popoutWindows = new Map<string, PopOutWindowRef>();
  private messagesSubject = new Subject<{ panelId: string; message: PopOutMessage }>();
  private closedSubject = new Subject<string>();
  private blockedSubject = new Subject<string>();
  private beforeUnloadHandler = () => this.closeAllPopOuts();
  private initialized = false;

  readonly messages$ = this.messagesSubject.asObservable();
  readonly closed$ = this.closedSubject.asObservable();
  readonly blocked$ = this.blockedSubject.asObservable();

  constructor(
    private popOutContext: PopOutContextService,
    private ngZone: NgZone
  ) {}

  initialize(gridId: string): void {
    if (this.initialized) {
      return;
    }

    this.gridId = gridId;
    this.initialized = true;

    this.popOutContext.initializeAsParent();
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    this.popOutContext.getMessages$().subscribe(message => {
      this.messagesSubject.next({ panelId: '', message });
    });
  }

  isPoppedOut(panelId: string): boolean {
    return this.poppedOutPanels.has(panelId);
  }

  getPoppedOutPanels(): string[] {
    return Array.from(this.poppedOutPanels);
  }

  openPopOut(
    panelId: string,
    panelType: string,
    features?: Partial<PopOutWindowFeatures>
  ): boolean {
    if (this.poppedOutPanels.has(panelId)) {
      return false;
    }

    // URL structure: /panel/:gridId/:panelId/:type (vvroom uses /panel prefix)
    const url = `/panel/${this.gridId}/${panelId}/${panelType}`;

    const windowFeatures = buildWindowFeatures({
      width: 1200,
      height: 800,
      left: 100,
      top: 100,
      resizable: true,
      scrollbars: true,
      ...features
    });

    const popoutWindow = window.open(url, `panel-${panelId}`, windowFeatures);

    if (!popoutWindow) {
      this.blockedSubject.next(panelId);
      return false;
    }

    this.poppedOutPanels.add(panelId);

    const channel = this.popOutContext.createChannelForPanel(panelId);

    channel.onmessage = event => {
      this.ngZone.run(() => {
        this.messagesSubject.next({ panelId, message: event.data });
      });
    };

    const checkInterval = window.setInterval(() => {
      if (popoutWindow.closed) {
        this.ngZone.run(() => {
          this.handlePopOutClosed(panelId, channel, checkInterval);
        });
      }
    }, 500);

    this.popoutWindows.set(panelId, {
      window: popoutWindow,
      channel,
      checkInterval,
      panelId,
      panelType
    });

    return true;
  }

  /**
   * Broadcast state to all popout windows
   *
   * @param state - Application state from ResourceManagementService
   * @param filterOptionsCache - Optional cached filter options for URL-First compliance
   */
  broadcastState(state: any, filterOptionsCache?: FilterOptionsCache): void {
    if (this.popoutWindows.size === 0) {
      return;
    }

    const message = {
      type: PopOutMessageType.STATE_UPDATE,
      payload: {
        state,
        filterOptionsCache: filterOptionsCache || null
      },
      timestamp: Date.now()
    };

    this.popoutWindows.forEach(({ channel }) => {
      try {
        channel.postMessage(message);
      } catch {
        // Silently ignore posting errors
      }
    });
  }

  closePopOut(panelId: string): void {
    const ref = this.popoutWindows.get(panelId);
    if (ref) {
      ref.channel.postMessage({
        type: PopOutMessageType.CLOSE_POPOUT,
        timestamp: Date.now()
      });
    }
  }

  closeAllPopOuts(): void {
    this.popoutWindows.forEach(({ channel }) => {
      channel.postMessage({
        type: PopOutMessageType.CLOSE_POPOUT,
        timestamp: Date.now()
      });
    });
  }

  private handlePopOutClosed(
    panelId: string,
    channel: BroadcastChannel,
    checkInterval: number
  ): void {
    clearInterval(checkInterval);
    channel.close();
    this.popoutWindows.delete(panelId);
    this.poppedOutPanels.delete(panelId);

    this.closedSubject.next(panelId);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);

    this.popoutWindows.forEach(({ window: win, channel, checkInterval }) => {
      clearInterval(checkInterval);
      channel.close();
      if (win && !win.closed) {
        win.close();
      }
    });

    this.messagesSubject.complete();
    this.closedSubject.complete();
    this.blockedSubject.complete();
  }
}
