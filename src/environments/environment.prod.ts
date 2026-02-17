/**
 * Production Environment Configuration
 *
 * @fileoverview
 * Environment configuration for production builds. This file defines runtime settings
 * for the application when deployed to production (Kubernetes, cloud, etc.).
 *
 * @remarks
 * **Build-Time Usage**:
 * This file is automatically used when building with the production configuration:
 * ```bash
 * ng build --configuration production
 * ```
 *
 * The build system uses the `fileReplacements` array in angular.json to automatically
 * replace environment.ts (development) with this file during the production build process.
 *
 * **Configuration Details**:
 * - `production`: true - Enables production optimizations and disables debugging
 * - `apiBaseUrl`: Production backend endpoint (identical to development for convenience)
 * - `includeTestIds`: false - Strips test-id attributes to reduce HTML output
 *
 * @see environment.ts - Development environment configuration
 * @see angular.json - Build configuration with fileReplacements array
 *
 * @version 1.0
 * @since 1.0.0
 */

/**
 * Environment object containing runtime configuration for production
 *
 * @type {Object}
 * @property {boolean} production - Whether running in production mode (true for production builds)
 * @property {string} apiBaseUrl - Base URL for backend API calls
 * @property {boolean} includeTestIds - Enable test-id attributes (false in production)
 */
export const environment = {
  /** Production mode flag - enables optimizations and disables debugging */
  production: true,

  /**
   * Backend API endpoint for production
   *
   * URL pattern: http://generic-prime.minilab/api/specs/v1
   */
  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1',

  /**
   * User preferences API endpoint for production
   *
   * URL pattern: http://generic-prime.minilab/api/preferences/v1
   */
  preferencesApiUrl: 'http://generic-prime.minilab/api/preferences/v1',

  /**
   * E2E test attribute flag for production
   *
   * Set to false in production to remove all [attr.data-testid] attributes from HTML.
   */
  includeTestIds: false
};
