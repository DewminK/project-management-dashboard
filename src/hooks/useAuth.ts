import { useMutation, useQuery } from "@tanstack/react-query";
import {
    mockFetchTeamMembers,
    mockLogin,
    mockLogout,
    mockSignup,
} from "../api/mockAuth";
import { useAuthStore } from "../store/authStore";
import type { LoginRequest, SignupRequest } from "../types/auth";

export function useLoginMutation() {
    const login = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: (credentials: LoginRequest) => mockLogin(credentials),
        onSuccess: (data) => {
            login(data);
        },
    });
}

export function useSignupMutation() {
    const login = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: (payload: SignupRequest) => mockSignup(payload),
        onSuccess: (data) => {
            login(data);
        },
    });
}

export function useLogoutMutation() {
    const logout = useAuthStore((state) => state.logout);

    return useMutation({
        mutationFn: () => mockLogout(),
        onSuccess: () => {
            logout();
        },
    });
}

export function useTeamMembersQuery(enabled = true) {
    return useQuery({
        queryKey: ["team-members"],
        queryFn: mockFetchTeamMembers,
        enabled,
    });
}

export function useCurrentUser() {
    return useAuthStore((state) => state.user);
}