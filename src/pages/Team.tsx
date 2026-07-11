import DashboardShell from "../components/common/DashboardShell";
import TeamBoard from "../components/team/TeamBoard";
import MyWorkBoard from "../components/team/MyWorkBoard";
import { useAuthStore } from "../store/authStore";
import { UserRoles } from "../types/auth";

export default function Team() {
	const user = useAuthStore((state) => state.user);

	if (!user) {
		return null;
	}

	return (
		<DashboardShell>
			{user.role === UserRoles.ProjectManager ? <TeamBoard /> : <MyWorkBoard />}
		</DashboardShell>
	);
}
