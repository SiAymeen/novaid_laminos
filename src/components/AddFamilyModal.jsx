import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { usePreferences } from '../context/PreferencesContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TUNISIA_CENTER = [34.0, 9.0];
const MAP_ZOOM = 6;

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

const NEEDS_OPTIONS = [
  { id: 'Alimentaire', labelKey: 'needs.food' },
  { id: 'Médical', labelKey: 'needs.medical' },
  { id: 'Vêtements', labelKey: 'needs.clothing' },
];

const emptyClothingRow = () => ({ type: 'Adulte', gender: 'M', age: '', size: '' });

function AddFamilyModal({ isOpen, onClose, onSave, initialData }) {
  const { t } = usePreferences();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [membersCount, setMembersCount] = useState(1);
  const [familyHistory, setFamilyHistory] = useState('');
  const [needs, setNeeds] = useState([]);
  const [medications, setMedications] = useState([]);
  const [medicationInput, setMedicationInput] = useState('');
  const [clothing, setClothing] = useState([]);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [error, setError] = useState('');

  const isEdit = Boolean(initialData?._id);
  const hasMedical = needs.includes('Médical');
  const hasClothing = needs.includes('Vêtements');

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setName(initialData.name || '');
      setAddress(initialData.address || '');
      setPhone(initialData.phone || '');
      setStatus(initialData.status || 'ACTIVE');
      setMembersCount(initialData.membersCount ?? 1);
      setFamilyHistory(initialData.familyHistory || '');
      setNeeds(Array.isArray(initialData.needs) ? [...initialData.needs] : []);
      const nd = initialData.needsDetails || {};
      setMedications(Array.isArray(nd.medications) ? [...nd.medications] : []);
      setMedicationInput('');
      setClothing(
        Array.isArray(nd.clothing) && nd.clothing.length > 0
          ? nd.clothing.map((c) => ({
              type: c.type || 'Adulte',
              gender: c.gender || 'M',
              age: c.age ?? '',
              size: c.size || '',
            }))
          : []
      );
      setCoordinates({
        lat: initialData.coordinates?.lat ?? null,
        lng: initialData.coordinates?.lng ?? null,
      });
    } else {
      setName('');
      setAddress('');
      setPhone('');
      setStatus('ACTIVE');
      setMembersCount(1);
      setFamilyHistory('');
      setNeeds([]);
      setMedications([]);
      setMedicationInput('');
      setClothing([]);
      setCoordinates({ lat: null, lng: null });
    }
    setError('');
  }, [isOpen, initialData]);

  const handleLocationSelect = ({ lat, lng }) => {
    setCoordinates({ lat, lng });
  };

  const toggleNeed = (needId) => {
    setNeeds((prev) =>
      prev.includes(needId) ? prev.filter((n) => n !== needId) : [...prev, needId]
    );
  };

  const addMedication = () => {
    const val = medicationInput.trim();
    if (!val) return;
    const parts = val.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      setMedications((prev) => [...prev, ...parts]);
      setMedicationInput('');
    }
  };

  const removeMedication = (index) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const addClothingRow = () => {
    setClothing((prev) => [...prev, emptyClothingRow()]);
  };

  const updateClothingRow = (index, field, value) => {
    setClothing((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeClothingRow = (index) => {
    setClothing((prev) => prev.filter((_, i) => i !== index));
  };
const generateFamilyStory = () => {
  const selectedNeeds = needs.length > 0 ? needs.join(', ') : 'aucun besoin spécifique';
  const familyName = name.trim() || 'cette famille';
  const familyAddress = address.trim() || 'une adresse non précisée';
  const familyPhone = phone.trim() || 'non renseigné';
  const members = Math.max(1, Number(membersCount) || 1);

  const story = `La famille ${familyName}, située à ${familyAddress}, est composée de ${members} membre(s). 
Elle est suivie par la plateforme NOVAID afin d’assurer un meilleur accompagnement social et humanitaire. 
Les besoins identifiés sont : ${selectedNeeds}. 
Le contact téléphonique renseigné est : ${familyPhone}. 
Le statut actuel de la famille est : ${status}. 
Cette description a été générée automatiquement afin d’aider les équipes à mieux comprendre le contexte de la famille et à prioriser les actions nécessaires.`;

  setFamilyHistory(story);
};

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError(t('families.nameRequired'));
      return;
    }
    
    const needsDetailsPayload = {};
    if (hasMedical) {
      const meds = medicationInput.trim()
        ? [...medications, ...medicationInput.split(',').map((s) => s.trim()).filter(Boolean)]
        : medications;
      needsDetailsPayload.medications = meds;
    }
    if (hasClothing) {
      needsDetailsPayload.clothing = clothing
        .filter((c) => c.type && c.gender)
        .map((c) => ({
          type: c.type,
          gender: c.gender,
          age: c.age === '' ? undefined : Number(c.age),
          size: c.size?.trim() || undefined,
        }));
    }

    const payload = {
      _id: isEdit ? initialData._id : undefined,
      id: isEdit ? initialData._id : undefined,
      name: name.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      status,
      membersCount: Math.max(1, Number(membersCount) || 1),
      familyHistory: familyHistory.trim() || undefined,
      needs,
      needsDetails: Object.keys(needsDetailsPayload).length > 0 ? needsDetailsPayload : undefined,
      coordinates: { lat: coordinates.lat, lng: coordinates.lng },
    };
    
    onSave?.(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center safe-area-modal">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="shrink-0 border-b border-slate-200 dark:border-slate-600 px-6 py-4 bg-white dark:bg-slate-800 rounded-t-xl z-10">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {isEdit ? t('modal.family.titleEdit') : t('modal.family.titleAdd')}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('modal.family.name')} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600"
              placeholder={t('families.addFamily')}
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('modal.family.address')}
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600"
              placeholder={t('modal.family.address')}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('modal.family.phone')}
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600"
              placeholder="+216 12 345 678"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('modal.family.status')}
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="STABLE">STABLE</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>
          <div>
            <label htmlFor="membersCount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('modal.family.members')}
            </label>
            <input
              id="membersCount"
              type="number"
              min={1}
              value={membersCount}
              onChange={(e) => setMembersCount(e.target.value)}
              className="w-full min-h-[44px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600"
            />
          </div>
          <div>
  <div className="flex items-center justify-between mb-2">
    <label htmlFor="familyHistory" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {t('modal.family.history')}
    </label>

    <button
      type="button"
      onClick={generateFamilyStory}
      className="px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60"
    >
      Générer l’histoire
    </button>
  </div>

  <textarea
    id="familyHistory"
    value={familyHistory}
    onChange={(e) => setFamilyHistory(e.target.value)}
    rows={5}
    className="w-full min-h-[120px] px-3 py-3 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 resize-none"
  />
