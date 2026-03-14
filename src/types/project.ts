export const ProjectStatus = {
    Planned: "Planned",
    InProgress: "In Progress",
    Completed: "Completed",
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export interface Project {
    id: string;
    name: string;
    description: string;
    status: ProjectStatus;
    managerId: string;
    memberIds: string[];
    createdAt: string;
}

export interface ProjectInput {
    name: string;
    description: string;
    status: ProjectStatus;
    memberIds: string[];
}
