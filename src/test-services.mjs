
// src/test-services.js
// Standalone script to verify Service Layer connectivity
// Run with: node src/test-services.js

// Mocking fetch for Node.js environment if needed, or assuming Node 18+
// In older node, we might need node-fetch, but let's assume modern node or add a check.
if (!global.fetch) {
    console.log("Fetch not found, using simple mock or exiting. (Please run with Node 18+)");
}

/*
 Since we are using ES modules in the services, we need to load them via import().
 We'll create a simple async runner.
 */

async function runTests() {
    console.log("--- Starting Service Verification ---");

    try {
        // Dynamic imports because we are in a script that might be run as module or script
        // Note: The services use 'export' syntax. To run this file directly with 'node', 
        // the project package.json should have "type": "module" or use .mjs extension.
        // I will assume I can run this via `node` if type=module is set, checking package.json is good practice, 
        // but I'll write this file as .mjs to force module mode just in case.

        // However, I am writing to src/test-services.js. I'll stick to .js but use valid ESM if the project is ESM.
        // Let's check package.json first? No, let's just write a .mjs file to be safe.
        // Actually, the user asked for `src/test-services.js`. The project likely uses bundlers (Vite/Webpack).
        // If I run `node src/test-services.js` and it contains `import`, node will complain if package.json doesn't say "type": "module".
        // Use `create-react-app` or `vite` usually implies ESM.

        // I'll try to import the files.
        // NOTE: Relative paths for import() need to be correct.

        console.log("1. Testing WeatherService...");
        const WeatherService = await import('./services/WeatherService.js');
        const weather = await WeatherService.getMarineWeather(51.92, 4.48); // Rotterdam
        console.log("   Weather Result:", weather);
        if (weather.windSpeed !== undefined && weather.waveHeight !== undefined) {
            console.log("   ✅ WeatherService OK");
        } else {
            console.error("   ❌ WeatherService Failed format");
        }

        console.log("2. Testing OceanService...");
        const OceanService = await import('./services/OceanService.js');
        const ocean = await OceanService.getOceanConditions(51.92, 4.48);
        console.log("   Ocean Result:", ocean);
        if (ocean.currentSpeed !== undefined) {
            console.log("   ✅ OceanService OK");
        } else {
            console.error("   ❌ OceanService Failed format");
        }

        console.log("3. Testing PortService...");
        const PortService = await import('./services/PortService.js');
        const congestion = await PortService.getPortCongestion('Rotterdam');
        console.log("   Congestion Result:", congestion);
        if (typeof congestion === 'number') {
            console.log("   ✅ PortService OK");
        } else {
            console.error("   ❌ PortService Failed format");
        }

    } catch (error) {
        console.error("❌ Test Script Error:", error);
    }

    console.log("--- Verification Completed ---");
}

runTests();
