import { Link } from 'react-router';

export default function Projects() {
	return (
		<div className="container mx-auto p-8">
			<h1 className="text-4xl font-bold mb-8">Projects</h1>
			<div className="space-y-4">
				<p className="text-lg">Welcome to your projects page.</p>
				<div className="flex gap-4">
					<Link
						to="/editor/project-1"
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Open Editor (Project 1)
					</Link>
					<Link
						to="/editor/project-2"
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Open Editor (Project 2)
					</Link>
				</div>
			</div>
		</div>
	);
}
