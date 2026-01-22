import {Dexie, type EntityTable} from 'dexie';
import {compositionState} from '../editor/state/types';

/**
 * Project entity stored in IndexedDB via Dexie
 * Stores the full editor configuration including assets metadata
 */
export interface Project {
	id: string;
	name: string;
	category: string;
	createdAt: number;
	updatedAt: number;
	thumbnail?: string;
	data: compositionState;
}

/**
 * Check if IndexedDB is available in the current context
 */
export function isIndexedDBAvailable(): boolean {
	if (typeof window === 'undefined') return false;
	if (typeof indexedDB === 'undefined') return false;

	try {
		// Test if we can actually access indexedDB
		const test = indexedDB.open('__test__');
		test.onerror = () => {};
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * Dexie database for storing video editor projects
 * Uses IndexedDB under the hood with a clean Promise-based API
 */
const db = new Dexie('oxoven-projects') as Dexie & {
	projects: EntityTable<Project, 'id'>;
};

/**
 * Schema definition - only indexed fields are listed here
 * 'data' and 'thumbnail' are stored but NOT indexed (per Dexie best practices)
 * Large objects should not be indexed as it affects performance
 */
db.version(1).stores({
	projects: 'id, name, category, createdAt, updatedAt',
});

/**
 * Handle Dexie errors globally to provide better error messages
 */
db.on('blocked', () => {
	console.error('Database access is blocked. Please check browser privacy settings.');
});

db.on('versionchange', () => {
	db.close();
});

export {db};
