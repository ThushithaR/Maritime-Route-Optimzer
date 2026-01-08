
// src/services/RiskService.js

/**
 * RiskService
 * Manages Piracy Risk and ECA/SECA Zones.
 * These are often defined by static polygons rather than live streams,
 * though piracy can be live. We will use static zones for MVP.
 */

import { getPiracyRiskLevel } from '../data/imb_piracy.js';

// Simple bounding boxes for demo [minLat, minLon, maxLat, maxLon]
// We still keep these for general awareness, but specific risk is now data-driven
const HIGH_RISK_ZONES = [
    { name: 'Gulf of Aden', bounds: [10, 43, 15, 52] },
    { name: 'Gulf of Guinea', bounds: [0, -5, 6, 10] }
];

const ECA_ZONES = [
    { name: 'North Sea ECA', bounds: [50, -5, 62, 10] }, // Rough approx
    { name: 'Baltic Sea ECA', bounds: [53, 10, 66, 30] },
    { name: 'North American ECA', bounds: [25, -130, 50, -60] }
];

// Helper function to check if coordinates are in ECA zone
function isECA(lat, lon) {
    return ECA_ZONES.some(zone =>
        lat >= zone.bounds[0] && lat <= zone.bounds[2] &&
        lon >= zone.bounds[1] && lon <= zone.bounds[3]
    );
}

export function getRiskAssessment(lat, lon) {
    // Check Piracy (Data-Driven from IMB Incidents)
    const riskLevel = getPiracyRiskLevel(lat, lon);
    
    // Fallback to zone check if data doesn't cover it (optional, but good for safety)
    const zoneRisk = HIGH_RISK_ZONES.some(zone =>
        lat >= zone.bounds[0] && lat <= zone.bounds[2] &&
        lon >= zone.bounds[1] && lon <= zone.bounds[3]
    );

    // Determine piracy risk level
    let piracyRisk;
    if (riskLevel === 2 || zoneRisk) {
        piracyRisk = 'HIGH';
    } else if (riskLevel === 1) {
        piracyRisk = 'MEDIUM';
    } else {
        piracyRisk = 'LOW';
    }

    return {
        piracy: piracyRisk,
        eca: isECA(lat, lon)
    };
}
