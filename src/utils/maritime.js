
// src/utils/maritime.js

import { getMarineWeather } from '../services/WeatherService.js';
import { getOceanConditions } from '../services/OceanService.js';
import { getRiskAssessment } from '../services/RiskService.js';
import { getPortCongestion } from '../services/PortService.js';

import { predictFuel, predictSpeedLoss, predictRisk } from '../models/predictors.js';

export { getPortCongestion };

/**
 * Calculates Great Circle Distance between two points (Haversine formula).
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in Nautical Miles
 */
export function calculateGCDistance(lat1, lon1, lat2, lon2) {
    const R = 3440; // Earth radius in NM
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(val) {
    return val * Math.PI / 180;
}

/**
 * Generates a mock complex route for demo purposes.
 * @param {object} origin {lat, lon}
 * @param {object} dest {lat, lon}
 * @param {string} type Route type (varies by O-D pair)
 * @param {string} routeKey 'Origin-Destination' identifier
 * @returns {Array<{lat, lon}>}
 */
export function generateComplexRoute(origin, dest, type, routeKey = 'Rotterdam-Shanghai') {
    const route = [];

    let waypoints;

    // Route-specific waypoint definitions
    if (routeKey === 'Rotterdam-Shanghai') {
        if (type === 'Suez' || type === 'Suez Canal Route') {
            waypoints = [
                [51.92, 4.48], [51.0, 1.5], [49.0, -5.0], [45.0, -8.0],
                [43.0, -9.5], [37.0, -9.0], [35.9, -5.5], [36.0, -2.0],
                [37.0, 6.0], [37.0, 11.0], [35.0, 18.0], [33.5, 29.0],
                [31.5, 32.3], [29.9, 32.5], [27.0, 34.0], [15.0, 41.0],
                [12.6, 43.3], [12.0, 45.0], [10.0, 55.0], [6.0, 78.0],
                [5.8, 95.0], [3.0, 100.0], [1.5, 103.0], [2.0, 105.0],
                [10.0, 110.0], [20.0, 115.0], [25.0, 120.0], [31.23, 121.47]
            ];
        } else { // Cape
            waypoints = [
                [51.92, 4.48], [51.0, 1.5], [49.0, -5.0], [45.0, -8.0],
                [43.0, -9.5], [30.0, -18.0], [10.0, -20.0], [0.0, -10.0],
                [-15.0, 5.0], [-34.0, 18.3], [-35.0, 30.0], [-30.0, 50.0],
                [-10.0, 80.0], [-6.0, 105.0], [-3.0, 107.0], [0.0, 108.0],
                [10.0, 110.0], [20.0, 115.0], [31.23, 121.47]
            ];
        }
    } else if (routeKey === 'Singapore-Rotterdam') {
        if (type === 'Suez' || type === 'Suez Canal Route') {
            waypoints = [
                [1.29, 103.85], [3.0, 100.0], [5.8, 95.0], [6.0, 78.0],
                [10.0, 55.0], [12.0, 45.0], [12.6, 43.3], [15.0, 41.0],
                [27.0, 34.0], [29.9, 32.5], [31.5, 32.3], [33.5, 29.0],
                [35.0, 18.0], [37.0, 11.0], [37.0, 6.0], [36.0, -2.0],
                [35.9, -5.5], [37.0, -9.0], [43.0, -9.5], [45.0, -8.0],
                [49.0, -5.0], [51.0, 1.5], [51.92, 4.48]
            ];
        } else { // Cape
            waypoints = [
                [1.29, 103.85], [-3.0, 107.0], [-6.0, 105.0], [-10.0, 80.0],
                [-30.0, 50.0], [-35.0, 30.0], [-34.0, 18.3], [-15.0, 5.0],
                [0.0, -10.0], [10.0, -20.0], [30.0, -18.0], [43.0, -9.5],
                [45.0, -8.0], [49.0, -5.0], [51.0, 1.5], [51.92, 4.48]
            ];
        }
    } else if (routeKey === 'Los Angeles-Tokyo') {
        // TRANS-PACIFIC ROUTE (EASTWARD - THE SHORT WAY!)
        // Tokyo is at 140°E, but we represent it as -220° to show on same side of map
        // This is the ACTUAL route ships take - straight across Pacific

        waypoints = [
            [33.74, -118.27],  // Los Angeles
            [34.5, -125.0],    // Off California
            [35.5, -132.0],    // Northeast Pacific
            [36.5, -139.0],    // Mid-Pacific
            [37.0, -146.0],    // Continuing east
            [37.5, -153.0],    // Central Pacific
            [38.0, -160.0],    // Approaching Hawaii latitude
            [38.0, -167.0],    // Mid-Pacific
            [37.5, -174.0],    // Nearing Date Line
            [37.0, -181.0],    // Cross Date Line (showing as -181° = 179°E)
            [36.5, -188.0],    // West Pacific (= 172°E)
            [36.0, -195.0],    // Approaching Japan (= 165°E)
            [35.8, -202.0],    // East of Japan (= 158°E)
            [35.7, -209.0],    // Near Japan (= 151°E)
            [35.65, -220.16]   // Tokyo (= 139.84°E shown as negative)
        ];

    } else if (routeKey === 'Shanghai-Los Angeles') {
        // TRANS-PACIFIC EASTBOUND (Reverse of LA-Tokyo)
        waypoints = [
            [31.23, 121.47],   // Shanghai
            [32.0, 130.0],     // East China Sea
            [33.0, 140.0],     // Off Japan
            [34.0, 150.0],     // Western Pacific
            [35.0, 160.0],     // Mid-Pacific
            [36.0, 170.0],     // Nearing Date Line
            [37.0, 180.0],     // Cross Date Line
            [37.5, 190.0],     // East of Date Line (-170 + 360)
            [38.0, 200.0],     // Central North Pacific (-160 + 360)
            [37.5, 210.0],     // Approaching North America (-150 + 360)
            [36.5, 220.0],     // Northeast Pacific (-140 + 360)
            [35.0, 230.0],     // Off California (-130 + 360)
            [33.74, 241.73]    // Los Angeles (-118.27 + 360)
        ];

    } else if (routeKey === 'Dubai-New York') {
        // MIDDLE EAST TO US EAST COAST
        if (type === 'Suez-Atlantic') {
            waypoints = [
                [25.27, 55.33],   // Dubai
                [24.0, 58.0],     // Arabian Sea
                [20.0, 62.0],     // Arabian Sea Central
                [15.0, 55.0],     // Approaching Bab el Mandeb
                [12.6, 43.3],     // Bab el Mandeb
                [20.0, 38.0],     // Red Sea North
                [29.9, 32.5],     // Suez Canal South
                [31.5, 32.3],     // Port Said
                [34.0, 25.0],     // Mediterranean
                [36.0, 10.0],     // Central Med
                [35.9, -5.5],     // Gibraltar
                [37.0, -12.0],    // Atlantic (off Portugal)
                [40.0, -20.0],    // Mid-Atlantic
                [41.0, -40.0],    // Crossing Atlantic
                [40.69, -74.04]   // New York
            ];
        } else { // Cape-Atlantic
            waypoints = [
                [25.27, 55.33],   // Dubai
                [20.0, 60.0],     // Arabian Sea
                [10.0, 65.0],     // Indian Ocean
                [0.0, 60.0],      // Equator
                [-15.0, 45.0],    // Southwest Indian Ocean
                [-34.0, 18.3],    // Cape Town
                [-30.0, 0.0],     // South Atlantic
                [-10.0, -20.0],   // Crossing equator
                [10.0, -35.0],    // North Atlantic
                [30.0, -50.0],    // Approaching US
                [40.69, -74.04]   // New York
            ];
        }

    } else if (routeKey === 'Hamburg-Santos') {
        // DIRECT NORTH-SOUTH ATLANTIC
        waypoints = [
            [53.55, 9.99],    // Hamburg
            [51.0, 1.5],      // English Channel
            [48.0, -6.0],     // Bay of Biscay
            [43.0, -10.0],    // Off Spain
            [35.0, -15.0],    // Canary Islands
            [20.0, -22.0],    // West Africa
            [5.0, -20.0],     // Equator crossing
            [-10.0, -25.0],   // South Atlantic
            [-20.0, -35.0],   // Approaching Brazil
            [-23.96, -46.33]  // Santos
        ];

    } else if (routeKey === 'Hong Kong-Hamburg') {
        // ASIA-EUROPE (Similar to Singapore-Rotterdam)
        if (type === 'Suez') {
            waypoints = [
                [22.28, 114.17],  // Hong Kong
                [15.0, 110.0],    // South China Sea
                [8.0, 105.0],     // Gulf of Thailand
                [3.0, 100.0],     // Malacca Strait North
                [6.0, 78.0],      // Sri Lanka South
                [10.0, 55.0],     // Arabian Sea
                [12.6, 43.3],     // Bab el Mandeb
                [15.0, 41.0],     // Red Sea
                [29.9, 32.5],     // Suez South
                [31.5, 32.3],     // Port Said
                [35.0, 18.0],     // Mediterranean
                [37.0, 11.0],     // Sicily
                [37.0, 6.0],      // Algeria
                [35.9, -5.5],     // Gibraltar
                [43.0, -9.5],     // Off Portugal
                [49.0, -5.0],     // English Channel
                [51.0, 1.5],      // Dover
                [53.55, 9.99]     // Hamburg
            ];
        } else { // Cape
            waypoints = [
                [22.28, 114.17],  // Hong Kong
                [10.0, 110.0],    // South China Sea
                [0.0, 108.0],     // Equator
                [-6.0, 105.0],    // Sunda Strait
                [-10.0, 80.0],    // Indian Ocean
                [-30.0, 50.0],    // Approaching Cape
                [-34.0, 18.3],    // Cape Town
                [-15.0, 5.0],     // South Atlantic
                [0.0, -10.0],     // Equator
                [30.0, -18.0],    // North Atlantic
                [43.0, -9.5],     // Off Portugal
                [49.0, -5.0],     // English Channel
                [53.55, 9.99]     // Hamburg
            ];
        }

    } else {
        // Default: Simple path
        waypoints = [[origin.lat, origin.lon], [dest.lat, dest.lon]];
    }

    // Linear Interpolation
    for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];

        const dLat = end[0] - start[0];
        const dLon = end[1] - start[1];
        const dist = Math.sqrt(dLat * dLat + dLon * dLon);
        const steps = Math.max(5, Math.floor(dist * 2));

        for (let j = 0; j < steps; j++) {
            const t = j / steps;
            route.push({
                lat: start[0] + (end[0] - start[0]) * t,
                lon: start[1] + (end[1] - start[1]) * t
            });
        }
    }
    route.push({ lat: dest.lat, lon: dest.lon });

    return route;
}

