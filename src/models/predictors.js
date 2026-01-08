
import * as tf from '@tensorflow/tfjs';
import { imoSpeedLossData } from '../data/imo_speed_loss.js';
import { piracyIncidents, getPiracyRiskLevel } from '../data/imb_piracy.js';

/**
 * Helper: Normalization
 */
function normalize(val, min, max) {
    if (max === min) return 0;
    return (val - min) / (max - min);
}

function denormalize(val, min, max) {
    return val * (max - min) + min;
}

/**
 * 1. Fuel Consumption Predictor (Regression)
 * Inputs: [dwt, speed, waveHeight, windSpeed, currentSpeed]
 * Output: Fuel Consumption (tons/day)
 */
export async function createFuelPredictorModel() {
    const model = tf.sequential();
    // Input layer: 5 features
    model.add(tf.layers.dense({ units: 20, inputShape: [5], activation: 'relu' }));
    model.add(tf.layers.dense({ units: 10, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'linear' })); // Regression output

    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    // Dummy training (Physics-Informed Initialization)
    // Training on IMO Ship Energy Efficiency Study Data (50 vessels)
    const xsDataRaw = [];
    const ysDataRaw = [];

    imoSpeedLossData.forEach(item => {
        // Feature Engineering: Normalize or use raw? TFJS handles raw reasonably well with normalization layers, 
        // but explicit scaling is better. For now, we use raw inputs as in the original code structure.
        // Inputs: [dwt, speed, waveHeight, windSpeed, currentSpeed]
        xsDataRaw.push([item.dwt, item.measuredSpeed, item.waveHeight, item.windSpeed, item.currentSpeed]);
        ysDataRaw.push([item.fuelConsumption]);
    });

    // Compute Stats for Normalization
    const inputMin = [Infinity, Infinity, Infinity, Infinity, Infinity];
    const inputMax = [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity];
    let outputMin = Infinity;
    let outputMax = -Infinity;

    xsDataRaw.forEach(row => {
        row.forEach((val, i) => {
            if (val < inputMin[i]) inputMin[i] = val;
            if (val > inputMax[i]) inputMax[i] = val;
        });
    });
    ysDataRaw.forEach(row => {
        if (row[0] < outputMin) outputMin = row[0];
        if (row[0] > outputMax) outputMax = row[0];
    });

    // Normalize
    const xsData = xsDataRaw.map(row => row.map((val, i) => normalize(val, inputMin[i], inputMax[i])));
    const ysData = ysDataRaw.map(row => [normalize(row[0], outputMin, outputMax)]);

    console.log(`[FuelModel] Training on ${xsData.length} IMO authentic samples (Normalized).`);

    const xs = tf.tensor2d(xsData);
    const ys = tf.tensor2d(ysData);

    await model.fit(xs, ys, { epochs: 100, verbose: 0 }); // Increased epochs

    // Attach stats to model for prediction usage
    model.normalization = { inputMin, inputMax, outputMin, outputMax };

    // Clean up tensors
    xs.dispose();
    ys.dispose();

    return model;
}

/**
 * 2. Speed Loss Predictor (Regression)
 * Inputs: [speed, waveHeight, windSpeed]
 * Output: Speed Loss (knots)
 */
export async function createSpeedLossModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 10, inputShape: [3], activation: 'relu' }));
    model.add(tf.layers.dense({ units: 5, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'linear' }));

    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    // Dummy training
    // Training on IMO Speed Loss Data
    // Objective: Learn the relationship between environment and speed drop (Design Speed - Measured Speed)
    const xsDataRaw = [];
    const ysDataRaw = [];

    imoSpeedLossData.forEach(item => {
        // Inputs: [speed, waveHeight, windSpeed] - using Measured Speed as current operating point
        // Target: Speed Loss (Design - Measured)
        const loss = Math.max(0, item.designSpeed - item.measuredSpeed);

        xsDataRaw.push([item.measuredSpeed, item.waveHeight, item.windSpeed]);
        ysDataRaw.push([loss]);
    });

    // Compute Stats
    const inputMin = [Infinity, Infinity, Infinity];
    const inputMax = [-Infinity, -Infinity, -Infinity];
    let outputMin = Infinity;
    let outputMax = -Infinity;

    xsDataRaw.forEach(row => {
        row.forEach((val, i) => {
            if (val < inputMin[i]) inputMin[i] = val;
            if (val > inputMax[i]) inputMax[i] = val;
        });
    });
    ysDataRaw.forEach(row => {
        if (row[0] < outputMin) outputMin = row[0];
        if (row[0] > outputMax) outputMax = row[0];
    });

    // Normalize
    const xsData = xsDataRaw.map(row => row.map((val, i) => normalize(val, inputMin[i], inputMax[i])));
    const ysData = ysDataRaw.map(row => [normalize(row[0], outputMin, outputMax)]);

    console.log(`[SpeedLossModel] Training on ${xsData.length} IMO authentic samples (Normalized).`);

    await model.fit(tf.tensor2d(xsData), tf.tensor2d(ysData), { epochs: 100, verbose: 0 });

    model.normalization = { inputMin, inputMax, outputMin, outputMax };
    return model;
}

