import React, { useState, useEffect } from 'react';
import { Package, Plus, Minus, Search, Edit2, Trash2 } from 'lucide-react';
import AppNavbar from '../components/AppNavbar';
import AddStockModal from '../components/AddStockModal';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../utils/api';

// --- STATUS BADGE ---
function StatusBadge({ isLow, t }) {
  const statusBadge = isLow ? 'urgent' : 'stable';
  const label = isLow ? t('status.low') : t('status.good');

  return (
    <div className={`badge badge-${statusBadge}`}>
      <span className={`badge-dot ${isLow ? 'pulse' : ''}`} />
      {label}
    </div>
  );
}

function Inventory({ toggleTheme, isDark }) {
  const { t } = usePreferences();
  const apiBaseUrl = '/api/items';
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  const mapResponseToItem = (item) => ({
    id: item.id,
    name: item.name,
    category: item.category || 'Autre',
    quantity: item.quantity,
    unit: item.unit,
    minThreshold: item.minThreshold,
  });

  const buildRequest = (itemData) => ({
    name: itemData.name?.trim() || '',
    category: itemData.category || 'Autre',
    quantity: Number(itemData.quantity) || 0,
    unit: itemData.unit?.trim() || '',
    minThreshold: Number(itemData.minThreshold) || 0,
  });

  const fetchItems = async () => {
    setIsLoading(true);
    setError('');
    const res = await apiFetch(apiBaseUrl);
    if (!res.ok) {
      throw new Error(t('inventory.loading'));
    }
    const data = await res.json();
    const mapped = (Array.isArray(data) ? data : []).map(mapResponseToItem);
    setItems(mapped);
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    fetchItems().catch((err) => {
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
    setItemToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm(t('inventory.deleteConfirm'))) {
      return;
    }
    setError('');
    const res = await apiFetch(`${apiBaseUrl}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError(t('inventory.deleteError'));
      return;
    }
    fetchItems().catch((err) => setError(err.message));
  };

  const handleSaveItem = async (itemData) => {
    setError('');
    const payload = buildRequest(itemData);
    if (!payload.name || !payload.unit) {
      setError(t('inventory.fillRequired'));
      return;
    }

    const isEdit = itemData.id !== undefined && itemData.id !== null && `${itemData.id}`.trim() !== '';
    const url = isEdit ? `${apiBaseUrl}/${itemData.id}` : apiBaseUrl;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError(t('inventory.saveError'));
      return;
    }

    setIsModalOpen(false);
    fetchItems().catch((err) => setError(err.message));
  };

  const updateQuantity = async (item, nextQuantity) => {
    setError('');
    const payload = buildRequest({ ...item, quantity: nextQuantity });
    const res = await apiFetch(`${apiBaseUrl}/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError(t('inventory.updateError'));
      return;
    }

    fetchItems().catch((err) => setError(err.message));
  };

  const handleAddQty = async (id) => {
    setError('');
    const res = await apiFetch(`${apiBaseUrl}/${id}/add-stock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: 1 }),
    });
    if (!res.ok) { setError(t('inventory.updateError')); return; }
    fetchItems().catch((err) => setError(err.message));
  };

  const handleRemoveQty = async (id) => {
    const item = items.find((i) => i.id === id);
    if (!item || item.quantity <= 0) return;
    setError('');
    const res = await apiFetch(`${apiBaseUrl}/${id}/remove-stock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: 1 }),
    });
    if (!res.ok) { setError(t('inventory.updateError')); return; }
    fetchItems().catch((err) => setError(err.message));
  };

  const filteredItems = items.filter((i) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (i.name || '').toLowerCase();
    const category = (i.category || '').toLowerCase();
    return name.includes(q) || category.includes(q);
  });

  return (
    <div className="page-container">
      <AppNavbar activeRoute="inventory" toggleTheme={toggleTheme} isDark={isDark} />

      <main className="page-main">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Package size={32} style={{ color: 'var(--color-blue)' }} />
              {t('inventory.title')}
            </h1>
            <p className="text-secondary">{t('inventory.subtitle')}</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
          >
            + {t('inventory.addItem')}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <AddStockModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveItem}
          initialData={itemToEdit}
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
                placeholder={t('inventory.searchPlaceholder')}
                className="search-input"
              />
            </div>

            {/* RESPONSIVE TABLE */}
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('inventory.table.name')}</th>
                    <th>{t('inventory.table.category')}</th>
                    <th>{t('inventory.table.status')}</th>
                    <th>{t('inventory.table.quantity')}</th>
                    <th className="text-right">{t('inventory.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-muted">
                        {t('inventory.loading')}
                      </td>
                    </tr>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const isLow = item.quantity < item.minThreshold;
                      return (
                        <tr key={item.id} className={isLow ? 'urgent' : ''}>
                          <td className="font-medium text-slate-800 dark:text-slate-200">
                            {item.name}
                          </td>
                          <td className="text-slate-600 dark:text-slate-400">
                            {item.category}
                          </td>
                          <td>
                            <StatusBadge isLow={isLow} t={t} />
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleRemoveQty(item.id)}
                                disabled={item.quantity <= 0}
                                className="control-btn control-btn-minus"
                                style={{width: '28px', height: '28px'}}
                                title={t('inventory.remove')}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="font-medium min-w-[3rem] text-center">
                                {item.quantity} <span className="text-xs text-muted">{item.unit}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddQty(item.id)}
                                className="control-btn control-btn-plus"
                                style={{width: '28px', height: '28px'}}
                                title={t('inventory.add')}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleOpenEdit(item)}
                                className="action-button edit"
                                title={t('common.edit')}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="action-button delete"
                                title={t('common.delete')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-muted">
                        {t('inventory.noneFound')}
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

export default Inventory;
