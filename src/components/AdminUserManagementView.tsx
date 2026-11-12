import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../utils/apiClient';
import { Shield, UserPlus, Key, Search, Lock } from 'lucide-react';
import { LoadingSkeleton } from './ui/LoadingSkeleton';
import { ErrorState } from './ui/ErrorState';
import { useToast } from '../context/ToastContext';

export const AdminUserManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // New user modal form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('teacher');
  const [newTitle, setNewTitle] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setFetching(true);
      setFetchError(null);
      const data = await apiClient.get<User[]>('/api/admin/users');
      setUsers(data || []);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load user directory.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newUser = await apiClient.post<User>('/api/admin/users', {
        name: newName,
        email: newEmail,
        role: newRole,
        title: newTitle || 'Educator',
        district: newDistrict || 'Default District',
      });

      setUsers((prev) => [newUser, ...prev]);
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewTitle('');
      setNewDistrict('');
      showToast(`User ${newUser.name} provisioned successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to provision user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <LoadingSkeleton count={6} className="h-10 mb-3" />
      </div>
    );
  }

  if (fetchError) {
    return <ErrorState title="Admin Directory Offline" message={fetchError} onRetry={fetchUsers} />;
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Subsystem 06 • District User & Auth Administration</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-2">District RBAC & Identity Management</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage teacher roles, student access codes, district permissions, and audit logs.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all flex items-center space-x-2 shadow-xs cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="all">All Roles</option>
            <option value="admin">District Admin</option>
            <option value="curriculum_lead">Curriculum Lead</option>
            <option value="teacher">Teacher</option>
            <option value="qa_auditor">QA Auditor</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="p-4">User Details</th>
              <th className="p-4">Assigned Role</th>
              <th className="p-4">District / Organization</th>
              <th className="p-4">Access Credentials</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <div className="font-bold text-slate-900">{u.name}</div>
                  <div className="text-slate-500 text-[11px]">{u.email}</div>
                </td>
                <td className="p-4">
                  <span className="bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded text-[11px] border border-indigo-100">
                    {String(u.role || 'user').toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-slate-600">{u.schoolDistrict || u.districtId || u.title || 'Springfield Public Schools'}</td>
                <td className="p-4 text-slate-500 font-mono text-[11px]">
                  {(u as any).studentAccessCode ? (
                    <span className="text-sky-700 font-semibold">Code: {(u as any).studentAccessCode}</span>
                  ) : (
                    <span className="text-slate-400 flex items-center">
                      <Lock className="w-3 h-3 mr-1" /> SSO / Password Protected
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Provision New District User</h3>

            <form onSubmit={handleAddUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-600"
                >
                  <option value="teacher">Teacher</option>
                  <option value="curriculum_lead">Curriculum Lead</option>
                  <option value="qa_auditor">QA Auditor</option>
                  <option value="admin">District Admin</option>
                  <option value="student">Student</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg"
                >
                  {submitting ? 'Provisioning...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
