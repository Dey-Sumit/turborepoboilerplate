import React, {createContext, useContext} from 'react';

interface ProjectContextValue {
	projectId: string;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
	projectId,
	children,
}: {
	projectId: string;
	children: React.ReactNode;
}) {
	return (
		<ProjectContext.Provider value={{projectId}}>
			{children}
		</ProjectContext.Provider>
	);
}

export function useProjectId(): string {
	const context = useContext(ProjectContext);
	if (!context) {
		throw new Error('useProjectId must be used within a ProjectProvider');
	}
	return context.projectId;
}

export function useProjectIdOptional(): string | null {
	const context = useContext(ProjectContext);
	return context?.projectId ?? null;
}
