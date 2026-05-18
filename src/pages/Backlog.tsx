import DashboardShell from "../components/common/DashboardShell";
import ErrorBoundary from "../components/common/ErrorBoundary";
import BacklogBoard from "../components/home/BacklogBoard";
import { useAuthStore } from "../store/authStore";
import { UserRoles } from "../types/auth";

export default function Backlog() {
	const user = useAuthStore((state) => state.user);

	if (!user) {
		return null;
	}

	const canEdit = user.role === UserRoles.ProjectManager;

	return (
		<DashboardShell>
			<ErrorBoundary
				fallbackTitle="Backlog failed"
				fallbackMessage="A rendering issue occurred while opening the backlog view."
			>
				<BacklogBoard canEdit={canEdit} />
			</ErrorBoundary>
		</DashboardShell>
	);
}
