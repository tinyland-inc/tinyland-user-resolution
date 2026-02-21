import { getConfig } from './config.js';
import type { ResolvedUser } from './types.js';

/**
 * Cache for profile lookups (profile handle -> resolved profile data).
 * Profiles don't change often, so caching reduces filesystem reads.
 */
let profileCache: Map<string, ResolvedUser | null> | null = null;
let profileCacheTime = 0;
const PROFILE_CACHE_TTL = 60 * 1000; // 1 minute cache

/**
 * Resolve a user by handle, checking database then profile markdown.
 *
 * Resolution order:
 * 1. Database/auth system (authenticated users take precedence)
 * 2. Profile markdown files (content-only users for demo/federation)
 * 3. NOAUTH fallback for 'admin' handle (when isNoAuthMode is true)
 *
 * @param handle - The user's handle (username)
 * @returns ResolvedUser if found, null otherwise
 */
export async function resolveUser(handle: string): Promise<ResolvedUser | null> {
  const config = getConfig();

  // 1. Check database first (authenticated users take precedence)
  try {
    const dbUser = await config.findUserByHandle(handle);
    if (dbUser) {
      return {
        handle: dbUser.handle,
        displayName: dbUser.displayName,
        source: 'database',
        id: dbUser.id,
        role: dbUser.role,
        avatar: dbUser.avatar,
        bio: dbUser.bio,
        pronouns: dbUser.pronouns,
        location: dbUser.location,
        website: dbUser.website,
        dbUser,
      };
    }
  } catch (error) {
    console.warn('[UserResolution] Error checking database:', error);
    // Continue to profile check
  }

  // 2. Fall back to profile markdown (content-only users)
  const profileUser = await resolveUserFromProfile(handle);
  if (profileUser) {
    return profileUser;
  }

  // 3. NOAUTH fallback for 'admin' handle
  if (handle === 'admin' && config.isNoAuthMode) {
    return {
      id: 'noauth-admin',
      handle: 'admin',
      displayName: 'Development Admin',
      source: 'noauth',
      role: 'super_admin',
      avatar: '/avatars/dev-admin.svg',
      bio: 'Local development super admin account',
    };
  }

  return null;
}

/**
 * Resolve a user from profile markdown only.
 *
 * @param handle - The user's handle
 * @returns ResolvedUser if profile exists, null otherwise
 */
async function resolveUserFromProfile(handle: string): Promise<ResolvedUser | null> {
  const config = getConfig();
  const now = Date.now();

  // Check cache first
  if (profileCache && (now - profileCacheTime) < PROFILE_CACHE_TTL) {
    if (profileCache.has(handle)) {
      return profileCache.get(handle) || null;
    }
  } else {
    // Cache expired or doesn't exist, rebuild it
    profileCache = new Map();
    profileCacheTime = now;
  }

  // Load profiles and find matching one
  try {
    const profiles = await config.loadProfiles({ handle });

    if (profiles.length === 0) {
      profileCache.set(handle, null);
      return null;
    }

    const profile = profiles[0];
    const metadata = profile.metadata;

    const resolved: ResolvedUser = {
      handle: metadata.handle || profile.slug,
      displayName: metadata.name || metadata.displayName || profile.slug,
      source: 'profile',
      role: metadata.role || 'member',
      avatar: metadata.avatar,
      bio: metadata.bio,
      pronouns: metadata.pronouns,
      location: metadata.location,
      website: metadata.website || metadata.social?.website,
    };

    profileCache.set(handle, resolved);
    return resolved;
  } catch (error) {
    console.error('[UserResolution] Error loading profile:', error);
    profileCache.set(handle, null);
    return null;
  }
}

/**
 * Check if a user exists (either in database or as profile).
 *
 * @param handle - The user's handle
 * @returns true if user exists, false otherwise
 */
export async function userExists(handle: string): Promise<boolean> {
  const user = await resolveUser(handle);
  return user !== null;
}

/**
 * Get all available user handles from both database and profile sources.
 * Handles are deduplicated.
 *
 * @returns Array of all unique user handles
 */
export async function getAllUserHandles(): Promise<string[]> {
  const config = getConfig();
  const handles = new Set<string>();

  // Get database users
  try {
    const dbUsers = await config.findAllUsers();
    for (const user of dbUsers) {
      handles.add(user.handle);
    }
  } catch (error) {
    console.warn('[UserResolution] Error getting database users:', error);
  }

  // Get profile users
  try {
    const profiles = await config.loadProfiles({});
    for (const profile of profiles) {
      handles.add(profile.metadata.handle || profile.slug);
    }
  } catch (error) {
    console.warn('[UserResolution] Error getting profile users:', error);
  }

  return Array.from(handles);
}

/**
 * Clear the profile cache. Useful for testing or after profile updates.
 */
export function clearUserResolutionCache(): void {
  profileCache = null;
  profileCacheTime = 0;
}

/**
 * Reserved route prefixes that should NOT be treated as user handles.
 * Used by URL rewriting to avoid conflicts with system routes.
 */
export const RESERVED_ROUTES: string[] = [
  'admin',
  'api',
  'auth',
  'legal',
  '.well-known',
  '_app',
  '__data',
  'socket.io',
  'health',
  'metrics',
  'blog',
  'products',
  'events',
  'notes',
  'videos',
  'programs',
  'explore',
  'settings',
  'contact',
  'about',
  'privacy',
  'terms',
];

/**
 * Check if a path segment is a reserved route (not a user handle).
 * Comparison is case-insensitive.
 *
 * @param segment - First path segment to check
 * @returns true if reserved, false if could be a user handle
 */
export function isReservedRoute(segment: string): boolean {
  return RESERVED_ROUTES.includes(segment.toLowerCase());
}
