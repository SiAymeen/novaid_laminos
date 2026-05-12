import 'leaflet/dist/leaflet.css';
import '../utils/leaflet-heat-init.js';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import HeatmapLayer from '../components/maps/HeatmapLayer.jsx';
import UserLocationMarker from '../components/maps/UserLocationMarker.jsx';
import AppNavbar from '../components/AppNavbar.jsx';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../utils/api';

// Fix Leaflet icons issue when using bundlers like Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create custom colored icons for markers
const createColoredIcon = (color) => {
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
    <circle cx="16" cy="16" r="10" fill="${color}" stroke="white" stroke-width="2"/>
  </svg>`;
  
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20],
    className: 'custom-marker'
  });
};

const redIcon = createColoredIcon('#f04e4e');
const greenIcon = createColoredIcon('#22c87a');

const TUNISIA_CENTER = [34.0, 9.0];
const DEFAULT_ZOOM = 5;


function StatusBadge({ status, t }) {
  const isUrgent = status === 'URGENT';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isUrgent ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200' : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
      }`}
    >
      {isUrgent ? t('status.urgent') : t('status.ok')}
    </span>
  );
}

function Map({ toggleTheme, isDark }) {
  const { t } = usePreferences();
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [families, setFamilies] = useState([]);

  useEffect(() => {
    let isMounted = true;
    apiFetch('/api/families')
      .then((res) => {
        if (!res || !res.ok) return;
        return res.json();
      })
      .then((data) => {
        if (!isMounted || !data) return;
        const mapped = data
          .filter((f) => f.latitude != null && f.longitude != null)
          .map((f) => ({
            _id: String(f.id),
            name: f.headName,
            location: f.address,
            status: f.urgencyIndex >= 7 ? 'URGENT' : 'OK',
            coordinates: { lat: f.latitude, lng: f.longitude },
          }));
        setFamilies(mapped);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const count = families.length;
  const familiesLabel = t('map.familiesGeo', { count });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppNavbar activeRoute="map" toggleTheme={toggleTheme} isDark={isDark} />
      
      <div className="px-4 py-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600 flex justify-end">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {familiesLabel}
        </span>
      </div>
      
      <div className="relative w-full shrink-0 flex-1" style={{ minHeight: 400 }}>
        <button
          type="button"
          onClick={() => setShowHeatmap((v) => !v)}
          className="absolute top-2 right-2 z-[1000] inline-flex items-center gap-2 min-h-[44px] rounded-lg bg-slate-900 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-slate-800 transition"
        >
          <span aria-hidden>🔥</span> {showHeatmap ? t('map.hideHeatmap') : t('map.showHeatmap')}
        </button>
        
        <MapContainer
          center={TUNISIA_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {showHeatmap && <HeatmapLayer families={families} />}
          <UserLocationMarker />
          
          {families.map((family) => (
            <Marker
              key={family._id}
              position={[family.coordinates.lat, family.coordinates.lng]}
              icon={family.status === 'URGENT' ? redIcon : greenIcon}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{family.name}</p>
                  <div className="mb-2">
                    <StatusBadge status={family.status} t={t} />
                  </div>
                  <Link
                    to={`/families/${family._id}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center mt-2"
                  >
                    {t('map.viewFile')}
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default Map;
