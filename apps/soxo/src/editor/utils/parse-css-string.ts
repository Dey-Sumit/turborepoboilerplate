/**
 * Parses a CSS string into a React CSSProperties object.
 * Handles both CSS rules with selectors and plain CSS properties.
 */
export function parseCssString(cssString: string): React.CSSProperties {
	const styles: React.CSSProperties = {};

	if (!cssString || !cssString.trim()) {
		return styles;
	}

	// First, try to extract CSS from rule blocks (e.g., ".class { ... }" or just "{ ... }")
	let cssContent = cssString.trim();

	// Check if it starts with a selector followed by braces
	const ruleMatch = cssContent.match(/^[^}]*\{([^}]*)\}/);
	if (ruleMatch) {
		// Extract content inside braces
		cssContent = ruleMatch[1].trim();
	} else {
		// Check if it's wrapped in braces without selector
		const braceMatch = cssContent.match(/^\{([^}]*)\}$/);
		if (braceMatch) {
			cssContent = braceMatch[1].trim();
		}
	}

	// Split by semicolons to get individual declarations
	const declarations = cssContent
		.split(';')
		.map((decl) => decl.trim())
		.filter((decl) => decl);

	// Use a Set to track unique values for combinable properties
	const combinableProps: Map<string, Set<string>> = new Map();

	for (const declaration of declarations) {
		// Split by colon to get property and value
		const colonIndex = declaration.indexOf(':');
		if (colonIndex === -1) continue;

		const property = declaration.slice(0, colonIndex).trim();
		const value = declaration.slice(colonIndex + 1).trim();

		if (!property || !value) continue;

		// Convert CSS property to camelCase for React
		const camelProperty = property.replace(/-([a-z])/g, (_, letter) =>
			letter.toUpperCase(),
		);

		// For combinable properties, collect unique values
		if (
			camelProperty === 'filter' ||
			camelProperty === 'transform' ||
			camelProperty === 'boxShadow'
		) {
			if (!combinableProps.has(camelProperty)) {
				combinableProps.set(camelProperty, new Set());
			}
			// Split multiple functions and add each uniquely
			const functions =
				value.match(/[a-z-]+\([^)]+\)|[a-z-]+\s+[^,;]+/gi) || [value];
			functions.forEach((fn) =>
				combinableProps.get(camelProperty)!.add(fn.trim()),
			);
			continue;
		}

		// Handle special cases and convert values
		let processedValue: string | number = value;

		// Handle numeric values with units
		if (/^-?\d+(\.\d+)?px$/.test(value)) {
			processedValue = parseFloat(value);
		} else if (/^-?\d+(\.\d+)?em$/.test(value)) {
			processedValue = value; // Keep as string for em values
		} else if (/^-?\d+(\.\d+)?rem$/.test(value)) {
			processedValue = value; // Keep as string for rem values
		} else if (/^-?\d+(\.\d+)?%$/.test(value)) {
			processedValue = value; // Keep as string for percentage values
		} else if (/^-?\d+(\.\d+)?$/.test(value)) {
			processedValue = parseFloat(value);
		} else if (
			value === 'none' ||
			value === 'auto' ||
			value === 'inherit' ||
			value === 'initial'
		) {
			processedValue = value;
		} else if (
			value.startsWith('#') ||
			value.startsWith('rgb') ||
			value.startsWith('hsl') ||
			value.startsWith('var(')
		) {
			processedValue = value;
		} else if (value.includes(' ')) {
			// Handle multiple values (like margin, padding, border, etc.)
			processedValue = value;
		} else {
			processedValue = value;
		}

		// Apply to styles object
		(styles as Record<string, string | number>)[camelProperty] = processedValue;
	}

	// Apply combinable properties with unique values
	for (const [property, valueSet] of combinableProps.entries()) {
		(styles as Record<string, string>)[property] = Array.from(valueSet).join(' ');
	}

	return styles;
}
