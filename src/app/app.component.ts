// src/app/app.component.ts

import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Root Application Component (AppComponent)
 *
 * Main container component for the popout application. Provides the global
 * application shell including navigation and router outlet for feature components.
 *
 * @class AppComponent
 * @selector app-root
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  /**
   * Application title identifier
   */
  title = 'popout';

  /**
   * Whether current route is a popout panel (hides header/footer)
   */
  isPopout = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.isPopout = event.urlAfterRedirects.startsWith('/panel/');
      });

    // Check initial route
    this.isPopout = this.router.url.startsWith('/panel/');
  }
}
