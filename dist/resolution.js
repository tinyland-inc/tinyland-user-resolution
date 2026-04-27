import { getConfig } from './config.js';
let profileCache = null;
let profileCacheTime = 0;
const PROFILE_CACHE_TTL = 60 * 1000;
export async function resolveUser(handle) {
    const config = getConfig();
    try {
        const dbUser = await config.findUserByHandle(handle);
        if (dbUser) {
            return {
                handle: dbUser.handle,
                displayName: dbUser.displayName,
                source: 'directory',
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
    }
    catch (error) {
        console.warn('[UserResolution] Error checking directory:', error);
    }
    const profileUser = await resolveUserFromProfile(handle);
    if (profileUser) {
        return profileUser;
    }
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
async function resolveUserFromProfile(handle) {
    const config = getConfig();
    const now = Date.now();
    if (profileCache && (now - profileCacheTime) < PROFILE_CACHE_TTL) {
        if (profileCache.has(handle)) {
            return profileCache.get(handle) || null;
        }
    }
    else {
        profileCache = new Map();
        profileCacheTime = now;
    }
    try {
        const profiles = await config.loadProfiles({ handle });
        if (profiles.length === 0) {
            profileCache.set(handle, null);
            return null;
        }
        const profile = profiles[0];
        const metadata = profile.metadata;
        const resolved = {
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
    }
    catch (error) {
        console.error('[UserResolution] Error loading profile:', error);
        profileCache.set(handle, null);
        return null;
    }
}
export async function userExists(handle) {
    const user = await resolveUser(handle);
    return user !== null;
}
export async function getAllUserHandles() {
    const config = getConfig();
    const handles = new Set();
    try {
        const dbUsers = await config.findAllUsers();
        for (const user of dbUsers) {
            handles.add(user.handle);
        }
    }
    catch (error) {
        console.warn('[UserResolution] Error getting directory users:', error);
    }
    try {
        const profiles = await config.loadProfiles({});
        for (const profile of profiles) {
            handles.add(profile.metadata.handle || profile.slug);
        }
    }
    catch (error) {
        console.warn('[UserResolution] Error getting profile users:', error);
    }
    return Array.from(handles);
}
export function clearUserResolutionCache() {
    profileCache = null;
    profileCacheTime = 0;
}
export const RESERVED_ROUTES = [
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
export function isReservedRoute(segment) {
    return RESERVED_ROUTES.includes(segment.toLowerCase());
}
