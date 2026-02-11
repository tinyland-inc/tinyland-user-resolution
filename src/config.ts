import type { AdminUser, Profile } from './types.js';

/**
 * Dependency injection configuration for user resolution.
 *
 * All external dependencies (database access, profile loading, environment flags)
 * are provided through this configuration rather than imported directly,
 * making the package decoupled from any specific framework or data layer.
 */
export interface UserResolutionConfig {
  /** Look up a single user by handle from the database/auth system */
  findUserByHandle: (handle: string) => Promise<AdminUser | null>;
  /** Retrieve all users from the database/auth system */
  findAllUsers: () => Promise<AdminUser[]>;
  /** Load profile markdown files, optionally filtered by handle */
  loadProfiles: (filter: { handle?: string }) => Promise<Profile[]>;
  /** When true, enables the noauth fallback for the 'admin' handle (replaces process.env checks) */
  isNoAuthMode?: boolean;
}

let config: UserResolutionConfig | null = null;

/**
 * Initialize the user resolution package with the required dependencies.
 * Must be called before any resolution functions are used.
 */
export function configure(c: UserResolutionConfig): void {
  config = c;
}

/**
 * Retrieve the current configuration. Throws if `configure()` has not been called.
 */
export function getConfig(): UserResolutionConfig {
  if (!config) {
    throw new Error('tinyland-user-resolution: call configure() before use');
  }
  return config;
}

/**
 * Reset the configuration to null. Useful for test teardown.
 */
export function resetConfig(): void {
  config = null;
}
