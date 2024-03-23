import directionsClient from '@mapbox/mapbox-sdk/services/directions';
import { MAPBOX_PRIVATE_TOKEN } from '$env/static/private';

const directions = directionsClient({ accessToken: MAPBOX_PRIVATE_TOKEN });
type DirectionsService = typeof directions;
type MapClient = {
    directions: DirectionsService,
};

export const mapClient: MapClient = {
    directions
}