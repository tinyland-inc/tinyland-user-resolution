/**
 * Admin user record from a database or external auth system.
 * Uses an index signature to allow additional fields from varying schemas.
 */
export interface AdminUser {
  id: string;
  handle: string;
  displayName: string;
  role: string;
  avatar?: string;
  bio?: string;
  pronouns?: string;
  location?: string;
  website?: string;
  [key: string]: unknown;
}

/**
 * A profile loaded from markdown or another content source.
 */
export interface Profile {
  slug: string;
  metadata: {
    handle?: string;
    name?: string;
    displayName?: string;
    role?: string;
    avatar?: string;
    bio?: string;
    pronouns?: string;
    location?: string;
    website?: string;
    social?: { website?: string; [key: string]: unknown };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Resolved user data from either database, profile markdown, or noauth fallback.
 */
export interface ResolvedUser {
  /** User's unique handle (username) */
  handle: string;
  /** Display name for the user */
  displayName: string;
  /** Where the user data came from */
  source: 'database' | 'profile' | 'noauth';
  /** User ID (only for database users) */
  id?: string;
  /** User role (defaults to 'member' for profile-only users) */
  role: string;
  /** Avatar URL */
  avatar?: string;
  /** Bio/description */
  bio?: string;
  /** User's pronouns */
  pronouns?: string;
  /** Location */
  location?: string;
  /** Website URL */
  website?: string;
  /** Original database user if from database */
  dbUser?: AdminUser;
}
