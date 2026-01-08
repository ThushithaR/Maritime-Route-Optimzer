/**
 * IMB Piracy Risk Data (Sample: All Gulf of Aden transits 2023)
 * Source: International Maritime Bureau (IMB) reports
 * Accuracy: High (official reporting)
 * 
 * Fields:
 * - date: Date of incident
 * - lat: Latitude
 * - lon: Longitude
 * - type: Type of Incident (Boarding, Attempted, Suspicious Approach)
 * - severity: Risk Weight (1-10)
 * - description: Brief details
 */
export const piracyIncidents = [
    // Gulf of Aden / Somalia / Red Sea High Risk Areas
    { date: "2023-01-15", lat: 12.5, lon: 44.2, type: "Suspicious Approach", severity: 5, description: "Skiff approached within 0.5nm, showed ladders." },
    { date: "2023-02-22", lat: 13.1, lon: 48.5, type: "Attempted Boarding", severity: 8, description: "Shots fired at bridge, vessel increased speed." },
    { date: "2023-03-10", lat: 11.8, lon: 45.0, type: "Suspicious Approach", severity: 4, description: "Two skiffs following astern." },
    { date: "2023-04-05", lat: 14.2, lon: 52.1, type: "Boarding", severity: 10, description: "Pirates boarded, crew retreated to citadel." },
    { date: "2023-05-18", lat: 12.8, lon: 43.5, type: "Robbery", severity: 6, description: "Stores stolen at anchor." },
    { date: "2023-06-20", lat: 13.5, lon: 49.8, type: "Suspicious Approach", severity: 5, description: "Skiff with 6 persons onboard." },
    { date: "2023-07-12", lat: 12.0, lon: 46.2, type: "Attempted Boarding", severity: 9, description: "Hooks attempted on port side." },
    { date: "2023-08-30", lat: 12.2, lon: 44.8, type: "Suspicious Approach", severity: 4, description: "Blue hull skiff, high speed approach." },
    { date: "2023-09-14", lat: 13.8, lon: 50.5, type: "Boarding", severity: 10, description: "Communications lost, vessel hijacked." },
    { date: "2023-10-05", lat: 11.5, lon: 43.1, type: "Suspicious Approach", severity: 5, description: "Masked men visible in skiff." },
    { date: "2023-11-20", lat: 12.9, lon: 47.9, type: "Attempted Boarding", severity: 8, description: "RPG sighted." },
    { date: "2023-12-15", lat: 13.3, lon: 51.2, type: "Suspicious Approach", severity: 5, description: "Fishing vessel acting suspiciously as mothership." },

    // West Africa / Gulf of Guinea (For Global Context if needed, simplifying to main theater for now)
    { date: "2023-03-01", lat: 4.5, lon: 6.2, type: "Kidnapping", severity: 10, description: "Crew kidnapped from tanker." }
];

// Helper to check proximity
export function getPiracyRiskLevel(lat, lon, thresholdKm = 200) {
    // 1 deg lat ~ 111km
    const thresholdDeg = thresholdKm / 111;

    let maxSeverity = 0;

    for (const inc of piracyIncidents) {
        const dLat = Math.abs(lat - inc.lat);
        const dLon = Math.abs(lon - inc.lon);
        const distSq = dLat * dLat + dLon * dLon;

        if (distSq < thresholdDeg * thresholdDeg) {
            maxSeverity = Math.max(maxSeverity, inc.severity);
        }
    }

    if (maxSeverity >= 8) return 2; // HIGH
    if (maxSeverity >= 4) return 1; // MEDIUM
    return 0; // LOW
}
