import {memo, useCallback, useEffect, useRef} from 'react';
import useEditorStore from '../../zustand/editor-store';
import {CaptionsItem} from '../items/captions/captions-item-type';
import {ShapeItem} from '../items/shape/shape-item-type';
import {SolidItem} from '../items/solid/solid-item-type';
import {TextItem, TextItemBackground} from '../items/text/text-item-type';
import {changeItem} from '../state/actions/change-item';
import {InspectorSubLabel} from './components/inspector-label';

const ColorInspectorUnmemoized: React.FC<{
	color: string;
	itemId: string;
	colorType: 'color' | 'highlightColor' | 'strokeColor' | 'backgroundColor' | 'textShadowColor';
	accessibilityLabel: string;
	label?: string;
}> = ({color, itemId, colorType, accessibilityLabel, label}) => {
	const setState = useEditorStore((state) => state.setState);
	const commitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const pendingCommitRef = useRef<(() => void) | null>(null);

	// <input type="color" doesn't support listening when it is dismissed, so we are debouncing the updates
	useEffect(() => {
		return () => {
			if (commitTimeoutRef.current) {
				clearTimeout(commitTimeoutRef.current);
			}
			if (pendingCommitRef.current) {
				pendingCommitRef.current();
			}
		};
	}, []);

	const onColorChange = useCallback(
		(evt: React.ChangeEvent<HTMLInputElement>) => {
			const newColor = evt.target.value;

			// Pause undo tracking for intermediate updates
			const temporalState = useEditorStore.temporal.getState();
			temporalState.pause();

			setState((state) => {
				changeItem(state, itemId, (i) => {
					if (colorType === 'highlightColor') {
						if (i.type !== 'captions') {
							throw new Error('Item is not a captions');
						}
						return {
							...(i as CaptionsItem),
							highlightColor: newColor,
						};
					}

					if (colorType === 'strokeColor') {
						// Handle shape items - update stroke property
						if (i.type === 'shape') {
							return {
								...(i as ShapeItem),
								stroke: newColor,
							};
						}
						if (i.type !== 'text' && i.type !== 'captions') {
							throw new Error('Item is not a text, caption, or shape');
						}
						return {
							...(i as TextItem | CaptionsItem),
							strokeColor: newColor,
						};
					}

					if (colorType === 'backgroundColor') {
						if (i.type !== 'text') {
							throw new Error('Item is not a text');
						}
						return {
							...(i as TextItem),
							background: {
								...(i.background as TextItemBackground),
								color: newColor,
							},
						};
					}

					// Handle 'color' colorType for shape items - update fill property
					if (i.type === 'shape') {
						return {
							...(i as ShapeItem),
							fill: newColor,
						};
					}

					if (
						i.type === 'text' ||
						i.type === 'solid' ||
						i.type === 'captions'
					) {
						return {
							...(i as TextItem | SolidItem | CaptionsItem),
							color: newColor,
						};
					}
					throw new Error('Invalid item type: ' + JSON.stringify(i));
				});
			});

			if (commitTimeoutRef.current) {
				clearTimeout(commitTimeoutRef.current);
			}

			const commit = () => {
				temporalState.resume();
				pendingCommitRef.current = null;
			};

			pendingCommitRef.current = commit;

			commitTimeoutRef.current = setTimeout(() => {
				commit();
				commitTimeoutRef.current = null;
			}, 200);
		},
		[setState, itemId, colorType],
	);

	return (
		<div className="w-full">
			<InspectorSubLabel>
				{label ||
					(colorType === 'color' || colorType === 'strokeColor'
						? 'Color'
						: colorType === 'backgroundColor'
							? 'Color'
							: 'Highlight color')}
			</InspectorSubLabel>
			<input
				type="color"
				value={color}
				onChange={onColorChange}
				className="editor-starter-focus-ring"
				aria-label={accessibilityLabel}
			/>
		</div>
	);
};

export const ColorInspector = memo(ColorInspectorUnmemoized);
