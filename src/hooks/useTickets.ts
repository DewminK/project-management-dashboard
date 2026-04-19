import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	mockCreateTicket,
	mockFetchTickets,
	mockUpdateTicketStatus,
} from "../api/mockTickets";
import { useAuthStore } from "../store/authStore";
import type { TicketInput, TicketStatus } from "../types/ticket";

function getTicketQueryKey(projectId: string) {
	return ["tickets", projectId] as const;
}

export function useTicketsQuery(projectId: string | null) {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: projectId ? getTicketQueryKey(projectId) : ["tickets", "none"],
		queryFn: () => {
			if (!user || !projectId) {
				throw new Error("Project context not found.");
			}

			return mockFetchTickets(user, projectId);
		},
		enabled: Boolean(user && projectId),
	});
}

export function useCreateTicketMutation(projectId: string | null) {
	const user = useAuthStore((state) => state.user);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: Omit<TicketInput, "projectId">) => {
			if (!user || !projectId) {
				throw new Error("Project context not found.");
			}

			return mockCreateTicket(user, {
				...payload,
				projectId,
			});
		},
		onSuccess: async () => {
			if (!projectId) {
				return;
			}
			await queryClient.invalidateQueries({ queryKey: getTicketQueryKey(projectId) });
		},
	});
}

export function useUpdateTicketStatusMutation(projectId: string | null) {
	const user = useAuthStore((state) => state.user);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (args: { ticketId: string; status: TicketStatus }) => {
			if (!user) {
				throw new Error("User not found.");
			}

			return mockUpdateTicketStatus(user, args.ticketId, args.status);
		},
		onSuccess: async () => {
			if (!projectId) {
				return;
			}
			await queryClient.invalidateQueries({ queryKey: getTicketQueryKey(projectId) });
		},
	});
}
