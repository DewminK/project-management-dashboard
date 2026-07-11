import { useMemo, useRef, useState } from "react";
import { useProjectsQuery } from "../../hooks/useProjects";
import { useTicketsQuery } from "../../hooks/useTickets";
import { useDebounce } from "../../hooks/useDebounce";
import { usePagination } from "../../hooks/usePagination";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { useCurrentUser } from "../../hooks/useAuth";
import { useProjectContext } from "../../context/ProjectContext";
import { TicketStatus } from "../../types/ticket";


export default function MyWorkBoard() {
	const user = useCurrentUser();
	const { data: projects, isLoading: isProjectsLoading } = useProjectsQuery();
	const { selectedProjectId } = useProjectContext();
	const { data: tickets, isLoading: isTicketsLoading } = useTicketsQuery(selectedProjectId);

	const [rawSearch, setRawSearch] = useState("");
	const debouncedSearch = useDebounce(rawSearch, 1000);

	const listRef = useRef<HTMLDivElement>(null);

	const myTickets = useMemo(
		() => (tickets ?? []).filter((t) => t.assigneeId === user?.id),
		[tickets, user?.id]
	);

	const stats = useMemo(() => {
		const byStatus = Object.fromEntries(
			Object.values(TicketStatus).map((s) => [
				s,
				myTickets.filter((t) => t.status === s).length,
			])
		);
		const totalHours = myTickets.reduce((sum, t) => sum + t.estimatedHours, 0);
		return { byStatus, totalHours };
	}, [myTickets]);

	const myProjects = useMemo(
		() => (projects ?? []).filter((p) => p.memberIds.includes(user?.id ?? "")),
		[projects, user?.id]
	);

	const filteredTickets = useMemo(() => {
		const q = debouncedSearch.trim().toLowerCase();
		if (!q) return myTickets;
		return myTickets.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				t.id.toLowerCase().includes(q) ||
				t.status.toLowerCase().includes(q)
		);
	}, [debouncedSearch, myTickets]);

	const { page, totalPages, paginated, setPage, hasPrev, hasNext, reset } =
		usePagination(filteredTickets, 2);

	useScrollToTop(listRef, [page, debouncedSearch]);

	const handleSearch = (value: string) => {
		setRawSearch(value);
		reset();
	};

	if (isProjectsLoading) {
		return <p className="state-message">Loading your projects...</p>;
	}

	if (!selectedProjectId) {
		return (
			<p className="state-message">
				Select a project from the sidebar to view your work.
			</p>
		);
	}

	return (
		<section className="dashboard-content">
			<header className="team-header">
				<div>
					<h2>My Work</h2>
					<p>Your tickets and workload in the selected project.</p>
				</div>
				<span className="kanban-total-pill">{myProjects.length} project(s)</span>
			</header>

			<div className="my-work-stats">
				<div className="my-work-stat-card">
					<span className="team-stat-value">{myTickets.length}</span>
					<span className="team-stat-label">My Tickets</span>
				</div>
				<div className="my-work-stat-card">
					<span className="team-stat-value">{stats.totalHours}h</span>
					<span className="team-stat-label">Est. Hours</span>
				</div>
				{Object.entries(stats.byStatus).map(([status, count]) => (
					<div className="my-work-stat-card" key={status}>
						<span className="team-stat-value">{count}</span>
						<span className="team-stat-label">{status}</span>
					</div>
				))}
			</div>

			<div className="team-toolbar">
				<label className="backlog-search" htmlFor="my-work-search">
					Search My Tickets
					<input
						id="my-work-search"
						value={rawSearch}
						onChange={(e) => handleSearch(e.target.value)}
						placeholder="Filter by name, ID, or status"
					/>
				</label>
			</div>

			{isTicketsLoading && <p className="state-message">Loading tickets...</p>}

			{!isTicketsLoading && myTickets.length === 0 && (
				<p className="state-message">
					You have no tickets assigned in this project.
				</p>
			)}

			{!isTicketsLoading && myTickets.length > 0 && filteredTickets.length === 0 && (
				<p className="state-message">No tickets match this search.</p>
			)}

			{!isTicketsLoading && filteredTickets.length > 0 && (
				<>
					<div className="my-work-list" ref={listRef}>
						{paginated.map((ticket) => (
							<div key={ticket.id} className="my-work-ticket">
								<div className="my-work-ticket-info">
									<h4>{ticket.name}</h4>
									<small>{ticket.id}</small>
								</div>
								<div className="my-work-ticket-meta">
									<span className="status-pill">{ticket.status}</span>
									<span className="my-work-hours">{ticket.estimatedHours}h</span>
									<small className="my-work-date">
										{new Date(ticket.createdAt).toLocaleDateString()}
									</small>
								</div>
							</div>
						))}
					</div>

					{totalPages > 1 && (
						<div className="team-pagination">
							<button
								className="secondary-button"
								onClick={() => setPage(page - 1)}
								disabled={!hasPrev}
								type="button"
							>
								← Prev
							</button>
							<span className="team-page-info">
								Page {page} of {totalPages}
							</span>
							<button
								className="secondary-button"
								onClick={() => setPage(page + 1)}
								disabled={!hasNext}
								type="button"
							>
								Next →
							</button>
						</div>
					)}
				</>
			)}
		</section>
	);
}
