import { useMemo } from "react";
import { useProjectsQuery } from "./useProjects";
import { useTicketsQuery } from "./useTickets";
import { TicketStatus } from "../types/ticket";
import type { Project } from "../types/project";

export interface MemberStat {
	memberId: string;
	memberName: string;
	projects: Project[];
	totalTickets: number;
	totalEstimatedHours: number;
	ticketsByStatus: Record<string, number>;
}

interface UseMemberStatsOptions {
	projectId: string | null;
	memberId: string;
	memberName: string;
}

export function useMemberStats({ projectId, memberId, memberName }: UseMemberStatsOptions): MemberStat {
	const { data: projects } = useProjectsQuery();
	const { data: tickets } = useTicketsQuery(projectId);

	return useMemo(() => {
		const memberProjects = (projects ?? []).filter((p) =>
			p.memberIds.includes(memberId)
		);

		const memberTickets = (tickets ?? []).filter(
			(t) => t.assigneeId === memberId
		);

		const ticketsByStatus = Object.fromEntries(
			Object.values(TicketStatus).map((s) => [
				s,
				memberTickets.filter((t) => t.status === s).length,
			])
		);

		const totalEstimatedHours = memberTickets.reduce(
			(sum, t) => sum + t.estimatedHours,
			0
		);

		return {
			memberId,
			memberName,
			projects: memberProjects,
			totalTickets: memberTickets.length,
			totalEstimatedHours,
			ticketsByStatus,
		};
	}, [memberId, memberName, projects, tickets]);
}
