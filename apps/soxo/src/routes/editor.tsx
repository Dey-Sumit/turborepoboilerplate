'use client';

import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router';
import {toast} from 'sonner';
import {getProject} from '../db/project-service';
import {ProjectProvider} from '../editor/context/project-context';
import {Editor} from '../editor/editor';
import {migrateStateWithTrackIds} from '../editor/state/persistance';
import useEditorStore from '../zustand/editor-store';
import type {Route} from './+types/editor';

export const meta: Route.MetaFunction = () => {
	return [
		{
			title: 'Editor - Oxoven Video',
		},
	];
};

function EditorLoader({projectId}: {projectId: string}) {
	const navigate = useNavigate();
	const setState = useEditorStore((state) => state.setState);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		const loadProject = async () => {
			try {
				const project = await getProject(projectId);

				if (cancelled) return;

				if (!project) {
					setError('Project not found');
					toast.error('Project not found');
					setTimeout(() => navigate('/projects'), 2000);
					return;
				}

				// Load project data into Zustand store
				// Migrate state to add trackId if missing (for backward compatibility)
				const migratedData = migrateStateWithTrackIds(project.data);
				setState((draft) => {
					draft.compositionState = migratedData;
					// Reset UI state for fresh editor session
					// textItemEditing: MIGRATED TO ZUSTAND UI STORE
					// textItemHoverPreview: MIGRATED TO ZUSTAND UI STORE
					draft.renderingTasks = [];
					draft.captioningTasks = [];
					draft.sceneCaptioningTasks = [];
					draft.initialized = false; // Will be set to true by EditorWrapper
					draft.assetStatus = {};
				});

				setIsLoading(false);
			} catch (err) {
				if (cancelled) return;
				const message =
					err instanceof Error ? err.message : 'Failed to load project';
				setError(message);
				toast.error(message);
			}
		};

		loadProject();

		return () => {
			cancelled = true;
		};
	}, [projectId, setState, navigate]);

	if (error) {
		return (
			<div className="bg-background flex h-screen w-screen items-center justify-center">
				<div className="text-center">
					<h1 className="text-destructive mb-2 text-lg font-semibold">Error</h1>
					<p className="text-muted-foreground">{error}</p>
					<p className="text-muted-foreground mt-2 text-sm">
						Redirecting to projects...
					</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="bg-background flex h-screen w-screen items-center justify-center">
				<div className="text-center">
					<div className="border-primary mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-t-transparent" />
					<p className="text-muted-foreground">Loading project...</p>
				</div>
			</div>
		);
	}

	return (
		<ProjectProvider projectId={projectId}>
			<Editor />
		</ProjectProvider>
	);
}

export default function EditorPage() {
	const {projectId} = useParams<{projectId: string}>();

	if (!projectId) {
		return (
			<div className="bg-background flex h-screen w-screen items-center justify-center">
				<div className="text-center">
					<h1 className="text-destructive mb-2 text-lg font-semibold">Error</h1>
					<p className="text-muted-foreground">No project ID provided</p>
				</div>
			</div>
		);
	}

	return <EditorLoader projectId={projectId} />;
}
