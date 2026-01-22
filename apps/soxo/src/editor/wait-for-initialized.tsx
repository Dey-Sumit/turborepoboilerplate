import useEditorStore from '../zustand/editor-store';

export const WaitForInitialized = ({children}: {children: React.ReactNode}) => {
	const initialized = useEditorStore((state) => state.initialized);

	if (!initialized) {
		return null;
	}

	return <>{children}</>;
};
