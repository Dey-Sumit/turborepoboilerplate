import { Link, useParams } from 'react-router';

export default function Editor() {
	const { projectId } = useParams();

	return (
		<div className="container mx-auto p-8">
			<div className="mb-4">
				<Link to="/" className="text-blue-600 hover:text-blue-700">
					← Back to Projects
				</Link>
			</div>
			<h1 className="text-4xl font-bold mb-4">Editor</h1>
			<p className="text-lg">
				Editing project: <span className="font-mono font-bold">{projectId}</span>
			</p>
		</div>
	);
}
