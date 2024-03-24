import { FeatureType } from "$lib/types"
/**
 * Reqs:
 * 
 * geometry.type : Point | LineString
 * geometry.coordinates : []
 * 
 * type : "Feature" (always)
 * 
 * properties.feature_desc : stairs, walkways, accessible_exits, etc.
 * properties.feature_value : -1 for negative features, +1 for positive features, 0 for neutral.
 */

export const putFeatures = async (
    geometryType: string,
    geometryCoordinates: [number, number][] | [number, number],
    type: FeatureType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accessLevel: number, fetch: any) => {

    try {
        console.log("putting feature")
        if (geometryType !== "Point" && geometryType !== "LineString") {
            throw new Error("geometryType most be Point or LineString")
        }
        if (geometryCoordinates.length === 0) {
            throw new Error("At least one geometryCoordinate should be given")
        }
        if (!type) {
            throw new Error("At least one type must be given")
        }
        if (accessLevel === undefined || accessLevel === null) {
            throw new Error("accessLevel must be given")
        }
        if (accessLevel !== -1 && accessLevel !== 0 && accessLevel !== 1) {
            throw new Error("accessLevel must be -1, 0, or 1")
        }
        if (!fetch) {
            fetch = window.fetch
        }

        const response = await fetch("/api/features", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ geometryType, geometryCoordinates, type, accessLevel })
        });
        const res = await response.json();
        res.status = response.status;
        return {
            status: res.status,
        };

    } catch (error) {
        console.log(error);
        return null;
    }
}