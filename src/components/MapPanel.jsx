import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Ensure CSS is imported if possible, otherwise rely on global

export default function MapPanel({ voyage, activeRoute, alternativeRoutes, setActiveRoute }) {
    const mapContainerRef = useRef(null);
    const mapInstance = useRef(null);
    const layerGroup = useRef(null);

    // Fix Leaflet icons (Standard fix)
    useEffect(() => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (!mapInstance.current) {
            mapInstance.current = L.map(mapContainerRef.current, {
                center: [20, 70], // Centered roughly on Indian Ocean/Asia based on context
                zoom: 3,
                zoomControl: false,
                attributionControl: false
            });

            // Dark Matter Basemap for that "Sophisticated" look
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(mapInstance.current);

            L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

            layerGroup.current = L.layerGroup().addTo(mapInstance.current);

            // Force resize on load to prevent grey tiles
            setTimeout(() => {
                mapInstance.current?.invalidateSize();
            }, 100);
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Update Map Content
    useEffect(() => {
        if (!mapInstance.current || !layerGroup.current) return;

        layerGroup.current.clearLayers();

        // Markers
        if (voyage.origin && voyage.origin.lat) {
            const originIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: #0ea5e9; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px #0ea5e9; border: 2px solid white;"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });
            L.marker([voyage.origin.lat, voyage.origin.lon], { icon: originIcon })
                .bindPopup(`<b style="color:black">ORIGIN: ${voyage.origin.name}</b>`)
                .addTo(layerGroup.current);
        }

        if (voyage.destination && voyage.destination.lat) {
            const destIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px #10b981; border: 2px solid white;"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });
            L.marker([voyage.destination.lat, voyage.destination.lon], { icon: destIcon })
                .bindPopup(`<b style="color:black">DESTINATION: ${voyage.destination.name}</b>`)
                .addTo(layerGroup.current);
        }

        // Routes
        if (alternativeRoutes && alternativeRoutes.length > 0) {
            alternativeRoutes.forEach(route => {
                const isSelected = activeRoute && route.id === activeRoute.id;

                // Polyline
                const polyline = L.polyline(route.path, {
                    color: isSelected ? route.color : '#475569', // Selected color or slate-600
                    weight: isSelected ? 4 : 2,
                    opacity: isSelected ? 1 : 0.3,
                    dashArray: isSelected ? null : '5, 10' // Dashed for inactive
                }).addTo(layerGroup.current);

                polyline.on('click', () => setActiveRoute(route));

                // Tooltip/Popup
                polyline.bindTooltip(route.name, { sticky: true, direction: 'top' });
            });

            // Fit bounds to show all routes
            const group = new L.featureGroup(alternativeRoutes.map(r => L.polyline(r.path)));
            mapInstance.current.fitBounds(group.getBounds(), { padding: [50, 50] });
        } else if (voyage.origin.lat && voyage.destination.lat) {
            // If no routes but points exist, fit bounds to points
            const bounds = L.latLngBounds([
                [voyage.origin.lat, voyage.origin.lon],
                [voyage.destination.lat, voyage.destination.lon]
            ]);
            mapInstance.current.fitBounds(bounds, { padding: [100, 100] });
        }

    }, [activeRoute, alternativeRoutes, voyage, setActiveRoute]);

    return (
        <div className="flex-1 relative bg-[#020617] h-full w-full">
            <div ref={mapContainerRef} className="absolute inset-0 z-0" />

            {/* Overlay Gradient for depth */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#020617] to-transparent z-[1] pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#020617] to-transparent z-[1] pointer-events-none" />
        </div>
    );
}
