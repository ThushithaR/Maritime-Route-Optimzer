import React from 'react';
import { BarChart3, Wind, Droplets, Navigation, AlertTriangle, ShieldCheck, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnalyticsPanel({ activeRoute, modelsLoaded }) {
    if (!activeRoute) {
        return (
            <aside className="w-[300px] bg-[#020617] border-l border-white/5 flex flex-col h-full items-center justify-center p-6 text-gray-500 z-10">
                <Gauge className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-xs uppercase font-bold tracking-widest text-center opacity-50">
                    Awaiting Telemetry
                </p>
            </aside>
        );
    }

    return (
        <aside className="w-[300px] bg-[#020617] border-l border-white/5 flex flex-col h-full overflow-y-auto custom-scrollbar z-10">
            <div className="p-6 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2 text-sky-400">
                        <BarChart3 className="w-4 h-4" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-white">Live Analytics</h2>
                    </div>
                    <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400 uppercase animate-pulse">
                        Live Stream
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <StatBox label="Est. Fuel" value={activeRoute.fuel} unit="MT" color="text-sky-400" />
                    <StatBox label="Est. Time" value={activeRoute.time} unit="Days" color="text-indigo-400" />
                    <StatBox label="Distance" value={activeRoute.distance} unit="NM" color="text-white" />
                    <StatBox label="Cost Est." value={`${(activeRoute.cost / 1000).toFixed(1)}k`} unit="$" color="text-emerald-400" />
                </div>

                {/* Environmental Conditions */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Enroute Conditions</h3>
                    <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                        <MetricBar
                            icon={<Wind className="w-3 h-3" />}
                            label="Wind Speed"
                            value={22}
                            unit="kts"
                            max={60}
                            color="bg-sky-500"
                        />
                        <MetricBar
                            icon={<Droplets className="w-3 h-3" />}
                            label="Swell Height"
                            value={3.5}
                            unit="m"
                            max={12}
                            color="bg-indigo-500"
                        />
                        <MetricBar
                            icon={<Navigation className="w-3 h-3" />}
                            label="Current"
                            value={1.2}
                            unit="kts"
                            max={5}
                            color="bg-emerald-500"
                        />
                    </div>
                </section>

                {/* Risk Assessment */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Risk Profile</h3>
                        {activeRoute.risk === 'LOW' ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                    </div>

                    <div className={`p-4 rounded-xl border-l-2 relative overflow-hidden ${activeRoute.risk === 'LOW'
                            ? 'bg-emerald-500/5 border-emerald-500'
                            : 'bg-amber-500/5 border-amber-500'
                        }`}>
                        <div className="relative z-10">
                            <p className={`text-sm font-black uppercase ${activeRoute.risk === 'LOW' ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                {activeRoute.risk} Risk Voyage
                            </p>
                            <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                                {activeRoute.risk === 'LOW'
                                    ? 'Environmental conditions are within optimal parameters. Piracy risk in sector 4 is negligible.'
                                    : 'Caution advised in Sector 7 due to high sea states. Traffic density near Suez requires reduced speed.'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* AI Insight */}
                <div className="p-4 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">AI Captain Insight</span>
                    </div>
                    <p className="text-[10px] text-indigo-100/70 leading-relaxed font-mono">
                        "Optimized route reduces fuel consumption by 4.2% by avoiding head currents south of Sri Lanka. Engine load projected to remain below 85%."
                    </p>
                </div>
            </div>
        </aside>
    );
}

function StatBox({ label, value, unit, color }) {
    return (
        <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex flex-col items-center justify-center text-center">
            <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">{label}</span>
            <div className={`text-lg font-black ${color} mt-1`}>
                {value}<span className="text-[10px] text-gray-500 font-normal ml-0.5">{unit}</span>
            </div>
        </div>
    );
}

function MetricBar({ icon, label, value, unit, max, color }) {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1.5 text-gray-400">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className="font-mono text-gray-200">{value} {unit}</span>
            </div>
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${color} rounded-full`}
                />
            </div>
        </div>
    );
}
