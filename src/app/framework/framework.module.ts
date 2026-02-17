import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimengModule } from '../primeng.module';

// Components
import { AiChatComponent } from './components/ai-chat/ai-chat.component';
import { BasePickerComponent } from './components/base-picker/base-picker.component';
import { ResultsTableComponent } from './components/results-table/results-table.component';
import { BasicResultsTableComponent } from './components/basic-results-table/basic-results-table.component';
import { DynamicResultsTableComponent } from './components/dynamic-results-table/dynamic-results-table.component';
import { QueryControlComponent } from './components/query-control/query-control.component';
import { QueryPanelComponent } from './components/query-panel/query-panel.component';
import { BaseChartComponent } from './components/base-chart/base-chart.component';
import { StatisticsPanel2Component } from './components/statistics-panel-2/statistics-panel-2.component';

/**
 * Framework Module
 *
 * Provides reusable framework components, services, and models.
 * This module should be imported by feature modules that need framework functionality.
 *
 * @example
 * ```typescript
 * @NgModule({
 *   imports: [
 *     CommonModule,
 *     FrameworkModule
 *   ]
 * })
 * export class FeatureModule { }
 * ```
 */
@NgModule({
  declarations: [
    AiChatComponent,
    BasePickerComponent,
    ResultsTableComponent,
    BasicResultsTableComponent,
    DynamicResultsTableComponent,
    QueryControlComponent,
    QueryPanelComponent,
    BaseChartComponent,
    StatisticsPanel2Component
  ],
  imports: [
    CommonModule,
    FormsModule,
    PrimengModule
  ],
  exports: [
    AiChatComponent,
    BasePickerComponent,
    ResultsTableComponent,
    BasicResultsTableComponent,
    DynamicResultsTableComponent,
    QueryControlComponent,
    QueryPanelComponent,
    BaseChartComponent,
    StatisticsPanel2Component,
    // Re-export common modules for convenience
    CommonModule,
    FormsModule,
    PrimengModule
  ]
})
export class FrameworkModule { }
