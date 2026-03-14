import { useProjectsQuery } from "../../hooks/useProjects";

export default function TeamMember() {
	const { data: projects, isLoading, isError, error } = useProjectsQuery();

	if (isLoading) {
		return <p className="state-message">Loading your assigned projects...</p>;
	}

	if (isError) {
		return (
			<p className="state-message error">
				{(error as Error).message || "Could not load projects."}
			</p>
		);
	}

	if (!projects || projects.length === 0) {
		return (
			<p className="state-message">
				No assigned projects yet. Your project manager will assign one soon.
			</p>
		);
	}

	return (
		<section className="dashboard-content">
			<h2>My Assigned Projects</h2>
			<div className="projects-grid">
				{projects.map((project) => (
					<article key={project.id} className="project-card">
						<div className="project-header">
							<h3>{project.name}</h3>
							<span className="status-pill">{project.status}</span>
						</div>
						<p>{project.description}</p>
					</article>
				))}
			</div>
		</section>
	);
}