/**
 * Fetches Environment Data for a location (Async wrapper).
 * NOTE: Since App.jsx expects this to be synchronous in the render loop (which is bad practice but exists),
 * we need to handle this carefully.
 * 
 * Ideally, we should fetch data in parallel for the whole route.
 * For this refactor, we will make `getEnvData` async, and App.jsx will need to await it.
 * But to keep existing App.jsx working without major refactor, we might need a synchronous fallback or
 * update App.jsx to handle async.
 * 
 * Given the task is to "Integrate Live Data", we MUST move to async.
 * Use a mocked sync version for immediate render if needed, but the real data is async.
 * 
 * I will provide an async version `fetchRouteData` that enriches the route.
 */

export async function enrichRouteWithLiveData(route) {
    // Optimization: Sample every Nth point to avoid API rate limits
    // We will interpolate or just use the sampled data for segments
    const SAMPLE_RATE = 10;

    // We need to keep all points for the polyline, but only fetch env data for some.
    // We will fetch for sampled points and fill the gaps with the last known data.

    const enriched = [];
    let lastEnvData = null;

    for (let i = 0; i < route.length; i++) {
        const point = route[i];

        // Fetch new data if it's a sample point or the first/last point
        if (i % SAMPLE_RATE === 0 || i === 0 || i === route.length - 1) {
            try {
                // Parallel fetch for this point
                const [weather, ocean] = await Promise.all([
                    getMarineWeather(point.lat, point.lon),
                    getOceanConditions(point.lat, point.lon)
                ]);
                const risk = getRiskAssessment(point.lat, point.lon);

                lastEnvData = { ...weather, ...ocean, ...risk };
            } catch (e) {
                console.warn("Failed to fetch data for point", i, e);
                // Fallback to previous or mock if completely failed
                if (!lastEnvData) lastEnvData = getMockEnvData(point.lat, point.lon);
            }
        }

        enriched.push({
            ...point,
            ...lastEnvData // Spread the last known environment data
        });
    }

    return enriched;
}

