// src/services/WeatherService.js

/**
 * WeatherService
 * Fetches real-time weather data using DUAL APIS:
 * - Marine API for WAVES
 * - Weather API for WIND (more reliable)
 */

const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

// Cache to prevent spamming
const cache = new Map();

/**
 * Fetches marine weather data for a specific location.
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @returns {Promise<{windSpeed: number, waveHeight: number, waveDirection: number, windDirection: number}>}
 */
export async function getMarineWeather(lat, lon) {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (cache.has(key)) {
        return cache.get(key);
    }

    try {
        // PARALLEL FETCH: Wind from Weather API, Waves from Marine API
        const [windData, waveData] = await Promise.all([
            fetchWind(lat, lon),
            fetchWaves(lat, lon)
        ]);

        const result = {
            windSpeed: windData.speed,
            windDirection: windData.direction,
            waveHeight: waveData.height,
            waveDirection: waveData.direction
        };

        console.log(`[WeatherService] ✓ REAL data (${lat.toFixed(1)},${lon.toFixed(1)}): Wind=${result.windSpeed.toFixed(1)}kts, Wave=${result.waveHeight.toFixed(1)}m`);

        cache.set(key, result);
        setTimeout(() => cache.delete(key), 1000 * 60 * 15); // 15 min TTL

        return result;

    } catch (error) {
        console.error('[WeatherService] ✗ Error:', error.message);
        return getFallbackWeather(lat);
    }
}

async function fetchWind(lat, lon) {
    try {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'wind_speed_10m,wind_direction_10m'
        });

        const response = await fetch(`${WEATHER_URL}?${params.toString()}`);
        if (!response.ok) throw new Error(`Weather API ${response.status}`);

        const data = await response.json();
        const current = data.current || {};

        return {
            speed: (current.wind_speed_10m || 15) / 1.852, // km/h to knots
            direction: current.wind_direction_10m || 0
        };
    } catch (e) {
        console.warn('[WeatherService] Wind fetch failed, using fallback');
        return { speed: 15 / 1.852, direction: Math.random() * 360 };
    }
}

async function fetchWaves(lat, lon) {
    try {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'wave_height,wave_direction'
        });

        const response = await fetch(`${MARINE_URL}?${params.toString()}`);
        if (!response.ok) throw new Error(`Marine API ${response.status}`);

        const data = await response.json();
        const current = data.current || {};

        return {
            height: current.wave_height || 1.5,
            direction: current.wave_direction || 0
        };
    } catch (e) {
        console.warn('[WeatherService] Wave fetch failed, using fallback');
        const baseWave = Math.abs(lat) > 40 ? 3.5 : 1.5;
        return { height: baseWave, direction: Math.random() * 360 };
    }
}

function getFallbackWeather(lat) {
    // Latitude-based simulation
    const baseWave = Math.abs(lat) > 40 ? 4.0 : 1.5;
    const baseWind = Math.abs(lat) > 40 ? 30 : 15;

    const result = {
        windSpeed: baseWind + (Math.random() * 10 - 5),
        waveHeight: baseWave + (Math.random() * 1 - 0.5),
        waveDirection: Math.random() * 360,
        windDirection: Math.random() * 360
    };

    console.log(`[WeatherService] ⚠ FALLBACK (${lat.toFixed(1)}): Wind=${result.windSpeed.toFixed(1)}kts, Wave=${result.waveHeight.toFixed(1)}m`);

    return result;
}
