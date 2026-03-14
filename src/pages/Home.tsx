import DashboardShell from "../components/common/DashboardShell";
import ProjectManager from "../components/home/ProjectManager";
import TeamMember from "../components/home/TeamMember";
import { useAuthStore } from "../store/authStore";
import { UserRoles } from "../types/auth";

export default function Home() {
	const user = useAuthStore((state) => state.user);

	if (!user) {
		return null;
	}

	return (
		<DashboardShell>
			{user.role === UserRoles.ProjectManager ? <ProjectManager /> : <TeamMember />}
		</DashboardShell>
	);
}