/**
 * Legacy synchronous mock header for compatibility during transition.
 * This should be deprecated.
 */
export function getMockEnvData(lat, lon) {
    // Return a random structure matching the new services
    return {
        waveHeight: 1.5 + Math.random(),
        windSpeed: 15 + Math.random() * 10,
        currentSpeed: 0.5,
        risk: 'LOW'
    };
}


/**
 * Calculates Fuel Consumption based on Physics + ML Correction
 * updated to include Cargo Load impact
 */
export function estimateFuel(distance, speed, shipParams, env, mlParams, tfModels, cargoLoad = 0.8) {
    let predictedFuel = 0;

    // Use TF.js Model if loaded
    if (tfModels && tfModels.fuel) {
        // Inputs: [dwt, speed, waveHeight, windSpeed, currentSpeed]
        const inputs = {
            dwt: shipParams.identity.dwt,
            speed: speed,
            waveHeight: env.waveHeight || 0,
            windSpeed: env.windSpeed || 0,
            currentSpeed: env.currentSpeed || 0
        };
        const dailyFuel = predictFuel(tfModels.fuel, inputs);
        const hours = distance / speed;
        predictedFuel = (dailyFuel / 24) * hours;

        // SAFEGUARD: If ML Model (unstable on unnormalized data) returns ~0, use Physics
        if (predictedFuel < 1) {
            console.warn("ML Model predicted ~0 fuel. Falling back to Physics.");
            predictedFuel = 0; // Force fallback logic below by resetting or we can just proceed to else block? 
            // Better to structure as: if (tfModels && ... && predictedFuel > 1)
        }
    }

    // Fallback if no model OR model failed
    if (predictedFuel < 1) {
        // Fallback to Physics Formula
        // 1. Base Power 
        const effectiveSpeed = speed - (env.currentSpeed || 0) * Math.cos((env.currentDirection || 0) * Math.PI / 180);
        const speedRatio = effectiveSpeed / shipParams.speed.designSpeed;
        let power = shipParams.propulsion.mcr * Math.pow(speedRatio, 3);

        let weatherFactor = 1.0;
        if (env.waveHeight > 2.0) weatherFactor += 0.1 * (env.waveHeight - 2.0);
        if (env.windSpeed > 20) weatherFactor += 0.05 * ((env.windSpeed - 20) / 10);
        power *= weatherFactor;

        // Cargo Load Factor (Spec Item 5)
        // Fully loaded (1.0) = 1.0 multiplier effectively on base design? 
        // Actually power ~ displacement^(2/3). 
        // Simple approximation: 70% power at ballast, 100% at full load.
        // factor = 0.7 + (0.3 * cargoLoad)
        power *= (0.7 + (0.3 * cargoLoad));

        const hullFcl = 1 + (shipParams.hull.age * 0.01) * mlParams.hullFactor;
        power *= hullFcl;
        power *= mlParams.bias;

        const hours = distance / speed;
        predictedFuel = (power * shipParams.propulsion.sfc * hours) / 1000000;
    }

    return predictedFuel;
}

