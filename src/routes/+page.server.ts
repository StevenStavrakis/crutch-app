import type { PageServerLoad } from './$types';
import { mapClient } from '$lib/map/client';
import { fail } from '@sveltejs/kit';
import { FeatureType, featureAccessLevelMap } from '$lib/types';
import { putFeatures } from '$lib/api/putFeatures';

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

export const actions = {
    submitFeature: async ({ request }) => {
        const formData = await request.formData();

        const featureType = formData.get('featureTypeValue');
        const isAccessible = formData.get('isAccessibleValue');
        const coordinates = formData.get('coordinates');
        console.log(formData)

        if (!featureType || !coordinates) {
            console.error("Invalid request")
            console.log(featureType, isAccessible, coordinates)
            if (!featureType) {
                return fail(400, {
                    message: 'Feature type is required'
                });
            }


            if (!coordinates) {
                return fail(400, {
                    message: 'Coordinates are required'
                });
            }
        }

        const coordinatesValue = JSON.parse(String(coordinates));
        const featureTypeValue = String(featureType);

        // string to enum

        const featureEnum = (() => {
            switch (featureTypeValue) {
                case 'roadblock':
                    return FeatureType.ROADBLOCK;
                case 'entrance':
                    return FeatureType.ENTRANCE;
                case 'stairs':
                    return FeatureType.STAIRS;
                case 'ramp':
                    return FeatureType.RAMP;
                case 'elevator':
                    return FeatureType.ELEVATOR;
                default:
                    return "invalid"
            }
        })();

        const accessLevel = (() => {
            switch (String(isAccessible)) {
                case 'true':
                    return 1;
                case 'false':
                    return 0;
                default:
                    return "invalid"
            }
        })();
        if (featureEnum === "invalid") {
            console.error("Invalid request")
            if (featureEnum === "invalid") {
                console.error("Invalid request: feature type invalid")
                console.error(featureEnum)
                return fail(400, {
                    message: 'Invalid request: feature type invalid'
                });
            }
            return fail(400, {
                message: 'Invalid request: access level or feature type invalid'
            });
        }

        if (featureTypeValue === FeatureType.ENTRANCE) {
            if (!isAccessible || accessLevel === "invalid") {
                return fail(400, {
                    message: 'Accessibility is required'
                });
            }
            try {
                await putFeatures("Point", coordinatesValue, featureEnum, accessLevel)
                return {
                    status: 200,
                    body: {
                        message: "Feature added"
                    }
                }
            } catch (error) {
                console.error(error)
                return fail(500, {
                    message: 'Internal server error'
                });
            }
        } else {

            try {
                await putFeatures("LineString", coordinatesValue, featureEnum, featureAccessLevelMap[(featureEnum as (FeatureType.ELEVATOR | FeatureType.RAMP | FeatureType.ROADBLOCK | FeatureType.STAIRS))])
                return {
                    status: 200,
                    body: {
                        message: "Feature added"
                    }
                }
            } catch (error) {
                console.error(error)
                return fail(500, {
                    message: 'Internal server error'
                });
            }
        }



    }
}