import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import ShipInputForm from './components/ShipInputForm';
import RouteAnalysisPanel from './components/RouteAnalysisPanel';
import { generateComplexRoute, enrichRouteWithLiveData, estimateFuel, calculateGCDistance, getPortCongestion, getSpeedLoss, getRiskClass, optimizeRouteForHazards, calculateCII } from './utils/maritime';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_INPUTS = {
    identity: { type: 'Container Ship', dwt: 75000, loa: 230, beam: 32 },
    propulsion: { engineType: '2-Stroke Diesel', mcr: 18000, fuelType: 'VLSFO', sfc: 165, fuelPrice: 650 },
    speed: { designSpeed: 20, ecoSpeed: 14, maxSafeSpeed: 16 },
    hull: { age: 7, hullIndex: 0.85, maintenance: 'Good' },
    loading: { loadPercent: 0.75, draft: 11.5, gm: 0.95 },
    emissions: { co2Factor: 3.114, eexi: 0.98, ciiTarget: 'B' },
    rules: { maxWave: 4.5, maxWind: 35, piracyTolerance: 'Low' },
    voyage: { origin: 'Rotterdam', destination: 'Shanghai', fuelBudget: 2800 }
};

export default function App() {
    const [inputs, setInputs] = useState(DEFAULT_INPUTS);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [routes, setRoutes] = useState([]);
    const [selectedRouteId, setSelectedRouteId] = useState(null);
    const [mlParams, setMlParams] = useState({ bias: 1.0, hullFactor: 1.0 });
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const layersRef = useRef(null);

    const [tfModels, setTfModels] = useState({ fuel: null, speed: null, risk: null });

    useEffect(() => {
        // Init Leaflet Map
        if (!mapContainerRef.current || mapRef.current) return;
        // ... (Leaflet init code remains, simplified here for replacement context) ...
        console.log('[MAP] Initializing...');
        try {
            const map = L.map(mapContainerRef.current, { center: [20, 50], zoom: 3, zoomControl: false, attributionControl: false });
            mapRef.current = map;
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19 }).addTo(map);
            layersRef.current = L.layerGroup().addTo(map);
            L.control.zoom({ position: 'bottomright' }).addTo(map);
            setTimeout(() => { map.invalidateSize(); }, 500);
        } catch (e) { console.error(e); }

        // Init ML Models
        const initModels = async () => {
            const { createFuelPredictorModel, createSpeedLossModel, createRiskClassifierModel } = await import('./models/predictors');

            let fuel, speed, risk;

            try {
                fuel = await tf.loadLayersModel('localstorage://fuel-model');
                console.log("Loaded Fuel Model from Storage");
            } catch (e) {
                fuel = await createFuelPredictorModel();
            }

            try {
                speed = await tf.loadLayersModel('localstorage://speed-model');
                console.log("Loaded Speed Model from Storage");
            } catch (e) {
                speed = await createSpeedLossModel();
            }

            try {
                risk = await tf.loadLayersModel('localstorage://risk-model');
            } catch (e) {
                risk = await createRiskClassifierModel();
            }

            setTfModels({ fuel, speed, risk });
            console.log("TF.js Models Response: Ready");
        };
        initModels();

        return () => {
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
        };
    }, []);

    const handleSimulate = async () => {
        if (!mapRef.current || !layersRef.current) return;

        setDrawerOpen(false);
        layersRef.current.clearLayers();

        // Route Definitions
        const ROUTES = {
            'Rotterdam-Shanghai': {
                origin: { lat: 51.92, lon: 4.48, name: 'Rotterdam' },
                dest: { lat: 31.23, lon: 121.47, name: 'Shanghai' },
                options: ['Suez', 'Cape']
            },
            'Singapore-Rotterdam': {
                origin: { lat: 1.29, lon: 103.85, name: 'Singapore' },
                dest: { lat: 51.92, lon: 4.48, name: 'Rotterdam' },
                options: ['Suez', 'Cape']
            },
            'Los Angeles-Tokyo': {
                origin: { lat: 33.74, lon: -118.27, name: 'Los Angeles' },
                dest: { lat: 35.65, lon: -220.16, name: 'Tokyo' },  // Wrapped: 139.84 - 360 = -220.16
                options: ['Trans-Pacific Route', 'Trans-Pacific Route']
            },
            'Shanghai-Los Angeles': {
                origin: { lat: 31.23, lon: 121.47, name: 'Shanghai' },
                dest: { lat: 33.74, lon: 241.73, name: 'Los Angeles' },  // Wrapped: -118.27 + 360 = 241.73 for Pacific crossing
                options: ['Trans-Pacific Route', 'Trans-Pacific Route']
            },
            'Dubai-New York': {
                origin: { lat: 25.27, lon: 55.33, name: 'Dubai' },
                dest: { lat: 40.69, lon: -74.04, name: 'New York' },
                options: ['Suez-Atlantic', 'Cape-Atlantic']
            },
            'Hamburg-Santos': {
                origin: { lat: 53.55, lon: 9.99, name: 'Hamburg' },
                dest: { lat: -23.96, lon: -46.33, name: 'Santos' },
                options: ['Direct Atlantic Route']
            },
            'Hong Kong-Hamburg': {
                origin: { lat: 22.28, lon: 114.17, name: 'Hong Kong' },
                dest: { lat: 53.55, lon: 9.99, name: 'Hamburg' },
                options: ['Suez', 'Cape']
            }
        };

        const routeKey = `${inputs.voyage.origin}-${inputs.voyage.destination}`;
        const selectedRoute = ROUTES[routeKey] || ROUTES['Rotterdam-Shanghai'];

        const origin = selectedRoute.origin;
        const dest = selectedRoute.dest;
        const routeOptions = selectedRoute.options;

        // 1. Generate Paths
        // Special handling: Single-route scenarios (Pacfic & Atlantic Direct)
        let path1, path2; // Declare outside if/else for broader scope
        let path1Only = false;
        let pathForCalc, pathForDisplay;

        if (routeKey === 'Los Angeles-Tokyo' || routeKey === 'Shanghai-Los Angeles' || routeKey === 'Hamburg-Santos') {
            path1 = generateComplexRoute(origin, dest, routeOptions[0], routeKey);

            // Convert back to positive longitude for calculations (but keep map display as-is)
            // The route path uses negative lon, but for distance calc we need positive
            const normalizedPath = path1.map(p => ({
                ...p,
                lon: p.lon < -180 ? p.lon + 360 : p.lon
            }));

            // Continue with single route
            path1Only = true;
            pathForCalc = normalizedPath;
            pathForDisplay = path1; // Keep negative for display
        } else {
            path1 = generateComplexRoute(origin, dest, routeOptions[0], routeKey);
            path2 = generateComplexRoute(origin, dest, routeOptions[1], routeKey);
            path1Only = false;
        }

        // 2. Fetch & Analyze (Async)
        let portCongestion = { origin: 0, dest: 0 }; // Shared state for closure

        const analyzeRoute = (enrichedPath, name, color) => {
            let totalDist = 0;
            let totalWaves = 0;
            let totalWind = 0;
            let highRiskCount = 0;
            let blockedByIce = false;

            // Draw Segments
            for (let i = 0; i < enrichedPath.length - 1; i++) {
                const p1 = enrichedPath[i];
                const p2 = enrichedPath[i + 1];
                const dist = calculateGCDistance(p1.lat, p1.lon, p2.lat, p2.lon);

                // Segment data corresponds to start point
                const env = p1;

                totalDist += dist;
                totalWaves += env.waveHeight || 0;
                totalWind += env.windSpeed || 0;
                if (env.ice) blockedByIce = true;

                // Color Logic
                let segColor = color;
                let segWeight = 3;

                const isStorm = (env.waveHeight > inputs.rules.maxWave || env.windSpeed > inputs.rules.maxWind);
                const isIce = env.ice;
                const isPiracy = env.piracy === 'HIGH';

                if (isStorm || isIce || isPiracy) {
                    segColor = '#ef4444';
                    segWeight = 5;
                    highRiskCount++;
                }

                const poly = L.polyline([[p1.lat, p1.lon], [p2.lat, p2.lon]], {
                    color: segColor, weight: segWeight, opacity: 0.8
                }).addTo(layersRef.current);

                // Detailed Tooltip
                const tooltipContent = `
                    <div style="font-family: monospace; font-size: 11px; line-height: 1.4;">
                        <b>📍 Segment Details</b><br/>
                        🌊 Waves: ${env.waveHeight?.toFixed(1) || '-'} m (${env.waveDirection?.toFixed(0) || '-'}°)<br/>
                        💨 Wind: ${env.windSpeed?.toFixed(1) || '-'} kts (${env.windDirection?.toFixed(0) || '-'}°)<br/>
                        💧 Current: ${env.currentSpeed?.toFixed(1) || '-'} kts<br/>
                        🧊 Ice: ${env.ice ? 'YES' : 'NO'}<br/>
                        🏴‍☠️ Piracy: ${env.piracy || 'LOW'}<br/>
                        🚢 ECA Zone: ${env.eca ? 'YES' : 'NO'}
                    </div>
                `;
                poly.bindTooltip(tooltipContent, { sticky: true, opacity: 0.9 });
            }

            // Stats Calculations
            const avgWave = totalWaves / (enrichedPath.length - 1);
            const avgWind = totalWind / (enrichedPath.length - 1);

            // Calculate ECA usage
            const ecaSegments = enrichedPath.filter(p => p.eca).length;
            const ecaRatio = ecaSegments / enrichedPath.length;

            // ML: Fuel Estimation (using TF.js if ready)
            // Updated to pass Cargo Load (0-1 scale, mapped from %)
            const cargoLoadFactor = (inputs.loading.cargoLoad || 80) / 100;
            const fuelTotal = estimateFuel(totalDist, inputs.speed.designSpeed, inputs, {
                waveHeight: avgWave,
                windSpeed: avgWind,
                currentSpeed: 0
            }, mlParams, tfModels, cargoLoadFactor);

            // Cost Calculation: VLSFO vs MGO (ECA requires cleaner fuel, usually +$200/ton or similar)
            // If ecaRatio > 0, we assume split fuel usage
            const basePrice = inputs.propulsion.fuelPrice;
            const ecaPrice = basePrice + 250;

            // Weighted avg price
            const avgFuelPrice = (basePrice * (1 - ecaRatio)) + (ecaPrice * ecaRatio);

            let cost = fuelTotal * (avgFuelPrice / 1000);

            // Detailed Cost Components (Spec Item 6)
            // 1. Canal Tolls
            if (name.includes('Suez')) {
                cost += 300; // +$300k for Suez Transit
            }
            if (name.includes('Panama')) {
                cost += 400; // +$400k for Panama
            }

            // ML: Speed Loss & ETA Adjustment
            // Calculate avg speed loss due to weather AND Hull Condition (Spec Item 4)
            const hullCondition = inputs.hull.hullIndex || 0; // 0-1
            const avgSpeedLoss = getSpeedLoss(inputs.speed.designSpeed, { waveHeight: avgWave, windSpeed: avgWind }, tfModels, hullCondition);
            const realSpeed = Math.max(5, inputs.speed.designSpeed - avgSpeedLoss);

            // ML: ETA Estimation (Distance / RealSpeed)
            const hours = totalDist / realSpeed;

            // Port Congestion Penalty
            // Uses closure variable portCongestion updated by parallel fetch
            const congestionDelayHours = (portCongestion.origin + portCongestion.dest) * 24; // 0-1 coeff * 24h

            const etaDays = (hours + congestionDelayHours) / 24;

            // Determines Risk Level (TF.js Classifier)
            // We can use the average conditions or check worst case. 
            // Let's use avg conditions + congestion + piracy
            let risk = getRiskClass({ windSpeed: avgWind, waveHeight: avgWave },
                (portCongestion.origin + portCongestion.dest) / 2,
                highRiskCount > 5 ? 'HIGH' : 'LOW',
                tfModels);

            // CII Calculation (New Feature)
            const ciiData = calculateCII(fuelTotal, totalDist, inputs.identity.dwt, inputs.emissions.co2Factor);

            // Override if blocked by Ice
            if (blockedByIce) risk = 'HIGH';

            return {
                id: name,
                name,
                color,
                distance: Math.round(totalDist),
                fuelML: Math.round(fuelTotal),
                fuelTrend: name.includes('Suez') ? -5 : 12,
                etaML: etaDays.toFixed(1), // Use etaDays to include congestion
                cost: Math.round(cost),  // Cost is already in k$.
                avgWave: avgWave.toFixed(1),
                avgWind: avgWind.toFixed(0),
                riskSegments: highRiskCount,
                risk,
                recommendation: risk === 'HIGH'
                    ? (path1Only ? 'Proceed with caution. High risk detected on sole route.' : 'Deviate to alternate route.')
                    : 'Optimal route found.',
                path: enrichedPath, // Cache the Full Path
                origin: origin,  // Store origin for markers
                destination: dest,  // Store destination for markers
                cii: ciiData // Store calculated CII
            };
        };

        try {
            if (path1Only) {
                // LA-Tokyo: Single route only
                let [enriched1, congOrigin, congDest] = await Promise.all([
                    enrichRouteWithLiveData(pathForCalc),  // Use normalized coordinates
                    getPortCongestion(origin.name),
                    getPortCongestion(dest.name)
                ]);

                portCongestion = { origin: congOrigin, dest: congDest };

                // Restore display coordinates
                enriched1 = enriched1.map((p, i) => ({
                    ...p,
                    lat: pathForDisplay[i]?.lat || p.lat,
                    lon: pathForDisplay[i]?.lon || p.lon
                }));

                const checkAndOptimize = async (enrichedPath, name, color) => {
                    let currentPath = enrichedPath;
                    let stats = analyzeRoute(currentPath, name, color);

                    if (stats.risk === 'HIGH' || stats.riskSegments > 0) {
                        console.log(`[Optimizer] High Risk detected on ${name}. Attempting deviation...`);
                        const optimizedPath = optimizeRouteForHazards(currentPath);

                        if (optimizedPath) {
                            const reEnriched = await enrichRouteWithLiveData(optimizedPath);
                            const newStats = analyzeRoute(reEnriched, name, color);
                            currentPath = reEnriched;
                            stats = newStats;
                            stats.recommendation = "Route Deviated: Waypoints shifted to avoid detected hazards.";
                            stats.name = name + " (Deviated)";
                            stats.color = '#f59e0b';
                        }
                    }
                    return stats;
                };

                const stats1 = await checkAndOptimize(enriched1, routeOptions[0], '#0ea5e9');
                setRoutes([stats1]);

                // Add markers (use actual geographic coords, not wrapped)
                const originMarkerLat = origin.lat;
                const originMarkerLon = origin.lon;
                const destMarkerLat = dest.lat;
                const destMarkerLon = dest.lon < -180 ? dest.lon + 360 : dest.lon;  // Unwrap if needed

                L.marker([originMarkerLat, originMarkerLon]).addTo(layersRef.current).bindPopup(origin.name);
                L.marker([destMarkerLat, destMarkerLon]).addTo(layersRef.current).bindPopup(dest.name);

                const bounds = L.latLngBounds(pathForDisplay.map(p => [p.lat, p.lon]));
                mapRef.current.fitBounds(bounds, { padding: [50, 50] });

            } else {
                // Normal: Two routes (Suez vs Cape, etc.)
                let [enriched1, enriched2, congOrigin, congDest] = await Promise.all([
                    enrichRouteWithLiveData(path1),
                    enrichRouteWithLiveData(path2),
                    getPortCongestion(origin.name),
                    getPortCongestion(dest.name)
                ]);

                portCongestion = { origin: congOrigin, dest: congDest };

                const checkAndOptimize = async (enrichedPath, name, color) => {
                    let currentPath = enrichedPath;
                    let stats = analyzeRoute(currentPath, name, color);

                    if (stats.risk === 'HIGH' || stats.riskSegments > 0) {
                        console.log(`[Optimizer] High Risk detected on ${name}. Attempting deviation...`);
                        const optimizedPath = optimizeRouteForHazards(currentPath);

                        if (optimizedPath) {
                            const reEnriched = await enrichRouteWithLiveData(optimizedPath);
                            const newStats = analyzeRoute(reEnriched, name, color);
                            currentPath = reEnriched;
                            stats = newStats;
                            stats.recommendation = "Route Deviated: Waypoints shifted to avoid detected hazards.";
                            stats.name = name + " (Deviated)";
                            stats.color = '#f59e0b';
                        }
                    }
                    return stats;
                };

                const stats1 = await checkAndOptimize(enriched1, routeOptions[0] + ' Route', '#0ea5e9');
                const stats2 = await checkAndOptimize(enriched2, routeOptions[1] + ' Route', '#10b981');

                setRoutes([stats1, stats2]);

                // Add markers (use actual geographic coords, not wrapped)
                const originMarkerLat = origin.lat;
                const originMarkerLon = origin.lon;
                const destMarkerLat = dest.lat;
                const destMarkerLon = dest.lon < -180 ? dest.lon + 360 : dest.lon;  // Unwrap if needed

                L.marker([originMarkerLat, originMarkerLon]).addTo(layersRef.current).bindPopup(origin.name);
                L.marker([destMarkerLat, destMarkerLon]).addTo(layersRef.current).bindPopup(dest.name);

                const allPoints = [...(stats1.path || path1), ...(stats2.path || path2)];
                const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lon]));
                mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }

        } catch (err) {
            console.error("Failed to fetch live data", err);
        }
    };

    const handleSelectRoute = (routeId) => {
        setSelectedRouteId(routeId);
        if (!mapRef.current || !layersRef.current) return;

        // Redraw only the selected route
        layersRef.current.clearLayers();

        // Find cached route
        const selectedRoute = routes.find(r => r.id === routeId);
        if (!selectedRoute) return;

        const enrichedPath = selectedRoute.path;
        const color = selectedRoute.color;

        // Get origin and destination from route data
        const origin = selectedRoute.origin;
        const dest = selectedRoute.destination;

        // Re-add markers with actual route locations
        if (origin && dest) {
            const originMarkerLat = origin.lat;
            const originMarkerLon = origin.lon;
            const destMarkerLat = dest.lat;
            const destMarkerLon = dest.lon < -180 ? dest.lon + 360 : dest.lon;  // Unwrap if needed

            L.marker([originMarkerLat, originMarkerLon]).addTo(layersRef.current).bindPopup(origin.name);
            L.marker([destMarkerLat, destMarkerLon]).addTo(layersRef.current).bindPopup(dest.name);
        }

        for (let i = 0; i < enrichedPath.length - 1; i++) {
            const p1 = enrichedPath[i];
            const p2 = enrichedPath[i + 1];

            // Env data from Point 1
            const env = p1;

            let segColor = color;
            let segWeight = 4;

            // Risk highlighting
            const isStorm = (env.waveHeight > inputs.rules.maxWave || env.windSpeed > inputs.rules.maxWind);
            const isIce = env.ice;
            const isPiracy = env.piracy === 'HIGH';

            if (isStorm || isIce || isPiracy) {
                segColor = '#ef4444';
                segWeight = 5;
            }

            const poly = L.polyline([[p1.lat, p1.lon], [p2.lat, p2.lon]], {
                color: segColor, weight: segWeight, opacity: 0.9
            }).addTo(layersRef.current);

            const tooltipContent = `
                <div style="font-family: monospace; font-size: 11px; line-height: 1.4;">
                    <b>📍 Segment Details</b><br/>
                    🌊 Waves: ${env.waveHeight?.toFixed(1) || '-'} m<br/>
                    💨 Wind: ${env.windSpeed?.toFixed(1) || '-'} kts<br/>
                    💧 Current: ${env.currentSpeed?.toFixed(1) || '-'} kts<br/>
                    🧊 Ice: ${env.ice ? 'YES' : 'NO'}<br/>
                    🏴‍☠️ Piracy: ${env.piracy || 'LOW'}<br/>
                    🚢 ECA Zone: ${env.eca ? 'YES' : 'NO'}
                </div>
            `;
            poly.bindTooltip(tooltipContent, { sticky: true, opacity: 0.9 });
        }

        // Focus map on this route
        const bounds = L.latLngBounds(enrichedPath.map(p => [p.lat, p.lon]));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    };

    const handleModelRetrain = async ({ actualFuel, actualDuration, routeId }) => {
        // Retrieve route inputs (simplified for this context - ideally we'd store the specific inputs used for prediction)
        // We'll approximate inputs from current global inputs + route averages
        const route = routes.find(r => r.id === routeId);
        if (!route || !tfModels.fuel) return;

        console.log("Starting On-Device Retraining...");

        // 1. Prepare Tensors for Fuel Model
        // Input: [dwt, speed, wave, wind, current]
        // Target: [actualFuel]
        // We use the route's average conditions as the "X" for this training sample
        const fuelInput = [
            inputs.identity.dwt,
            inputs.speed.designSpeed,
            parseFloat(route.avgWave),
            parseFloat(route.avgWind),
            0 // Avg current
        ];

        // We convert tons/voyage back to tons/day for the model unit
        const days = parseFloat(actualDuration);
        const actualFuelPerDay = (actualFuel / days) * 24; // approx

        const xsFuel = tf.tensor2d([fuelInput]);
        const ysFuel = tf.tensor2d([[actualFuelPerDay]]);

        // Train Fuel Model
        await tfModels.fuel.fit(xsFuel, ysFuel, {
            epochs: 5,
            verbose: 0
        });

        // 2. Prepare Tensors for Speed Loss (Duration)
        // Target: Speed Loss
        // Actual Speed = Distance / (Duration * 24)
        const realSpeed = route.distance / (parseFloat(actualDuration) * 24);
        const actualLoss = Math.max(0, inputs.speed.designSpeed - realSpeed);

        const speedInput = [
            inputs.speed.designSpeed,
            parseFloat(route.avgWave),
            parseFloat(route.avgWind)
        ];

        const xsSpeed = tf.tensor2d([speedInput]);
        const ysSpeed = tf.tensor2d([[actualLoss]]);

        await tfModels.speed.fit(xsSpeed, ysSpeed, {
            epochs: 5,
            verbose: 0
        });

        // Cleanup tensors
        xsFuel.dispose(); ysFuel.dispose();
        xsSpeed.dispose(); ysSpeed.dispose();

        console.log("Retraining Complete. Weights updated.");

        // Persist Models to LocalStorage
        await tfModels.fuel.save('localstorage://fuel-model');
        await tfModels.speed.save('localstorage://speed-model');
        // Risk model is usually static in this demo but if trainable:
        // await tfModels.risk.save('localstorage://risk-model');

        console.log("Models Saved to LocalStorage");

        // Clear routes to force/allow re-simulation with new model weights
        setRoutes([]);
        setSelectedRouteId(null);
        if (layersRef.current) layersRef.current.clearLayers();
    };

    return (
        <div className="relative h-screen w-screen bg-[#020617] overflow-hidden">
            <div ref={mapContainerRef} className="absolute inset-0 z-0" style={{ height: '100vh', width: '100vw' }} />

            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#020617]/90 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#020617]/90 to-transparent pointer-events-none z-10" />

            {/* Header - Hidden when routes are visible */}
            {routes.length === 0 && (
                <header className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#0a0f1e]/95 to-transparent backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-6 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setDrawerOpen(!drawerOpen)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            {drawerOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight">Maritime Route Optimizer</h1>
                            <p className="text-[10px] text-gray-400 font-mono">
                                {inputs.voyage.origin} → {inputs.voyage.destination}
                            </p>
                        </div>
                    </div>
                </header>
            )}

            <AnimatePresence>
                {drawerOpen && (
                    <motion.div
                        initial={{ x: -450, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -450, opacity: 0 }}
                        transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                        className="absolute left-0 top-0 bottom-0 z-30"
                        style={{ height: '100vh' }}
                    >
                        <ShipInputForm
                            inputs={inputs}
                            setInputs={setInputs}
                            onSimulate={handleSimulate}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* NEW RESULTS PANEL */}
            <RouteAnalysisPanel
                routes={routes}
                inputs={inputs}
                onSelectRoute={(id) => handleSelectRoute(id)}
                selectedRouteId={selectedRouteId}
                onModelRetrain={handleModelRetrain}
            />


        </div>
    );
}