/**
 * 3. Risk Classifier (Classification)
 * Inputs: [windSpeed, waveHeight, congestion, piracyRisk]
 * Output: Risk Level (0=LOW, 1=MEDIUM, 2=HIGH) - Softmax 3 units
 */
export async function createRiskClassifierModel() {
    const model = tf.sequential();
    // Input: 4 features. PiracyRisk: 0=Low, 1=High
    model.add(tf.layers.dense({ units: 16, inputShape: [4], activation: 'relu' }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));

    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });

    // Inputs for Risk are roughly 0-100 range, piracy 0-1.
    // Softmax handles outputs. We just normalize inputs roughly.
    // We'll normalize inputs 0-50/100 to 0-1 range to be safe.

    // Training on IMB Piracy Data + Safe Baselines
    // We combine actual incidents (High Risk) with synthetic "safe" data points to balance the classes
    const xsData = [];
    const ysData = [];

    // To simplify: we will use fixed normalization constants for Risk
    // Wind: 0-60, Wave: 0-10, Congestion: 0-1, Piracy: 0-1
    const N = { wind: 60, wave: 10, cong: 1, piracy: 1 };

    const addSample = (wind, wave, cong, piracy, risk) => {
        xsData.push([
            normalize(wind, 0, N.wind),
            normalize(wave, 0, N.wave),
            normalize(cong, 0, N.cong),
            normalize(piracy, 0, N.piracy)
        ]);
        const oneHot = [0, 0, 0];
        oneHot[risk] = 1;
        ysData.push(oneHot);
    };

    // 1. Add Positive Samples (High Risk from IMB)
    piracyIncidents.forEach(inc => {
        // derived features for the model
        // wind/wave generic for these locations, piracy=1
        const wind = 10 + Math.random() * 10;
        const wave = 0.5 + Math.random();
        const cong = 0.2;
        const piracy = 1; // High likelihood indicator

        // Incident severity determines risk label
        let risk = 1; // Default Medium
        if (inc.severity >= 8) risk = 2; // High

        addSample(wind, wave, cong, piracy, risk);
    });

    // 2. Add Negative Samples (Safe zones, various weather)
    for (let i = 0; i < 50; i++) {
        const wind = Math.random() * 50;
        const wave = Math.random() * 8;
        const cong = Math.random();
        const piracy = 0; // Safe zone

        let risk = 0; // Low
        if (wind > 35 || wave > 5) risk = 1; // Medium due to weather
        // Note: No 'High' risk from weather alone in this simplified logic, preserving High for Piracy/Extreme Weather overlap
        if (wind > 50 || wave > 8) risk = 2;

        addSample(wind, wave, cong, piracy, risk);
    }

    console.log(`[RiskModel] Training on ${xsData.length} mixed samples (Normalized).`);

    await model.fit(tf.tensor2d(xsData), tf.tensor2d(ysData), { epochs: 50, verbose: 0 });
    return model;
}

/**
 * Prediction Wrappers
 */

export function predictFuel(model, inputs) {
    if (!model.normalization) return 0; // Guard
    const { inputMin, inputMax, outputMin, outputMax } = model.normalization;

    // inputs: { dwt, speed, waveHeight, windSpeed, currentSpeed }
    // Normalize inputs
    const rawInputs = [inputs.dwt, inputs.speed, inputs.waveHeight, inputs.windSpeed, inputs.currentSpeed];
    const normInputs = rawInputs.map((val, i) => normalize(val, inputMin[i], inputMax[i]));

    const inputTensor = tf.tensor2d([normInputs]);
    const pred = model.predict(inputTensor);
    const valNorm = pred.dataSync()[0];

    inputTensor.dispose();
    pred.dispose();

    // Denormalize output
    return Math.max(0, denormalize(valNorm, outputMin, outputMax));
}

export function predictSpeedLoss(model, inputs) {
    if (!model.normalization) return 0;
    const { inputMin, inputMax, outputMin, outputMax } = model.normalization;

    // inputs: { speed, waveHeight, windSpeed }
    const rawInputs = [inputs.speed, inputs.waveHeight, inputs.windSpeed];
    const normInputs = rawInputs.map((val, i) => normalize(val, inputMin[i], inputMax[i]));

    const inputTensor = tf.tensor2d([normInputs]);
    const pred = model.predict(inputTensor);
    const valNorm = pred.dataSync()[0];

    inputTensor.dispose();
    pred.dispose();

    return Math.max(0, denormalize(valNorm, outputMin, outputMax));
}

export function predictRisk(model, inputs) {
    // inputs: { windSpeed, waveHeight, congestion, piracyRisk } (piracyRisk: 0 or 1)
    // Fixed normalization as used in training
    const N = { wind: 60, wave: 10, cong: 1, piracy: 1 };

    const inputTensor = tf.tensor2d([[
        normalize(inputs.windSpeed, 0, N.wind),
        normalize(inputs.waveHeight, 0, N.wave),
        normalize(inputs.congestion, 0, N.cong),
        normalize(inputs.piracy, 0, N.piracy)
    ]]);
    const pred = model.predict(inputTensor);
    const probs = pred.dataSync();
    const maxIdx = probs.indexOf(Math.max(...probs));

    inputTensor.dispose();
    pred.dispose();
    return ['LOW', 'MEDIUM', 'HIGH'][maxIdx];
}
