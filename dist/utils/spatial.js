"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metersToMiles = exports.metersToKm = exports.milesToMeters = exports.kmToMeters = exports.withinBoundingBox = exports.orderByDistance = exports.withinRadius = exports.distanceInMeters = exports.makePoint = void 0;
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Create a PostGIS point from coordinates
 * @param longitude - Longitude value (-180 to 180)
 * @param latitude - Latitude value (-90 to 90)
 * @returns SQL fragment for ST_SetSRID(ST_MakePoint(...), 4326)
 */
const makePoint = (longitude, latitude) => {
    return (0, drizzle_orm_1.sql) `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
};
exports.makePoint = makePoint;
/**
 * Calculate distance between two points in meters
 * Uses geography cast for accurate spherical distance
 * @param point1 - First geometry point column or SQL expression
 * @param point2 - Second geometry point column or SQL expression
 * @returns SQL fragment for ST_Distance with geography cast
 */
const distanceInMeters = (point1, point2) => {
    return (0, drizzle_orm_1.sql) `ST_Distance(${point1}::geography, ${point2}::geography)`;
};
exports.distanceInMeters = distanceInMeters;
/**
 * Find points within a radius (in meters)
 * Uses ST_DWithin with geography cast for accurate spherical calculations
 * @param point1 - Geometry point column
 * @param point2 - Reference point (SQL expression)
 * @param radiusMeters - Radius in meters
 * @returns SQL fragment for WHERE clause
 */
const withinRadius = (point1, point2, radiusMeters) => {
    return (0, drizzle_orm_1.sql) `ST_DWithin(${point1}::geography, ${point2}::geography, ${radiusMeters})`;
};
exports.withinRadius = withinRadius;
/**
 * Order by distance (nearest first)
 * Uses <-> operator for efficient KNN search
 * @param point1 - Geometry point column
 * @param point2 - Reference point (SQL expression)
 * @returns SQL fragment for ORDER BY clause
 */
const orderByDistance = (point1, point2) => {
    return (0, drizzle_orm_1.sql) `${point1} <-> ${point2}`;
};
exports.orderByDistance = orderByDistance;
/**
 * Find points within a bounding box
 * @param pointColumn - Geometry point column
 * @param minLng - Minimum longitude (west)
 * @param minLat - Minimum latitude (south)
 * @param maxLng - Maximum longitude (east)
 * @param maxLat - Maximum latitude (north)
 * @returns SQL fragment for WHERE clause
 */
const withinBoundingBox = (pointColumn, minLng, minLat, maxLng, maxLat) => {
    return (0, drizzle_orm_1.sql) `ST_Within(${pointColumn}, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))`;
};
exports.withinBoundingBox = withinBoundingBox;
/**
 * Convert distance from kilometers to meters
 */
const kmToMeters = (km) => km * 1000;
exports.kmToMeters = kmToMeters;
/**
 * Convert distance from miles to meters
 */
const milesToMeters = (miles) => miles * 1609.34;
exports.milesToMeters = milesToMeters;
/**
 * Convert distance from meters to kilometers
 */
const metersToKm = (meters) => meters / 1000;
exports.metersToKm = metersToKm;
/**
 * Convert distance from meters to miles
 */
const metersToMiles = (meters) => meters / 1609.34;
exports.metersToMiles = metersToMiles;
