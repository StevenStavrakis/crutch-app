import type { PageServerLoad } from './$types';
import { mapClient } from '$lib/map/client';

export const load: PageServerLoad = (async () => {

    try {
        const response = await mapClient.datasets.listFeatures({datasetId : "clu4lsehn8u3k1tp9g91gaxie"}).send();
        const res = response.body;
        return { feature : res };
    } catch (error) {
        console.log(error);
        return {};
    }

}) satisfies PageServerLoad;
