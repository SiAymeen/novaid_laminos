import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';
import AppNavbar from '../components/AppNavbar';
import AddUserModal from '../components/AddUserModal';
import { usePreferences } from '../context/PreferencesContext';
import { apiFetch } from '../utils/api';

// --- ROLE BADGE ---
function RoleBadge({ role }) {
  const { t } = usePreferences();
  let bgClass = '';
  let textClass = '';
  let label = '';
  let borderClass = '';

  switch (role) {
    case 'ADMIN':
      bgClass = 'bg-purple-500/10 dark:bg-purple-500/20';
      textClass = 'text-purple-600 dark:text-purple-400';
      borderClass = 'border-purple-500/30';
      label = t('roles.admin');
      break;
    case 'COORDINATOR':
      bgClass = 'bg-amber-500/10 dark:bg-amber-500/20';
      textClass = 'text-amber-600 dark:text-amber-400';
      borderClass = 'border-amber-500/30';
      label = t('roles.coordinator');
      break;
    case 'AGENT':
    default:
      bgClass = 'bg-blue-500/10 dark:bg-blue-500/20';
      textClass = 'text-blue-600 dark:text-blue-400';
      borderClass = 'border-blue-500/30';
      label = t('roles.agent');
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgClass} ${textClass} ${borderClass}`}>
      {label}
    </span>
  );
}

function Users({ toggleTheme, isDark }) {
  const { t } = usePreferences();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'ROLE_ADMIN';
  const apiBaseUrl = '/api/users';
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const mapResponseToUser = (user) => ({
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role,
  });

  const buildRequest = (userData) => ({
    fullName: userData.name?.trim() || '',
    email: userData.email?.trim() || '',
    role: userData.role || 'AGENT',
    password: userData.password || undefined,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    const res = await apiFetch(apiBaseUrl);
    if (!res || !res.ok) {
      throw new Error(t('users.loading'));
    }
    const data = await res.json();
    const mapped = (Array.isArray(data) ? data : []).map(mapResponseToUser);
    setUsers(mapped);
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    fetchUsers().catch((err) => {
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
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t('users.deleteConfirm'))) {
      return;
    }
    setError('');
    const res = await apiFetch(`${apiBaseUrl}/${userId}`, { method: 'DELETE' });
    if (!res || !res.ok) {
      setError(t('users.deleteError'));
      return;
    }
    fetchUsers().catch((err) => setError(err.message));
  };

  const handleSaveUser = async (userData) => {
    setError('');
    const payload = buildRequest(userData);
    if (!payload.fullName || !payload.email) {
      setError(t('users.fillRequired'));
      return;
    }

    const isEdit = userData.id !== undefined && userData.id !== null && `${userData.id}`.trim() !== '';
    const url = isEdit ? `${apiBaseUrl}/${userData.id}` : apiBaseUrl;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError(t('users.saveError'));
      return;
    }

    setIsModalOpen(false);
    fetchUsers().catch((err) => setError(err.message));
  };

  const filteredUsers = users.filter((u) => {
    if (currentUser.role === 'ROLE_COORDINATOR' && u.role === 'ADMIN') return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="page-container">
      <AppNavbar activeRoute="users" toggleTheme={toggleTheme} isDark={isDark} />
      
      <main className="page-main">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="page-title">{t('users.title')}</h1>
            <p className="text-secondary">{t('users.subtitle')}</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
          >
            + {t('users.addUser')}
          </button>
        </div>

        <AddUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
          initialData={userToEdit}
        />

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        {/* SEARCH AND TABLE SECTION */}
        <div className="mb-6">
          <div className="table-wrapper">
            <div className="table-search">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('users.searchPlaceholder')}
                className="search-input"
              />
            </div>

            {/* RESPONSIVE TABLE */}
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('users.table.name')}</th>
                    <th>{t('users.table.email')}</th>
                    <th>{t('users.table.role')}</th>
                    <th className="text-right">{t('users.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-muted">
                        {t('users.loading')}
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="font-medium text-slate-800 dark:text-slate-200">
                          {user.name}
                        </td>
                        <td className="text-slate-600 dark:text-slate-400">
                          {user.email}
                        </td>
                        <td>
                          <RoleBadge role={user.role} />
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="action-button edit"
                              title={t('common.edit')}
                            >
                              <Edit2 size={16} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="action-button delete"
                                title={t('common.delete')}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-muted">
                        {t('users.noneFound')}
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

export default Users;
