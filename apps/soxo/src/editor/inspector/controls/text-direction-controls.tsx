import React, {memo, useCallback} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import {LeftToRightIcon} from '../../icons/left-to-right';
import {RightToLeftIcon} from '../../icons/right-to-left';
import {TextDirection} from '../../items/text/text-item-type';
import {InspectorSubLabel} from '../components/inspector-label';

const TextDirectionControlsUnmemoized: React.FC<{
	direction: TextDirection;
	itemId: string;
}> = ({direction, itemId}) => {
	const updateItem = useEditorStore((state) => state.updateItem);

	const setDirection = useCallback(
		(newDirection: TextDirection) => {
			updateItem(itemId, (i) => {
				if (i.type !== 'text' && i.type !== 'captions') {
					throw new Error(
						'Text direction can only be changed for text items',
					);
				}

				return {
					...i,
					direction: newDirection,
				};
			});
		},
		[updateItem, itemId],
	);

	return (
		<div className="flex-1">
			<InspectorSubLabel>Direction</InspectorSubLabel>
			<div className="editor-starter-field inline-flex hover:border-transparent">
				<button
					onClick={() => setDirection('ltr')}
					data-active={direction === 'ltr'}
					className="editor-starter-focus-ring flex h-6 w-10 items-center justify-center rounded-[2px] text-neutral-300 data-[active=true]:bg-black/20 data-[active=true]:outline data-[active=true]:outline-neutral-700"
					title="Left to Right"
					aria-label="Left to Right"
				>
					<LeftToRightIcon />
				</button>
				<button
					onClick={() => setDirection('rtl')}
					data-active={direction === 'rtl'}
					className="editor-starter-focus-ring flex h-6 w-10 items-center justify-center rounded-[2px] text-neutral-300 data-[active=true]:bg-black/20 data-[active=true]:outline data-[active=true]:outline-neutral-700"
					title="Right to Left"
					aria-label="Right to Left"
				>
					<RightToLeftIcon />
				</button>
			</div>
		</div>
	);
};

export const TextDirectionControls = memo(TextDirectionControlsUnmemoized);
