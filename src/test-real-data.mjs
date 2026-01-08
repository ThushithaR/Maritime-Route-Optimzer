
import { createFuelPredictorModel, createSpeedLossModel, createRiskClassifierModel, predictFuel, predictSpeedLoss, predictRisk } from './models/predictors.js';
import { imoSpeedLossData } from './data/imo_speed_loss.js';
import { piracyIncidents, getPiracyRiskLevel } from './data/imb_piracy.js';
import * as tf from '@tensorflow/tfjs';

async function runVerification() {
    console.log("=== 1. Verifying IMO Speed Loss Data Integration ===");
    console.log(`Loaded ${imoSpeedLossData.length} vessel records.`);

    // Check first record
    const sample = imoSpeedLossData[0];
    console.log(`Sample Vessel: ${sample.id} (${sample.type})`);
    console.log(`   Design Speed: ${sample.designSpeed} kn, Measured: ${sample.measuredSpeed} kn`);
    console.log(`   Fuel: ${sample.fuelConsumption} tons/day`);

    console.log("\n=== 2. Training Models with Real Data ===");
    const fuelModel = await createFuelPredictorModel();
    const speedLossModel = await createSpeedLossModel();
    const riskModel = await createRiskClassifierModel();

    console.log("\n=== 3. Testing Predictions ===");

    // Test Fuel Prediction
    // Using the same parameters as the sample to see if it learned approx value
    const fuelPred = predictFuel(fuelModel, {
        dwt: sample.dwt,
        speed: sample.measuredSpeed,
        waveHeight: sample.waveHeight,
        windSpeed: sample.windSpeed,
        currentSpeed: sample.currentSpeed
    });
    console.log(`Fuel Prediction for Sample: ${fuelPred.toFixed(2)} tons/day (Actual: ${sample.fuelConsumption})`);
    const fuelError = Math.abs(fuelPred - sample.fuelConsumption) / sample.fuelConsumption;
    console.log(`Fuel Error: ${(fuelError * 100).toFixed(1)}%`);

    // Test Speed Loss Prediction
    // High wind/wave case from data (item 6: heavy weather)
    const heavy = imoSpeedLossData.find(d => d.windSpeed > 35);
    if (heavy) {
        const lossPred = predictSpeedLoss(speedLossModel, {
            speed: heavy.measuredSpeed,
            waveHeight: heavy.waveHeight,
            windSpeed: heavy.windSpeed
        });
        const actualLoss = heavy.designSpeed - heavy.measuredSpeed;
        console.log(`\nSpeed Loss Prediction (Heavy Weather): ${lossPred.toFixed(2)} kn (Actual: ${actualLoss.toFixed(2)} kn)`);
    }

    // Test Piracy Risk Lookup
    console.log("\n=== 4. Verifying IMB Piracy Risk ===");
    const pirateLoc = piracyIncidents[0]; // { lat: 12.5, lon: 44.2 ... }
    const riskLevel = getPiracyRiskLevel(pirateLoc.lat, pirateLoc.lon);
    console.log(`Risk Check at Known Incident (${pirateLoc.lat}, ${pirateLoc.lon}): Level ${riskLevel}`);

    if (riskLevel > 0) {
        console.log("✅ Risk Service correctly identified high risk zone.");
    } else {
        console.error("❌ Risk Service failed to identify known incident location.");
    }

    // Test Risk Model Prediction
    // Should predict 'HIGH' (2) or at least 'MEDIUM' (1) given piracy=1
    const riskClass = predictRisk(riskModel, {
        windSpeed: 10,
        waveHeight: 1,
        congestion: 0,
        piracy: 1 // High likelihood
    });
    console.log(`Risk Model Prediction with Piracy Input: ${riskClass}`);

    if (riskClass === 'HIGH' || riskClass === 'MEDIUM') {
        console.log("✅ Risk Model correctly weights piracy factor.");
    } else {
        console.error("❌ Risk Model failed to flag piracy risk.");
    }
}

runVerification();
