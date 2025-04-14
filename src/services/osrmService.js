import { polyline } from '@mapbox/polyline';

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving/';

export const getRoute = async (start, end) => {
  try {
    const response = await fetch(
      `${OSRM_BASE_URL}${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=polyline`
    );
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error('Route calculation failed');
    }

    // Decode polyline geometry to coordinates array
    const coordinates = polyline.decode(data.routes[0].geometry).map(coord => [coord[0], coord[1]]);
    
    return {
      coordinates,
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
      steps: data.routes[0].legs[0].steps
    };
  } catch (error) {
    console.error('Error fetching route:', error);
    throw error;
  }
};

export const interpolateCoordinates = (coordinates, steps = 100) => {
  const interpolated = [];
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [startLng, startLat] = coordinates[i];
    const [endLng, endLat] = coordinates[i + 1];
    
    for (let j = 0; j < steps; j++) {
      const ratio = j / steps;
      interpolated.push([
        startLng + (endLng - startLng) * ratio,
        startLat + (endLat - startLat) * ratio
      ]);
    }
  }
  return interpolated;
};