/**
 * Predicts Speed Loss using TF.js + Physics
 */
export function getSpeedLoss(speed, env, tfModels, hullCondition = 0) {
    if (tfModels && tfModels.speed) {
        return predictSpeedLoss(tfModels.speed, {
            speed: speed,
            waveHeight: env.waveHeight || 0,
            windSpeed: env.windSpeed || 0
        });
    }
    // Fallback simple physics
    let loss = 0;
    if (env.waveHeight > 3) loss += 1;
    if (env.windSpeed > 30) loss += 2;

    // Hull Condition Penalty (Spec Item 4)
    // hullCondition is 0-1 (0=New, 1=Badly Fouled)
    // Max penalty 1.0 kn for bad hull
    loss += hullCondition * 1.0;

    return loss;
}

/**
 * Predicts Risk Class using TF.js
 */
export function getRiskClass(env, congestion, piracy, tfModels) {
    if (tfModels && tfModels.risk) {
        return predictRisk(tfModels.risk, {
            windSpeed: env.windSpeed || 0,
            waveHeight: env.waveHeight || 0,
            congestion: congestion || 0,
            piracy: piracy === 'HIGH' ? 1 : 0
        });
    }
    // Fallback
    let count = 0;
    if (env.windSpeed > 35) count++;
    if (env.waveHeight > 5) count++;
    if (piracy === 'HIGH') count += 2;

    if (count > 2) return 'HIGH';
    if (count > 0) return 'MEDIUM';
    return 'LOW';
}

