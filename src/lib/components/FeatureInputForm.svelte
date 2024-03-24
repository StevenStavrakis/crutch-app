<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from './ui/button/button.svelte';
	import Label from './ui/label/label.svelte';
	import * as Select from './ui/select';
	import { FeatureType } from '$lib/types';
	import { Switch } from './ui/switch';
	import type { Selected } from 'bits-ui';
	import type mapboxgl from 'mapbox-gl';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';

	let { coords, closeForm }: { coords: mapboxgl.LngLat; closeForm: () => void } = $props();
	console.log('Form mounted');
	console.log('Coords: ', coords);
	const featureTypeEnum = Object.entries(FeatureType);

	let featureType: undefined | Selected<FeatureType> = $state();
	let showBoolean = $derived.by(() => {
		return featureType?.value === FeatureType.ENTRANCE;
	});
	let isAccessible = $state(false);
	let submitButtonDisabled = $derived.by(() => {
		return !featureType || (showBoolean && isAccessible === undefined);
	});

</script>

<form
	method="post"
	action="?/submitFeature"
	use:enhance={() => {
		return async ({ result, update }) => {
			if (result.status === 200) {
				toast.success('Feature successfully uploaded for review');
				closeForm()
			} else {
				toast.error('There was an error uploading the feature');
			}			// `result` is an `ActionResult` object
			// `update` is a function which triggers the default logic that would be triggered if this callback wasn't set
			update();
		};
	}}
>
	<div class="flex flex-col gap-6">
		<div>
			<Label for="featureType">Feature Type</Label>
			<Select.Root bind:selected={featureType} name="featureType">
				<Select.Trigger class="w-full">
					<Select.Value class="capitalize" placeholder="Select feature type" />
				</Select.Trigger>
				<Select.Content>
					{#each featureTypeEnum as [key, value]}
						<Select.Item class="capitalize" {value}>{value}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<input type="hidden" name="featureTypeValue" value={featureType?.value} />
		</div>
		{#if showBoolean}
			<div class="flex items-center gap-3">
				<Label for="isAccessible">Is Accessible</Label>
				<Switch name="isAccessible" bind:checked={isAccessible} />
				<input type="hidden" name="isAccessibleValue" value={isAccessible} />
			</div>
		{/if}
		<input type="hidden" name="coordinates" value="[{coords.lng},{coords.lat}]" />
		<div class="w-full">
			<Button disabled={submitButtonDisabled} class="w-full" type="submit">Submit</Button>
		</div>
	</div>
</form>
