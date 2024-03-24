// NEED
// Validate the input before sending it to the server
// strings cannot be empty
// strings cannot be the same
// strings cannot have spaces
export const getDirections = async (from: string, to: string) => {
    console.log("getDirections")
    try {
        console.log("trying")
        if (!from || !to) {
            throw new Error("Both 'from' and 'to' are required");
        }
        if (from === to) {
            throw new Error("'from' and 'to' cannot be the same");
        }
        if (from.includes(" ") || to.includes(" ")) {
            throw new Error("No spaces allowed in 'from' or 'to'");
        }
        const response = await fetch("/api/directions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ from, to }),
        });
        const json = await response.json();
        const data = json.routes[0];
        const route = data.geometry.coordinates;
        const geojson: GeoJSON.Feature = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: route
            }
        };
        console.log(geojson)
        return geojson;
    } catch (error) {
        console.log(error);
        return null;
    }
}