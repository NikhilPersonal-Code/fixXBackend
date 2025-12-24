import { sql, SQL, AnyColumn } from 'drizzle-orm';

/**
 * Interface for geographic coordinates
 */
export interface GeoPoint {
  x: number; // longitude
  y: number; // latitude
}

/**
 * Create a PostGIS point from coordinates
 * @param longitude - Longitude value (-180 to 180)
 * @param latitude - Latitude value (-90 to 90)
 * @returns SQL fragment for ST_SetSRID(ST_MakePoint(...), 4326)
 */
export const makePoint = (longitude: number, latitude: number) => {
  return sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
};

/**
 * Calculate distance between two points in meters
 * Uses geography cast for accurate spherical distance
 * @param point1 - First geometry point column or SQL expression
 * @param point2 - Second geometry point column or SQL expression
 * @returns SQL fragment for ST_Distance with geography cast
 */
export const distanceInMeters = (
  point1: SQL | AnyColumn,
  point2: SQL | AnyColumn,
) => {
  return sql`ST_Distance(${point1}::geography, ${point2}::geography)`;
};

/**
 * Find points within a radius (in meters)
 * Uses ST_DWithin with geography cast for accurate spherical calculations
 * @param point1 - Geometry point column
 * @param point2 - Reference point (SQL expression)
 * @param radiusMeters - Radius in meters
 * @returns SQL fragment for WHERE clause
 */
export const withinRadius = (
  point1: SQL | AnyColumn,
  point2: SQL | AnyColumn,
  radiusMeters: number,
) => {
  return sql`ST_DWithin(${point1}::geography, ${point2}::geography, ${radiusMeters})`;
};

/**
 * Order by distance (nearest first)
 * Uses <-> operator for efficient KNN search
 * @param point1 - Geometry point column
 * @param point2 - Reference point (SQL expression)
 * @returns SQL fragment for ORDER BY clause
 */
export const orderByDistance = (
  point1: SQL | AnyColumn,
  point2: SQL | AnyColumn,
) => {
  return sql`${point1} <-> ${point2}`;
};

/**
 * Find points within a bounding box
 * @param pointColumn - Geometry point column
 * @param minLng - Minimum longitude (west)
 * @param minLat - Minimum latitude (south)
 * @param maxLng - Maximum longitude (east)
 * @param maxLat - Maximum latitude (north)
 * @returns SQL fragment for WHERE clause
 */
export const withinBoundingBox = (
  pointColumn: SQL | AnyColumn,
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
) => {
  return sql`ST_Within(${pointColumn}, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))`;
};

/**
 * Convert distance from kilometers to meters
 */
export const kmToMeters = (km: number): number => km * 1000;

/**
 * Convert distance from miles to meters
 */
export const milesToMeters = (miles: number): number => miles * 1609.34;

/**
 * Convert distance from meters to kilometers
 */
export const metersToKm = (meters: number): number => meters / 1000;

/**
 * Convert distance from meters to miles
 */
export const metersToMiles = (meters: number): number => meters / 1609.34;
