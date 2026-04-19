import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent, FormEvent } from "react";
import { useTeamMembersQuery } from "../../hooks/useAuth";
import { useProjectsQuery } from "../../hooks/useProjects";
import {
	useCreateTicketMutation,
	useTicketsQuery,
	useUpdateTicketStatusMutation,
} from "../../hooks/useTickets";
import { TicketStatus } from "../../types/ticket";
import type { Ticket, TicketStatus as TicketStatusType } from "../../types/ticket";

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
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
	const [ticketName, setTicketName] = useState("");
	const [assigneeId, setAssigneeId] = useState("");
	const [estimatedHours, setEstimatedHours] = useState("2");
	const [ticketFormError, setTicketFormError] = useState("");
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

	useEffect(() => {
		if (!availableProjects.length) {
			setSelectedProjectId(null);
			return;
		}

		setSelectedProjectId((current) => {
			const isCurrentAvailable = availableProjects.some(
				(project) => project.id === current
			);

			return isCurrentAvailable ? current : availableProjects[0].id;
		});
	}, [availableProjects]);

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
	const createTicketMutation = useCreateTicketMutation(selectedProjectId);
	const updateTicketStatusMutation = useUpdateTicketStatusMutation(selectedProjectId);

	const memberMap = useMemo(
		() => new Map((members ?? []).map((member) => [member.id, member.name])),
		[members]
	);

	const assignableMembers = useMemo(() => {
		if (!selectedProject) {
			return [];
		}

		return selectedProject.memberIds
			.map((memberId) => {
				const memberName = memberMap.get(memberId);
				return memberName
					? {
						id: memberId,
						name: memberName,
					}
					: null;
			})
			.filter((member): member is { id: string; name: string } => Boolean(member));
	}, [memberMap, selectedProject]);

	useEffect(() => {
		if (!assignableMembers.length) {
			setAssigneeId("");
			return;
		}
        console.log("Assignable members updated:", assignableMembers);

		setAssigneeId((current) => {
			const exists = assignableMembers.some((member) => member.id === current);
			return exists ? current : assignableMembers[0].id;
		});
	}, [assignableMembers]);

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

	const handleCreateTicket = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			setTicketFormError("");

			if (!canEdit) {
				return;
			}

			if (!selectedProjectId) {
				setTicketFormError("Please select a project first.");
				return;
			}

			const parsedHours = Number(estimatedHours);
			if (!ticketName.trim()) {
				setTicketFormError("Ticket name is required.");
				return;
			}

			if (!assigneeId) {
				setTicketFormError("Please assign a team member.");
				return;
			}

			if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
				setTicketFormError("Estimated time must be a positive number.");
				return;
			}

			createTicketMutation.mutate(
				{
					name: ticketName.trim(),
					assigneeId,
					estimatedHours: parsedHours,
					status: TicketStatus.Todo,
				},
				{
					onSuccess: () => {
						setTicketName("");
						setAssigneeId(assignableMembers[0]?.id ?? "");
						setEstimatedHours("2");
					},
					onError: (mutationError) => {
						setTicketFormError((mutationError as Error).message);
					},
				}
			);
		},
		[
			assigneeId,
			assignableMembers,
			canEdit,
			createTicketMutation,
			estimatedHours,
			selectedProjectId,
			ticketName,
		]
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

	return (
		<section className="dashboard-content">
			<header className="kanban-header">
				<div>
					<h2>Project Ticket Board</h2>
					<p>
						{canEdit
							? "Select a project, create tickets, then move cards across ticket states."
							: "Read-only tickets for your assigned projects."}
					</p>
				</div>
				<span className="kanban-total-pill">{totalCards} total tickets</span>
			</header>

			<div className="kanban-toolbar">
				<div className="kanban-project-picker">
					<label htmlFor="kanban-project-select">
						{canEdit ? "Select Project" : "Assigned Projects"}
					</label>
					<select
						id="kanban-project-select"
						value={selectedProjectId ?? ""}
						onChange={(event) => setSelectedProjectId(event.target.value)}
					>
						{availableProjects.map((project) => (
							<option key={project.id} value={project.id}>
								{project.name}
							</option>
						))}
					</select>
					{!canEdit && selectedProject && (
						<p className="kanban-assigned-project">Viewing: {selectedProject.name}</p>
					)}
				</div>

				{canEdit && (
					<form className="kanban-ticket-form" onSubmit={handleCreateTicket}>
						<label>
							Ticket Name
							<input
								type="text"
								value={ticketName}
								onChange={(event) => setTicketName(event.target.value)}
								placeholder="e.g. Design login form"
							/>
						</label>
						<label>
							Assign To
							<select
								value={assigneeId}
								onChange={(event) => setAssigneeId(event.target.value)}
							>
								{assignableMembers.length === 0 && (
									<option value="">No team members available</option>
								)}
								{assignableMembers.map((member) => (
									<option key={member.id} value={member.id}>
										{member.name}
									</option>
								))}
							</select>
						</label>
						<label>
							Estimated Time (hours)
							<input
								type="number"
								min={1}
								step={1}
								value={estimatedHours}
								onChange={(event) => setEstimatedHours(event.target.value)}
							/>
						</label>
						<button
							type="submit"
							disabled={createTicketMutation.isPending || assignableMembers.length === 0}
						>
							{createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
						</button>
						{assignableMembers.length === 0 && (
							<p className="state-message error">
								Assign at least one team member to this project before creating tickets.
							</p>
						)}
						{ticketFormError && (
							<p className="state-message error">{ticketFormError}</p>
						)}
					</form>
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
									<small>Estimated time: {ticket.estimatedHours}h</small>
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
