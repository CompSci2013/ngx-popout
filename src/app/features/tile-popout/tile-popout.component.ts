import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { PopOutContextService } from '../../framework/services/popout-context.service';
import { PopOutMessageType } from '../../framework/models/popout.interface';
import { UrlStateService } from '../../framework/services/url-state.service';

interface DomainTile {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const TILES: DomainTile[] = [
  { id: 'auto', icon: '🚗', title: 'Automobiles', description: 'Vehicle data' },
  { id: 'agriculture', icon: '🌾', title: 'Agriculture', description: 'Agricultural data analysis' },
  { id: 'physics', icon: '⚛️', title: 'Physics', description: 'Physics research data' },
  { id: 'chemistry', icon: '🧪', title: 'Chemistry', description: 'Chemical compound data' },
  { id: 'mathematics', icon: '📐', title: 'Mathematics', description: 'Mathematical datasets' }
];

@Component({
  selector: 'app-tile-popout',
  templateUrl: './tile-popout.component.html',
  styleUrls: ['./tile-popout.component.scss']
})
export class TilePopoutComponent implements OnInit, OnDestroy {
  tile: DomainTile | null = null;
  inputText = '';

  private destroy$ = new Subject<void>();
  private inputChange$ = new Subject<string>();
  private panelId = '';

  constructor(
    private route: ActivatedRoute,
    private popOutContext: PopOutContextService,
    private urlState: UrlStateService
  ) {}

  ngOnInit(): void {
    this.panelId = this.route.snapshot.paramMap.get('panelId') || '';
    this.tile = TILES.find(t => t.id === this.panelId) || null;

    // Initialize from URL query params
    this.urlState.watchParams()
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const text = params['text'] || '';
        if (text !== this.inputText) {
          this.inputText = text;
        }
      });

    // Debounce input changes and sync to URL + broadcast
    this.inputChange$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(text => {
        // Update URL (source of truth)
        this.urlState.setParam('text', text || null, true);

        // Broadcast to main window
        this.popOutContext.sendMessage({
          type: PopOutMessageType.URL_PARAMS_CHANGED,
          payload: { params: { tile: this.panelId, text } },
          timestamp: Date.now()
        });
      });

    this.popOutContext.initializeAsPopOut(this.panelId);

    // Listen for messages from main window
    this.popOutContext.getMessages$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message.type === PopOutMessageType.CLOSE_POPOUT) {
          window.close();
        }
        if (message.type === PopOutMessageType.URL_PARAMS_SYNC) {
          const text = message.payload?.params?.text || '';
          if (text !== this.inputText) {
            this.inputText = text;
          }
        }
      });

    this.popOutContext.sendMessage({
      type: PopOutMessageType.PANEL_READY,
      timestamp: Date.now()
    });
  }

  onInputChange(value: string): void {
    this.inputChange$.next(value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
