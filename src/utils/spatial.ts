/**
 * Spatial utilities for location-based queries WITHOUT PostGIS dependency
 * Uses pure PostgreSQL with JSONB and Haversine formula for distance calculations
 */

import { sql, SQL, AnyColumn } from 'drizzle-orm';

/**
 * Interface for geographic coordinates stored in JSONB
 */
export interface GeoPoint {
  x: number; // longitude (-180 to 180)
  y: number; // latitude (-90 to 90)
}

/**
 * Earth's radius in meters (used for Haversine formula)
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculate distance between a JSONB point column and reference coordinates using Haversine formula
 * Returns distance in METERS
 *
 * @param pointColumn - JSONB column containing {x: longitude, y: latitude}
 * @param longitude - Reference longitude
 * @param latitude - Reference latitude
 * @returns SQL fragment that calculates distance in meters
 */
export const distanceInMeters = (
  pointColumn: SQL | AnyColumn,
  longitude: number,
  latitude: number,
) => {
  // Haversine formula in pure SQL
  // Distance = 2 * R * asin(sqrt(sin²((lat2-lat1)/2) + cos(lat1) * cos(lat2) * sin²((lng2-lng1)/2)))
  return sql`(
    2 * ${EARTH_RADIUS_METERS} * asin(sqrt(
      power(sin(radians((${pointColumn}->>'y')::float - ${latitude}) / 2), 2) +
      cos(radians(${latitude})) *
      cos(radians((${pointColumn}->>'y')::float)) *
      power(sin(radians((${pointColumn}->>'x')::float - ${longitude}) / 2), 2)
    ))
  )`;
};

/**
 * Find points within a radius (in meters) using Haversine formula
 *
 * @param pointColumn - JSONB column containing {x: longitude, y: latitude}
 * @param longitude - Reference longitude
 * @param latitude - Reference latitude
 * @param radiusMeters - Radius in meters
 * @returns SQL fragment for WHERE clause
 */
export const withinRadius = (
  pointColumn: SQL | AnyColumn,
  longitude: number,
  latitude: number,
  radiusMeters: number,
) => {
  return sql`(
    2 * ${EARTH_RADIUS_METERS} * asin(sqrt(
      power(sin(radians((${pointColumn}->>'y')::float - ${latitude}) / 2), 2) +
      cos(radians(${latitude})) *
      cos(radians((${pointColumn}->>'y')::float)) *
      power(sin(radians((${pointColumn}->>'x')::float - ${longitude}) / 2), 2)
    ))
  ) <= ${radiusMeters}`;
};

/**
 * Order by distance (nearest first) using Haversine formula
 *
 * @param pointColumn - JSONB column containing {x: longitude, y: latitude}
 * @param longitude - Reference longitude
 * @param latitude - Reference latitude
 * @returns SQL fragment for ORDER BY clause
 */
export const orderByDistance = (
  pointColumn: SQL | AnyColumn,
  longitude: number,
  latitude: number,
) => {
  return distanceInMeters(pointColumn, longitude, latitude);
};

/**
 * Find points within a bounding box (fast pre-filter before Haversine)
 * Use this for efficient queries before applying exact radius filter
 *
 * @param pointColumn - JSONB column containing {x: longitude, y: latitude}
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
  return sql`(
    (${pointColumn}->>'x')::float >= ${minLng} AND
    (${pointColumn}->>'x')::float <= ${maxLng} AND
    (${pointColumn}->>'y')::float >= ${minLat} AND
    (${pointColumn}->>'y')::float <= ${maxLat}
  )`;
};

/**
 * Calculate bounding box from center point and radius
 * Useful for creating a fast pre-filter before exact Haversine calculation
 *
 * @param longitude - Center longitude
 * @param latitude - Center latitude
 * @param radiusMeters - Radius in meters
 * @returns Bounding box coordinates
 */
export const getBoundingBox = (
  longitude: number,
  latitude: number,
  radiusMeters: number,
): { minLng: number; minLat: number; maxLng: number; maxLat: number } => {
  // Approximate degrees per meter at given latitude
  const latDelta = radiusMeters / 111320; // ~111.32 km per degree latitude
  const lngDelta =
    radiusMeters / (111320 * Math.cos((latitude * Math.PI) / 180));

  return {
    minLng: longitude - lngDelta,
    maxLng: longitude + lngDelta,
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
  };
};

/**
 * Create a GeoPoint object
 *
 * @param longitude - Longitude value (-180 to 180)
 * @param latitude - Latitude value (-90 to 90)
 * @returns GeoPoint object for storing in JSONB column
 */
export const createGeoPoint = (
  longitude: number,
  latitude: number,
): GeoPoint => ({
  x: longitude,
  y: latitude,
});

// ==================== UNIT CONVERTERS ====================

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
