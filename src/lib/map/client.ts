import directionsClient from '@mapbox/mapbox-sdk/services/directions';
import datasetClient from '@mapbox/mapbox-sdk/services/datasets';
import { MAPBOX_PRIVATE_TOKEN } from '$env/static/private';

const directions = directionsClient({ accessToken: MAPBOX_PRIVATE_TOKEN });
const datasets = datasetClient({ accessToken: MAPBOX_PRIVATE_TOKEN });

type DirectionsService = typeof directions;
type DatasetService = typeof datasets;

type MapClient = {
    directions: DirectionsService,
    datasets: DatasetService
};

export const mapClient: MapClient = {
    directions, datasets
}