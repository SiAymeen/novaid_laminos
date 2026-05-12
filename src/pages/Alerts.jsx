import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Package, MessageSquare, ChevronRight } from 'lucide-react';
import AppNavbar from '../components/AppNavbar';
import AddVisitModal from '../components/AddVisitModal';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../utils/api';

function formatDate(dateStr, locale, t) {
  if (!dateStr) return t('common.neverVisited');
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return t('common.today');
  if (days === 1) return t('common.yesterday');
  if (days < 7) return t('common.daysAgo', { days });
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function Alerts({ toggleTheme, isDark }) {
  const { t, locale } = usePreferences();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canPlan = currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'ROLE_COORDINATOR';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);

  const urgentFamiliesMock = [
    { _id: '1', name: 'Famille Mansouri', address: 'Quartier Nord, Bizerte', needs: ['Lait infantile', 'Médicaments'], alertType: 'urgent' }
  ];

  const [urgentFamilies, setUrgentFamilies] = useState([]);
  const [forgottenFamilies, setForgottenFamilies] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    apiFetch('/api/alerts')
      .then(res => {
        if (!res) return null;
        if (!res.ok) throw new Error('Failed to fetch alerts');
        return res.json();
      })
      .then(data => {
        if (isMounted && data) {
          setUrgentFamilies(data.urgentFamilies || []);
          setForgottenFamilies(data.forgottenFamilies || []);
          setLowStockItems(data.lowStockItems || []);
          setRecentReports(data.recentReports || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const mergedFamilies = [...urgentFamilies, ...forgottenFamilies];

  const handlePlanVisit = (f) => {
    setSelectedFamily(f);
    setIsModalOpen(true);
  };

  return (
    <div className="page-container">
      <AppNavbar activeRoute="alerts" toggleTheme={toggleTheme} isDark={isDark} />
      
      <main className="page-main">
        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 className="page-title flex items-center gap-2">
            <AlertTriangle size={32} style={{ color: 'var(--color-red)' }} />
            {t('alerts.title')}
          </h1>
          <p className="text-secondary">{t('alerts.subtitle')}</p>
        </div>

        {/* MAIN GRID: Families + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* LEFT SECTION: Urgent & Forgotten Families */}
          <section className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <AlertTriangle size={20} style={{ color: 'var(--color-red)' }} />
              {t('alerts.criticalFamilies')}
              <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                {urgentFamilies.length + forgottenFamilies.length}
              </span>
            </h2>
            
            <div className="space-y-3 mb-8">
              {/* URGENT FAMILIES */}
              {urgentFamilies.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-primary">{t('alerts.criticalSituations')}</h3>
                    <span className="text-xs text-muted">{urgentFamilies.length}</span>
                  </div>
                  {urgentFamilies.map((f) => (
                    <div key={f._id} className="card card-left-border urgent">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-primary truncate">{f.name}</h4>
                            <span className="badge badge-urgent shrink-0">
                              <span className="badge-dot pulse" />
                              Critique
                            </span>
                          </div>
                          <p className="text-sm text-secondary mb-2">{f.address}</p>
                          {f.needs?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {f.needs.map((n) => (
                                <span key={n} className="need-pill need-pill-medical">
                                  {n}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            to={`/families/${f._id}`}
                            className="btn btn-outline"
                          >
                            {t('alerts.folder')}
                          </Link>
                          {canPlan && (
                            <button
                              onClick={() => handlePlanVisit(f)}
                              className="btn btn-primary"
                            >
                              {t('alerts.plan')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FORGOTTEN FAMILIES */}
              {forgottenFamilies.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-primary">{t('alerts.forgottenVisits')}</h3>
                    <span className="text-xs text-muted">{forgottenFamilies.length}</span>
                  </div>
                  {forgottenFamilies.map((f) => (
                    <div key={f._id} className="card card-left-border warning">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-primary mb-1">{f.name}</h4>
                          <p className="text-sm text-secondary mb-1">{f.address}</p>
                          <p className="text-xs text-muted flex items-center gap-1">
                            <Clock size={14} />
                            {t('alerts.lastVisit', { date: formatDate(f.lastVisitDate, locale, t) })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            to={`/families/${f._id}`}
                            className="btn btn-outline"
                          >
                            {t('alerts.folder')}
                          </Link>
                          {canPlan && (
                            <button
                              onClick={() => handlePlanVisit(f)}
                              className="btn btn-primary"
                            >
                              {t('alerts.plan')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mergedFamilies.length === 0 && (
                <div className="card">
                  <p className="text-center text-secondary py-8">
                    ✅ {t('alerts.noneCritical')}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT SIDEBAR: Stock & Reports */}
          <div className="flex flex-col gap-6">
            
            {/* STOCK SECTION */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <Package size={20} style={{ color: 'var(--color-red)' }} />
                {t('alerts.criticalStocks')}
              </h2>
              
              <div className="card">
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-green-500 font-medium">✅ {t('alerts.allStocksOk')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStockItems.map((item) => (
                      <div key={item._id} className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-primary">{item.name}</span>
                          <span className="text-xs font-bold text-red-500">
                            {item.quantity}/{item.minThreshold}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full bg-red-500 transition-all"
                            style={{ width: `${Math.min((item.quantity / item.minThreshold) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-secondary mt-1">{item.unit}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* RECENT REPORTS SECTION */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <MessageSquare size={20} style={{ color: 'var(--color-blue)' }} />
                {t('alerts.recentReports')}
              </h2>
              
              <div className="card">
                {recentReports.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-secondary">{t('alerts.noRecentReports')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentReports.map((r) => (
                      <div key={r._id} className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-primary text-sm">{r.familyName}</span>
                          <span className="text-xs text-muted">{formatDate(r.date, locale, t)}</span>
                        </div>
                        <p className="text-xs text-secondary font-medium mb-1">{r.volunteerName}</p>
                        <p className="text-xs text-secondary line-clamp-2">{r.notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <AddVisitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedFamily={selectedFamily}
        onSuccess={() => {
          setIsModalOpen(false);
          setSelectedFamily(null);
        }}
      />
    </div>
  );
}

export default Alerts;
