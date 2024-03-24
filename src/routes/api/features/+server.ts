import { mapClient } from '$lib/map/client';
import type { RequestHandler } from './$types';

const DATASET_ID = "clu4lsehn8u3k1tp9g91gaxie"

export const PUT: RequestHandler = async (event) => {
    const { geometryType, geometryCoordinates, type, accessLevel } = await event.request.json();
    const id = crypto.randomUUID();
    console.log("EXECUTING PUT")
    console.log(geometryType, geometryCoordinates, type, accessLevel, id);

    try {
        const response = await mapClient.datasets.putFeature({
            datasetId: DATASET_ID,
            featureId: id,
            feature: {
                geometry: { coordinates: geometryCoordinates, type: geometryType },
                id: id,
                properties: { type: type, accessLevel: accessLevel },
                type: "Feature"
            }
        }).send();
        const res = new Response(JSON.stringify(response.body), {
            status: response.statusCode
        });
        return res;
    } catch (error) {
        console.log(error);
        return new Response(JSON.stringify(error), {
            status: 500
        });
    }
};