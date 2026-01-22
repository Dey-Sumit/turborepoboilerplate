import {useLiveQuery} from 'dexie-react-hooks';
import {db, Project} from './projects-db';

/**
 * Hook to get all projects, optionally filtered by category
 * Uses Dexie's liveQuery for reactive updates
 * Returns undefined while loading, then the array of projects
 */
export function useProjects(category?: string): Project[] | undefined {
	return useLiveQuery(async () => {
		if (category) {
			return db.projects
				.where('category')
				.equals(category)
				.reverse()
				.sortBy('updatedAt');
		}
		return db.projects.orderBy('updatedAt').reverse().toArray();
	}, [category]);
}

/**
 * Hook to get a single project by ID
 * Returns undefined while loading or if not found
 */
export function useProject(id: string | undefined): Project | undefined {
	return useLiveQuery(async () => {
		if (!id) return undefined;
		return db.projects.get(id);
	}, [id]);
}

/**
 * Hook to get all unique categories from existing projects
 * Returns undefined while loading, then sorted array of category names
 */
export function useProjectCategories(): string[] | undefined {
	return useLiveQuery(async () => {
		const projects = await db.projects.toArray();
		const categories = new Set(projects.map((p) => p.category));
		return Array.from(categories).sort();
	}, []);
}

/**
 * Hook to get project count, optionally filtered by category
 */
export function useProjectCount(category?: string): number | undefined {
	return useLiveQuery(async () => {
		if (category) {
			return db.projects.where('category').equals(category).count();
		}
		return db.projects.count();
	}, [category]);
}
