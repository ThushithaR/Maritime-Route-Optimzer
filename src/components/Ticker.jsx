import React from 'react';
import { AlertTriangle, Wifi, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Ticker() {
    return (
        <div className="h-12 bg-[#020617] border-t border-white/5 flex items-center px-4 gap-4 z-20 flex-shrink-0">
            {/* System Status Label */}
            <div className="flex items-center gap-2 pr-4 border-r border-white/10 h-6">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                    <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">Live Feed</span>
                </div>
            </div>

            {/* Scrolling Ticker */}
            <div className="flex-1 overflow-hidden relative mask-linear-fade">
                <motion.div
                    className="flex items-center gap-12 whitespace-nowrap"
                    animate={{ x: [0, -1000] }}
                    transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                >
                    <TickerItem type="WEATHER" msg="Severe Cyclonic Storm 'ASNA' developing in Arabian Sea. Avoid Sector 4B." color="text-rose-400" bg="bg-rose-500/10" />
                    <TickerItem type="MARKET" msg="Bunker prices in Singapore up 2.4% to $650/MT." color="text-emerald-400" bg="bg-emerald-500/10" />
                    <TickerItem type="TRAFFIC" msg="Suez Canal Southbound Convoy delayed by 4 hours due to fog." color="text-amber-400" bg="bg-amber-500/10" />
                    <TickerItem type="PORT" msg="Mumbai Port Trust: Berth 4 maintenance scheduled for 12th Jan." color="text-sky-400" bg="bg-sky-500/10" />
                    <TickerItem type="PIRACY" msg="Gulf of Guinea: Suspicious skiff reported at 04°12'N 006°34'E." color="text-rose-400" bg="bg-rose-500/10" />
                </motion.div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 pl-4 border-l border-white/10 h-6">
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-mono text-emerald-500 opacity-60">12ms Latency</span>
            </div>
        </div>
    );
}

function TickerItem({ type, msg, color, bg }) {
    return (
        <div className="flex items-center gap-3">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${color} ${bg} border border-current opacity-30`}>{type}</span>
            <span className="text-xs font-mono text-gray-400 uppercase tracking-tight">{msg}</span>
        </div>
    );
}
