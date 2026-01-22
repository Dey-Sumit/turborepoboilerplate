import React, {useMemo, useRef} from 'react';
import useEditorStore from '../../zustand/editor-store';
import useUIStore from '../../zustand/ui-store';
import {scrollbarStyle} from '../constants';
import {CompositionInspector} from './composition-inspector';
import {InspectorContent} from './inspector-content';
import {useInspectorScrollRestoration} from './scroll-restoration';

export const INSPECTOR_WIDTH = 350;

export const Inspector: React.FC = () => {
	const selectedItems = useUIStore((state) => state.selectedItems);
	const initialized = useEditorStore((state) => state.initialized);
	const ref = useRef<HTMLDivElement>(null);

	useInspectorScrollRestoration(ref, selectedItems);

	const style: React.CSSProperties = useMemo(() => {
		return {
			...scrollbarStyle,
			width: INSPECTOR_WIDTH,
		};
	}, []);

	return (
		<div
			className="border-l-editor-starter-border bg-editor-starter-panel w-[350px] overflow-y-auto border-l text-white"
			style={style}
			ref={ref}
		>
			{selectedItems.length > 1 ? null : selectedItems.length === 1 ? (
				<InspectorContent itemId={selectedItems[0]} />
			) : initialized ? (
				<CompositionInspector />
			) : null}
		</div>
	);
};