</div>
          <div role="group" aria-labelledby="family-gps-label">
            <span id="family-gps-label" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('modal.family.gps')}
            </span>
            <div
              className="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-500"
              style={{ height: 250 }}
            >
              <MapContainer
                center={coordinates.lat != null ? [coordinates.lat, coordinates.lng] : TUNISIA_CENTER}
                zoom={MAP_ZOOM}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onLocationSelect={handleLocationSelect} />
                <MapInvalidateSize />
                {coordinates.lat != null && coordinates.lng != null && (
                  <Marker position={[coordinates.lat, coordinates.lng]} />
                )}
              </MapContainer>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {coordinates.lat != null && coordinates.lng != null
                ? `Position : ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
                : t('modal.family.gpsNone')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {t('modal.family.gpsHint')}
            </p>
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('modal.family.needs')}</span>
            <div className="space-y-2">
              {NEEDS_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={needs.includes(opt.id)}
                    onChange={() => toggleNeed(opt.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-slate-700"
                  />
                  {t(opt.labelKey)}
                </label>
              ))}
            </div>

            {hasMedical && (
              <div className="mt-4 p-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('modal.family.meds')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={medicationInput}
                    onChange={(e) => setMedicationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={t('modal.family.medsPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={addMedication}
                    className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-lg"
                  >
                    {t('modal.family.add')}
                  </button>
                </div>
                {medications.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {medications.map((med, i) => (
                      <li
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm"
                      >
                        {med}
                        <button
                          type="button"
                          onClick={() => removeMedication(i)}
                          className="text-red-600 dark:text-red-400"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {hasClothing && (
              <div className="mt-4 p-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('modal.family.clothingDetails')}</span>
                  <button
                    type="button"
                    onClick={addClothingRow}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-lg"
                  >
                    ➕ {t('modal.family.add')}
                  </button>
                </div>
                <div className="space-y-2">
                  {clothing.map((row, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center gap-2 p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                    >
                      <select
                        value={row.type}
                        onChange={(e) => updateClothingRow(index, 'type', e.target.value)}
                        className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100 rounded"
                      >
                        <option value="Enfant">{t('modal.family.child')}</option>
                        <option value="Adulte">{t('modal.family.adult')}</option>
                      </select>
                      <select
                        value={row.gender}
                        onChange={(e) => updateClothingRow(index, 'gender', e.target.value)}
                        className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100 rounded"
                      >
                        <option value="M">{t('modal.family.male')}</option>
                        <option value="F">{t('modal.family.female')}</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        placeholder={t('modal.family.age')}
                        value={row.age}
                        onChange={(e) => updateClothingRow(index, 'age', e.target.value)}
                        className="w-16 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100 rounded"
                      />
                      <input
                        type="text"
                        placeholder={t('modal.family.sizeOptional')}
                        value={row.size}
                        onChange={(e) => updateClothingRow(index, 'size', e.target.value)}
                        className="w-24 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeClothingRow(index)}
                        className="p-1.5 text-red-600 dark:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
          
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-600 px-6 py-4 bg-white dark:bg-slate-800 rounded-b-xl">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[44px] px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[44px] px-4 py-3 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFamilyModal;
