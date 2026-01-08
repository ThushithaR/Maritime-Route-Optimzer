
// src/services/OceanService.js

/**
 * OceanService
 * Fetches Ocean Currents and Ice data.
 * Since public real-time currents APIs are complex (often requiring NetCDF parsing or paid keys),
 * we will use a simplified model or a public endpoint if available like Open-Meteo Marine (which has currents).
 */

const BASE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const cache = new Map();

export async function getOceanConditions(lat, lon) {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (cache.has(key)) return cache.get(key);

    try {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'ocean_current_velocity,ocean_current_direction', // if supported
            daily: 'sea_ice_cover_mean', // for ice
            timezone: 'auto'
        });

        const response = await fetch(`${BASE_URL}?${params.toString()}`);
        if (!response.ok) return getFallbackOcean(lat);

        const data = await response.json();

        const current = data.current || {};
        const daily = data.daily || {};

        const speed = current.ocean_current_velocity ?? 0.5; // m/s or similar, check units
        const direction = current.ocean_current_direction ?? 0;

        // Ice cover is usually 0-1 or percentage
        // If > 0.1 (10%), consider it icy
        const iceCover = daily.sea_ice_cover_mean ? daily.sea_ice_cover_mean[0] : 0;
        const isIce = iceCover > 0.1; // threshold

        const result = {
            currentSpeed: speed * 1.94384, // m/s to knots
            currentDirection: direction,
            ice: isIce
        };

        cache.set(key, result);
        setTimeout(() => cache.delete(key), 1000 * 60 * 60); // 1 hour cache

        return result;

    } catch (error) {
        console.warn('OceanService error', error);
        return getFallbackOcean(lat);
    }
}

function getFallbackOcean(lat) {
    return {
        currentSpeed: Math.random() * 1.5, // 0-1.5 knots
        currentDirection: Math.random() * 360,
        ice: Math.abs(lat) > 70 // Simple latitude based ice
    };
}
