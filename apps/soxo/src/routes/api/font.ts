import {LoaderFunction} from 'react-router';
import {GOOGLE_FONTS_DATABASE} from '../../editor/data/google-fonts';

export const loader: LoaderFunction = ({params}) => {
	const entry = GOOGLE_FONTS_DATABASE.find(
		(font) => font.fontFamily === params.name,
	);

	if (!entry) {
		return new Response('Font not found', {
			status: 404,
		});
	}

	return new Response(JSON.stringify(entry), {
		status: 200,
		headers: {'Content-Type': 'application/json'},
	});
};
