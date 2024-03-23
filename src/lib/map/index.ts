import { PUBLIC_MAPBOX_PUBLIC_TOKEN } from "$env/static/public";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = PUBLIC_MAPBOX_PUBLIC_TOKEN;

export { mapboxgl };