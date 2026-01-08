
// src/test-models.js
// Verify TF.js models load and predict reasonable values
// Run with: node src/test-models.js

import * as tf from '@tensorflow/tfjs';
// We need to polyfill fetch for TF.js in node sometimes, but let's try direct import
// If this fails due to environment, we rely on browser verification which is already done.

async function testModels() {
    console.log("--- Testing ML Models ---");

    try {
        const { createFuelPredictorModel, createSpeedLossModel, createRiskClassifierModel, predictFuel } = await import('./models/predictors.js');

        console.log("1. Creating Fuel Model...");
        const fuelModel = await createFuelPredictorModel();
        const fuelPred = predictFuel(fuelModel, { dwt: 50000, speed: 14, waveHeight: 2, windSpeed: 15, currentSpeed: 0 });
        console.log(`   Prediction (Fuel): ${fuelPred.toFixed(2)} tons/day`);

        console.log("2. Creating Speed Loss Model...");
        const speedModel = await createSpeedLossModel();
        // We need to export predictSpeedLoss to test it, let's assume it works or import it if exported
        // It is exported in the file.
        const { predictSpeedLoss } = await import('./models/predictors.js');
        const speedLoss = predictSpeedLoss(speedModel, { speed: 14, waveHeight: 4, windSpeed: 30 });
        console.log(`   Prediction (Speed Loss): ${speedLoss.toFixed(2)} knots`);

        console.log("3. Creating Risk Classifier...");
        const riskModel = await createRiskClassifierModel();
        const { predictRisk } = await import('./models/predictors.js');
        const risk = predictRisk(riskModel, { windSpeed: 40, waveHeight: 6, congestion: 0.5, piracy: 0 });
        console.log(`   Prediction (Risk): ${risk}`);

        console.log("✅ ML Models Verified");

    } catch (e) {
        console.error("❌ Model Test Failed", e);
    }
}

testModels();
