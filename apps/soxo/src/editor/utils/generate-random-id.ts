// Define the possible prefix types
type ContentPrefix =
	| 'video'
	| 'audio'
	| 'image'
	| 'gif'
	| 'text'
	| 'captions'
	| 'composite'
	| 'track'
	| 'template'
	| 'asset'
	| 'task'
	| 'misc'
	| 'solid'
	| 'code'
	| 'shape';

export function generateRandomId(
	prefix: ContentPrefix,
	length: number = 4,

): string {
	const chars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	return `${prefix}_${result}`;
}
