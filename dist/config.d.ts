import type { AdminUser, Profile } from './types.js';
export interface UserResolutionConfig {
    findUserByHandle: (handle: string) => Promise<AdminUser | null>;
    findAllUsers: () => Promise<AdminUser[]>;
    loadProfiles: (filter: {
        handle?: string;
    }) => Promise<Profile[]>;
    isNoAuthMode?: boolean;
}
export declare function configure(c: UserResolutionConfig): void;
export declare function getConfig(): UserResolutionConfig;
export declare function resetConfig(): void;
//# sourceMappingURL=config.d.ts.map