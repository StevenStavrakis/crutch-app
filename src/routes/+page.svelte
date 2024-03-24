<script lang="ts">
	import { mapboxgl } from '$lib/map';
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { getDirections } from '$lib/api/getDirections';
	import type { GeoJSONSource, LngLat, MapMouseEvent } from 'mapbox-gl';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Dialog from '$lib/components/ui/dialog';
	import FeatureInputForm from '$lib/components/FeatureInputForm.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Card from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import { calcDistance } from '$lib/utils.js';
	import { Menu } from 'lucide-svelte';
	let { data, form } = $props();
	$effect(() => {
		untrack(() => {
			resize();
		});
	});

	let map: mapboxgl.Map | undefined = $state();
	let directions: null | GeoJSON.Feature = $state(null);
	const maxDistanceToClip = 0.00035;
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
		if (startMarker.getLngLat() == endMarker.getLngLat()) return;
		const start = startMarker.getLngLat();
		const end = endMarker.getLngLat();
		getDirections(`${start.lng},${start.lat}`, `${end.lng},${end.lat}`).then(
			(res) => (directions = res)
		);
	};

	const addNewMarker = (event: MapMouseEvent) => {
		if (isMobile && modeSetting === 'upload') {
			if (endMarker) {
				endMarker.remove();
				endMarker = null;
			}
			startMarker?.remove();
			startMarker = new mapboxgl.Marker().setLngLat(event.lngLat);
			startMarker.addTo(map);
			selectedMarker = 0;
			currentCoordsSet = event.lngLat;
			open = true;
			return;
		}
		if (!isMobile && modeSetting === 'upload') {
			if (endMarker) {
				endMarker.remove();
				endMarker = null;
			}
			startMarker?.remove();
			startMarker = new mapboxgl.Marker({
				draggable: true
			}).setLngLat(event.lngLat);
			startMarker.addTo(map);
			selectedMarker = 0;
			currentCoordsSet = event.lngLat;
			return;
		}
		if (isMobile && modeSetting === 'navigate') {
			console.log('isMobile add marker');
			// set start marker to current user geo location

			startMarker?.remove();
			startMarker = new mapboxgl.Marker().setLngLat(compareAndSetPoint(currentPosition));
			if (!endMarker) {
				console.log('make end marker');
				selectedMarker = 1;
				endMarker = new mapboxgl.Marker().setLngLat(compareAndSetPoint(event.lngLat));
				endMarker.addTo(map);
			} else {
				endMarker.setLngLat(compareAndSetPoint(event.lngLat));
			}
			recalculateRoute();
			return;
		}
		if (!map || map === undefined) return;
		if (startMarker && endMarker) {
			// careful
			selectedMarkerRef!.setLngLat(compareAndSetPoint(event.lngLat));
			recalculateRoute();
			return;
		}
		const marker = new mapboxgl.Marker({
			draggable: true // Make the marker draggable
		}).setLngLat(compareAndSetPoint(event.lngLat)); // Set the marker's longitude and latitude

		if (!startMarker) {
			startMarker = marker.setLngLat(compareAndSetPoint(event.lngLat));
			selectedMarker = 0;
			marker.getElement().addEventListener('click', (e) => {
				e.stopPropagation();
				endMarker?.getElement().querySelector('path')?.setAttribute('fill', 'lightblue');
				marker.getElement().querySelector('path')?.setAttribute('fill', 'red');
				selectedMarker = 0;
			});
		} else {
			endMarker = marker.setLngLat(compareAndSetPoint(event.lngLat));
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

		let lastLngLatBeforeDrag: mapboxgl.LngLatLike;

		marker.on('dragstart', (e) => {
			isDragging = true;
			lastLngLatBeforeDrag = marker.getLngLat();
		});

		marker.on('dragend', () => {
			isDragging = false;
			if (selectedMarker === 0 && compareAndSetPoint(marker.getLngLat()) === compareAndSetPoint(endMarker!.getLngLat())){
				marker.setLngLat(lastLngLatBeforeDrag);
			} else {
				marker.setLngLat(compareAndSetPoint(marker.getLngLat()));				
			};
			if (selectedMarker === 1 && compareAndSetPoint(marker.getLngLat()) === compareAndSetPoint(startMarker!.getLngLat())){
				marker.setLngLat(lastLngLatBeforeDrag);
			} else {
				marker.setLngLat(compareAndSetPoint(marker.getLngLat()));
			};
			recalculateRoute();
		});
	};
	$effect(() => {
		// need to use untrack for some reason or effect triggers
		untrack(() => {
			const location = navigator.geolocation.getCurrentPosition((position) => {
				const coord: mapboxgl.LngLat = new mapboxgl.LngLat(
					position.coords.longitude,
					position.coords.latitude
				);
				currentPosition = coord;
				map = new mapboxgl.Map({
					container: 'map',
					style: 'mapbox://styles/mapbox/dark-v11',
					center: [currentPosition.lng, currentPosition.lat],
					zoom: 17
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
							ctx!.drawImage(svgImage, 0, 0);
							const imageData = ctx!.getImageData(0, 0, svgImage.width, svgImage.height);

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
								'orange',
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

					const geoControl = new mapboxgl.GeolocateControl({
						positionOptions: {
							enableHighAccuracy: true
						},
						// When active the map will receive updates to the device's location as it changes.
						trackUserLocation: true,
						// Draw an arrow next to the location dot to indicate which direction the device is heading.
						showUserHeading: true
					});
					map.addControl(geoControl);

					setTimeout(() => {
						geoControl.trigger();
					}, 300);
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
	});

	$effect(() => {
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

	const calculateClosestDoor = (myPos: LngLat) => {
		let minDist = 1000;
		let coord = [0, 0];

		for (const { id, geometry, properties } of data.features) {
			let { type, accessLevel } = properties;
			if (type === 'entrance' && accessLevel === 1) {
				let { coordinates } = geometry;
				let currDist = calcDistance(coordinates, [myPos.lng, myPos.lat]);
				if (currDist < minDist) {
					minDist = currDist;
					coord = coordinates;
				}
			}
		}
		return coord;
	};

	const compareAndSetPoint = (myPos: LngLat) => {
		const closestDoor = calculateClosestDoor(myPos);
		if (
			calcDistance([closestDoor[0], closestDoor[1]], [myPos.lng, myPos.lat]) > maxDistanceToClip
		) {
			toast.error('No ADA compliant entrance nearby, using selected location');
			return myPos;
		} else {
			toast.success('Using closest ADA compliant entrance');
			return new mapboxgl.LngLat(closestDoor[0], closestDoor[1]);
		}
	};

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

	let openMenu = $state(false);
	let modeSetting = $state('upload');
	$effect(() => {
		if (isMobile) {
			if (modeSetting === 'upload') {
				if (map?.getLayer('route')) {
					map?.removeLayer('route');
					map?.removeSource('route');
				}
				if (endMarker) {
					endMarker.remove();
					endMarker = null;
				}
				if (startMarker) {
					startMarker.remove();
					startMarker = null;
				}
				directions = null;
			}
		}
	});
	let currentLngLat = $derived.by(() => {
		if (selectedMarkerRef !== null) {
			return selectedMarkerRef.getLngLat();
		}
		return null;
	});
	let currentCoordsSet: null | LngLat = $state(null);
</script>

<svelte:window onresize={resize} />

<div class="flex flex-col md:flex-row">
	<div class="hidden h-full w-fit p-4 md:block">
		<h1 class="mb-6 hidden text-4xl font-bold md:block">Crutch</h1>
		<Tabs.Root bind:value={modeSetting} class="w-[400px]">
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
				</Card.Root>
			</Tabs.Content>
			<Tabs.Content value="upload">
				<Card.Root>
					<Card.Header>
						<Card.Title>Upload</Card.Title>
						<Card.Description
							>Upload a new feature to the map. Click open to start.</Card.Description
						>
					</Card.Header>
					<Card.Footer>
						<Button
							class="w-full"
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
	<div class="h-screen w-full p-4">
		<div class="h-full w-full rounded-xl" id="map"></div>
		<div class="absolute bottom-8 left-8 z-40 rounded-lg border bg-black p-3 md:hidden">
			<span>Mode: </span>
			{#if modeSetting === 'navigate'}
				<span>Navigate</span>
			{:else}
				<span>Upload</span>
			{/if}
		</div>
		<div class="absolute bottom-8 right-8 z-40 md:hidden">
			<Button
				onclick={() => {
					console.log('clicked');
					openMenu = true;
				}}
				size="icon"
			>
				<Menu class="pointer-events-none" size={32} />
			</Button>
			<Dialog.Root bind:open={openMenu}>
				<Dialog.Content class="max-w-[95vw]">
					<Dialog.Header>
						<Dialog.Title>Settings</Dialog.Title>
						<Dialog.Description>
							Choose between navigating or uploading a new feature to the map.
						</Dialog.Description>
					</Dialog.Header>
					<Tabs.Root class="w-full" bind:value={modeSetting}>
						<Tabs.List class="grid w-full grid-cols-2">
							<Tabs.Trigger value="navigate">Navigate</Tabs.Trigger>
							<Tabs.Trigger value="upload">Upload</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="navigate">
							<Card.Root>
								<Card.Header>
									<Card.Title>Navigate</Card.Title>
									<Card.Description>
										Tap a location on the map to get walking directions. If there is an ADA
										compliant entrance nearby, it will be used.
									</Card.Description>
								</Card.Header>
								<Card.Footer>
									<Button onclick={() => (openMenu = false)}>Close</Button>
								</Card.Footer>
							</Card.Root>
						</Tabs.Content>
						<Tabs.Content value="upload">
							<Card.Root>
								<Card.Header>
									<Card.Title>Upload</Card.Title>
									<Card.Description
										>Tap on the map to submit a new feature marker so that others can easily make
										routing decisions.</Card.Description
									>
								</Card.Header>
								<Card.Footer>
									<Button onclick={() => (openMenu = false)}>Close</Button>
								</Card.Footer>
							</Card.Root>
						</Tabs.Content>
					</Tabs.Root>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>
</div>

{#if !isMobile}
	<Dialog.Root bind:open>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Upload Feature</Dialog.Title>
			</Dialog.Header>
			<Separator />
			<FeatureInputForm {closeForm} coords={currentCoordsSet} />
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content class="h-[80vh] px-8">
			<div class="pt-12">
				<FeatureInputForm {closeForm} coords={currentCoordsSet} />
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/if}
