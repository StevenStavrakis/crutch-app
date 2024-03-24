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
    Roadblock,
    AccesibleEnt,
    Stairs,
}