'use client';

import {Button} from '@/components/ui/button';
import {Field, FieldError, FieldLabel} from '@/components/ui/field';
import {Input} from '@/components/ui/input';
import {useForm} from 'react-hook-form';
import {VariableTemplate} from './templates-library';

interface VariableFormProps {
	template: VariableTemplate;
	onSubmit: (values: Record<string, unknown>) => void;
	onCancel?: () => void;
}

export function VariableForm({
	template,
	onSubmit,
	onCancel,
}: VariableFormProps) {
	const {
		register,
		handleSubmit,
		formState: {errors},
	} = useForm<Record<string, unknown>>({
		defaultValues: template.variables as Record<string, unknown>,
	});

	function handleFormSubmit(values: Record<string, unknown>) {
		onSubmit(values);
	}

	const getFieldError = (fieldPath: string) => {
		const keys = fieldPath.split('.');
		let error: unknown = errors;
		for (const key of keys) {
			if (
				error &&
				typeof error === 'object' &&
				error !== null &&
				key in error
			) {
				error = (error as Record<string, unknown>)[key];
			} else {
				return null;
			}
		}
		return (error as {message?: string})?.message || null;
	};

	return (
		<form
			onSubmit={handleSubmit(handleFormSubmit)}
			className="w-full space-y-6"
		>
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">{template.metadata.name}</h3>
				{/* <p className="text-sm text-gray-600">{template.metadata.description}</p> */}
			</div>

			<div className="grid grid-cols-2 gap-6">
				{Object.entries(template.variables).map(([key, variable]) => {
					if (variable.content !== undefined) {
						// Text field
						return (
							<Field key={key}>
								<FieldLabel>
									{key.charAt(0).toUpperCase() + key.slice(1)} Text
								</FieldLabel>
								<Input
									placeholder={`Enter ${key} text...`}
									{...register(`${key}.content`)}
								/>
								{getFieldError(`${key}.content`) && (
									<FieldError>{getFieldError(`${key}.content`)}</FieldError>
								)}
							</Field>
						);
					} else if (variable.url !== undefined) {
						// URL field for images/assets
						return (
							<div key={key} className="space-y-4">
								<Field>
									<FieldLabel>
										{key.charAt(0).toUpperCase() + key.slice(1)} URL
									</FieldLabel>
									<Input
										placeholder={`Enter ${key} image URL...`}
										{...register(`${key}.url`)}
									/>
									{getFieldError(`${key}.url`) && (
										<FieldError>{getFieldError(`${key}.url`)}</FieldError>
									)}
								</Field>

								<Field>
									<FieldLabel>Description (optional)</FieldLabel>
									<Input
										placeholder="Describe this image..."
										{...register(`${key}.description`)}
									/>
								</Field>
							</div>
						);
					}

					return null; // Unknown variable type
				})}
			</div>

			<div className="col-span-2 flex gap-2 pt-4">
				<Button type="submit">Add Template</Button>
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}
			</div>
		</form>
	);
}
