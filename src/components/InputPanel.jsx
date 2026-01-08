import React from 'react';
import { Anchor, Navigation, Calendar, Database, Activity, Package, Battery, Ship } from 'lucide-react';

export default function InputPanel({ shipSpecs, setShipSpecs, voyage, setVoyage, onGenerate, isOptimizing }) {

    const handleChange = (field, value) => {
        setShipSpecs(prev => ({ ...prev, [field]: value }));
    };

    const handleVoyageChange = (field, value) => {
        setVoyage(prev => ({ ...prev, [field]: value }));
    };

    return (
        <aside className="w-[320px] bg-[#020617] border-r border-white/5 flex flex-col h-full z-10">
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 flex-1">

                {/* Header */}
                <div className="flex items-center gap-2 mb-6 opacity-80">
                    <Ship className="w-5 h-5 text-sky-400" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">Mission Control</h2>
                </div>

                {/* Section: Vessel Config */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-sky-400">
                        <Anchor className="w-4 h-4" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Vessel Manifest</h3>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Vessel Name</label>
                            <input
                                type="text"
                                value={shipSpecs.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder="e.g. EVER GIVEN"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Type</label>
                                <select
                                    value={shipSpecs.type}
                                    onChange={(e) => handleChange('type', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                                >
                                    <option>Container Ship</option>
                                    <option>Bulk Carrier</option>
                                    <option>Oil Tanker</option>
                                    <option>LNG Carrier</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Age (Yrs)</label>
                                <input
                                    type="number"
                                    value={shipSpecs.age}
                                    onChange={(e) => handleChange('age', parseInt(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Cargo Details</label>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Type (e.g. Electronics)"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                                />
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={shipSpecs.dwt}
                                        onChange={(e) => handleChange('dwt', parseInt(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                                    />
                                    <span className="absolute right-2 top-2 text-[10px] text-gray-500">DWT</span>
                                </div>
                            </div>
                        </div>

                        {/* Technical Ops */}
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5 space-y-3">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Activity className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase">Technical Status</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-gray-500">Engine Health</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${shipSpecs.engineHealth}%` }} />
                                        </div>
                                        <span className="text-[10px] font-mono text-emerald-400">{shipSpecs.engineHealth}%</span>
                                    </div>
                                    <input
                                        type="range" min="50" max="100"
                                        value={shipSpecs.engineHealth}
                                        onChange={(e) => handleChange('engineHealth', parseInt(e.target.value))}
                                        className="w-full h-1 mt-2 appearance-none bg-white/10 rounded-full cursor-pointer thumb-sky"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500">Fuel Reserves</label>
                                    <div className="relative mt-1">
                                        <input
                                            type="number"
                                            value={shipSpecs.fuel}
                                            onChange={(e) => handleChange('fuel', parseInt(e.target.value))}
                                            className="w-full bg-gray-900 border border-white/10 rounded px-2 py-1 text-xs text-white text-right"
                                        />
                                        <span className="absolute left-2 top-1.5 text-[10px] text-gray-500">MT</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Voyage Config */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-sky-400">
                        <Navigation className="w-4 h-4" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Route Parameters</h3>
                    </div>

                    <div className="grid gap-4">
                        <div className="relative group">
                            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Origin Port</label>
                            <input
                                type="text"
                                value={voyage.origin.name}
                                onChange={(e) => handleVoyageChange('origin', { ...voyage.origin, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                            <div className="absolute right-3 top-7 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>

                        <div className="relative group">
                            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Destination Port</label>
                            <select
                                value={voyage.destination.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Logic to update lat/lon would be in parent, handling strict name update here 
                                    // For now passing string, parent deals with coords
                                    handleVoyageChange('destination', { ...voyage.destination, name: val })
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                                <option>Mumbai, IN</option>
                                <option>Singapore, SG</option>
                                <option>Shanghai, CN</option>
                                <option>Tokyo, JP</option>
                                <option>New York, US</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Priority Strategy</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Fuel Efficiency', 'Minimal Time', 'Lowest Risk', 'Balanced'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => handleVoyageChange('optimizationPref', opt)}
                                        className={`px-2 py-2 rounded-lg text-[10px] font-bold border transition-all ${voyage.optimizationPref === opt
                                                ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onGenerate}
                        disabled={isOptimizing}
                        className="w-full py-4 bg-gradient-to-r from-sky-600 to-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg shadow-sky-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isOptimizing ? (
                            <>
                                <Database className="w-4 h-4 animate-spin" />
                                <span>Calculating...</span>
                            </>
                        ) : (
                            <>
                                <Navigation className="w-4 h-4" />
                                <span>Initiate Simulation</span>
                            </>
                        )}
                    </button>
                </section>
            </div>
        </aside>
    );
}
