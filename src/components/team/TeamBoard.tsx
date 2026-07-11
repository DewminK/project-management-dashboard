import { useMemo, useRef, useState } from "react";
import { useProjectsQuery } from "../../hooks/useProjects";
import { useTeamMembersQuery } from "../../hooks/useAuth";
import { useTicketsQuery } from "../../hooks/useTickets";
import { useDebounce } from "../../hooks/useDebounce";
import { usePagination } from "../../hooks/usePagination";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { useProjectContext } from "../../context/ProjectContext";
import { TicketStatus } from "../../types/ticket";

export default function TeamBoard() {
	const { data: projects, isLoading: isProjectsLoading } = useProjectsQuery();
	const { data: members, isLoading: isMembersLoading } = useTeamMembersQuery(true);
	const { selectedProjectId } = useProjectContext();
	const { data: tickets } = useTicketsQuery(selectedProjectId);

	const [rawSearch, setRawSearch] = useState("");
	const debouncedSearch = useDebounce(rawSearch, 300);

	const listRef = useRef<HTMLDivElement>(null);

	const allMemberIds = useMemo(() => {
		if (!projects) return new Set<string>();
		return new Set(projects.flatMap((p) => p.memberIds));
	}, [projects]);

	const memberMap = useMemo(
		() => new Map((members ?? []).map((m) => [m.id, m.name])),
		[members]
	);

	const memberProjectNames = useMemo(() => {
		const map = new Map<string, string[]>();
		for (const project of projects ?? []) {
			for (const memberId of project.memberIds) {
				if (!map.has(memberId)) map.set(memberId, []);
				map.get(memberId)!.push(project.name);
			}
		}
		return map;
	}, [projects]);

	const memberTicketStats = useMemo(() => {
		const map = new Map<string, { total: number; hours: number; byStatus: Record<string, number> }>();
		for (const ticket of tickets ?? []) {
			if (!map.has(ticket.assigneeId)) {
				map.set(ticket.assigneeId, {
					total: 0,
					hours: 0,
					byStatus: Object.fromEntries(Object.values(TicketStatus).map((s) => [s, 0])),
				});
			}
			const stat = map.get(ticket.assigneeId)!;
			stat.total += 1;
			stat.hours += ticket.estimatedHours;
			stat.byStatus[ticket.status] = (stat.byStatus[ticket.status] ?? 0) + 1;
		}
		return map;
	}, [tickets]);

	const enrichedMembers = useMemo(() => {
		return Array.from(allMemberIds)
			.map((memberId) => ({
				id: memberId,
				name: memberMap.get(memberId) ?? memberId,
				projectNames: memberProjectNames.get(memberId) ?? [],
				stats: memberTicketStats.get(memberId) ?? {
					total: 0,
					hours: 0,
					byStatus: Object.fromEntries(Object.values(TicketStatus).map((s) => [s, 0])),
				},
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [allMemberIds, memberMap, memberProjectNames, memberTicketStats]);

	const filteredMembers = useMemo(() => {
		const q = debouncedSearch.trim().toLowerCase();
		if (!q) return enrichedMembers;
		return enrichedMembers.filter(
			(m) =>
				m.name.toLowerCase().includes(q) ||
				m.projectNames.some((p) => p.toLowerCase().includes(q))
		);
	}, [debouncedSearch, enrichedMembers]);

	const { page, totalPages, paginated, setPage, hasPrev, hasNext, reset } =
		usePagination(filteredMembers, 5);

	useScrollToTop(listRef, [page, debouncedSearch]);

	const handleSearch = (value: string) => {
		setRawSearch(value);
		reset();
	};

	const isLoading = isProjectsLoading || isMembersLoading;

	if (isLoading) {
		return <p className="state-message">Loading team...</p>;
	}

	if (allMemberIds.size === 0) {
		return (
			<p className="state-message">
				No team members are assigned to your projects yet.
			</p>
		);
	}

	return (
		<section className="dashboard-content">
			<header className="team-header">
				<div>
					<h2>Team Overview</h2>
					<p>All members assigned to your projects and their workload.</p>
				</div>
				<span className="kanban-total-pill">{allMemberIds.size} members</span>
			</header>

			<div className="team-toolbar">
				<label className="backlog-search" htmlFor="team-search">
					Search Members
					<input
						id="team-search"
						value={rawSearch}
						onChange={(e) => handleSearch(e.target.value)}
						placeholder="Filter by name or project"
					/>
				</label>
				{selectedProjectId && (
					<span className="backlog-project-meta">
						Ticket stats from selected project
					</span>
				)}
			</div>

			{filteredMembers.length === 0 ? (
				<p className="state-message">No members match this search.</p>
			) : (
				<>
					<div className="team-grid" ref={listRef}>
						{paginated.map((member) => (
							<div key={member.id} className="team-card">
								<div className="team-card-header">
									<div className="team-avatar">
										{member.name.charAt(0).toUpperCase()}
									</div>
									<div>
										<h3>{member.name}</h3>
										<small className="team-projects-label">
											{member.projectNames.length === 0
												? "No projects"
												: member.projectNames.join(", ")}
										</small>
									</div>
								</div>

								<div className="team-stats-row">
									<div className="team-stat">
										<span className="team-stat-value">{member.stats.total}</span>
										<span className="team-stat-label">Tickets</span>
									</div>
									<div className="team-stat">
										<span className="team-stat-value">{member.stats.hours}h</span>
										<span className="team-stat-label">Est. Hours</span>
									</div>
								</div>

								{selectedProjectId && member.stats.total > 0 && (
									<div className="team-status-breakdown">
										{Object.entries(member.stats.byStatus).map(([status, count]) => (
											<span key={status} className="team-status-chip">
												{status}: {count}
											</span>
										))}
									</div>
								)}

								{selectedProjectId && member.stats.total === 0 && (
									<p className="state-message team-no-tickets">
										No tickets in this project
									</p>
								)}
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
