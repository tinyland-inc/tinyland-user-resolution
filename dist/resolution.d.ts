import type { ResolvedUser } from './types.js';
export declare function resolveUser(handle: string): Promise<ResolvedUser | null>;
export declare function userExists(handle: string): Promise<boolean>;
export declare function getAllUserHandles(): Promise<string[]>;
export declare function clearUserResolutionCache(): void;
export declare const RESERVED_ROUTES: string[];
export declare function isReservedRoute(segment: string): boolean;
//# sourceMappingURL=resolution.d.ts.map