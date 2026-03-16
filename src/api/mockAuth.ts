import { UserRoles } from "../types/auth";
import type {
    AuthResponse,
    LoginRequest,
    SignupRequest,
    StoredUser,
    User,
} from "../types/auth";

const USERS_STORAGE_KEY = import.meta.env.VITE_USERS_STORAGE_KEY ;
const AUTH_TOKEN_PREFIX = import.meta.env.VITE_AUTH_TOKEN_PREFIX;

type PersistedStoredUser = Omit<StoredUser, "passwordHash"> & {
    passwordHash?: string;
    password?: string;
};

const INITIAL_USERS: StoredUser[] = [];

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hashPassword(password: string): Promise<string> {
    const encoded = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-256", encoded);

    return Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0")
    ).join("");
}

function isPersistedStoredUser(value: unknown): value is PersistedStoredUser {
    if (!value || typeof value !== "object") {
        return false;
    }

    const user = value as Partial<PersistedStoredUser>;

    return (
        typeof user.id === "string" &&
        typeof user.name === "string" &&
        typeof user.email === "string" &&
        Object.values(UserRoles).includes(user.role as UserRoles) &&
        (typeof user.passwordHash === "string" || typeof user.password === "string")
    );
}

async function normalizeStoredUsers(users: PersistedStoredUser[]): Promise<StoredUser[]> {
    return Promise.all(
        users.map(async ({ password, passwordHash, ...user }) => ({
            ...user,
            passwordHash: passwordHash ?? (await hashPassword(password ?? "")),
        }))
    );
}

async function getStoredUsers(): Promise<StoredUser[]> {
    const serialized = localStorage.getItem(USERS_STORAGE_KEY);
    if (!serialized) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
    }

    try {
        const parsed = JSON.parse(serialized) as unknown;
        if (!Array.isArray(parsed)) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
            return INITIAL_USERS;
        }

        const candidates = parsed.filter(isPersistedStoredUser);
        if (!candidates.length) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
            return INITIAL_USERS;
        }

        const normalizedUsers = await normalizeStoredUsers(candidates);
        const requiresMigration =
            candidates.length !== parsed.length ||
            candidates.some((user) => typeof user.passwordHash !== "string");

        if (requiresMigration) {
            setStoredUsers(normalizedUsers);
        }

        return normalizedUsers;
    } catch {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
    }
}

function setStoredUsers(users: StoredUser[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function toPublicUser({ passwordHash: _passwordHash, ...user }: StoredUser): User {
    return user;
}

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export async function mockLogin(credentials: LoginRequest): Promise<AuthResponse> {
    const users = await getStoredUsers();
    const passwordHash = await hashPassword(credentials.password);
    const match = users.find(
        (user) =>
            normalizeEmail(user.email) === normalizeEmail(credentials.email) &&
            user.passwordHash === passwordHash
    );

    if (!match) {
        throw new Error("Invalid email or password.");
    }

    return {
        token: `${AUTH_TOKEN_PREFIX}-${match.id}-${Date.now()}`,
        user: toPublicUser(match),
    };
}

export async function mockSignup(payload: SignupRequest): Promise<AuthResponse> {
    const users = await getStoredUsers();
    const email = normalizeEmail(payload.email);
    const isExists = users.some((user) => normalizeEmail(user.email) === email);

    if (isExists) {
        throw new Error("An account with this email already exists.");
    }

    const user: StoredUser = {
        id: `user-${Date.now()}`,
        name: payload.name.trim(),
        email,
        passwordHash: await hashPassword(payload.password),
        role: payload.role,
    };

    setStoredUsers([...users, user]);

    return {
        token: `${AUTH_TOKEN_PREFIX}-${user.id}-${Date.now()}`,
        user: toPublicUser(user),
    };
}

export async function mockLogout(): Promise<void> {
    await sleep(200);
}

export async function mockFetchUsers(): Promise<User[]> {
    await sleep(300);
    return (await getStoredUsers()).map(toPublicUser);
}

export async function mockFetchTeamMembers(): Promise<User[]> {
    await sleep(300);
    return (await getStoredUsers())
        .filter((user) => user.role === UserRoles.TeamMember)
        .map(toPublicUser);
}
