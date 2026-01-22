'use client';

import * as React from 'react';
import {
	Search,
	ImageIcon,
	VideoIcon,
	Music2Icon,
	FileIcon,
	RefreshCw,
} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Skeleton} from '@/components/ui/skeleton';
import type {
	S3Asset,
	ListAssetsResponse,
	ListAssetsErrorResponse,
} from '@/routes/api/list-assets';

type AssetCategory = 'all' | 'image' | 'video' | 'audio' | 'gif' | 'other';

const CATEGORY_CONFIG: Record<
	AssetCategory,
	{label: string; icon: React.ElementType}
> = {
	all: {label: 'All', icon: FileIcon},
	image: {label: 'Images', icon: ImageIcon},
	video: {label: 'Videos', icon: VideoIcon},
	audio: {label: 'Audio', icon: Music2Icon},
	gif: {label: 'GIFs', icon: ImageIcon},
	other: {label: 'Other', icon: FileIcon},
};

const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileExtension = (key: string): string => {
	const parts = key.split('.');
	return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
};

interface AssetCardProps {
	asset: S3Asset;
}

const AssetCard: React.FC<AssetCardProps> = ({asset}) => {
	const isImage = asset.category === 'image' || asset.category === 'gif';
	const isVideo = asset.category === 'video';
	const CategoryIcon = CATEGORY_CONFIG[asset.category]?.icon || FileIcon;

	return (
		<div className="group border-border bg-muted/30 hover:bg-muted/50 relative aspect-video cursor-pointer overflow-hidden rounded-lg border transition-colors">
			{isImage ? (
				<img
					src={asset.url}
					alt={asset.key}
					className="size-full object-cover"
					loading="lazy"
				/>
			) : isVideo ? (
				<video
					src={asset.url}
					className="size-full object-cover"
					muted
					preload="metadata"
				/>
			) : (
				<div className="absolute inset-0 flex items-center justify-center">
					<CategoryIcon className="text-muted-foreground/50 size-8" />
				</div>
			)}
			<div className="bg-background/80 border-border absolute inset-x-0 bottom-0 border-t p-2 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
				<p className="text-foreground truncate text-xs font-medium">
					{asset.key.length > 20
						? `${asset.key.slice(0, 8)}...${getFileExtension(asset.key)}`
						: asset.key}
				</p>
				<p className="text-muted-foreground text-[10px]">
					{formatFileSize(asset.size)}
				</p>
			</div>
			{/* File type badge */}
			<div className="bg-background/90 text-foreground absolute right-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-medium">
				{getFileExtension(asset.key)}
			</div>
		</div>
	);
};

const LoadingSkeleton: React.FC = () => (
	<div className="grid grid-cols-2 gap-3">
		{Array.from({length: 6}).map((_, i) => (
			<Skeleton key={i} className="aspect-video rounded-lg" />
		))}
	</div>
);

export function S3AssetsPanel() {
	const [assets, setAssets] = React.useState<S3Asset[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const [searchQuery, setSearchQuery] = React.useState('');
	const [activeCategory, setActiveCategory] = React.useState<AssetCategory>('all');

	const fetchAssets = React.useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch('/api/list-assets');
			const data = (await response.json()) as
				| ListAssetsResponse
				| ListAssetsErrorResponse;

			if ('error' in data) {
				setError(data.error);
				return;
			}

			setAssets(data.assets);
		} catch (err) {
			setError('Failed to load assets');
			console.error('Error fetching assets:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		fetchAssets();
	}, [fetchAssets]);

	// Filter assets based on search and category
	const filteredAssets = React.useMemo(() => {
		return assets.filter((asset) => {
			const matchesSearch = asset.key
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
			const matchesCategory =
				activeCategory === 'all' || asset.category === activeCategory;
			return matchesSearch && matchesCategory;
		});
	}, [assets, searchQuery, activeCategory]);

	// Get counts for each category
	const categoryCounts = React.useMemo(() => {
		const counts: Record<AssetCategory, number> = {
			all: assets.length,
			image: 0,
			video: 0,
			audio: 0,
			gif: 0,
			other: 0,
		};

		assets.forEach((asset) => {
			counts[asset.category]++;
		});

		return counts;
	}, [assets]);

	const categories: AssetCategory[] = ['all', 'image', 'video', 'audio', 'gif', 'other'];

	return (
		<div className="flex h-full flex-col">
			{/* Sticky search bar */}
			<div className="bg-background sticky top-0 z-10 space-y-3 pb-3">
				<div className="relative">
					<Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
					<Input
						placeholder="Search assets..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-8"
					/>
				</div>

				{/* Category filter buttons */}
				<div className="flex flex-wrap gap-1.5">
					{categories.map((category) => {
						const config = CATEGORY_CONFIG[category];
						const count = categoryCounts[category];
						const isActive = activeCategory === category;

						return (
							<Button
								key={category}
								variant={isActive ? 'default' : 'outline'}
								size="sm"
								onClick={() => setActiveCategory(category)}
								className="h-7 gap-1.5 px-2 text-xs"
							>
								<config.icon className="size-3" />
								{config.label}
								<span
									className={`rounded-full px-1.5 py-0.5 text-[10px] ${
										isActive
											? 'bg-primary-foreground/20'
											: 'bg-muted'
									}`}
								>
									{count}
								</span>
							</Button>
						);
					})}
				</div>
			</div>

			{/* Assets grid */}
			<ScrollArea className="flex-1">
				{loading ? (
					<LoadingSkeleton />
				) : error ? (
					<div className="flex flex-col items-center justify-center gap-3 py-12">
						<p className="text-muted-foreground text-sm">{error}</p>
						<Button
							variant="outline"
							size="sm"
							onClick={fetchAssets}
							className="gap-2"
						>
							<RefreshCw className="size-4" />
							Retry
						</Button>
					</div>
				) : filteredAssets.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12">
						<FileIcon className="text-muted-foreground/50 mb-3 size-12" />
						<p className="text-muted-foreground text-sm">
							{searchQuery || activeCategory !== 'all'
								? 'No matching assets found'
								: 'No assets in your bucket'}
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 gap-3 pb-4">
						{filteredAssets.map((asset) => (
							<AssetCard key={asset.key} asset={asset} />
						))}
					</div>
				)}
			</ScrollArea>

			{/* Refresh button */}
			{!loading && !error && (
				<div className="border-border flex items-center justify-between border-t pt-3">
					<p className="text-muted-foreground text-xs">
						{filteredAssets.length} of {assets.length} assets
					</p>
					<Button
						variant="ghost"
						size="sm"
						onClick={fetchAssets}
						className="h-7 gap-1.5 px-2 text-xs"
					>
						<RefreshCw className="size-3" />
						Refresh
					</Button>
				</div>
			)}
		</div>
	);
}
