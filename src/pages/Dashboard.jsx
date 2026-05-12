import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import AppNavbar from '../components/AppNavbar';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../utils/api';

// --- ANIMATED COUNTER COMPONENT ---
function CountUpValue({ targetValue }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let animationFrameId;
    let currentValue = 0;
    const startTime = Date.now();
    const duration = 700; // 700ms animation

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      currentValue = Math.floor(progress * targetValue);
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetValue]);

  return <span>{displayValue}</span>;
}

// --- DASHBOARD CHARTS WITH NEW DESIGN SYSTEM ---
const NEEDS_COLORS = ['#4f7fff', '#22c87a', '#f0a742', '#f04e4e', '#9b7ff4', '#2dd4bf'];

function DashboardCharts({ needsData, weekData, t }) {

  return (
    <div className="grid-2 gap-6 mb-6">
      {/* DONUT CHART */}
      <div className="card">
        <h3 className="text-base font-medium text-primary mb-4">{t('dashboard.needsDistribution')}</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={needsData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={true}
              >
                {needsData.map((_, index) => (
                  <Cell key={index} fill={NEEDS_COLORS[index % NEEDS_COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value) => [`${value} ${t('dashboard.tooltipFamilies')}`, t('dashboard.tooltipCount')]}
                contentStyle={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid rgba(79,127,255,0.3)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend mt-4">
          {needsData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: NEEDS_COLORS[idx % NEEDS_COLORS.length] }}
              />
              <span className="text-secondary">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BAR CHART */}
      <div className="card">
        <h3 className="text-base font-medium text-primary mb-4">{t('dashboard.visitsThisWeek')}</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,146,165,0.2)" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: "var(--text-muted)", fontSize: 12 }} 
                stroke="rgba(139,146,165,0.2)"
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fill: "var(--text-muted)", fontSize: 12 }} 
                stroke="rgba(139,146,165,0.2)"
              />
              <RechartsTooltip
                formatter={(value) => [value, t('dashboard.tooltipVisits')]}
                labelFormatter={(label) => t('dashboard.tooltipDay', { label })}
                contentStyle={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid rgba(79,127,255,0.3)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
              />
              <Bar 
                dataKey="visits" 
                fill="#4f7fff" 
                radius={[4, 4, 0, 0]} 
                name={t('dashboard.tooltipVisits')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ toggleTheme, isDark }) {
  const { t } = usePreferences();
  const [summary, setSummary] = useState({
    totalFamilies: 0,
    urgentFamilies: 0,
    visitsCount: 0,
    needs: [],
    weeklyVisits: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError('');

    apiFetch('/api/dashboard/summary')
      .then((res) => {
        if (!res) return;
        if (!res.ok) {
          throw new Error(t('dashboard.loadError'));
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setSummary(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalFamilies = summary.totalFamilies || 0;
  const urgentFamilies = summary.urgentFamilies || 0;
  const visitsCount = summary.visitsCount || 0;
  const needsData = Array.isArray(summary.needs) ? summary.needs : [];
  const weekData = Array.isArray(summary.weeklyVisits) ? summary.weeklyVisits : [];

  return (
    <div className="page-container">
      <AppNavbar activeRoute="dashboard" toggleTheme={toggleTheme} isDark={isDark} />
      
      <main className="page-main">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="page-title">{t('dashboard.title')}</h1>
            <p className="text-secondary">{t('dashboard.subtitle')}</p>
          </div>
        </div>

        {/* STAT CARDS - 3 COLUMN GRID */}
        <div className="grid-3 gap-4 mb-8">
          {/* Total Families Card */}
          <div className="card card-accent-top accent-blue">
            <div className="stat-card">
              <div className="stat-icon blue">
                <Users size={28} />
              </div>
              <div>
                <p className="stat-label">{t('dashboard.totalFamilies')}</p>
                <p className="stat-value">
                  <CountUpValue targetValue={totalFamilies} />
                </p>
              </div>
            </div>
          </div>

          {/* Urgent Families Card */}
          <div className="card card-accent-top accent-red">
            <div className="stat-card">
              <div className="stat-icon red">
                <AlertTriangle size={28} />
              </div>
              <div>
                <p className="stat-label">{t('dashboard.urgentFamilies')}</p>
                <p className="stat-value">
                  <CountUpValue targetValue={urgentFamilies} />
                </p>
              </div>
            </div>
          </div>

          {/* Completed Visits Card */}
          <div className="card card-accent-top accent-green">
            <div className="stat-card">
              <div className="stat-icon green">
                <CheckCircle size={28} />
              </div>
              <div>
                <p className="stat-label">{t('dashboard.completedVisits')}</p>
                <p className="stat-value">
                  <CountUpValue targetValue={visitsCount} />
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="card">
            <p className="text-secondary">{t('dashboard.loading')}</p>
          </div>
        ) : (
          <DashboardCharts needsData={needsData} weekData={weekData} t={t} />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
