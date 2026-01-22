// Re-export types inferred from Zod schemas
export type {
	TextAlign,
	TextDirection,
	FontStyle,
	TextItemBackground,
	TextItem,
} from '../schemas';

// Re-export schemas for validation
export {
	textAlignSchema,
	textDirectionSchema,
	fontStyleSchema,
	textItemBackgroundSchema,
	textItemSchema,
} from '../schemas';
