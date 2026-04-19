import DashboardShell from "../components/common/DashboardShell";
import ErrorBoundary from "../components/common/ErrorBoundary";
import KanbanBoard from "../components/home/KanbanBoard";
import { useAuthStore } from "../store/authStore";
import { UserRoles } from "../types/auth";

export default function Kanban() {
	const user = useAuthStore((state) => state.user);

	if (!user) {
		return null;
	}

	const canEdit = user.role === UserRoles.ProjectManager;

	return (
		<DashboardShell>
			<ErrorBoundary
				fallbackTitle="Kanban board failed"
				fallbackMessage="A rendering issue occurred while opening the Kanban board."
			>
				<KanbanBoard canEdit={canEdit} />
			</ErrorBoundary>
		</DashboardShell>
	);
}
