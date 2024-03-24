import type { RequestHandler } from './$types';
import { mapClient } from '$lib/map/client';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async (event) => {
    // get coordinates from request body
    const { from, to } = await event.request.json();
    // hit mapbox api
    try {
        const response = await mapClient.directions.getDirections({
            profile: 'walking',
            geometries: 'geojson',
            waypoints: [
                { coordinates: from.split(',').map(Number) },
                { coordinates: to.split(',').map(Number) }
            ]
        }).send();
        return json(response.body);
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify(error), {
            status: 500
        });
    }
};