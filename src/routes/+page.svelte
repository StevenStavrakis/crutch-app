<script lang="ts">
	import { mapboxgl } from '$lib/map';
	import * as Resizable from '$lib/components/ui/resizable';
	import { untrack } from 'svelte';
	import { Input } from '$lib/components/ui/input';
	import { Navigation, Type } from 'lucide-svelte';
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
				map.addSource('features', {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: data.features
					}
				});

				// Add a layer to display the features as circles
				map.addLayer({
					id: 'feature-layer',
					type: 'circle',
					source: 'features',
					paint: {
						'circle-radius': 6,
						'circle-color': '#FF0000'
					}
				});
				if (map.getLayer('feature-layer')) {
					console.log('Layer added successfully');
				} else {
					console.error('Error adding layer');
				}
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
			console.log(directions);
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
</script>

<svelte:window onresize={resize} />

<Resizable.PaneGroup
	direction="horizontal"
	onLayoutChange={() => window.dispatchEvent(new Event('resize'))}
>
	<Resizable.Pane defaultSize={25}>
		<div class="h-full w-full p-4">
			<h1 class="text-4xl font-bold">Crutch</h1>
			<Tabs.Root value="navigate" class="w-[400px]">
				<Tabs.List class="grid w-full grid-cols-2">
					<Tabs.Trigger value="navigate">Navigate</Tabs.Trigger>
					<Tabs.Trigger value="upload">Upload</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="navigate">
					<Card.Root>
						<Card.Header>
							<Card.Title>Account</Card.Title>
							<Card.Description>
								Make changes to your account here. Click save when you're done.
							</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-2">
							<div class="space-y-1">
								<Label for="name">Name</Label>
								<Input id="name" value="Pedro Duarte" />
							</div>
							<div class="space-y-1">
								<Label for="username">Username</Label>
								<Input id="username" value="@peduarte" />
							</div>
						</Card.Content>
						<Card.Footer>
							<Button>Save changes</Button>
						</Card.Footer>
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

			<div class="flex gap-4">
				<form method="POST" action="?/search">
					<Input type="text" name="q" placeholder="Search locations" />
				</form>
				<Button size="icon" variant="ghost">
					<Navigation size={18} />
				</Button>
			</div>
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
			<FeatureInputForm coords={selectedMarkerRef!.getLngLat()} />
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Trigger asChild let:builder>
			<Button variant="outline" builders={[builder]}>Edit Profile</Button>
		</Drawer.Trigger>
		<Drawer.Content class="h-[80vh] px-8">
			<div class="pt-12">
				<FeatureInputForm coords={selectedMarkerRef!.getLngLat()} />
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/if}
