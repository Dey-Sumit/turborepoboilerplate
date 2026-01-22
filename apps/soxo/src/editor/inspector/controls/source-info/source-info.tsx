import React, {memo, useCallback, useState} from 'react';
import {toast} from 'sonner';
import {Alert, AlertDescription} from '../../../../components/ui/alert';
import {Button} from '../../../../components/ui/button';
import {Field, FieldContent, FieldLabel} from '../../../../components/ui/field';
import {Input} from '../../../../components/ui/input';
import {Label} from '../../../../components/ui/label';
import useEditorStore from '../../../../zustand/editor-store';
import {setLocalUrl} from '../../../caching/load-to-blob-url';
import {makeExternalImageItem} from '../../../items/image/make-external-image-item';
import {updateImageSource} from '../../../state/actions/update-image-source';
import {secondsToTimeString} from '../../../utils/seconds-to-time-string';
import {useDimensions, useFps} from '../../../utils/use-context';
import {
	useItemSource,
	useAssetStatusForAsset,
	useAssetById,
} from '../../../selectors/hooks';
import {InspectorLabel} from '../../components/inspector-label';
import {
	CollapsableInspectorSection,
	InspectorDivider,
} from '../../components/inspector-section';
import {UploadInfo} from './upload-info';

const isValidUrl = (url: string): boolean => {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
};

const ImageSourceEditor: React.FC<{itemId: string; assetId: string}> = ({
	itemId,
	assetId,
}) => {
	const asset = useAssetById(assetId);
	const [url, setUrl] = useState(asset?.remoteUrl || '');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const setState = useEditorStore((s) => s.setState);
	const {compositionWidth, compositionHeight} = useDimensions();
	const {fps} = useFps();

	const hasChanges = url.trim() !== (asset?.remoteUrl || '');

	const handleUpdate = useCallback(async () => {
		if (!asset) return;
		const trimmedUrl = url.trim();

		if (!trimmedUrl) {
			setError('Please enter a URL');
			return;
		}

		if (!isValidUrl(trimmedUrl)) {
			setError('Invalid URL. Must start with http:// or https://');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const {asset: newAssetData, errorCode} = await makeExternalImageItem({
				url: trimmedUrl,
				currentFrame: 0,
				fps,
				compositionWidth,
				compositionHeight,
			});

			// Update the cached URL for the existing asset
			setLocalUrl(assetId, trimmedUrl);

			setState((state) =>
				updateImageSource(state, {
					itemId,
					url: trimmedUrl,
					width: newAssetData.width,
					height: newAssetData.height,
					filename: newAssetData.filename,
					mimeType: newAssetData.mimeType,
				}),
			);

			if (errorCode) {
				toast.warning('Image updated with limited metadata', {
					description:
						'Could not extract dimensions due to CORS. You may need to resize manually.',
				});
			} else {
				toast.success('Image source updated successfully');
			}

			setIsLoading(false);
			setError(null);
		} catch (err) {
			setIsLoading(false);
			setError(err instanceof Error ? err.message : 'Failed to update image');
		}
	}, [
		url,
		itemId,
		fps,
		compositionWidth,
		compositionHeight,
		setState,
		assetId,
		asset,
	]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && !isLoading) {
				e.preventDefault();
				handleUpdate();
			}
		},
		[handleUpdate, isLoading],
	);

	if (!asset) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2">
			<Field>
				<FieldLabel>
					<Label htmlFor={`url-input-${itemId}`}>Image URL</Label>
				</FieldLabel>
				<FieldContent>
					<Input
						id={`url-input-${itemId}`}
						type="text"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="https://example.com/image.jpg"
						disabled={isLoading}
					/>
				</FieldContent>
			</Field>

			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<Button
				nativeButton
				type="button"
				onClick={handleUpdate}
				disabled={isLoading || !hasChanges}
				className="w-full"
			>
				{isLoading ? 'Updating...' : 'Update Image'}
			</Button>
		</div>
	);
};

const SourceControlsWithAssetUnmemoized: React.FC<{
	itemId: string;
	assetId: string;
	type: string;
}> = ({itemId, assetId, type}) => {
	const asset = useAssetById(assetId);
	const currentAssetStatus = useAssetStatusForAsset(assetId);

	if (!asset) {
		return null;
	}

	const duration =
		'durationInSeconds' in asset ? asset.durationInSeconds : null;

	return (
		<>
			<CollapsableInspectorSection
				summary={<InspectorLabel>Source</InspectorLabel>}
				id={`source-${itemId}`}
				defaultOpen
			>
				<div className="text-xs leading-relaxed text-neutral-300">
					<div>{asset.filename}</div>
					{duration !== null && <div>{secondsToTimeString(duration)}</div>}
					{currentAssetStatus && (
						<UploadInfo asset={asset} status={currentAssetStatus} />
					)}
				</div>
				{type === 'image' && (
					<>
						<div className="mt-3 border-t border-white/10 pt-3">
							<ImageSourceEditor itemId={itemId} assetId={assetId} />
						</div>
					</>
				)}
			</CollapsableInspectorSection>
			<InspectorDivider />
		</>
	);
};

const SourceControlsWithAsset = memo(SourceControlsWithAssetUnmemoized);

const SourceControlsUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const {assetId, type} = useItemSource(itemId);

	// Handle items without assets
	if (!assetId) {
		return null;
	}

	return (
		<SourceControlsWithAsset itemId={itemId} assetId={assetId} type={type} />
	);
};

export const SourceControls = memo(SourceControlsUnmemoized);
