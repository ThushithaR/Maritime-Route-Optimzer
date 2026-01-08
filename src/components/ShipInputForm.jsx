import React from 'react';

export default function ShipInputForm({ inputs, setInputs, onSimulate }) {
    const handleChange = (category, field, value) => {
        setInputs(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }));
    };

    return (
        <div className="w-[420px] h-full bg-[#0a0f1e] flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5">
                <h1 className="text-2xl font-light text-white tracking-tight">Vessel Configuration</h1>
                <p className="text-sm text-gray-500 mt-1">{inputs.voyage.origin} → {inputs.voyage.destination}</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-12 custom-scrollbar">

                {/* SECTION 1: VESSEL SPECIFICATIONS */}
                <section className="space-y-6">
                    <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold pb-3 border-b border-white/5">
                        Vessel Specifications
                    </h2>

                    <div className="space-y-4">
                        <Field label="Ship Type">
                            <select
                                value={inputs.identity.type}
                                onChange={(e) => handleChange('identity', 'type', e.target.value)}
                                className="input-clean"
                            >
                                <option>Container Ship</option>
                                <option>Bulk Carrier</option>
                                <option>VLCC</option>
                                <option>LNG Carrier</option>
                            </select>
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Length (m)">
                                <input
                                    type="number"
                                    value={inputs.identity.loa}
                                    onChange={(e) => handleChange('identity', 'loa', parseFloat(e.target.value))}
                                    className="input-clean"
                                />
                            </Field>
                            <Field label="Beam (m)">
                                <input
                                    type="number"
                                    value={inputs.identity.beam}
                                    onChange={(e) => handleChange('identity', 'beam', parseFloat(e.target.value))}
                                    className="input-clean"
                                />
                            </Field>
                        </div>

                        <Field label="Deadweight Tonnage (MT)">
                            <input
                                type="number"
                                value={inputs.identity.dwt}
                                onChange={(e) => handleChange('identity', 'dwt', parseFloat(e.target.value))}
                                className="input-clean"
                            />
                        </Field>

                        <Field label="Vessel Age (Years)">
                            <input
                                type="number"
                                value={inputs.hull.age}
                                onChange={(e) => handleChange('hull', 'age', parseFloat(e.target.value))}
                                className="input-clean"
                            />
                        </Field>

                        <Field label="Hull Condition Index">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={inputs.hull.hullIndex}
                                onChange={(e) => handleChange('hull', 'hullIndex', parseFloat(e.target.value))}
                                className="input-clean"
                            />
                            <p className="text-xs text-gray-600 mt-1">0.0 = Poor, 1.0 = Excellent</p>
                        </Field>
                    </div>
                </section>

                {/* SECTION 2: PROPULSION & PERFORMANCE */}
                <section className="space-y-6">
                    <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold pb-3 border-b border-white/5">
                        Propulsion & Performance
                    </h2>

                    <div className="space-y-4">
                        <Field label="Engine Type">
                            <select
                                value={inputs.propulsion.engineType}
                                onChange={(e) => handleChange('propulsion', 'engineType', e.target.value)}
                                className="input-clean"
                            >
                                <option>2-Stroke Diesel</option>
                                <option>4-Stroke Dual Fuel</option>
                                <option>Steam Turbine</option>
                            </select>
                        </Field>

                        <Field label="Max Continuous Rating (kW)">
                            <input
                                type="number"
                                value={inputs.propulsion.mcr}
                                onChange={(e) => handleChange('propulsion', 'mcr', parseFloat(e.target.value))}
                                className="input-clean"
                            />
                        </Field>

                        <Field label="Fuel Type">
                            <select
                                value={inputs.propulsion.fuelType}
                                onChange={(e) => handleChange('propulsion', 'fuelType', e.target.value)}
                                className="input-clean"
                            >
                                <option>VLSFO</option>
                                <option>HFO</option>
                                <option>MGO</option>
                                <option>LNG</option>
                            </select>
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="SFC (g/kWh)">
                                <input
                                    type="number"
                                    value={inputs.propulsion.sfc}
                                    onChange={(e) => handleChange('propulsion', 'sfc', parseFloat(e.target.value))}
                                    className="input-clean"
                                />
                            </Field>
                            <Field label="Fuel Price ($/MT)">
                                <input
                                    type="number"
                                    value={inputs.propulsion.fuelPrice}
                                    onChange={(e) => handleChange('propulsion', 'fuelPrice', parseFloat(e.target.value))}
                                    className="input-clean"
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Design Speed (kn)">
                                <input
                                    type="number"
                                    value={inputs.speed.designSpeed}
                                    onChange={(e) => handleChange('speed', 'designSpeed', parseFloat(e.target.value))}
                                    className="input-clean"
                                />
                            </Field>
                            <Field label="Eco Speed (kn)">
                                <input
                                    type="number"
                                    value={inputs.speed.ecoSpeed}
                                    onChange={(e) => handleChange('speed', 'ecoSpeed', parseFloat(e.target.value))}
                                    className="input-clean"
                                />
                            </Field>
                            <Field label="Max Speed (kn)">
                                <input
                                    type="number"
                                    value={inputs.speed.maxSafeSpeed}
                                    onChange={(e) => handleChange('speed', 'maxSafeSpeed', parseFloat(e.target.value))}
                                    className="input-clean"
                                />
                            </Field>
                        </div>
                    </div>
                </section>

                {/* SECTION 3: OPERATIONAL PARAMETERS */}
                <section className="space-y-6">
                    <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold pb-3 border-b border-white/5">
                        Operational Parameters
                    </h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Draft (m)">
                                <input
                                    type="number"
                                    value={inputs.loading.draft}
                                    onChange={(e) => handleChange('loading', 'draft', parseFloat(e.target.value))}
                                    className="input-clean"
                                />
                            </Field>
                            <Field label="Cargo Load (%)">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={Math.round(inputs.loading.loadPercent * 100)}
                                    onChange={(e) => handleChange('loading', 'loadPercent', parseFloat(e.target.value) / 100)}
                                    className="input-clean"
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Max Wave Height (m)">
                                <input
                                    type="number"
                                    step="0.5"
                                    value={inputs.rules.maxWave}
                                    onChange={(e) => handleChange('rules', 'maxWave', parseFloat(e.target.value))}
                                    className="input-clean"
                                />
                            </Field>
                            <Field label="Max Wind Speed (kn)">
                                <input
                                    type="number"
                                    value={inputs.rules.maxWind}
                                    onChange={(e) => handleChange('rules', 'maxWind', parseFloat(e.target.value))}
                                    className="input-clean"
                                />
                            </Field>
                        </div>

                        <Field label="Fuel Budget (MT)">
                            <input
                                type="number"
                                value={inputs.voyage.fuelBudget}
                                onChange={(e) => handleChange('voyage', 'fuelBudget', parseFloat(e.target.value))}
                                className="input-clean"
                            />
                        </Field>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Trade Route</label>
                            <select
                                value={`${inputs.voyage.origin}-${inputs.voyage.destination}`}
                                onChange={(e) => {
                                    const [origin, destination] = e.target.value.split('-');
                                    handleChange('voyage', 'origin', origin);
                                    handleChange('voyage', 'destination', destination);
                                }}
                                className="w-full px-4 py-3 bg-[#0a0f1e]/80 border border-white/10 rounded-lg text-white focus:border-sky-500 focus:outline-none transition-colors"
                            >
                                <option value="Rotterdam-Shanghai">Rotterdam → Shanghai</option>
                                <option value="Singapore-Rotterdam">Singapore → Rotterdam</option>
                                <option value="Los Angeles-Tokyo">Los Angeles → Tokyo</option>
                                <option value="Shanghai-Los Angeles">Shanghai → Los Angeles</option>
                                <option value="Dubai-New York">Dubai → New York</option>
                                <option value="Hamburg-Santos">Hamburg → Santos (Brazil)</option>
                                <option value="Hong Kong-Hamburg">Hong Kong → Hamburg</option>
                            </select>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer - Sticky */}
            <div className="px-8 py-6 border-t border-white/5 bg-[#0a0f1e] sticky bottom-0 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-10">
                <button
                    onClick={onSimulate}
                    className="w-full py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                    Show Trade Routes
                </button>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-400">{label}</label>
            {children}
        </div>
    );
}
