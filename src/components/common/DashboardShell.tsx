import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { useLogoutMutation } from "../../hooks/useAuth";
import { useProjectsQuery } from "../../hooks/useProjects";
import { useAuthStore } from "../../store/authStore";
import { useProjectContext } from "../../context/ProjectContext";

interface DashboardShellProps {
	children: ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
	const navigate = useNavigate();
	const user = useAuthStore((state) => state.user);
	const logoutMutation = useLogoutMutation();
	const { data: projects } = useProjectsQuery();
	const { selectedProjectId, setSelectedProjectId } = useProjectContext();
	const lastProjectRef = useRef<string | null>(null);

	const availableProjects = useMemo(() => projects ?? [], [projects]);

	useEffect(() => {
		if (!availableProjects.length) {
			setSelectedProjectId(null);
			return;
		}

		setSelectedProjectId((current) => {
			const isCurrentAvailable = availableProjects.some(
				(project) => project.id === current
			);
			if (isCurrentAvailable) {
				return current;
			}

			const lastProjectId = lastProjectRef.current;
			if (
				lastProjectId &&
				availableProjects.some((project) => project.id === lastProjectId)
			) {
				return lastProjectId;
			}

			return availableProjects[0].id;
		});
	}, [availableProjects, setSelectedProjectId]);

	useEffect(() => {
		if (selectedProjectId) {
			lastProjectRef.current = selectedProjectId;
		}
	}, [selectedProjectId]);

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
				<div className="sidebar-project-card">
					<p className="card-label">CURRENT PROJECT</p>

					<div className="project-switcher">
						<select
							value={selectedProjectId ?? ""}
							onChange={(e) => setSelectedProjectId(e.target.value)}
							disabled={!availableProjects.length}
							className="project-switcher-select"
						>
							{availableProjects.map((project) => (
								<option key={project.id} value={project.id}>
									{project.name}
								</option>
							))}
						</select>

						<div className="project-indicator" />
					</div>

					<div className="project-meta">
						<span>{availableProjects.length} projects</span>
						<span className="dot">•</span>
						<span>Active workspace</span>
					</div>
				</div>
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
						to="/dashboard/backlog"
						className={({ isActive }) =>
							`dashboard-nav-link ${isActive ? "active" : ""}`.trim()
						}
					>
						Backlog
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
