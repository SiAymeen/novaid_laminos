import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../utils/api';

const ALLOWED_RADIUS_METERS = 500;

const STEP = {
  LOADING_VISIT: 'loading_visit',
  GETTING_POSITION: 'getting_position',
  POSITION_FOUND: 'position_found',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  ERROR: 'error',
};

const USER_LOCATION = { lat: 36.8065, lng: 10.1815 };

// Calculate distance between two GPS coordinates in meters
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

function VisitCheckin({ toggleTheme, isDark }) {
  const { t } = usePreferences();
  const { id } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEP.LOADING_VISIT);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [proofPhoto, setProofPhoto] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [missionData, setMissionData] = useState(null);

  useEffect(() => {
    apiFetch(`/api/visits/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(t('visitCheckin.notFound'));
        return res.json();
      })
      .then((visit) => {
        setMissionData({
          id: visit.id,
          family: visit.familyName || 'Famille',
          address: visit.familyAddress || '',
          lat: visit.familyLatitude,
          lng: visit.familyLongitude,
        });
        setStep(STEP.GETTING_POSITION);
      })
      .catch(() => {
        setError(t('visitCheckin.notFound'));
        setStep(STEP.ERROR);
      });
  }, [id]);

  useEffect(() => {
    if (step !== STEP.GETTING_POSITION || !missionData) return;

    // Get real user position using browser geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (geolocationPos) => {
          const userLat = geolocationPos.coords.latitude;
          const userLng = geolocationPos.coords.longitude;

          setPosition({ lat: userLat, lng: userLng });
          
          // Calculate real distance
          const dist = calculateDistance(userLat, userLng, missionData.lat, missionData.lng);
          setDistanceMeters(dist);

          setStep(STEP.POSITION_FOUND);
        },
        (err) => {
          // Fallback: Use default Tunis location if geolocation denied
          console.warn('Geolocation error:', err);
          setPosition(USER_LOCATION);
          const dist = calculateDistance(USER_LOCATION.lat, USER_LOCATION.lng, missionData.lat, missionData.lng);
          setDistanceMeters(dist);
          setStep(STEP.POSITION_FOUND);
        }
      );
    } else {
      // Geolocation not supported - use default Tunis location
      setPosition(USER_LOCATION);
      const dist = calculateDistance(USER_LOCATION.lat, USER_LOCATION.lng, missionData.lat, missionData.lng);
      setDistanceMeters(dist);
      setStep(STEP.POSITION_FOUND);
    }
  }, [step, missionData]);

  const handleProofPhotoChange = (e) => {
  const file = e.target.files?.[0];
  if (file) {
    setSelectedFile(file);
    setProofPhoto(URL.createObjectURL(file));
  }
};

 const handleValidate = async () => {
  setStep(STEP.SUBMITTING);

  const res = await apiFetch(`/api/visits/${id}/checkin`, {
    method: 'POST',
    body: JSON.stringify({ latitude: position.lat, longitude: position.lng }),
  });

  if (res && res.ok) {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('token');
      await fetch(`/api/visits/${id}/proof-photo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
    }

    setStep(STEP.SUCCESS);
    setTimeout(() => navigate('/missions', { replace: true }), 2000);
  } else {
    setStep(STEP.POSITION_FOUND);
    setError(t('visitCheckin.tooFar'));
  }
};

  const distance = distanceMeters;
  const withinRadius = distance != null && distance <= ALLOWED_RADIUS_METERS;
  const canValidate = withinRadius;

  // Format distance for display
  const formatDistance = (meters) => {
    if (meters == null) return '—';
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <AppNavbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 max-w-md w-full relative overflow-hidden">
          
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('visitCheckin.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            {t('visitCheckin.subtitle')}
          </p>

          {step === STEP.LOADING_VISIT && (
            <div className="text-center py-6">
              <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading"></div>
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">{t('visitCheckin.loadingFile')}</p>
            </div>
          )}

          {step === STEP.GETTING_POSITION && (
            <div className="text-center py-6">
              <div className="animate-pulse flex justify-center items-center gap-2 mb-4 text-amber-500">
                <span className="text-3xl">📍</span>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">{t('visitCheckin.searchingGps')}</p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden position-relative">
                 <div className="bg-blue-600 h-2 rounded-full absolute top-0 left-0 animate-[ping_2s_ease-in-out_infinite]" style={{width: '20%'}}></div>
              </div>
            </div>
          )}

          {step === STEP.POSITION_FOUND && position && missionData && (
            <div className="animate-fade-in text-left">
              <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-600">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('visitCheckin.mission')}</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{missionData.family}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{missionData.address}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-mono space-y-2.5 text-slate-700 dark:text-slate-300 mb-6">
                <p className="flex justify-between border-b pb-2 border-slate-200 dark:border-slate-600">
                  <span className="text-slate-500 dark:text-slate-400">📍 {t('visitCheckin.target')}</span> 
                  <span>[{missionData.lat.toFixed(4)}, {missionData.lng.toFixed(4)}]</span>
                </p>
                <p className="flex justify-between border-b pb-2 border-slate-200 dark:border-slate-600">
                  <span className="text-slate-500 dark:text-slate-400">🚶 {t('visitCheckin.myPosition')}</span> 
                  <span>[{position.lat.toFixed(4)}, {position.lng.toFixed(4)}]</span>
                </p>
                <p className="flex justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">📏 {t('visitCheckin.distance')}</span> 
                  <span className={withinRadius ? "text-green-600 dark:text-green-400" : "text-red-500"}>{formatDistance(distanceMeters)}</span>
                </p>
              </div>

              {withinRadius ? (
                <div className="mb-6 p-4 flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/60 rounded-xl">
                  <span aria-hidden className="text-xl">✅</span>
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">{t('visitCheckin.excellent')}</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 p-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl">
                    <span aria-hidden className="text-xl">⚠️</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">{t('visitCheckin.tooFar')}</p>
                  </div>
                </>
              )}

              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {t('visitCheckin.photoOptional')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {t('visitCheckin.photoHelp')}
                </p>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 transition cursor-pointer group">
                  {proofPhoto ? (
                    <img src={proofPhoto} alt="Aperçu" className="max-h-32 rounded shadow-sm" />
                  ) : (
                    <>
                      <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📷</span>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('visitCheckin.addPhoto')}</span>
                    </>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleProofPhotoChange} />
                </label>
              </div>

              <button
                type="button"
                onClick={handleValidate}
                disabled={!canValidate}
                className={`w-full min-h-[48px] py-3.5 px-4 font-semibold text-sm rounded-xl shadow-sm transition-all flex justify-center items-center gap-2 ${
                  canValidate
                    ? 'text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 hover:-translate-y-0.5'
                    : 'text-slate-400 bg-slate-200 dark:bg-slate-700 cursor-not-allowed opacity-70'
                }`}
              >
                {t('visitCheckin.validate')}
              </button>
            </div>
          )}

          {step === STEP.SUBMITTING && (
            <div className="text-center py-8 animate-fade-in">
              <div className="animate-spin inline-block w-10 h-10 border-[4px] border-current border-t-transparent text-blue-600 rounded-full" role="status"></div>
              <p className="mt-4 text-base font-semibold text-slate-700 dark:text-slate-300">{t('visitCheckin.saving')}</p>
            </div>
          )}

          {step === STEP.ERROR && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">❌</span>
              </div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {step === STEP.SUCCESS && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">{t('visitCheckin.success')}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t('visitCheckin.redirecting')}</p>
            </div>
          )}

          <Link
            to="/missions"
            className="mt-6 block text-center min-h-[44px] flex items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            {t('visitCheckin.back')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VisitCheckin;
