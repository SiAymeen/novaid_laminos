import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Globe, Package, Users, Target, Settings, LogOut, Menu, X } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

function AppNavbar({ activeRoute = 'dashboard', toggleTheme, isDark }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = usePreferences();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsMobileMenuOpen(false);
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = currentUser.role;

  const ALL_NAV_ITEMS = [
    { key: 'dashboard', to: '/dashboard', label: t('nav.dashboard'), icon: null, roles: ['ROLE_ADMIN', 'ROLE_COORDINATOR', 'ROLE_AGENT'] },
    { key: 'families', to: '/families', label: t('nav.families'), icon: Users, roles: ['ROLE_ADMIN', 'ROLE_COORDINATOR', 'ROLE_AGENT'] },
    { key: 'alerts', to: '/alerts', label: t('nav.alerts'), icon: Bell, roles: ['ROLE_ADMIN', 'ROLE_COORDINATOR'] },
    { key: 'map', to: '/map', label: t('nav.map'), icon: Globe, roles: ['ROLE_ADMIN', 'ROLE_COORDINATOR', 'ROLE_AGENT'] },
    { key: 'inventory', to: '/inventory', label: t('nav.inventory'), icon: Package, roles: ['ROLE_ADMIN', 'ROLE_COORDINATOR'] },
    { key: 'users', to: '/users', label: t('nav.users'), icon: Users, roles: ['ROLE_ADMIN', 'ROLE_COORDINATOR'] },
    { key: 'missions', to: '/missions', label: t('nav.missions'), icon: Target, roles: ['ROLE_ADMIN', 'ROLE_COORDINATOR', 'ROLE_AGENT'] },
    { key: 'settings', to: '/settings', label: t('nav.settings'), icon: Settings, roles: ['ROLE_ADMIN', 'ROLE_COORDINATOR', 'ROLE_AGENT'] },
  ];

  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-logo" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="navbar-logo-dot" />
            NOVAID
          </Link>

          {/* Desktop Links */}
          <div className="navbar-links">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={`navbar-link ${activeRoute === item.key ? 'active' : ''}`}
                >
                  {Icon && <Icon size={16} />}
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="navbar-right">
            <Link to="/" className="btn btn-sm btn-outline gap-2 hidden sm:flex" onClick={handleLogout}>
              <LogOut size={14} />
              {t('nav.logout')}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-header">
            <Link to="/" className="navbar-logo" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="navbar-logo-dot" />
              NOVAID
            </Link>
            <button
              className="mobile-menu-close"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={28} />
            </button>
          </div>
          
          <div className="mobile-menu-links">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={`mobile-menu-link ${activeRoute === item.key ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {Icon && <Icon size={20} />}
                  {item.label}
                </Link>
              );
            })}
            
            <div className="mt-auto pt-6 border-t border-slate-200/20 dark:border-slate-700/50">
              <Link
                to="/"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-medium"
                onClick={handleLogout}
              >
                <LogOut size={20} />
                {t('nav.logout')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AppNavbar;