/**
 * Optimizes a route by applying local geometric deviations to avoid hazards.
 * Returns a NEW path array (lat/lon) if optimization is needed, or null if no change.
 */
export function optimizeRouteForHazards(enrichedRoute) {
    let hasDeviation = false;
    const newPath = enrichedRoute.map(p => ({ lat: p.lat, lon: p.lon })); // Deep copy coords

    // Heuristic: Storm Avoidance
    // If we find a "Cluster" of bad weather, we shift the route segment.
    // Simple logic: If waves > 5m, shift Latitude by +3 deg (North) to skirt.
    // Real logic would check wind direction, but this visualizes the "Deviation".

    for (let i = 0; i < enrichedRoute.length; i++) {
        const p = enrichedRoute[i];

        // Hazard Condition
        if (p.waveHeight > 5.0 || p.windSpeed > 40 || p.piracy === 'HIGH') {
            hasDeviation = true;
            // Apply Deviation
            // Smooth transition? Just hard shift for MVP visibility.
            // Move 3 degrees South if High Piracy (usually near Somalia, so move further out/South)
            // Move 3 degrees North if Storm (Arbitrary heuristic)

            if (p.piracy === 'HIGH') {
                newPath[i].lat -= 2.0;
                newPath[i].lon += 1.0; // Move further East
            } else {
                newPath[i].lat += 3.0; // Shift North away from presumed storm track
            }
        }
    }

    if (!hasDeviation) return null;
    return newPath;
}

/**
 * Calculates Carbon Intensity Indicator (CII) and Rating
 * Formula: (Fuel * CO2_Factor * 10^6) / (DWT * Distance) -> grams CO2 per DWT-mile
 * Note: Simplified thresholds for Container Ships.
 */
export function calculateCII(fuelMT, distanceNM, dwt, co2Factor = 3.114) {
    if (!distanceNM || !dwt) return { value: 0, rating: 'E', color: 'text-gray-400' };

    // Total CO2 in GRAMS
    const totalCO2Grams = fuelMT * co2Factor * 1000000;

    // Transport Work in DWT-NM
    const transportWork = dwt * distanceNM;

    // CII value (g / dwt-nm)
    const cii = totalCO2Grams / transportWork;

    // Rating Thresholds (Example for Container Ships ~2023)
    // Real baselines depend on ship type/size, we use reasonable defaults
    let rating = 'E';
    let color = 'text-rose-500';

    if (cii < 5.0) { rating = 'A'; color = 'text-emerald-400'; }
    else if (cii < 7.0) { rating = 'B'; color = 'text-lime-400'; }
    else if (cii < 10.0) { rating = 'C'; color = 'text-amber-400'; } // Standard Baseline
    else if (cii < 14.0) { rating = 'D'; color = 'text-orange-400'; }
    else { rating = 'E'; color = 'text-rose-500'; }

    return {
        value: cii.toFixed(2),
        rating,
        color
    };
}
