import { UserRoles } from "../types/auth";
import type { User } from "../types/auth";
import { TicketStatus } from "../types/ticket";
import type { Ticket, TicketInput, TicketStatus as TicketStatusType } from "../types/ticket";

const TICKETS_STORAGE_KEY = "pmd_tickets";

const INITIAL_TICKETS: Ticket[] = [];

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTicketStatus(value: unknown): value is TicketStatusType {
	return Object.values(TicketStatus).includes(value as TicketStatusType);
}

function isPersistedTicket(value: unknown): value is Ticket {
	if (!value || typeof value !== "object") {
		return false;
	}

	const ticket = value as Partial<Ticket>;

	return (
		typeof ticket.id === "string" &&
		typeof ticket.projectId === "string" &&
		typeof ticket.name === "string" &&
		(typeof ticket.assigneeId === "string" || typeof ticket.assigneeId === "undefined") &&
		typeof ticket.estimatedHours === "number" &&
		isTicketStatus(ticket.status) &&
		typeof ticket.createdAt === "string"
	);
}

function normalizePersistedTicket(ticket: Ticket): Ticket {
	return {
		...ticket,
		assigneeId: ticket.assigneeId ?? "",
	};
}

function getStoredTickets(): Ticket[] {
	const serialized = localStorage.getItem(TICKETS_STORAGE_KEY);
	if (!serialized) {
		localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
		return INITIAL_TICKETS;
	}

	try {
		const parsed = JSON.parse(serialized) as unknown;
		if (!Array.isArray(parsed)) {
			localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
			return INITIAL_TICKETS;
		}

		const tickets = parsed.filter(isPersistedTicket).map(normalizePersistedTicket);
		if (tickets.length !== parsed.length) {
			localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
		}

		return tickets;
	} catch {
		localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
		return INITIAL_TICKETS;
	}
}

function setStoredTickets(tickets: Ticket[]): void {
	localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
}

export async function mockFetchTickets(_user: User, projectId: string): Promise<Ticket[]> {
	await sleep(350);

	return getStoredTickets()
		.filter((ticket) => ticket.projectId === projectId)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function mockCreateTicket(user: User, payload: TicketInput): Promise<Ticket> {
	await sleep(500);

	if (user.role !== UserRoles.ProjectManager) {
		throw new Error("Only project managers can create tickets.");
	}

	const ticket: Ticket = {
		id: `ticket-${Date.now()}`,
		projectId: payload.projectId,
		name: payload.name.trim(),
		assigneeId: payload.assigneeId,
		estimatedHours: payload.estimatedHours,
		status: payload.status,
		createdAt: new Date().toISOString(),
	};

	const tickets = getStoredTickets();
	setStoredTickets([ticket, ...tickets]);

	return ticket;
}

export async function mockUpdateTicketStatus(
	user: User,
	ticketId: string,
	status: TicketStatusType
): Promise<Ticket> {
	await sleep(420);

	if (user.role !== UserRoles.ProjectManager) {
		throw new Error("Only project managers can move tickets.");
	}

	const tickets = getStoredTickets();
	const target = tickets.find((ticket) => ticket.id === ticketId);

	if (!target) {
		throw new Error("Ticket not found.");
	}

	const updated: Ticket = {
		...target,
		status,
	};

	setStoredTickets(
		tickets.map((ticket) => (ticket.id === ticketId ? updated : ticket))
	);

	return updated;
}
