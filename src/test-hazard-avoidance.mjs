
// src/test-hazard-avoidance.mjs
// Verify that the route optimizer detects hazards and shifts coordinates.
// Run with: node src/test-hazard-avoidance.mjs

import { optimizeRouteForHazards } from './utils/maritime.js';

// Mock TF models are not needed for this specific geometric function, 
// as it operates on the 'enriched' data properties directly.

async function testHazardAvoidance() {
    console.log("--- Testing Hazard Avoidance Logic ---");

    // Case 1: Safe Route (No changes expected)
    const safeRoute = [
        { lat: 10, lon: 10, waveHeight: 1, windSpeed: 10, piracy: 'LOW' },
        { lat: 11, lon: 11, waveHeight: 2, windSpeed: 15, piracy: 'LOW' }
    ];

    const optSafe = optimizeRouteForHazards(safeRoute);
    if (optSafe === null) {
        console.log("✅ Case 1: Safe route returned null (no change) as expected.");
    } else {
        console.error("❌ Case 1 Failed: Safe route was modified.");
    }

    // Case 2: Storm Route (Expect North Shift)
    const stormRoute = [
        { lat: 10, lon: 10, waveHeight: 6.5, windSpeed: 20, piracy: 'LOW' } // Wave > 5m
    ];

    const optStorm = optimizeRouteForHazards(stormRoute);
    if (optStorm && optStorm[0].lat > 10) {
        console.log(`✅ Case 2: Storm detected. Lat deviated from 10 to ${optStorm[0].lat}`);
    } else {
        console.error("❌ Case 2 Failed: Coordinates did not shift North for storm.");
        console.log("Result:", optStorm);
    }

    // Case 3: Piracy Route (Expect South/East Shift)
    const piracyRoute = [
        { lat: 12, lon: 45, waveHeight: 1, windSpeed: 10, piracy: 'HIGH' } // High Piracy
    ];

    // Logic was: lat -= 2.0, lon += 1.0
    const optPiracy = optimizeRouteForHazards(piracyRoute);
    if (optPiracy && optPiracy[0].lat < 12 && optPiracy[0].lon > 45) {
        console.log(`✅ Case 3: Piracy detected. deviated to Lat: ${optPiracy[0].lat}, Lon: ${optPiracy[0].lon}`);
    } else {
        console.error("❌ Case 3 Failed: Coordinates did not shift correctly for piracy.");
        console.log("Result:", optPiracy);
    }

    console.log("--- Test Complete ---");
}

testHazardAvoidance();
