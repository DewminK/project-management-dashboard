export const UserRoles = {
    ProjectManager: "ProjectManager",
    TeamMember: "TeamMember",
} as const;

export type UserRoles = typeof UserRoles[keyof typeof UserRoles];

export interface User {
    id: string;
    name: string;
    role: UserRoles;
    email: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRoles;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface StoredUser extends User {
    passwordHash: string;
}

