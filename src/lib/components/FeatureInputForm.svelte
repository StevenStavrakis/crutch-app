<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from './ui/button/button.svelte';
	import Label from './ui/label/label.svelte';
	import * as Select from './ui/select';
</script>

<form method="post" action="?/submitFeature" use:enhance>
	<div>
		<Label for="type">Feature Type</Label>
		<Select.Root name="type">
			<Select.Trigger class="w-full">
				<Select.Value placeholder="Theme" />
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="light">Light</Select.Item>
				<Select.Item value="dark">Dark</Select.Item>
				<Select.Item value="system">System</Select.Item>
			</Select.Content>
		</Select.Root>
	</div>
	<Button type="submit">Submit</Button>
</form>
