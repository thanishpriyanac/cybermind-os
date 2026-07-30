export const Role = {
    ADMIN: "ADMIN",
    ANALYST: "ANALYST",
    SENIOR_ANALYST: "SENIOR_ANALYST",
    VIEWER: "VIEWER"
} as const;

export type Role = typeof Role[keyof typeof Role];
