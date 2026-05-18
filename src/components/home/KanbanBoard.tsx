import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { useTeamMembersQuery } from "../../hooks/useAuth";
import { useProjectsQuery } from "../../hooks/useProjects";
import {
	useTicketsQuery,
	useUpdateTicketStatusMutation,
} from "../../hooks/useTickets";
import { TicketStatus } from "../../types/ticket";
import type { Ticket, TicketStatus as TicketStatusType } from "../../types/ticket";
import { useProjectContext } from "../../context/ProjectContext";

interface KanbanBoardProps {
	canEdit: boolean;
}

const BOARD_COLUMNS: TicketStatusType[] = [
	TicketStatus.Todo,
	TicketStatus.InProgress,
	TicketStatus.Done,
];

export default function KanbanBoard({ canEdit }: KanbanBoardProps) {

    //throw new Error("Test crash: Kanban board rendering failed");
	const { data: projects, isLoading, isError, error } = useProjectsQuery();
	const { selectedProjectId } = useProjectContext();
	const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);
	const [activeColumn, setActiveColumn] = useState<TicketStatusType | null>(null);

	const availableProjects = useMemo(() => {
		if (!projects?.length) {
			return [];
		}

		return projects;
	}, [projects]);

    // useEffect(()=>{
    //     setSelectedProjectId("test-error");
    // }, []);

    //  if (selectedProjectId === "test-error") {
	// 	throw new Error("Test crash: Kanban board rendering failed");
	// }

	const selectedProject = useMemo(
		() => availableProjects.find((project) => project.id === selectedProjectId) ?? null,
		[availableProjects, selectedProjectId]
	);

	const {
		data: tickets,
		isLoading: isTicketsLoading,
		isError: isTicketsError,
		error: ticketsError,
	} = useTicketsQuery(selectedProjectId);
	const { data: members } = useTeamMembersQuery(true);
	const updateTicketStatusMutation = useUpdateTicketStatusMutation(selectedProjectId);

	const memberMap = useMemo(
		() => new Map((members ?? []).map((member) => [member.id, member.name])),
		[members]
	);

	const projectsByStatus = useMemo(() => {
		const grouped: Record<TicketStatusType, Ticket[]> = {
			[TicketStatus.Todo]: [],
			[TicketStatus.InProgress]: [],
			[TicketStatus.Done]: [],
		};

		for (const ticket of tickets ?? []) {
			grouped[ticket.status].push(ticket);
		}

		for (const status of BOARD_COLUMNS) {
			grouped[status].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
		}

		return grouped;
	}, [tickets]);

	const totalCards = useMemo(
		() => BOARD_COLUMNS.reduce((total, status) => total + projectsByStatus[status].length, 0),
		[projectsByStatus]
	);

	const findTicket = useCallback(
		(ticketId: string): Ticket | undefined => {
			return (tickets ?? []).find((ticket) => ticket.id === ticketId);
		},
		[tickets]
	);

	const handleDragStart = useCallback((ticketId: string) => {
		if (!canEdit) {
			return;
		}

		setDraggingTicketId(ticketId);
	}, [canEdit]);

	const handleDragEnd = () => {
		setDraggingTicketId(null);
		setActiveColumn(null);
	};

	const handleColumnDragOver = useCallback(
		(event: DragEvent<HTMLElement>, status: TicketStatusType) => {
			if (!canEdit) {
				return;
			}
			event.preventDefault();
			setActiveColumn(status);
		},
		[canEdit]
	);

	const handleDrop = useCallback(
		(targetStatus: TicketStatusType) => {
			if (!canEdit) {
				return;
			}

			if (!draggingTicketId) {
				return;
			}

			const ticket = findTicket(draggingTicketId);
			if (!ticket || ticket.status === targetStatus) {
				handleDragEnd();
				return;
			}

			updateTicketStatusMutation.mutate({
				ticketId: ticket.id,
				status: targetStatus,
			});
			handleDragEnd();
		},
		[canEdit, draggingTicketId, findTicket, handleDragEnd, updateTicketStatusMutation]
	);

	if (isLoading) {
		return <p className="state-message">Loading projects...</p>;
	}

	if (isError) {
		return <p className="state-message error">{(error as Error).message}</p>;
	}

	if (!availableProjects.length) {
		return (
			<p className="state-message">
				No available projects found. Create or get assigned to a project first.
			</p>
		);
	}

	if (!selectedProjectId) {
		return (
			<p className="state-message">
				Select an active project from the sidebar to view the Kanban board.
			</p>
		);
	}

	return (
		<section className="dashboard-content">
			<header className="kanban-header">
				<div>
					<h2>Project Ticket Board</h2>
					<p>
						{canEdit
							? "Select a project, then move cards across ticket states."
							: "Read-only tickets for your assigned projects."}
					</p>
				</div>
				<span className="kanban-total-pill">{totalCards} total tickets</span>
			</header>

			<div className="kanban-toolbar">
				<div className="kanban-project-picker">
					<p className="kanban-assigned-project">
						Active project: {selectedProject?.name ?? ""}
					</p>
					<small>Change the active project from the sidebar.</small>
				</div>

				{canEdit && (
					<p className="state-message">
						Create new tickets from the Backlog view.
					</p>
				)}
			</div>

			{isTicketsLoading && <p className="state-message">Loading tickets...</p>}
			{isTicketsError && (
				<p className="state-message error">{(ticketsError as Error).message}</p>
			)}

			<div className="kanban-board" role="list" aria-label="Project ticket board">
				{BOARD_COLUMNS.map((status) => (
					<section
						key={status}
						className={`kanban-column ${activeColumn === status ? "active" : ""}`.trim()}
						onDragOver={
							canEdit ? (event) => handleColumnDragOver(event, status) : undefined
						}
						onDrop={canEdit ? () => handleDrop(status) : undefined}
					>
						<header className="kanban-column-header">
							<h3>{status}</h3>
							<span>{projectsByStatus[status].length}</span>
						</header>

						<div className="kanban-cards">
							{projectsByStatus[status].map((ticket) => (
								<article
									key={ticket.id}
									className={`kanban-card ${
										draggingTicketId === ticket.id ? "dragging" : ""
									}`.trim()}
									draggable={canEdit}
									onDragStart={canEdit ? () => handleDragStart(ticket.id) : undefined}
									onDragEnd={canEdit ? handleDragEnd : undefined}
									role="listitem"
								>
									<div className="kanban-card-title-row">
										<h4>{ticket.name}</h4>
									</div>
									<small>Estimated time: {ticket.estimatedHours}h </small>
									<small>
										Assigned: {memberMap.get(ticket.assigneeId) ?? "Unassigned"}
									</small>
								</article>
							))}
							{projectsByStatus[status].length === 0 && (
								<div className="kanban-empty">
									{canEdit ? "Drop a ticket here" : "No tickets in this status"}
								</div>
							)}
						</div>
					</section>
				))}
			</div>
		</section>
	);
}
