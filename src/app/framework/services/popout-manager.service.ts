/**
 * Pop-out Manager Service
 *
 * Manages pop-out window lifecycle:
 * - Opening and tracking pop-out windows
 * - BroadcastChannel setup and message handling
 * - Window close detection
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

@Injectable()
export class PopOutManagerService implements OnDestroy {
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

  initialize(): void {
    if (this.initialized) {
      return;
    }

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

  openPopOut(
    panelId: string,
    queryParams?: Record<string, string>,
    features?: Partial<PopOutWindowFeatures>
  ): boolean {
    if (this.poppedOutPanels.has(panelId)) {
      return false;
    }

    // Build URL: /panel/:panelId?key=value&...
    let url = `/panel/${panelId}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams(queryParams).toString();
      url += `?${params}`;
    }

    const windowFeatures = buildWindowFeatures({
      width: 400,
      height: 400,
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
      panelType: 'tile'
    });

    return true;
  }

  sendMessage(panelId: string, message: PopOutMessage): void {
    const ref = this.popoutWindows.get(panelId);
    if (ref) {
      try {
        ref.channel.postMessage(message);
      } catch {
        // Silently ignore posting errors
      }
    }
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
