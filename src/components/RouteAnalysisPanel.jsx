import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Droplets, Wind, Navigation2, DollarSign, Clock, ArrowLeft, BrainCircuit, Table, Info } from 'lucide-react';

export default function RouteAnalysisPanel({ routes, inputs, onSelectRoute, selectedRouteId, onModelRetrain }) {
    const [voyageStatus, setVoyageStatus] = React.useState('planning'); // planning, completed, retraining
    const [retrainProgress, setRetrainProgress] = React.useState(0);
    const [telemetry, setTelemetry] = React.useState(null);

    // Reset when selecting new route
    React.useEffect(() => {
        if (selectedRouteId) {
            setVoyageStatus('planning');
            setTelemetry(null);
        }
    }, [selectedRouteId]);

    const handleCompleteVoyage = (route, actualFuel, actualEta) => {
        // Use user-provided actuals
        setTelemetry({
            fuel: parseFloat(actualFuel),
            cost: (parseFloat(route.cost) * (actualFuel / route.fuelML)).toFixed(1), // approx cost adjustment
            eta: parseFloat(actualEta).toFixed(1)
        });
        setVoyageStatus('completed');
    };

    const handleRetrain = () => {
        setVoyageStatus('retraining');

        if (!selectedRoute || !telemetry) return;

        let p = 0;
        const interval = setInterval(() => {
            p += 2; // rapid progress
            setRetrainProgress(p);
            if (p >= 100) {
                clearInterval(interval);

                // Call the prop to update App state with ACTUAL data for TF.js training
                if (onModelRetrain) {
                    onModelRetrain({
                        actualFuel: telemetry.fuel,
                        actualDuration: telemetry.eta, // telemetry.eta stores duration in days here
                        routeId: selectedRoute.id
                    });
                }

                setTimeout(() => setVoyageStatus('planning'), 1000);
                alert(`Model Retrained: Weights updated based on actual voyage data.`);
            }
        }, 50);
    };

    if (!routes || routes.length === 0) return null;

    const selectedRoute = routes.find(r => r.id === selectedRouteId);
    const isDetailView = !!selectedRouteId;

    return (
        <div className="absolute right-6 top-24 w-[380px] bg-[#0a0f1e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-20 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar transition-all duration-300">

            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
                {isDetailView && (
                    <button
                        onClick={() => onSelectRoute(null)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                )}
                <div>
                    <h2 className="text-lg font-bold text-white">
                        {voyageStatus === 'completed' ? 'Post-Voyage Report' :
                            voyageStatus === 'retraining' ? 'Model Retraining' :
                                isDetailView ? 'Detailed Analysis' : 'Trade Route Options'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <BrainCircuit className="w-3 h-3 text-sky-400" />
                        {voyageStatus === 'retraining' ? 'Backpropagating Error...' : 'Voyage Projections'}
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-4">
                {!isDetailView ? (
                    // OVERVIEW MODE: List all routes (Basic Stats Only)
                    routes.map((route, idx) => (
                        <RouteOverviewCard
                            key={idx}
                            route={route}
                            onSelect={() => onSelectRoute(route.id)}
                        />
                    ))
                ) : voyageStatus === 'planning' ? (
                    // DETAIL MODE: Pre-Voyage Analysis
                    <>
                        <RouteDetailCard route={selectedRoute} inputs={inputs} />

                        {/* Voyage Completion Form */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-lg mt-4">
                            <h4 className="text-xs font-bold text-white uppercase mb-3">Voyage Completion</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">ACTUAL FUEL CONSUMED (MT)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs focus:border-sky-500 outline-none"
                                        placeholder={selectedRoute.fuelML}
                                        id="actualFuelInput"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">ACTUAL DURATION (DAYS)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs focus:border-sky-500 outline-none"
                                        placeholder={selectedRoute.etaML}
                                        id="actualDurationInput"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const fuel = document.getElementById('actualFuelInput').value || selectedRoute.fuelML;
                                        const eta = document.getElementById('actualDurationInput').value || selectedRoute.etaML;
                                        handleCompleteVoyage(selectedRoute, fuel, eta);
                                    }}
                                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-xs uppercase tracking-widest shadow-lg shadow-sky-900/20 transition-all border border-white/10 mt-2"
                                >
                                    Log Voyage Data
                                </button>
                            </div>
                        </div>
                    </>
                ) : voyageStatus === 'completed' && telemetry ? (
                    // REPORT MODE: Actual vs Predicted
                    <VoyageReportView
                        predicted={selectedRoute}
                        actual={telemetry}
                        onRetrain={handleRetrain}
                    />
                ) : (
                    // RETRAINING MODE: Progress
                    <RetrainingView progress={retrainProgress} />
                )}
            </div>
        </div>
    );
}

// STAGE 1: OVERVIEW CARD (No Live Streams)
function RouteOverviewCard({ route, onSelect }) {
    return (
        <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-sky-500/50 transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-[0_0_10px]" style={{ backgroundColor: route.color, boxShadow: `0 0 10px ${route.color}` }} />
                    <h3 className="text-sm font-bold text-white">{route.name}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${route.risk === 'LOW' ? 'bg-emerald-500/20 text-emerald-400' :
                    route.risk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400'
                    }`}>
                    {route.risk} RISK
                </span>
            </div>

            {/* Basic ML Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <MetricBox icon={<DollarSign className="w-3 h-3" />} label="Cost ($)" value={route.cost + 'k'} />
                <MetricBox icon={<Droplets className="w-3 h-3" />} label="Fuel" value={route.fuelML} />
                <MetricBox icon={<Clock className="w-3 h-3" />} label="ETA" value={route.etaML + 'd'} />
            </div>

            <button
                onClick={onSelect}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-xs uppercase tracking-widest shadow-lg shadow-sky-900/20 transition-all active:scale-95"
            >
                Select Route
            </button>
        </div>
    );
}

// STAGE 2: DETAIL CARD (Full Live Data)
function RouteDetailCard({ route, inputs }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Identity */}
            <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                <h3 className="text-lg font-black text-white mb-1">{route.name}</h3>
                <p className="text-xs text-sky-300 flex items-center gap-2">
                    <Navigation2 className="w-3 h-3" />
                    {route.distance} NM Calculated Path
                </p>
            </div>

            {/* Analysis Metrics */}
            <div className="grid grid-cols-2 gap-3">
                <LargeMetric label="Predicted Fuel" value={route.fuelML} unit="MT" sub="Physics-Based Model" />
                <LargeMetric label="Total Cost" value={route.cost} unit="k$" sub="Market Rates" />
                <LargeMetric label="Est. Arrival" value={route.etaML} unit="Days" sub="Avg Speed 18kn" />
                <LargeMetric label="Carbon Intensity" value={route.cii?.rating || 'C'} unit="Rating" sub={`Projected CII: ${route.cii?.value || '-'}`} color={route.cii?.color || 'text-amber-400'} />
            </div>

            {/* LIVE DATA STREAMS (The "Real Data" View) */}
            <div className="border-t border-white/10 pt-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Live Environmental Streams
                </h4>

                <div className="space-y-3">
                    <StreamRow
                        icon={<Wind className="w-4 h-4 text-gray-400" />}
                        label="Avg Wind Speed"
                        value={route.avgWind}
                        unit="knots"
                        limit={inputs.rules.maxWind}
                    />
                    <StreamRow
                        icon={<Droplets className="w-4 h-4 text-gray-400" />}
                        label="Significant Wave Ht"
                        value={route.avgWave}
                        unit="meters"
                        limit={inputs.rules.maxWave}
                    />
                    <StreamRow
                        icon={<AlertTriangle className="w-4 h-4 text-gray-400" />}
                        label="High Risk Sectors"
                        value={route.riskSegments}
                        unit="zones"
                        limit={5}
                        invert={true}
                    />
                </div>
            </div>

            {/* AI Recommendation */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-start gap-3">
                    <BrainCircuit className="w-5 h-5 text-indigo-400 mt-1 shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-indigo-300 uppercase mb-1">Log</h4>
                        <p className="text-xs text-gray-300 leading-relaxed">
                            {route.recommendation} Fuel consumption adjusted for hull fouling ({inputs.hull.hullIndex}) using predictive ML models.
                        </p>
                    </div>
                </div>
            </div>

            {/* SEGMENT BREAKDOWN TABLE (Transparency Feature) */}
            <SegmentAnalysisTable route={route} inputs={inputs} />
        </div>
    );
}

function SegmentAnalysisTable({ route, inputs }) {
    const [isOpen, setIsOpen] = React.useState(false);

    if (!route.path) return null;

    // Sample representative segments (start, middle, end, hazard areas)
    // We can't show ALL 50+ segments, so we pick key ones.
    const segments = route.path.filter((_, i) => i % Math.max(1, Math.floor(route.path.length / 5)) === 0).slice(0, 5);

    // Add the destination as last point if not present
    if (segments[segments.length - 1] !== route.path[route.path.length - 1]) {
        segments.push(route.path[route.path.length - 1]);
    }

    return (
        <div className="border border-white/10 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors"
            >
                <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase">
                    <Table className="w-4 h-4 text-sky-400" />
                    Segment Transparency Report
                </div>
                {isOpen ? <TrendingDown className="w-3 h-3 text-gray-500" /> : <TrendingUp className="w-3 h-3 text-gray-500" />}
            </button>

            {isOpen && (
                <div className="overflow-x-auto bg-black/40 p-3">
                    <table className="w-full text-[10px] text-left">
                        <thead>
                            <tr className="text-gray-500 border-b border-white/10">
                                <th className="p-1">Leg</th>
                                <th className="p-1">Env (W/C)</th>
                                <th className="p-1">Eff. Spd</th>
                                <th className="p-1">Fuel/Day</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {segments.map((pt, idx) => {
                                // Local Calculation Simulation
                                const wave = pt.waveHeight || 0;
                                const wind = pt.windSpeed || 0;
                                const hull = inputs.hull.hullIndex || 0;

                                // Speed Loss Logic (Local)
                                let loss = 0;
                                if (wave > 3) loss += 1;
                                if (hull > 0.5) loss += 0.5;

                                const effSpeed = (inputs.speed.designSpeed - loss).toFixed(1);

                                // Fuel Impact (Higher in bad weather)
                                const fuelFactor = (1 + (wave * 0.05)).toFixed(2);

                                return (
                                    <tr key={idx}>
                                        <td className="p-1 text-gray-300">#{idx + 1} ({pt.lat.toFixed(0)},{pt.lon.toFixed(0)})</td>
                                        <td className="p-1 text-sky-300">{wave.toFixed(1)}m / {wind.toFixed(0)}kt</td>
                                        <td className="p-1 font-mono text-emerald-400">{effSpeed} kn</td>
                                        <td className="p-1 font-mono text-rose-300">x{fuelFactor}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <p className="text-[9px] text-gray-500 mt-2 italic">
                        * Sampled segments showing local environmental impact on Speed and Fuel Rate.
                    </p>
                </div>
            )}
        </div>
    );
}

function VoyageReportView({ predicted, actual, onRetrain }) {
    const fuelDiff = ((actual.fuel - predicted.fuelML) / predicted.fuelML) * 100;
    const costDiff = ((actual.cost - predicted.cost) / predicted.cost) * 100;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
                <h3 className="text-2xl font-black text-white">{predicted.name}</h3>
                <p className="text-xs text-emerald-400 font-mono mt-1">VOYAGE COMPLETED</p>
            </div>

            {/* Comparison Table */}
            <div className="bg-black/30 rounded-lg overflow-hidden border border-white/10">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 border-b border-white/10">
                            <th className="p-3 font-medium">Metric</th>
                            <th className="p-3 font-medium">Estimated</th>
                            <th className="p-3 font-medium">Actual (Live)</th>
                            <th className="p-3 font-medium text-right">Dev</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <tr>
                            <td className="p-3 text-gray-300 flex items-center gap-2"><Droplets className="w-3 h-3" /> Fuel</td>
                            <td className="p-3 text-gray-400">{predicted.fuelML}</td>
                            <td className="p-3 text-white font-bold">{actual.fuel}</td>
                            <td className="p-3 text-right text-rose-400">+{fuelDiff.toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td className="p-3 text-gray-300 flex items-center gap-2"><DollarSign className="w-3 h-3" /> Cost</td>
                            <td className="p-3 text-gray-400">{predicted.cost}</td>
                            <td className="p-3 text-white font-bold">{actual.cost}</td>
                            <td className="p-3 text-right text-rose-400">+{costDiff.toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td className="p-3 text-gray-300 flex items-center gap-2"><Clock className="w-3 h-3" /> ETA</td>
                            <td className="p-3 text-gray-400">{predicted.etaML}</td>
                            <td className="p-3 text-white font-bold">{actual.eta}</td>
                            <td className="p-3 text-right text-gray-400">~</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <p className="text-[10px] text-rose-300 leading-relaxed text-center">
                    <strong>Model Drift Detected:</strong> Actual consumption exceeded ML predictions by {fuelDiff.toFixed(1)}%. Recommendation: Retrain model weights.
                </p>
            </div>

            <button
                onClick={onRetrain}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all border border-white/10 flex items-center justify-center gap-2"
            >
                <BrainCircuit className="w-4 h-4" />
                Retrain Model
            </button>
        </div>
    );
}

function RetrainingView({ progress }) {
    return (
        <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-500">
            <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                    <circle
                        cx="48" cy="48" r="40"
                        stroke="#0ea5e9" strokeWidth="8" fill="none"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 * (1 - progress / 100)}
                        className="transition-all duration-100 ease-linear"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sky-400 font-bold text-xl">
                    {progress}%
                </div>
            </div>
            <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-1">Backpropagating</h3>
                <p className="text-xs text-gray-400">Updating node weights based on telemetry variance...</p>
            </div>

            <div className="w-full bg-white/5 rounded-full h-1 mt-8">
                <div className="h-full bg-sky-500 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}

function MetricBox({ icon, label, value }) {
    return (
        <div className="flex flex-col items-center p-2 bg-black/30 rounded border border-white/5">
            <div className="text-gray-400 mb-1">{icon}</div>
            <div className="text-sm font-bold text-white">{value}</div>
            <div className="text-[10px] text-gray-500">{label}</div>
        </div>
    );
}

function LargeMetric({ label, value, unit, sub, color = "text-white" }) {
    return (
        <div className="p-3 bg-white/5 rounded border border-white/10">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-xl font-black ${color}`}>{value} <span className="text-xs font-normal text-gray-500">{unit}</span></div>
            <div className="text-[9px] text-gray-600 mt-1">{sub}</div>
        </div>
    );
}

function StreamRow({ icon, label, value, unit, limit, invert }) {
    const isBad = invert ? value > limit : value > limit;
    return (
        <div className="flex items-center justify-between p-3 bg-black/20 rounded border border-white/5">
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-xs font-medium text-gray-300">{label}</span>
            </div>
            <div className="text-right">
                <div className={`text-sm font-bold font-mono ${isBad ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {value} {unit}
                </div>
                {limit && <div className="text-[9px] text-gray-600">Max allowed: {limit}</div>}
            </div>
        </div>
    );
}
