import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { PopOutManagerService } from '../../framework/services/popout-manager.service';
import { PopOutContextService } from '../../framework/services/popout-context.service';
import { PopOutMessageType } from '../../framework/models/popout.interface';

interface DomainTile {
  id: string;
  icon: string;
  title: string;
  description: string;
}

/**
 * Home Component - Landing Page
 *
 * Serves as the main entry point and domain selector for the Generic-Prime application.
 * This component provides navigation to various domain-specific modules including
 * Automobile, Physics, Agriculture, Chemistry, and Mathematics.
 *
 * The home page acts as a hub allowing users to select their desired domain of interest
 * and navigate to the corresponding feature modules for data exploration and visualization.
 *
 * @class HomeComponent
 * @since 1.0
 */
@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    providers: [PopOutManagerService, PopOutContextService]
})
export class HomeComponent implements OnInit, OnDestroy {
  tiles: DomainTile[] = [
    { id: 'auto', icon: '🚗', title: 'Automobiles', description: 'Vehicle data' },
    { id: 'agriculture', icon: '🌾', title: 'Agriculture', description: 'Agricultural data analysis' },
    { id: 'physics', icon: '⚛️', title: 'Physics', description: 'Physics research data' },
    { id: 'chemistry', icon: '🧪', title: 'Chemistry', description: 'Chemical compound data' },
    { id: 'mathematics', icon: '📐', title: 'Mathematics', description: 'Mathematical datasets' }
  ];

  tileInputs: { [key: string]: string } = {};
  poppedOutTiles = new Set<string>();

  private destroy$ = new Subject<void>();
  private inputChanges: { [key: string]: Subject<string> } = {};

  constructor(private popOutManager: PopOutManagerService) {
    this.tiles.forEach(tile => {
      this.tileInputs[tile.id] = '';
      this.inputChanges[tile.id] = new Subject<string>();
    });
  }

  ngOnInit(): void {
    this.popOutManager.initialize('home');

    // Handle popout closed
    this.popOutManager.closed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(panelId => {
        this.poppedOutTiles.delete(panelId);
      });

    // Handle messages from popouts (URL_PARAMS_CHANGED)
    this.popOutManager.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ panelId, message }) => {
        if (message.type === PopOutMessageType.URL_PARAMS_CHANGED) {
          const tileId = message.payload?.params?.tile;
          const text = message.payload?.params?.text || '';
          if (tileId && this.tileInputs.hasOwnProperty(tileId)) {
            this.tileInputs[tileId] = text;
          }
        }
      });

    // Set up debounced input sync for each tile
    this.tiles.forEach(tile => {
      this.inputChanges[tile.id]
        .pipe(
          debounceTime(300),
          takeUntil(this.destroy$)
        )
        .subscribe(text => {
          // If tile is popped out, sync to popout
          if (this.poppedOutTiles.has(tile.id)) {
            this.popOutManager.broadcastState({ tile: tile.id, text });
          }
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    Object.values(this.inputChanges).forEach(s => s.complete());
  }

  isPoppedOut(tileId: string): boolean {
    return this.poppedOutTiles.has(tileId);
  }

  onInputChange(tileId: string, value: string): void {
    this.tileInputs[tileId] = value;
    this.inputChanges[tileId].next(value);
  }

  openPopOut(tile: DomainTile): void {
    if (this.poppedOutTiles.has(tile.id)) {
      return;
    }

    const text = this.tileInputs[tile.id] || '';
    const success = this.popOutManager.openPopOut(tile.id, `tile?text=${encodeURIComponent(text)}`, {
      width: 400,
      height: 400
    });

    if (success) {
      this.poppedOutTiles.add(tile.id);
    }
  }
}
