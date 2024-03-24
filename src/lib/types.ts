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

// inaccessible = -1, neutral = 0, accessible = 1
export const featureAccessLevelMap = {
    [FeatureType.ROADBLOCK]: -1,
    [FeatureType.STAIRS]: -1,
    [FeatureType.RAMP]: 1,
    [FeatureType.ELEVATOR]: 1,
}


// example of how to access map values

// console.log(featureAccessLevelMap[FeatureType.ROADBLOCK]) // -1