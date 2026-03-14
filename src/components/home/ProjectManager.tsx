import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useTeamMembersQuery } from "../../hooks/useAuth";
import {
	useCreateProjectMutation,
	useDeleteProjectMutation,
	useProjectsQuery,
	useUpdateProjectMutation,
} from "../../hooks/useProjects";
import { ProjectStatus } from "../../types/project";
import type { Project, ProjectInput, ProjectStatus as ProjectStatusType } from "../../types/project";

interface ProjectFormState {
	name: string;
	description: string;
	status: ProjectStatusType;
	memberIds: string[];
}

const DEFAULT_FORM: ProjectFormState = {
	name: "",
	description: "",
	status: ProjectStatus.Planned,
	memberIds: [],
};

function mapProjectToForm(project: Project): ProjectFormState {
	return {
		name: project.name,
		description: project.description,
		status: project.status,
		memberIds: project.memberIds,
	};
}

export default function ProjectManager() {
	const { data: projects, isLoading, isError, error } = useProjectsQuery();
	const { data: members, isLoading: isMembersLoading } = useTeamMembersQuery(true);

	const createMutation = useCreateProjectMutation();
	const updateMutation = useUpdateProjectMutation();
	const deleteMutation = useDeleteProjectMutation();

	const [form, setForm] = useState<ProjectFormState>(DEFAULT_FORM);
	const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
	const [formError, setFormError] = useState<string>("");
	const [feedback, setFeedback] = useState<string>("");

	const isEditing = Boolean(editingProjectId);
	const isSubmitting = createMutation.isPending || updateMutation.isPending;

	const sortedProjects = useMemo(() => {
		return (projects ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}, [projects]);

	const handleMemberToggle = (memberId: string) => {
		setForm((current) => {
			const exists = current.memberIds.includes(memberId);
			return {
				...current,
				memberIds: exists
					? current.memberIds.filter((id) => id !== memberId)
					: [...current.memberIds, memberId],
			};
		});
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError("");
		setFeedback("");

		if (!form.name.trim() || !form.description.trim()) {
			setFormError("Name and description are required.");
			return;
		}

		if (form.memberIds.length === 0) {
			setFormError("Assign at least one team member.");
			return;
		}

		const payload: ProjectInput = {
			name: form.name,
			description: form.description,
			status: form.status,
			memberIds: form.memberIds,
		};

		if (editingProjectId) {
			updateMutation.mutate(
				{ projectId: editingProjectId, payload },
				{
					onSuccess: () => {
						setFeedback("Project updated successfully.");
						setForm(DEFAULT_FORM);
						setEditingProjectId(null);
					},
					onError: (mutationError) => {
						setFormError((mutationError as Error).message);
					},
				}
			);
			return;
		}

		createMutation.mutate(payload, {
			onSuccess: () => {
				setFeedback("Project created successfully.");
				setForm(DEFAULT_FORM);
			},
			onError: (mutationError) => {
				setFormError((mutationError as Error).message);
			},
		});
	};

	const handleEdit = (project: Project) => {
		setForm(mapProjectToForm(project));
		setEditingProjectId(project.id);
		setFeedback("");
		setFormError("");
	};

	const handleDelete = (projectId: string) => {
		const shouldDelete = window.confirm("Delete this project permanently?");
		if (!shouldDelete) {
			return;
		}

		setFeedback("");
		deleteMutation.mutate(projectId, {
			onSuccess: () => {
				setFeedback("Project deleted successfully.");
			},
		});
	};

	return (
		<section className="dashboard-content">
			<div className="manager-grid">
				<form className="form-card" onSubmit={handleSubmit}>
					<h2>{isEditing ? "Edit Project" : "Create Project"}</h2>

					<label>
						Project Name
						<input
							value={form.name}
							onChange={(event) =>
								setForm((current) => ({ ...current, name: event.target.value }))
							}
							placeholder="e.g. Mobile App Redesign"
						/>
					</label>

					<label>
						Description
						<textarea
							value={form.description}
							onChange={(event) =>
								setForm((current) => ({ ...current, description: event.target.value }))
							}
							placeholder="Short summary"
							rows={4}
						/>
					</label>

					<label>
						Status
						<select
							value={form.status}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									status: event.target.value as ProjectStatusType,
								}))
							}
						>
							{Object.values(ProjectStatus).map((status) => (
								<option key={status} value={status}>
									{status}
								</option>
							))}
						</select>
					</label>

					<fieldset>
						<legend>Assign Team Members</legend>
						{isMembersLoading && <p>Loading team members...</p>}
						{!isMembersLoading && (!members || members.length === 0) && (
							<p>No team members available yet.</p>
						)}
						<div className="checkbox-grid">
							{members?.map((member) => (
								<label key={member.id} className="checkbox-label">
									<input
										type="checkbox"
										checked={form.memberIds.includes(member.id)}
										onChange={() => handleMemberToggle(member.id)}
									/>
									{member.name}
								</label>
							))}
						</div>
					</fieldset>

					{formError && <p className="state-message error">{formError}</p>}
					{feedback && <p className="state-message success">{feedback}</p>}

					<div className="form-actions">
						{isEditing && (
							<button
								className="secondary-button"
								onClick={() => {
									setEditingProjectId(null);
									setForm(DEFAULT_FORM);
									setFormError("");
								}}
								type="button"
							>
								Cancel edit
							</button>
						)}
						<button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? "Saving..."
								: isEditing
								  ? "Update project"
								  : "Create project"}
						</button>
					</div>
				</form>

				<div className="list-card">
					<h2>My Projects</h2>
					{isLoading && <p className="state-message">Loading projects...</p>}
					{isError && (
						<p className="state-message error">
							{(error as Error).message || "Could not load projects."}
						</p>
					)}
					{!isLoading && !isError && sortedProjects.length === 0 && (
						<p className="state-message">No projects yet. Create your first project.</p>
					)}
					<div className="projects-list">
						{sortedProjects.map((project) => (
							<article key={project.id} className="project-card">
								<div className="project-header">
									<h3>{project.name}</h3>
									<span className="status-pill">{project.status}</span>
								</div>
								<p>{project.description}</p>
								<small>{project.memberIds.length} member(s) assigned</small>
								<div className="project-actions">
									<button
										className="secondary-button"
										onClick={() => handleEdit(project)}
										type="button"
									>
										Edit
									</button>
									<button
										className="danger-button"
										disabled={deleteMutation.isPending}
										onClick={() => handleDelete(project.id)}
										type="button"
									>
										Delete
									</button>
								</div>
							</article>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
