// src/app/app.module.ts
// Home-only version - Discover and pop-out components removed

import { NgModule, ErrorHandler, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PrimengModule } from './primeng.module';
import { FrameworkModule } from './framework/framework.module';
import { GlobalErrorHandler } from './framework/services/global-error.handler';
import { HttpErrorInterceptor } from './framework/services/http-error.interceptor';
import { DOMAIN_CONFIG } from './framework/services/domain-config-registry.service';
import { createAutomobileDomainConfig } from './domain-config/automobile';

// Feature Components
import { HomeComponent } from './features/home/home.component';
import { TilePopoutComponent } from './features/tile-popout/tile-popout.component';

/**
 * Root Application Module (AppModule)
 *
 * Central configuration and bootstrapping module for the popout Angular application.
 * Home-only version with framework and domain-config preserved for future use.
 *
 * @class AppModule
 * @see AppComponent - Root component
 * @see FrameworkModule - Core framework services and components
 * @see PrimengModule - UI component library configuration
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
    PrimengModule,
    FrameworkModule
  ],
  providers: [
    MessageService,
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },
    {
      provide: DOMAIN_CONFIG,
      useFactory: createAutomobileDomainConfig,
      deps: [Injector]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
