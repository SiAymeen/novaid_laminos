import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Edit2, Trash2 } from 'lucide-react';
import AddFamilyModal from '../components/AddFamilyModal';
import AppNavbar from '../components/AppNavbar';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../utils/api';

// --- STATUS BADGE WITH NEW DESIGN ---
function StatusBadge({ status, t }) {
  const isUrgent = status === 'URGENT';
  
  return (
    <div className={`badge badge-${isUrgent ? 'urgent' : 'stable'}`}>
      <span className={`badge-dot ${isUrgent ? 'pulse' : ''}`} />
      {isUrgent ? t('status.urgent') : t('status.stable')}
    </div>
  );
}

function FamilyManagement({ toggleTheme, isDark }) {
  const { t } = usePreferences();
  const apiBaseUrl = '/api/families';
  const [families, setFamilies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [familyToEdit, setFamilyToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const mapResponseToFamily = (family) => {
    const urgencyIndex = family.urgencyIndex ?? 0;
    return {
      id: family.id,
      _id: family.id,
      name: family.headName,
      address: family.address,
      status: urgencyIndex >= 7 ? 'URGENT' : 'STABLE',
      needs: family.needs || [],
      urgencyIndex,
      coordinates: {
        lat: family.latitude ?? null,
        lng: family.longitude ?? null,
      },
    };
  };

  const statusToUrgency = (status) => {
    if (status === 'URGENT') return 8;
    if (status === 'STABLE') return 4;
    return 2;
  };

  const buildRequest = (familyData) => ({
    headName: familyData.name?.trim() || '',
    address: familyData.address?.trim() || null,
    urgencyIndex: statusToUrgency(familyData.status),
    needs: familyData.needs || [],
    latitude: familyData.coordinates?.lat ?? null,
    longitude: familyData.coordinates?.lng ?? null,
  });

  const fetchFamilies = async () => {
    setIsLoading(true);
    setError('');
    const res = await apiFetch(apiBaseUrl);
    if (!res || !res.ok) {
      throw new Error(t('families.saveError'));
    }
    const data = await res.json();
    const mapped = (Array.isArray(data) ? data : []).map(mapResponseToFamily);
    setFamilies(mapped);
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    fetchFamilies().catch((err) => {
      if (isMounted) {
        setError(err.message);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setFamilyToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (family) => {
    setFamilyToEdit(family);
    setIsModalOpen(true);
  };

  const handleDeleteFamily = async (familyId) => {
    if (!window.confirm(t('families.deleteConfirm'))) {
      return;
    }
    setError('');
    const res = await apiFetch(`${apiBaseUrl}/${familyId}`, { method: 'DELETE' });
    if (!res || !res.ok) {
      setError(t('families.deleteError'));
      return;
    }
    fetchFamilies().catch((err) => setError(err.message));
  };

  const handleSaveFamily = async (familyData) => {
    setError('');
    const payload = buildRequest(familyData);
    if (!payload.headName) {
      setError(t('families.nameRequired'));
      return;
    }

    const rawId = familyData.id ?? familyData._id;
    const isEdit = rawId !== undefined && rawId !== null && `${rawId}`.trim() !== '';
    const url = isEdit ? `${apiBaseUrl}/${rawId}` : apiBaseUrl;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
  const text = await res.text();
  setError(`${t('families.saveError')} - ${res.status} - ${text}`);
  return;
}
    setIsModalOpen(false);
    fetchFamilies().catch((err) => setError(err.message));
  };

  const filteredFamilies = families.filter((f) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (f.name || '').toLowerCase();
    const address = (f.address || '').toLowerCase();
    const statusLabel = (f.status === 'URGENT' ? t('status.urgent') : t('status.stable')).toLowerCase();
    const needsText = (f.needs || []).join(' ').toLowerCase();
    return name.includes(q) || address.includes(q) || statusLabel.includes(q) || needsText.includes(q);
  });

  return (
    <div className="page-container">
      <AppNavbar activeRoute="families" toggleTheme={toggleTheme} isDark={isDark} />
      
      <main className="page-main">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="page-title">{t('families.title')}</h1>
            <p className="text-secondary">{t('families.subtitle')}</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
          >
            + {t('families.addFamily')}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <AddFamilyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveFamily}
          initialData={familyToEdit}
        />

        {/* SEARCH AND TABLE SECTION */}
        <div className="mb-6">
          <div className="table-wrapper">
            <div className="table-search">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('families.searchPlaceholder')}
                className="search-input"
              />
            </div>

            {/* RESPONSIVE TABLE */}
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('families.table.name')}</th>
                    <th>{t('families.table.address')}</th>
                    <th>{t('families.table.status')}</th>
                    <th>{t('families.table.needs')}</th>
                    <th className="text-right">{t('families.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-muted">
                        {t('families.loading')}
                      </td>
                    </tr>
                  ) : filteredFamilies.length > 0 ? (
                    filteredFamilies.map((family) => (
                      <tr key={family.id}>
                        <td>
                          <Link to={`/families/${family.id}`} className="link-primary">
                            {family.name}
                          </Link>
                        </td>
                        <td>{family.address || '-'}</td>
                        <td>
                          <StatusBadge status={family.status} t={t} />
                        </td>
                        <td>
                          <div className="flex gap-1 flex-wrap">
                            {family.needs?.length > 0 ? (
                              family.needs.map((need, idx) => (
                                <span key={idx} className="need-pill need-pill-default">
                                  {need}
                                </span>
                              ))
                            ) : (
                                <span className="text-muted">-</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenEdit(family)}
                              className="action-button edit"
                                title={t('common.edit')}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteFamily(family.id)}
                              className="action-button delete"
                                title={t('common.delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-muted">
                          {t('families.noneFound')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default FamilyManagement;
