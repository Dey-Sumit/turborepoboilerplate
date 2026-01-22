import {nanoid} from 'nanoid';
import {compositionState} from '../editor/state/types';
import {db, Project, isIndexedDBAvailable} from './projects-db';

/**
 * Check if storage is available and throw a helpful error if not
 */
function checkStorageAvailable(): void {
	if (!isIndexedDBAvailable()) {
		throw new Error(
			'Browser storage is not available. Please check:\n' +
				'1. You are not in incognito/private mode\n' +
				'2. Third-party cookies are enabled\n' +
				'3. No browser extensions are blocking storage\n' +
				'4. You are accessing via http:// or https:// (not file://)',
		);
	}
}

/**
 * Default undoable state for new projects
 */
const DEFAULT_TIMELINE_VIEW_STACK = [{type: 'ROOT' as const}];

const getDefaultcompositionState = (): compositionState => ({
	tracks: [],
	items: {},
	assets: {},
	fps: 30,
	compositionWidth: 1080,
	compositionHeight: 1920,
	deletedAssets: [],
	timelineViewStack: DEFAULT_TIMELINE_VIEW_STACK,
});

/**
 * Create a new project with the given name and category
 * If no state is provided, creates an empty project with default settings
 */
export async function createProject(
	name: string,
	category: string,
	state?: compositionState,
): Promise<Project> {
	checkStorageAvailable();

	const now = Date.now();
	const project: Project = {
		id: nanoid(),
		name,
		category,
		createdAt: now,
		updatedAt: now,
		data: state ?? getDefaultcompositionState(),
	};

	await db.projects.add(project);
	return project;
}

/**
 * Save/update project data
 * Updates the data and updatedAt timestamp
 */
export async function saveProject(
	id: string,
	state: compositionState,
): Promise<void> {
	await db.projects.update(id, {
		data: state,
		updatedAt: Date.now(),
	});
}

/**
 * Update project metadata (name, category, thumbnail)
 */
export async function updateProjectMetadata(
	id: string,
	updates: Partial<Pick<Project, 'name' | 'category' | 'thumbnail'>>,
): Promise<void> {
	await db.projects.update(id, {
		...updates,
		updatedAt: Date.now(),
	});
}

/**
 * Get a project by ID
 */
export async function getProject(id: string): Promise<Project | undefined> {
	checkStorageAvailable();
	return db.projects.get(id);
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id: string): Promise<void> {
	await db.projects.delete(id);
}

/**
 * List all projects, optionally filtered by category
 * Returns projects sorted by updatedAt (most recent first)
 */
export async function listProjects(category?: string): Promise<Project[]> {
	checkStorageAvailable();

	let collection = db.projects.orderBy('updatedAt');

	if (category) {
		collection = db.projects.where('category').equals(category);
	}

	const projects = await collection.reverse().toArray();
	return projects;
}

/**
 * Get all unique categories from existing projects
 */
export async function getCategories(): Promise<string[]> {
	const projects = await db.projects.toArray();
	const categories = new Set(projects.map((p) => p.category));
	return Array.from(categories).sort();
}

/**
 * Duplicate a project with a new name
 */
export async function duplicateProject(
	id: string,
	newName: string,
): Promise<Project> {
	const original = await getProject(id);
	if (!original) {
		throw new Error(`Project ${id} not found`);
	}

	const now = Date.now();
	const duplicated: Project = {
		id: nanoid(),
		name: newName,
		category: original.category,
		createdAt: now,
		updatedAt: now,
		thumbnail: original.thumbnail,
		data: structuredClone(original.data),
	};

	await db.projects.add(duplicated);
	return duplicated;
}

/**
 * Check if a project exists by ID
 */
export async function projectExists(id: string): Promise<boolean> {
	const count = await db.projects.where('id').equals(id).count();
	return count > 0;
}
