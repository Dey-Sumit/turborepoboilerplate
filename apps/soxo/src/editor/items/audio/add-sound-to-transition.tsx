import {
	TransitionPresentation,
	TransitionPresentationComponentProps,
} from '@remotion/transitions';
import {Html5Audio} from 'remotion';

export function addSoundToTransition<T extends Record<string, unknown>>(
	transition: TransitionPresentation<T>,
	src: string,
): TransitionPresentation<T> {
	const {component: Component, ...other} = transition;

	const C = Component as React.FC<TransitionPresentationComponentProps<T>>;

	const NewComponent: React.FC<TransitionPresentationComponentProps<T>> = (
		p,
	) => {
		return (
			<>
				{p.presentationDirection === 'entering' ? (
					<Html5Audio src={src} playbackRate={0.7} />
				) : null}
				<C {...p} />
			</>
		);
	};

	return {
		component: NewComponent,
		...other,
	};
}
