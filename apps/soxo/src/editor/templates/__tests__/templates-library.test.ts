import {describe, it, expect} from 'vitest';
import {compileTemplate, fullCanvasSolid} from '../templates-library';
import {SolidItem} from '../../items/solid/solid-item-type';

describe('Template Compilation', () => {
	describe('fullCanvasSolid template', () => {
		it('should compile fullCanvasSolid template with default values', () => {
			const compiled = compileTemplate(fullCanvasSolid);

			// Verify it's a solid item
			expect(compiled.type).toBe('solid');
			expect(compiled.id).toBe('bg-solid');

			// Verify timing properties
			expect(compiled.durationInFrames).toBe(90);
			expect(compiled.from).toBe(0);

			// Verify position (should be 0,0 for full canvas)
			expect(compiled.left).toBe(0);
			expect(compiled.top).toBe(0);

			// Verify dimensions (should use composition dimensions)
			expect(compiled.width).toBe(1080);
			expect(compiled.height).toBe(1920);

			// Verify color (default white)
			expect(compiled.color).toBe('#ffffff');

			// Verify other properties
			expect(compiled.opacity).toBe(1);
			expect(compiled.borderRadius).toBe(0);
			expect(compiled.rotation).toBe(0);
			expect(compiled.keepAspectRatio).toBe(false);
			expect(compiled.fadeInDurationInSeconds).toBe(0);
			expect(compiled.fadeOutDurationInSeconds).toBe(0);
			expect(compiled.isDraggingInTimeline).toBe(false);
			expect(compiled.transition).toEqual({});
		});

		it('should compile fullCanvasSolid with custom color override', () => {
			// Override structure matches the organized variables structure
			const compiled = compileTemplate(fullCanvasSolid, {
				static: {
					color: {
						type: 'COLOR',
						value: '#ff0000',
						path: 'template.color',
					},
				},
			} as any);

			expect(compiled.type).toBe('solid');
			expect(compiled.color).toBe('#ff0000');
			// Other properties should remain the same
			expect(compiled.width).toBe(1080);
			expect(compiled.height).toBe(1920);
		});

		it('should compile fullCanvasSolid with custom composition dimensions', () => {
			const compiled = compileTemplate(
				fullCanvasSolid,
				{},
				{width: 1920, height: 1080},
			);

			expect(compiled.width).toBe(1920);
			expect(compiled.height).toBe(1080);
			// Other properties should remain the same
			expect(compiled.color).toBe('#ffffff');
		});

		it('should compile fullCanvasSolid with both overrides', () => {
			const compiled = compileTemplate(
				fullCanvasSolid,
				{
					static: {
						color: {
							type: 'COLOR',
							value: '#00ff00',
							path: 'template.color',
						},
					},
				} as any,
				{width: 1920, height: 1080},
			);

			expect(compiled.width).toBe(1920);
			expect(compiled.height).toBe(1080);
			expect(compiled.color).toBe('#00ff00');
		});

		it('should produce the exact expected structure', () => {
			const compiled = compileTemplate(fullCanvasSolid);

			// Note: The ID will be 'bg-solid' from template, not 'LSdV' (which is generated later)
			const expectedStructure: Omit<SolidItem, 'id'> = {
				type: 'solid',
				durationInFrames: 90,
				from: 0,
				left: 0,
				top: 0,
				width: 1080,
				height: 1920,
				color: '#ffffff',
				opacity: 1,
				borderRadius: 0,
				rotation: 0,
				keepAspectRatio: false,
				fadeInDurationInSeconds: 0,
				fadeOutDurationInSeconds: 0,
				transition: {},
				isDraggingInTimeline: false,
			};

			// Compare all properties except ID (which gets regenerated in addVariableTemplate)
			expect(compiled.type).toBe(expectedStructure.type);
			expect(compiled.durationInFrames).toBe(
				expectedStructure.durationInFrames,
			);
			expect(compiled.from).toBe(expectedStructure.from);
			expect(compiled.left).toBe(expectedStructure.left);
			expect(compiled.top).toBe(expectedStructure.top);
			expect(compiled.width).toBe(expectedStructure.width);
			expect(compiled.height).toBe(expectedStructure.height);
			expect(compiled.color).toBe(expectedStructure.color);
			expect(compiled.opacity).toBe(expectedStructure.opacity);
			expect(compiled.borderRadius).toBe(expectedStructure.borderRadius);
			expect(compiled.rotation).toBe(expectedStructure.rotation);
			expect(compiled.keepAspectRatio).toBe(expectedStructure.keepAspectRatio);
			expect(compiled.fadeInDurationInSeconds).toBe(
				expectedStructure.fadeInDurationInSeconds,
			);
			expect(compiled.fadeOutDurationInSeconds).toBe(
				expectedStructure.fadeOutDurationInSeconds,
			);
			expect(compiled.transition).toEqual(expectedStructure.transition);
			expect(compiled.isDraggingInTimeline).toBe(
				expectedStructure.isDraggingInTimeline,
			);
		});
	});
});
