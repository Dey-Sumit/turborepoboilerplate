import React, {createContext, useContext, useState} from 'react';

export type CopiedStyle = {
	sourceType: string;
	sourceItemId: string;
	properties: Record<string, unknown>;
};

type StyleClipboardContextType = {
	copiedStyle: CopiedStyle | null;
	setCopiedStyle: (style: CopiedStyle | null) => void;
};

const StyleClipboardContext = createContext<
	StyleClipboardContextType | undefined
>(undefined);

export const StyleClipboardProvider: React.FC<{
	children: React.ReactNode;
}> = ({children}) => {
	const [copiedStyle, setCopiedStyle] = useState<CopiedStyle | null>(null);

	return (
		<StyleClipboardContext.Provider value={{copiedStyle, setCopiedStyle}}>
			{children}
		</StyleClipboardContext.Provider>
	);
};

export const useStyleClipboard = (): StyleClipboardContextType => {
	const context = useContext(StyleClipboardContext);
	if (context === undefined) {
		throw new Error(
			'useStyleClipboard must be used within StyleClipboardProvider',
		);
	}
	return context;
};
