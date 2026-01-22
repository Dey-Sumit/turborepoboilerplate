'use client';

import {Button} from '@/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	IconCopy,
	IconDots,
	IconFolderOpen,
	IconPlus,
	IconTrash,
	IconVideo,
} from '@tabler/icons-react';
import {useCallback, useState} from 'react';
import {useNavigate} from 'react-router';
import {toast} from 'sonner';
import {Project} from '../db/projects-db';
import {
	createProject,
	deleteProject,
	duplicateProject,
} from '../db/project-service';
import {useProjectCategories, useProjects} from '../db/use-projects';

// Predefined categories
const PROJECT_CATEGORIES = ['Misc', 'POC', 'Caption Gen', 'Marketing', 'Tutorial'] as const;
const DEFAULT_CATEGORY = 'Misc';

function formatDate(timestamp: number): string {
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(timestamp));
}

function ProjectCard({
	project,
	onDelete,
	onDuplicate,
}: {
	project: Project;
	onDelete: (id: string) => void;
	onDuplicate: (id: string) => void;
}) {
	const navigate = useNavigate();

	const handleOpen = useCallback(() => {
		navigate(`/editor/${project.id}`);
	}, [navigate, project.id]);

	return (
		<div className="border-border bg-card group relative flex flex-col overflow-hidden border transition-all hover:border-foreground/20 hover:shadow-lg">
			{/* Thumbnail / Placeholder */}
			<button
				type="button"
				onClick={handleOpen}
				className="bg-muted/30 flex aspect-video w-full items-center justify-center"
			>
				{project.thumbnail ? (
					<img
						src={project.thumbnail}
						alt={project.name}
						className="h-full w-full object-cover"
					/>
				) : (
					<IconVideo className="text-muted-foreground/50 size-16" />
				)}
			</button>

			{/* Project Info */}
			<div className="flex flex-1 flex-col gap-2 p-4">
				<div className="flex items-start justify-between gap-2">
					<button
						type="button"
						onClick={handleOpen}
						className="hover:text-primary text-left font-medium transition-colors"
					>
						{project.name}
					</button>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button variant="ghost" size="icon-xs" className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
							}
						>
							<IconDots className="size-4" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={handleOpen}>
								<IconFolderOpen className="size-4" />
								Open
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onDuplicate(project.id)}>
								<IconCopy className="size-4" />
								Duplicate
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								variant="destructive"
								onClick={() => onDelete(project.id)}
							>
								<IconTrash className="size-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="text-muted-foreground flex items-center gap-2 text-xs">
					<span className="bg-muted/50 border-border rounded border px-2 py-0.5">
						{project.category}
					</span>
					<span className="text-muted-foreground/70">{formatDate(project.updatedAt)}</span>
				</div>
			</div>
		</div>
	);
}

