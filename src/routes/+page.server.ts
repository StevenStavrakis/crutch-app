import type { PageServerLoad } from './$types';
import { mapClient } from '$lib/map/client';

export const load: PageServerLoad = (async () => {

    try {
        const request = await mapClient.datasets.listFeatures({ datasetId: "clu4lsehn8u3k1tp9g91gaxie" }).send();

        const res = await request.body;
        console.log(res)
        return {
            features: res
        };
    } catch (error) {
        console.log(error);
        return {};
    }

}) satisfies PageServerLoad;
