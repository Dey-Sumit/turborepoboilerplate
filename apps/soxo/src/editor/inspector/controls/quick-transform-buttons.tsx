import {Button} from '@/components/ui/button';
import {
	IconArrowsHorizontal,
	IconArrowsVertical,
	IconFocusCentered,
	IconMaximize,
} from '@tabler/icons-react';
import React, {memo, useCallback} from 'react';
import {toast} from 'sonner';
import useEditorStore from '../../../zustand/editor-store';
import {EditorStarterItem} from '../../items/item-type';
import {InspectorSubLabel} from '../components/inspector-label';

interface QuickTransformButtonsProps {
	itemId: string;
}

const QuickTransformButtonsUnmemoized: React.FC<QuickTransformButtonsProps> = ({
	itemId,
}) => {
	const updateItem = useEditorStore((state) => state.updateItem);
	const compositionWidth = useEditorStore(
		(state) => state.compositionState.compositionWidth,
	);
	const compositionHeight = useEditorStore(
		(state) => state.compositionState.compositionHeight,
	);

	/**
	 * Flip horizontal - add scaleX(-1) to CSS
	 */
	const handleFlipHorizontal = useCallback(() => {
		updateItem(itemId, (item: EditorStarterItem) => {
			const existingCss = item.css || '';
			const hasFlipH = existingCss.includes('scaleX(-1)');

			let newCss = existingCss;
			if (hasFlipH) {
				// Remove flip
				newCss = existingCss.replace(/transform:\s*scaleX\(-1\);?\s*/gi, '');
				toast.success('Removed horizontal flip');
			} else {
				// Add flip
				const trimmed = existingCss.trim();
				newCss = trimmed
					? trimmed + '\ntransform: scaleX(-1);'
					: 'transform: scaleX(-1);';
				toast.success('Flipped horizontally');
			}

			return {
				...item,
				css: newCss.trim(),
			};
		});
	}, [itemId, updateItem]);

	/**
	 * Flip vertical - add scaleY(-1) to CSS
	 */
	const handleFlipVertical = useCallback(() => {
		updateItem(itemId, (item: EditorStarterItem) => {
			const existingCss = item.css || '';
			const hasFlipV = existingCss.includes('scaleY(-1)');

			let newCss = existingCss;
			if (hasFlipV) {
				// Remove flip
				newCss = existingCss.replace(/transform:\s*scaleY\(-1\);?\s*/gi, '');
				toast.success('Removed vertical flip');
			} else {
				// Add flip
				const trimmed = existingCss.trim();
				newCss = trimmed
					? trimmed + '\ntransform: scaleY(-1);'
					: 'transform: scaleY(-1);';
				toast.success('Flipped vertically');
			}

			return {
				...item,
				css: newCss.trim(),
			};
		});
	}, [itemId, updateItem]);

	/**
	 * Center in canvas - move to center position
	 */
	const handleCenterInCanvas = useCallback(() => {
		updateItem(itemId, (item: EditorStarterItem) => {
			const centerX = (compositionWidth - item.width) / 2;
			const centerY = (compositionHeight - item.height) / 2;

			toast.success('Centered in canvas');

			return {
				...item,
				left: centerX,
				top: centerY,
			};
		});
	}, [itemId, compositionWidth, compositionHeight, updateItem]);

	/**
	 * Fit to canvas width - scale to match canvas width
	 */
	const handleFitWidth = useCallback(() => {
		updateItem(itemId, (item: EditorStarterItem) => {
			const scale = compositionWidth / item.width;
			const newWidth = compositionWidth;
			const newHeight = item.height * scale;

			// Center vertically after scaling
			const centerY = (compositionHeight - newHeight) / 2;

			toast.success('Fit to canvas width');

			return {
				...item,
				width: newWidth,
				height: newHeight,
				left: 0,
				top: centerY,
			};
		});
	}, [itemId, compositionWidth, compositionHeight, updateItem]);

	/**
	 * Fit to canvas height - scale to match canvas height
	 */
	const handleFitHeight = useCallback(() => {
		updateItem(itemId, (item: EditorStarterItem) => {
			const scale = compositionHeight / item.height;
			const newHeight = compositionHeight;
			const newWidth = item.width * scale;

			// Center horizontally after scaling
			const centerX = (compositionWidth - newWidth) / 2;

			toast.success('Fit to canvas height');

			return {
				...item,
				width: newWidth,
				height: newHeight,
				left: centerX,
				top: 0,
			};
		});
	}, [itemId, compositionWidth, compositionHeight, updateItem]);

	/**
	 * Fill canvas - scale to cover entire canvas (may crop)
	 */
	const handleFillCanvas = useCallback(() => {
		updateItem(itemId, (item: EditorStarterItem) => {
			const scaleX = compositionWidth / item.width;
			const scaleY = compositionHeight / item.height;
			const scale = Math.max(scaleX, scaleY); // Use larger scale to fill

			const newWidth = item.width * scale;
			const newHeight = item.height * scale;

			// Center the item
			const centerX = (compositionWidth - newWidth) / 2;
			const centerY = (compositionHeight - newHeight) / 2;

			toast.success('Filled canvas');

			return {
				...item,
				width: newWidth,
				height: newHeight,
				left: centerX,
				top: centerY,
			};
		});
	}, [itemId, compositionWidth, compositionHeight, updateItem]);

	return (
		<div className="space-y-3">
			{/* Flip buttons */}
			<div>
				<InspectorSubLabel>Flip</InspectorSubLabel>
				<div className="grid grid-cols-2 gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleFlipHorizontal}
						className="h-auto py-2"
					>
						<IconArrowsHorizontal size={16} className="mr-1" />
						Horizontal
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleFlipVertical}
						className="h-auto py-2"
					>
						<IconArrowsVertical size={16} className="mr-1" />
						Vertical
					</Button>
				</div>
			</div>

			{/* Position buttons */}
			<div>
				<InspectorSubLabel>Position</InspectorSubLabel>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleCenterInCanvas}
					className="w-full h-auto py-2"
				>
					<IconFocusCentered size={16} className="mr-1" />
					Center in Canvas
				</Button>
			</div>

			{/* Fit to canvas buttons */}
			<div>
				<InspectorSubLabel>Fit to Canvas</InspectorSubLabel>
				<div className="grid grid-cols-3 gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleFitWidth}
						className="h-auto py-2 text-xs"
						title="Scale to fit canvas width"
					>
						Width
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleFitHeight}
						className="h-auto py-2 text-xs"
						title="Scale to fit canvas height"
					>
						Height
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleFillCanvas}
						className="h-auto py-2 text-xs"
						title="Scale to fill entire canvas"
					>
						<IconMaximize size={14} className="mr-1" />
						Fill
					</Button>
				</div>
			</div>
		</div>
	);
};

export const QuickTransformButtons = memo(QuickTransformButtonsUnmemoized);
