import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useProjectsQuery } from "../../hooks/useProjects";
import { useTeamMembersQuery } from "../../hooks/useAuth";
import {
	useCreateTicketMutation,
	useTicketsQuery,
	useUpdateTicketAssigneeMutation,
	useUpdateTicketStatusMutation,
} from "../../hooks/useTickets";
import { TicketStatus } from "../../types/ticket";
import type { TicketStatus as TicketStatusType } from "../../types/ticket";
import { useProjectContext } from "../../context/ProjectContext";

interface BacklogBoardProps {
	canEdit: boolean;
}

const STATUS_OPTIONS = Object.values(TicketStatus);

export default function BacklogBoard({ canEdit }: BacklogBoardProps) {
	const { data: projects, isLoading, isError, error } = useProjectsQuery();
	const { data: members } = useTeamMembersQuery(true);
	const { selectedProjectId } = useProjectContext();
	const [ticketName, setTicketName] = useState("");
	const [assigneeId, setAssigneeId] = useState("");
	const [estimatedHours, setEstimatedHours] = useState("2");
	const [ticketFormError, setTicketFormError] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [isFiltering, startTransition] = useTransition();
	const searchInputRef = useRef<HTMLInputElement | null>(null);
	const prevSearchRef = useRef(searchQuery);
	const isCreatingRef = useRef(false);

	const availableProjects = useMemo(() => projects ?? [], [projects]);
	const deferredQuery = useDeferredValue(searchQuery);

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

	const createTicketMutation = useCreateTicketMutation(selectedProjectId);
	const updateStatusMutation = useUpdateTicketStatusMutation(selectedProjectId);
	const updateAssigneeMutation = useUpdateTicketAssigneeMutation(selectedProjectId);

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

	const handleStatusChange = useCallback(
		(ticketId: string, status: TicketStatusType) => {
			if (!canEdit) {
				return;
			}

			updateStatusMutation.mutate({ ticketId, status });
		},
		[canEdit, updateStatusMutation]
	);

	const handleAssigneeChange = useCallback(
		(ticketId: string, assigneeId: string) => {
			if (!canEdit) {
				return;
			}

			updateAssigneeMutation.mutate({ ticketId, assigneeId });
		},
		[canEdit, updateAssigneeMutation]
	);

	useEffect(() => {
		if (!assignableMembers.length) {
			setAssigneeId("");
			return;
		}

		setAssigneeId((current) => {
			const exists = assignableMembers.some((member) => member.id === current);
			return exists ? current : assignableMembers[0].id;
		});
	}, [assignableMembers]);

	// useEffect(() => {
	// 	searchInputRef.current?.focus();
	// }, []);

	useEffect(() => {
		prevSearchRef.current = searchQuery;
	}, [searchQuery]);

	const handleSearchChange = (value: string) => {
		startTransition(() => {
			setSearchQuery(value);
		});
	};

	const filteredTickets = useMemo(() => {
		const normalizedQuery = deferredQuery.trim().toLowerCase();
		if (!normalizedQuery) {
			return tickets ?? [];
		}

		return (tickets ?? []).filter((ticket) => {
			const assigneeName = memberMap.get(ticket.assigneeId) ?? "";
			return (
				ticket.name.toLowerCase().includes(normalizedQuery) ||
				ticket.id.toLowerCase().includes(normalizedQuery) ||
				assigneeName.toLowerCase().includes(normalizedQuery)
			);
		});
	}, [deferredQuery, memberMap, tickets]);

	const handleCreateTicket = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			setTicketFormError("");

			if (isCreatingRef.current) {
				return;
			}

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

			isCreatingRef.current = true;
			createTicketMutation.mutate(
				{
					name: ticketName.trim(),
					assigneeId,
					estimatedHours: parsedHours,
					status: TicketStatus.Todo,
				},
				{
					onSuccess: () => {
						isCreatingRef.current = false;
						setTicketName("");
						setAssigneeId(assignableMembers[0]?.id ?? "");
						setEstimatedHours("2");
					},
					onError: (mutationError) => {
						isCreatingRef.current = false;
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

	if (!selectedProjectId) {
		return (
			<p className="state-message">
				Select an active project from the sidebar to view the backlog.
			</p>
		);
	}

	return (
		<section className="dashboard-content">
			<header className="backlog-header">
				<div>
					<h2>Ticket Backlog</h2>
					<p>
						Review every ticket in the selected project and manage assignments.
					</p>
				</div>
				<span className="kanban-total-pill">{tickets?.length ?? 0} tickets</span>
			</header>

			<div className="backlog-toolbar">
				<label className="backlog-search" htmlFor="backlog-search">
					Search Tickets
					<input
						id="backlog-search"
						ref={searchInputRef}
						value={searchQuery}
						onChange={(event) => handleSearchChange(event.target.value)}
						placeholder="Filter by ticket, ID, or assignee"
					/>
				</label>
				{selectedProject && (
					<span className="backlog-project-meta">
						{selectedProject.memberIds.length} assigned member(s)
					</span>
				)}
			</div>

			{canEdit && (
				<form className="backlog-create-form" onSubmit={handleCreateTicket}>
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

			{isTicketsLoading && <p className="state-message">Loading tickets...</p>}
			{isTicketsError && (
				<p className="state-message error">{(ticketsError as Error).message}</p>
			)}

			{!isTicketsLoading && !isTicketsError && filteredTickets.length === 0 && (
				<p className="state-message">No tickets match this search.</p>
			)}
			{isFiltering && <p className="state-message">Filtering tickets...</p>}

			<div className="backlog-table" role="table" aria-label="Ticket backlog">
				<div className="backlog-row backlog-header-row" role="row">
					<div className="backlog-cell" role="columnheader">
						Ticket
					</div>
					<div className="backlog-cell" role="columnheader">
						Status
					</div>
					<div className="backlog-cell" role="columnheader">
						Assignee
					</div>
					<div className="backlog-cell" role="columnheader">
						Created
					</div>
				</div>

				{filteredTickets.map((ticket) => (
					<div className="backlog-row" role="row" key={ticket.id}>
						<div className="backlog-cell" role="cell">
							<h4>{ticket.name}</h4>
							<small>{ticket.id}</small>
						</div>
						<div className="backlog-cell" role="cell">
							{canEdit ? (
								<select
									value={ticket.status}
									onChange={(event) =>
										handleStatusChange(
											ticket.id,
											event.target.value as TicketStatusType
										)
									}
								>
									{STATUS_OPTIONS.map((status) => (
										<option key={status} value={status}>
											{status}
										</option>
									))}
								</select>
							) : (
								<span className="status-pill">{ticket.status}</span>
							)}
						</div>
						<div className="backlog-cell" role="cell">
							{canEdit ? (
								<select
									value={ticket.assigneeId}
									onChange={(event) =>
										handleAssigneeChange(ticket.id, event.target.value)
									}
									disabled={assignableMembers.length === 0}
								>
									<option value="">Unassigned</option>
									{assignableMembers.map((member) => (
										<option key={member.id} value={member.id}>
											{member.name}
										</option>
									))}
								</select>
							) : (
								<span>
									{memberMap.get(ticket.assigneeId) ?? "Unassigned"}
								</span>
							)}
						</div>
						<div className="backlog-cell" role="cell">
							<small>{new Date(ticket.createdAt).toLocaleDateString()}</small>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}