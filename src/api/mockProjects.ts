import type { Project, ProjectInput } from "../types/project";
import { UserRoles } from "../types/auth";
import type { User } from "../types/auth";

const PROJECTS_STORAGE_KEY = "pmd_projects";

const INITIAL_PROJECTS: Project[] = [
    {
        id: "project-1",
        name: "Website Revamp",
        description: "Upgrade the client marketing website using a new design system.",
        status: "In Progress",
        managerId: "pm-1",
        memberIds: ["tm-1"],
        createdAt: new Date().toISOString(),
    },
];

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStoredProjects(): Project[] {
    const serialized = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!serialized) {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
        return INITIAL_PROJECTS;
    }

    try {
        const parsed = JSON.parse(serialized) as Project[];
        if (!Array.isArray(parsed)) {
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
            return INITIAL_PROJECTS;
        }
        return parsed;
    } catch {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
        return INITIAL_PROJECTS;
    }
}

function setStoredProjects(projects: Project[]): void {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

export async function mockFetchProjects(user: User): Promise<Project[]> {
    await sleep(500);

    const projects = getStoredProjects();
    if (user.role === UserRoles.ProjectManager) {
        return projects.filter((project) => project.managerId === user.id);
    }

    return projects.filter((project) => project.memberIds.includes(user.id));
}

export async function mockCreateProject(
    user: User,
    payload: ProjectInput
): Promise<Project> {
    await sleep(700);

    if (user.role !== UserRoles.ProjectManager) {
        throw new Error("Only project managers can create projects.");
    }

    const projects = getStoredProjects();
    const project: Project = {
        id: `project-${Date.now()}`,
        name: payload.name.trim(),
        description: payload.description.trim(),
        status: payload.status,
        managerId: user.id,
        memberIds: payload.memberIds,
        createdAt: new Date().toISOString(),
    };

    setStoredProjects([project, ...projects]);
    return project;
}

export async function mockUpdateProject(
    user: User,
    projectId: string,
    payload: ProjectInput
): Promise<Project> {
    await sleep(700);

    if (user.role !== UserRoles.ProjectManager) {
        throw new Error("Only project managers can edit projects.");
    }

    const projects = getStoredProjects();
    const target = projects.find((project) => project.id === projectId);

    if (!target) {
        throw new Error("Project not found.");
    }

    if (target.managerId !== user.id) {
        throw new Error("You can only edit your own projects.");
    }

    const updated: Project = {
        ...target,
        name: payload.name.trim(),
        description: payload.description.trim(),
        status: payload.status,
        memberIds: payload.memberIds,
    };

    const merged = projects.map((project) =>
        project.id === projectId ? updated : project
    );
    setStoredProjects(merged);

    return updated;
}

export async function mockDeleteProject(user: User, projectId: string): Promise<void> {
    await sleep(400);

    if (user.role !== UserRoles.ProjectManager) {
        throw new Error("Only project managers can delete projects.");
    }

    const projects = getStoredProjects();
    const target = projects.find((project) => project.id === projectId);

    if (!target) {
        throw new Error("Project not found.");
    }

    if (target.managerId !== user.id) {
        throw new Error("You can only delete your own projects.");
    }

    setStoredProjects(projects.filter((project) => project.id !== projectId));
}
