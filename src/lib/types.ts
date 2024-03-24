type Geometry = {
    type: 'LineString',
    coordinates: number[][]
}

export type GeoJSON = {
    type: string,
    properties: object,
    geometry: Geometry
}

export enum FeatureType {
    Roadblock = "Roadblock",
    AccesibleEnt = "Accessible Entrance",
    Stairs = "Stairs",
}