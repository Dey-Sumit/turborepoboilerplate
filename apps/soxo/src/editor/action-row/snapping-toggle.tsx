import {useCallback} from 'react';
import {useIsSnappingEnabled} from '../../zustand/ui-store';
import {MagnetIcon} from '../icons/magnet';
import {toggleSnapping} from '../state/actions/toggle-snapping';

export function SnappingToggle() {
	const isSnappingEnabled = useIsSnappingEnabled();

	const handleToggle = useCallback(() => {
		toggleSnapping();
	}, []);

	return (
		<button
			onClick={handleToggle}
			className={`editor-starter-focus-ring flex items-center justify-center p-2 ${
				isSnappingEnabled ? 'text-blue-500' : 'text-neutral-300'
			}`}
			title={`${isSnappingEnabled ? 'Disable Snapping' : 'Enable Snapping'} (Shift+M)`}
			aria-label={isSnappingEnabled ? 'Disable Snapping' : 'Enable Snapping'}
			aria-pressed={isSnappingEnabled}
			aria-keyshortcuts="Shift+KeyM"
		>
			<MagnetIcon className="w-[14px]" />
		</button>
	);
}
