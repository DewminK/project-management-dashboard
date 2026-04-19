export const TicketStatus = {
	Todo: "To Do",
	InProgress: "In Progress",
	Done: "Done",
} as const;

export type TicketStatus = typeof TicketStatus[keyof typeof TicketStatus];

export interface Ticket {
	id: string;
	projectId: string;
	name: string;
	assigneeId: string;
	estimatedHours: number;
	status: TicketStatus;
	createdAt: string;
}

export interface TicketInput {
	projectId: string;
	name: string;
	assigneeId: string;
	estimatedHours: number;
	status: TicketStatus;
}
