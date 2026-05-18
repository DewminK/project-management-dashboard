import { createContext, useContext, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

interface ProjectContextValue {
	selectedProjectId: string | null;
	setSelectedProjectId: Dispatch<SetStateAction<string | null>>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

interface ProjectProviderProps {
	children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

	const value = useMemo<ProjectContextValue>(
		() => ({
			selectedProjectId,
			setSelectedProjectId,
		}),
		[selectedProjectId]
	);

	return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
	const context = useContext(ProjectContext);
	if (!context) {
		throw new Error("useProjectContext must be used within ProjectProvider");
	}
	return context;
}