function NewProjectDialog({
	onCreated,
}: {
	onCreated: (project: Project) => void;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState('');
	const [category, setCategory] = useState(DEFAULT_CATEGORY);
	const [isCreating, setIsCreating] = useState(false);

	const handleCreate = useCallback(async () => {
		if (!name.trim()) {
			toast.error('Please enter a project name');
			return;
		}

		setIsCreating(true);
		try {
			const project = await createProject(name.trim(), category);
			toast.success('Project created');
			setOpen(false);
			setName('');
			setCategory(DEFAULT_CATEGORY);
			onCreated(project);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to create project',
			);
		} finally {
			setIsCreating(false);
		}
	}, [name, category, onCreated]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button />}>
				<IconPlus className="size-4" />
				New Project
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Create New Project</DialogTitle>
					<DialogDescription>
						Enter a name for your new video project.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="project-name">Project Name</Label>
						<Input
							id="project-name"
							placeholder="My Awesome Video"
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleCreate();
								}
							}}
						/>
					</div>
					<div className="grid gap-2">
						<Label>Category</Label>
						{/* @ts-expect-error : type mismatch */}
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger className="w-full">
								<SelectValue>{category}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{PROJECT_CATEGORIES.map((cat) => (
									<SelectItem key={cat} value={cat}>
										{cat}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button onClick={handleCreate} disabled={isCreating}>
						{isCreating ? 'Creating...' : 'Create Project'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DuplicateProjectDialog({
	projectId,
	open,
	onOpenChange,
	onDuplicated,
}: {
	projectId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDuplicated: () => void;
}) {
	const [name, setName] = useState('');
	const [isDuplicating, setIsDuplicating] = useState(false);

	const handleDuplicate = useCallback(async () => {
		if (!projectId) return;
		if (!name.trim()) {
			toast.error('Please enter a name for the duplicate');
			return;
		}

		setIsDuplicating(true);
		try {
			await duplicateProject(projectId, name.trim());
			toast.success('Project duplicated');
			onOpenChange(false);
			setName('');
			onDuplicated();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to duplicate project',
			);
		} finally {
			setIsDuplicating(false);
		}
	}, [projectId, name, onOpenChange, onDuplicated]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Duplicate Project</DialogTitle>
					<DialogDescription>
						Enter a name for the duplicated project.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="duplicate-name">New Name</Label>
						<Input
							id="duplicate-name"
							placeholder="My Project (Copy)"
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleDuplicate();
								}
							}}
						/>
					</div>
				</div>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button onClick={handleDuplicate} disabled={isDuplicating}>
						{isDuplicating ? 'Duplicating...' : 'Duplicate'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DeleteProjectDialog({
	projectId,
	open,
	onOpenChange,
	onDeleted,
}: {
	projectId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleted: () => void;
}) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = useCallback(async () => {
		if (!projectId) return;

		setIsDeleting(true);
		try {
			await deleteProject(projectId);
			toast.success('Project deleted');
			onOpenChange(false);
			onDeleted();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete project',
			);
		} finally {
			setIsDeleting(false);
		}
	}, [projectId, onOpenChange, onDeleted]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Delete Project</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete this project? This action cannot be
						undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
					>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function ProjectsPage() {
	const navigate = useNavigate();
	const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
		undefined,
	);
	const projects = useProjects(selectedCategory);
	const categories = useProjectCategories();

	// Duplicate dialog state
	const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
	const [duplicateProjectId, setDuplicateProjectId] = useState<string | null>(
		null,
	);

	// Delete dialog state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

	const handleProjectCreated = useCallback(
		(project: Project) => {
			navigate(`/editor/${project.id}`);
		},
		[navigate],
	);

	const handleDuplicateClick = useCallback((id: string) => {
		setDuplicateProjectId(id);
		setDuplicateDialogOpen(true);
	}, []);

	const handleDeleteClick = useCallback((id: string) => {
		setDeleteProjectId(id);
		setDeleteDialogOpen(true);
	}, []);

	return (
		<div className="bg-background min-h-screen">
			{/* Header */}
			<header className="border-border border-b">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
					<h1 className="text-xl font-semibold">Projects</h1>
					<NewProjectDialog onCreated={handleProjectCreated} />
				</div>
			</header>

			<div className="mx-auto flex max-w-7xl gap-8 p-6">
				{/* Sidebar - Categories */}
				<aside className="border-border w-52 shrink-0 border-r pr-6">
					<h2 className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
						Categories
					</h2>
					<nav className="flex flex-col gap-1">
						<button
							type="button"
							onClick={() => setSelectedCategory(undefined)}
							className={`rounded px-3 py-2 text-left text-sm transition-colors ${
								selectedCategory === undefined
									? 'bg-primary text-primary-foreground font-medium'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'
							}`}
						>
							All Projects
						</button>
						{categories?.map((category) => (
							<button
								key={category}
								type="button"
								onClick={() => setSelectedCategory(category)}
								className={`rounded px-3 py-2 text-left text-sm transition-colors ${
									selectedCategory === category
										? 'bg-primary text-primary-foreground font-medium'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground'
								}`}
							>
								{category}
							</button>
						))}
					</nav>
				</aside>

				{/* Main Content - Project Grid */}
				<main className="flex-1">
					{projects === undefined ? (
						<div className="text-muted-foreground py-20 text-center">
							<div className="border-primary mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-t-transparent" />
							Loading projects...
						</div>
					) : projects.length === 0 ? (
						<div className="border-border rounded-lg border border-dashed py-20 text-center">
							<IconVideo className="text-muted-foreground/30 mx-auto mb-4 size-20" />
							<h3 className="mb-2 text-xl font-medium">No projects yet</h3>
							<p className="text-muted-foreground mx-auto mb-6 max-w-sm text-sm">
								Create your first video project to get started with editing.
							</p>
							<NewProjectDialog onCreated={handleProjectCreated} />
						</div>
					) : (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{projects.map((project) => (
								<ProjectCard
									key={project.id}
									project={project}
									onDelete={handleDeleteClick}
									onDuplicate={handleDuplicateClick}
								/>
							))}
						</div>
					)}
				</main>
			</div>

			{/* Dialogs */}
			<DuplicateProjectDialog
				projectId={duplicateProjectId}
				open={duplicateDialogOpen}
				onOpenChange={setDuplicateDialogOpen}
				onDuplicated={() => {
					setDuplicateProjectId(null);
				}}
			/>
			<DeleteProjectDialog
				projectId={deleteProjectId}
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onDeleted={() => {
					setDeleteProjectId(null);
				}}
			/>
		</div>
	);
}
