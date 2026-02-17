// src/app/app.module.ts
// Minimal popout application - URL-First architecture demo

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PrimengModule } from './primeng.module';

// Feature Components
import { HomeComponent } from './features/home/home.component';
import { TilePopoutComponent } from './features/tile-popout/tile-popout.component';

// Framework Services
import { UrlStateService } from './framework/services/url-state.service';
import { PopOutContextService } from './framework/services/popout-context.service';
import { PopOutManagerService } from './framework/services/popout-manager.service';

/**
 * Root Application Module (AppModule)
 *
 * Minimal popout application demonstrating URL-First architecture.
 * Uses only the core framework services needed for popout functionality.
 *
 * @class AppModule
 * @see AppComponent - Root component
 */
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    TilePopoutComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    PrimengModule
  ],
  providers: [
    MessageService,
    UrlStateService,
    PopOutContextService,
    PopOutManagerService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
