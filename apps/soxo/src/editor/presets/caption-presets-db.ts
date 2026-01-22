import {FontStyle, TextAlign, TextDirection} from '../items/text/text-item-type';
import {HighlightStyle} from '../items/captions/highlight-styles';

export interface CaptionPreset {
	// Metadata
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;

	// Typography
	fontFamily: string;
	fontStyle: FontStyle;
	fontSize: number;
	lineHeight: number;
	letterSpacing: number;

	// Layout
	align: TextAlign;
	direction: TextDirection;

	// Colors
	color: string;
	highlightColor: string;

	// Stroke
	strokeWidth: number;
	strokeColor: string;

	// Caption-specific
	maxLines: number;
	pageDurationInMilliseconds: number;
	fadeInDurationInSeconds: number;
	fadeOutDurationInSeconds: number;

	// Highlight style
	highlightStyle: HighlightStyle;

	// Background box
	backgroundEnabled: boolean;
	backgroundColor: string;
	backgroundOpacity: number;
	backgroundPadding: number;
	backgroundBorderRadius: number;

	// Text shadow
	textShadowEnabled: boolean;
	textShadowColor: string;
	textShadowOffsetX: number;
	textShadowOffsetY: number;
	textShadowBlur: number;
}

// Database configuration
const DB_NAME = 'caption-presets-db';
const DB_VERSION = 1;
const DB_OBJECT_STORE_NAME = 'presets';

let opened: Promise<IDBDatabase> | null = null;

const openIndexedDb = (): Promise<IDBDatabase> => {
	const {promise, reject, resolve} = Promise.withResolvers<IDBDatabase>();
	const rq = indexedDB.open(DB_NAME, DB_VERSION);

	rq.onupgradeneeded = (event) => {
		try {
			const db = rq.result;
			if (event.oldVersion < DB_VERSION) {
				db.createObjectStore(DB_OBJECT_STORE_NAME, {autoIncrement: false});
			} else {
				const {transaction} = event.currentTarget as IDBOpenDBRequest;
				if (!transaction) {
					throw new Error('No transaction available during upgrade');
				}

				const objectStore = transaction.objectStore(DB_OBJECT_STORE_NAME);
				if (!objectStore) {
					throw new Error('Could not access object store during upgrade');
				}

				objectStore.clear();
			}
		} catch (err) {
			reject(new Error(`Failed to upgrade database: ${err}`));
		}
	};

	rq.onsuccess = () => {
		try {
			const db = rq.result;
			resolve(db);
		} catch (err) {
			reject(new Error(`Failed to open database: ${err}`));
		}
	};

	rq.onerror = () => {
		const error = rq.error?.message ?? 'Unknown error';
		reject(new Error(`Failed to open IndexedDB: ${error}`));
	};

	rq.onblocked = () => {
		reject(new Error('Database is blocked by another connection'));
	};

	return promise;
};

const getIndexedDbInstance = (): Promise<IDBDatabase> => {
	if (opened) {
		return opened;
	}

	opened = openIndexedDb();
	return opened;
};

const prepareTransaction = async (transactionMode: IDBTransactionMode) => {
	const db = await getIndexedDbInstance();
	const {promise, reject, resolve} = Promise.withResolvers<void>();
	const transaction = db.transaction([DB_OBJECT_STORE_NAME], transactionMode);

	transaction.onerror = () => {
		reject(new Error('Transaction failed'));
	};

	transaction.onabort = () => {
		reject(new Error('Transaction aborted'));
	};

	transaction.oncomplete = () => {
		resolve();
	};

	const objectStore = transaction.objectStore(DB_OBJECT_STORE_NAME);
	return {objectStore, waitForCompletion: () => promise};
};

const waitForRequestCompletion = async <T>(transaction: IDBRequest<T>) => {
	const {promise, reject, resolve} = Promise.withResolvers<T>();
	transaction.onsuccess = () => {
		resolve(transaction.result as T);
	};
	transaction.onerror = () => {
		reject(new Error('Transaction failed'));
	};
	return promise;
};

// CRUD Operations

export const savePreset = async (preset: CaptionPreset): Promise<void> => {
	const {objectStore, waitForCompletion} = await prepareTransaction('readwrite');

	const request = objectStore.put(preset, preset.id);
	await waitForRequestCompletion(request);
	await waitForCompletion();
	updatePresets();
};

export const getAllPresets = async (): Promise<CaptionPreset[]> => {
	const {objectStore, waitForCompletion} = await prepareTransaction('readonly');

	const request = objectStore.getAll();
	const presets = await waitForRequestCompletion<CaptionPreset[]>(request);
	await waitForCompletion();

	// Sort by most recently updated first
	return presets.sort((a, b) => b.updatedAt - a.updatedAt);
};

export const deletePreset = async (id: string): Promise<void> => {
	const {objectStore, waitForCompletion} = await prepareTransaction('readwrite');

	const request = objectStore.delete(id);
	await waitForRequestCompletion(request);
	await waitForCompletion();
	updatePresets();
};

// Subscription system for reactive updates

let presetsCache: CaptionPreset[] | null = null;
let presetsChangedCallbacks: (() => void)[] = [];

export const onPresetsChanged = (callback: () => void): (() => void) => {
	presetsChangedCallbacks.push(callback);
	return () => {
		presetsChangedCallbacks = presetsChangedCallbacks.filter(
			(cb) => cb !== callback,
		);
	};
};

const updatePresets = async () => {
	if (typeof window === 'undefined') {
		return;
	}

	presetsCache = await getAllPresets();
	presetsChangedCallbacks.forEach((callback) => callback());
};

export const getPresetsCache = (): CaptionPreset[] | null => {
	return presetsCache;
};

// Initialize cache on load
updatePresets();
