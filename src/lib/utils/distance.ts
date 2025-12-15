'use client';

import { METERS_PER_KM } from '@/lib/constants/timing';

export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * METERS_PER_KM)} م`;
  }
  return `${km.toFixed(1)} كم`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} د.ق`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours} س ${mins > 0 ? `و ${mins} د.ق` : ''}`;
};

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Build a distance matrix for all points
 * @param points Array of {lat, lng} points
 * @returns 2D array where matrix[i][j] = distance from point i to point j
 */
export const buildDistanceMatrix = (points: Array<{ lat: number; lng: number }>): number[][] => {
  const n = points.length;
  const matrix: number[][] = [];
  
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = calculateDistance(
          points[i].lat,
          points[i].lng,
          points[j].lat,
          points[j].lng
        );
      }
    }
  }
  
  return matrix;
};

/**
 * Calculate total distance of a route
 * @param route Array of indices representing the route order
 * @param distanceMatrix Pre-computed distance matrix
 * @returns Total distance in kilometers
 */
export const calculateRouteDistance = (route: number[], distanceMatrix: number[][]): number => {
  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += distanceMatrix[route[i]][route[i + 1]];
  }
  return totalDistance;
};

/**
 * 2-opt improvement algorithm for TSP
 * Tries to improve a route by swapping edges
 * @param route Initial route (array of indices)
 * @param distanceMatrix Pre-computed distance matrix
 * @param preserveStart If true, keeps the first element (start point) fixed
 * @returns Improved route
 */
export const twoOptImprovement = (
  route: number[],
  distanceMatrix: number[][],
  preserveStart: boolean = false
): number[] => {
  if (route.length < 3) return route; // Too short to optimize
  
  let improved = true;
  let bestRoute = [...route];
  let bestDistance = calculateRouteDistance(bestRoute, distanceMatrix);
  
  // Maximum iterations to prevent infinite loops
  let iterations = 0;
  const maxIterations = 100;
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    // Start from index 1 if preserving start, otherwise from 0
    const startIndex = preserveStart ? 1 : 0;
    const endIndex = bestRoute.length - (preserveStart ? 1 : 0);
    
    for (let i = startIndex; i < endIndex - 1; i++) {
      for (let j = i + 2; j < endIndex; j++) {
        // Try reversing the segment between i and j
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1)
        ];
        
        const newDistance = calculateRouteDistance(newRoute, distanceMatrix);
        
        if (newDistance < bestDistance) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
          break; // Restart search after improvement
        }
      }
      if (improved) break;
    }
  }
  
  return bestRoute;
};

