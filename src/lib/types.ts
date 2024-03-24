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
    ROADBLOCK = 'roadblock',
    ENTRANCE = 'entrance',
    STAIRS = 'stairs',
    RAMP = 'ramp',
    ELEVATOR = 'elevator',
}