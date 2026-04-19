import { NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useLogoutMutation } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";

interface DashboardShellProps {
	children: ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
	const navigate = useNavigate();
	const user = useAuthStore((state) => state.user);
	const logoutMutation = useLogoutMutation();

	const handleLogout = () => {
		logoutMutation.mutate(undefined, {
			onSuccess: () => {
				navigate("/", { replace: true });
			},
		});
	};

	return (
		<div className="dashboard-layout">
			<aside className="dashboard-sidebar">
				<div className="dashboard-brand">Project Board</div>
				<p className="dashboard-role">{user?.role ?? ""}</p>
				<nav className="dashboard-nav" aria-label="Dashboard Navigation">
					<NavLink
						to="/dashboard"
						end
						className={({ isActive }) =>
							`dashboard-nav-link ${isActive ? "active" : ""}`.trim()
						}
					>
						Overview
					</NavLink>
					<NavLink
						to="/dashboard/kanban"
						className={({ isActive }) =>
							`dashboard-nav-link ${isActive ? "active" : ""}`.trim()
						}
					>
						Kanban Board
					</NavLink>
				</nav>
				<button className="ghost-button" onClick={handleLogout} type="button">
					{logoutMutation.isPending ? "Logging out..." : "Logout"}
				</button>
			</aside>

			<main className="dashboard-main">
				<header className="dashboard-topbar">
					<h1>Welcome, {user?.name}</h1>
					<span>{user?.email}</span>
				</header>
				{children}
			</main>
		</div>
	);
}
