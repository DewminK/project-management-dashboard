import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    mockCreateProject,
    mockDeleteProject,
    mockFetchProjects,
    mockUpdateProject,
} from "../api/mockProjects";
import { useAuthStore } from "../store/authStore";
import type { ProjectInput } from "../types/project";

const PROJECTS_QUERY_KEY = ["projects"];

export function useProjectsQuery() {
    const user = useAuthStore((state) => state.user);

    return useQuery({
        queryKey: PROJECTS_QUERY_KEY,
        queryFn: () => {
            if (!user) {
                throw new Error("User not found.");
            }
            return mockFetchProjects(user);
        },
        enabled: Boolean(user),
    });
}

export function useCreateProjectMutation() {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ProjectInput) => {
            if (!user) {
                throw new Error("User not found.");
            }
            return mockCreateProject(user, payload);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
        },
    });
}

export function useUpdateProjectMutation() {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (args: { projectId: string; payload: ProjectInput }) => {
            if (!user) {
                throw new Error("User not found.");
            }
            return mockUpdateProject(user, args.projectId, args.payload);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
        },
    });
}

export function useDeleteProjectMutation() {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (projectId: string) => {
            if (!user) {
                throw new Error("User not found.");
            }
            return mockDeleteProject(user, projectId);
        },
        onMutate: async (projectId) => {
            await queryClient.cancelQueries({ queryKey: PROJECTS_QUERY_KEY });
            const previousProjects = queryClient.getQueryData(PROJECTS_QUERY_KEY);

            queryClient.setQueryData(
                PROJECTS_QUERY_KEY,
                (oldData: Array<{ id: string }> | undefined) =>
                    oldData?.filter((project) => project.id !== projectId) ?? []
            );

            return { previousProjects };
        },
        onError: (_error, _projectId, context) => {
            if (context?.previousProjects) {
                queryClient.setQueryData(PROJECTS_QUERY_KEY, context.previousProjects);
            }
        },
        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
        },
    });
}
