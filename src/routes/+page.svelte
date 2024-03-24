<script lang="ts">
	import { mapboxgl } from '$lib/map';
	import * as Resizable from '$lib/components/ui/resizable';
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { getDirections } from '$lib/api/getDirections';
	import type { GeoJSONSource, MapMouseEvent } from 'mapbox-gl';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Dialog from '$lib/components/ui/dialog';
	import FeatureInputForm from '$lib/components/FeatureInputForm.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { addCircleBackground } from '$lib/utils.js';
	let { data, form } = $props();
	$effect(() => {
		if (!form) return;
		if (form?.status === 200) {
			toast.success('Feature uploaded successfully');
		} else {
			toast.error(`There was an error uploading the feature: ${form?.message}`);
		}
	});

	let map: mapboxgl.Map | undefined = $state();
	let directions: null | GeoJSON.Feature = $state(null);
	const fromCoords = '-78.5294792,38.0404501';
	const toCoords = '-78.5065194,38.0340111';
	const point: [number, number] = [-78.5294792, 38.0404501];
	let open = $state(false);

	let isMobile = $state(false);
	let currentPosition: mapboxgl.LngLat | undefined = $state();

	let isDragging = $state(false);
	let startMarker: mapboxgl.Marker | null = $state(null);
	let endMarker: mapboxgl.Marker | null = $state(null);
	let selectedMarker: 0 | 1 = $state(0);
	let selectedMarkerRef = $derived.by(() => {
		if (selectedMarker === 0) {
			return startMarker;
		} else if (selectedMarker === 1) {
			return endMarker;
		} else {
			return null;
		}
	});

	const recalculateRoute = () => {
		if (!startMarker || !endMarker) return;
		const start = startMarker.getLngLat();
		const end = endMarker.getLngLat();
		getDirections(`${start.lng},${start.lat}`, `${end.lng},${end.lat}`).then(
			(res) => (directions = res)
		);
	};

	const addNewMarker = (event: MapMouseEvent) => {
		if (!map || map === undefined) return;
		if (startMarker && endMarker) {
			// careful
			selectedMarkerRef!.setLngLat(event.lngLat);
			recalculateRoute();
			return;
		}
		const marker = new mapboxgl.Marker({
			draggable: true // Make the marker draggable
		}).setLngLat(event.lngLat); // Set the marker's longitude and latitude

		if (!startMarker) {
			startMarker = marker;
			selectedMarker = 0;
			marker.getElement().addEventListener('click', (e) => {
				e.stopPropagation();
				endMarker?.getElement().querySelector('path')?.setAttribute('fill', 'lightblue');
				marker.getElement().querySelector('path')?.setAttribute('fill', 'red');
				selectedMarker = 0;
			});
		} else {
			endMarker = marker;
			selectedMarker = 1;
			marker.getElement().addEventListener('click', (e) => {
				e.stopPropagation();
				startMarker?.getElement().querySelector('path')?.setAttribute('fill', 'lightblue');
				marker.getElement().querySelector('path')?.setAttribute('fill', 'red');
				selectedMarker = 1;
			});
			recalculateRoute();
		}
		marker.addTo(map);
		marker.on('dragstart', (e) => {
			isDragging = true;
		});
		marker.on('dragend', () => {
			isDragging = false;
			recalculateRoute();
		});
	};
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
				const coord: mapboxgl.LngLat = new mapboxgl.LngLat(
					position.coords.longitude,
					position.coords.latitude
				);
				currentPosition = coord;
				map?.setCenter([position.coords.longitude, position.coords.latitude]);
			});

			map.on('load', () => {
				if (!map) return;
				const svgs = [
					{
						svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-right"><path d="M22 18a2 2 0 0 1-2 2H3c-1.1 0-1.3-.6-.4-1.3L20.4 4.3c.9-.7 1.6-.4 1.6.7Z"/></svg>',
						id: 'icon-ramp'
					},
					{
						svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-door-open"><path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/></svg>',
						id: 'icon-entrance'
					},
					{
						svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-construction"><rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v7"/><path d="M7 14v7"/><path d="M17 3v3"/><path d="M7 3v3"/><path d="M10 14 2.3 6.3"/><path d="m14 6 7.7 7.7"/><path d="m8 6 8 8"/></svg>',
						id: 'icon-roadblock'
					},
					{
						svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-from-dot"><path d="m5 9 7-7 7 7"/><path d="M12 16V2"/><circle cx="12" cy="21" r="1"/></svg>',
						id: 'icon-elevator'
					},
					{
						svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-redo-dot"><circle cx="12" cy="17" r="1"/><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>',
						id: 'icon-stairs'
					}
				];

				svgs.forEach((svg) => {
					const svgImage = new Image();
					svgImage.onload = () => {
						const canvas = document.createElement('canvas');
						canvas.width = svgImage.width;
						canvas.height = svgImage.height;
						const ctx = canvas.getContext('2d');
						ctx.drawImage(svgImage, 0, 0);
						const imageData = ctx.getImageData(0, 0, svgImage.width, svgImage.height);

						map!.addImage(svg.id, {
							width: svgImage.width,
							height: svgImage.height,
							data: imageData.data
						});
					};
					svgImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.svg);
				});

				map.addSource('features', {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: data.features
					}
				});

				// Add a layer for the background circles
				map.addLayer({
					id: 'background-circle-layer',
					type: 'circle',
					source: 'features',
					paint: {
						'circle-radius': 16,
						'circle-color': [
							'match',
							['get', 'accessLevel'],
							1,
							'green',
							0,
							'yellow',
							-1,
							'red',
							'white'
						]
					}
				});

				// Add a layer to display the features as symbols
				map.addLayer({
					id: 'feature-layer',
					type: 'symbol',
					source: 'features',
					layout: {
						'icon-image': ['concat', 'icon-', ['get', 'type']],
						'icon-allow-overlap': true
					}
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

			map.on('click', (event: MapMouseEvent) => {
				addNewMarker(event);
			});
			map.on('movestart', (event) => {
				navigator.geolocation.getCurrentPosition((position) => {
					const coord: mapboxgl.LngLat = new mapboxgl.LngLat(
						position.coords.longitude,
						position.coords.latitude
					);
					currentPosition = coord;
				});
			});
		});
	});

	$effect(() => {
		// something weird about how this effect is running
		if (!map) return;
		if (directions) {
			if (map.getSource('route')) {
				(map.getSource('route') as GeoJSONSource).setData(directions);
			} else {
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
		}
		untrack(() => {
			directions = null;
		});
	});

	// function that runs on resize
	const resize = () => {
		if (window.innerWidth < 768) {
			isMobile = true;
		} else {
			isMobile = false;
		}
	};

	let submitButtonDisabled = $derived.by(() => {
		if (selectedMarkerRef === null) return true;
		return false;
	});

	const closeForm = () => {
		open = false;
	};
</script>

<svelte:window onresize={resize} />

<Resizable.PaneGroup
	direction="horizontal"
	onLayoutChange={() => window.dispatchEvent(new Event('resize'))}
>
	<Resizable.Pane defaultSize={25}>
		<div class="h-full w-full p-4">
			<h1 class="mb-6 text-4xl font-bold">Crutch</h1>
			<Tabs.Root value="navigate" class="w-[400px]">
				<Tabs.List class="grid w-full grid-cols-2">
					<Tabs.Trigger value="navigate">Navigate</Tabs.Trigger>
					<Tabs.Trigger value="upload">Upload</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="navigate">
					<Card.Root>
						<Card.Header>
							<Card.Title>Navigate</Card.Title>
							<Card.Description>
								Place two markers on the map to get directions between them. Markers can be clicked
								and dragged.
							</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-2">Various settings here</Card.Content>
						<Card.Footer>Nothing here probably</Card.Footer>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="upload">
					<Card.Root>
						<Card.Header>
							<Card.Title>Upload</Card.Title>
							<Card.Description>
								Upload a new feature to the map. Click open to start.
							</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-2">
							<p>Possible content here. Maybe the form?</p>
						</Card.Content>
						<Card.Footer>
							<Button
								disabled={submitButtonDisabled}
								onclick={() => {
									if (selectedMarkerRef !== null) {
										open = true;
									}
								}}>Upload Feature</Button
							>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</Resizable.Pane>
	<Resizable.Handle />
	<Resizable.Pane defaultSize={75}>
		<div class="h-screen w-full p-4">
			<div class="h-full w-full rounded-xl" id="map"></div>
		</div>
	</Resizable.Pane>
</Resizable.PaneGroup>

{#if !isMobile}
	<Dialog.Root bind:open>
		<Dialog.Trigger asChild let:builder>
			<Button variant="outline" builders={[builder]}>Edit Profile</Button>
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Upload Feature</Dialog.Title>
			</Dialog.Header>
			<Separator />
			<FeatureInputForm {closeForm} coords={selectedMarkerRef!.getLngLat()} />
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Trigger asChild let:builder>
			<Button variant="outline" builders={[builder]}>Edit Profile</Button>
		</Drawer.Trigger>
		<Drawer.Content class="h-[80vh] px-8">
			<div class="pt-12">
				<FeatureInputForm {closeForm} coords={selectedMarkerRef!.getLngLat()} />
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/if}
