
// src/services/PortService.js

/**
 * PortService
 * Estimates port congestion.
 * Since we don't have a real-time AIS density feed, we'll simulate based on known busy ports.
 */

const BUSY_PORTS = {
    'Singapore': 0.8,
    'Shanghai': 0.9,
    'Rotterdam': 0.6,
    'Los Angeles': 0.7
};

export async function getPortCongestion(portName) {
    // Simulate async fetch
    return new Promise(resolve => {
        setTimeout(() => {
            const congestion = BUSY_PORTS[portName] || 0.2; // Default low congestion
            // Add some noise
            resolve(Math.min(1, Math.max(0, congestion + (Math.random() * 0.2 - 0.1))));
        }, 200);
    });
}
