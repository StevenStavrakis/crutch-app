<script lang="ts">
	import { mapboxgl } from '$lib/map';
	import * as Resizable from '$lib/components/ui/resizable';
	import { untrack } from 'svelte';
	import { Input } from '$lib/components/ui/input';
	import { Navigation, Type } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { getDirections } from '$lib/api/getDirections';
	import type { GeoJSON } from '$lib/types';
	import { putFeatures } from '$lib/api/putFeatures';
	import { FeatureType } from '$lib/types';

	let { data } = $props();

	$inspect(data.features);

	let map: mapboxgl.Map | undefined = $state();
	let directions: null | GeoJSON.Feature = $state(null);
	const fromCoords = '-78.5294792,38.0404501';
	const toCoords = '-78.5065194,38.0340111';
	const point:[number, number] = [-78.5294792, 38.0404501];

	let submitFeatures = (coord:[number, number], type:FeatureType) => {
		if (type === FeatureType.AccesibleEnt) {
			putFeatures("Point", coord, type, 1)
		} else if (type === FeatureType.Roadblock || type === FeatureType.Stairs) {
			putFeatures("Point", coord, type, -1)
		}
	}

	$effect(() => {
		// need to use untrack for some reason or effect triggers
		untrack(() => {
			map = new mapboxgl.Map({
				container: 'map',
				style: 'mapbox://styles/mapbox/dark-v11',
				center: [-78.5079772, 38.0335529],
				zoom: 15
			});
			const location = navigator.geolocation.getCurrentPosition((position) => {
				map?.setCenter([position.coords.longitude, position.coords.latitude]);
			});

			map.addControl(
				new mapboxgl.GeolocateControl({
					positionOptions: {
						enableHighAccuracy: true
					},
					// When active the map will receive updates to the device's location as it changes.
					trackUserLocation: true,
					// Draw an arrow next to the location dot to indicate which direction the device is heading.
					showUserHeading: true
				})
			);
		});
	});

	$effect(() => {
		// something weird about how this effect is running
		if (!map) return;
		if (directions) {
			console.log(directions);
			/*
			if (map.getSource('route')) {
				map.getSource('route').setData(directions);
			}
			*/
			// otherwise, we'll make a new request
			map.addLayer({
				id: 'route',
				type: 'line',
				source: {
					type: 'geojson',
					data: directions
				},
				layout: {
					'line-join': 'round',
					'line-cap': 'round'
				},
				paint: {
					'line-color': '#3887be',
					'line-width': 5,
					'line-opacity': 0.75
				}
			});
		}
		untrack(() => {
			directions = null;
		});
	});
</script>

<Resizable.PaneGroup
	direction="horizontal"
	onLayoutChange={() => window.dispatchEvent(new Event('resize'))}
>
	<Resizable.Pane defaultSize={25}>
		<div class="h-full w-full p-4">
			<h1 class="text-4xl font-bold">Crutch</h1>

			<Button onclick={() => submitFeatures(point, FeatureType.AccesibleEnt)}>Example of how submitFeatures work</Button>

			<div class="flex gap-4">
				<form method="POST" action="?/search">
					<Input type="text" name="q" placeholder="Search locations" />
				</form>
				<Button size="icon" variant="ghost">
					<Navigation size={18} />
				</Button>
			</div>
			<Button onclick={() => getDirections(fromCoords, toCoords).then((res) => (directions = res))}
				>Test directions</Button
			>
		</div>
	</Resizable.Pane>
	<Resizable.Handle />
	<Resizable.Pane defaultSize={75}>
		<div class="h-screen w-full p-4">
			<div class="h-full w-full rounded-xl" id="map"></div>
		</div>
	</Resizable.Pane>
</Resizable.PaneGroup>
