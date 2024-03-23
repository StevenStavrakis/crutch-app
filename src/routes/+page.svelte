<script lang="ts">
	import { mapboxgl } from '$lib/map';
	let map: mapboxgl.Map | undefined = $state();
	$effect(() => {
		map = new mapboxgl.Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/streets-v11'
		});
	});
</script>

<h1>Welcome to SvelteKit</h1>
<div class="h-screen w-screen" id="map"></div>
