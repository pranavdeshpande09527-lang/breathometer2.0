import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

export default function AQIMap({ lat, lon, apiKey }) {
    if (!lat || !lon) return null;

    const center = [lat, lon];
    const zoom = 10;

    // OpenWeatherMap Air Pollution (AQI) tile URL
    // Endpoint: https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={API_KEY}
    // Layer options for AQI often use 'pm25' or 'aqi' depending on the API subscripting
    const aqiTileUrl = `https://tile.openweathermap.org/map/pm25/{z}/{x}/{y}.png?appid=${apiKey}`;

    return (
        <div className="w-full h-[300px] rounded-xl overflow-hidden shadow-lg border border-brand-terracotta/10 relative z-0 mt-2">
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={false}
                className="w-full h-full min-h-[300px]"
                style={{ height: '300px', width: '100%' }}
            >
                <ChangeView center={center} zoom={zoom} />

                {/* Standard Base Map */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* OpenWeatherMap PM2.5 / Pollution Overlay */}
                <TileLayer
                    attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
                    url={aqiTileUrl}
                    opacity={0.8}
                />

                {/* Center marker */}
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-none">
                    <span className="text-4xl filter drop-shadow-md pb-8">📍</span>
                </div>
            </MapContainer>

            {/* Legend Overlay */}
            <div className="absolute bottom-2 right-2 bg-surface-base0/90 backdrop-blur-md px-3 py-2 rounded-lg border border-brand-terracotta/20 z-[400] text-xs">
                <div className="font-bold text-white mb-1">PM2.5 Level Tracker</div>
                <div className="flex gap-1 h-2 w-32 rounded-full overflow-hidden">
                    <div className="bg-safe-500 flex-1"></div>
                    <div className="bg-warning-400 flex-1"></div>
                    <div className="bg-warning-500 flex-1"></div>
                    <div className="bg-danger-500 flex-1"></div>
                    <div className="bg-purple-600 flex-1"></div>
                </div>
                <div className="flex justify-between text-[10px] text-ink-muted mt-1">
                    <span>Low</span>
                    <span>High</span>
                </div>
            </div>
        </div>
    );
}
