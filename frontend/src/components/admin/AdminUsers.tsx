import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { Plus, Edit, Trash2, Shield, Mail, Network } from 'lucide-react';
import UserModal from '../modals/UserModal';
import TeamAssignmentModal from '../modals/TeamAssignmentModal';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  oidc_provider: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const { showConfirm, dialogState } = useConfirmDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleManageTeams = (user: User) => {
    setSelectedUserForAssignment(user);
    setAssignmentModalOpen(true);
  };

  const handleDelete = (id: string) => {
    showConfirm(
      t('admin.confirmDeleteUser'),
      t('admin.confirmDeleteUser'),
      async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          loadUsers();
        } catch (error: any) {
          alert(error.response?.data?.error || t('common.error'));
        }
      },
      { variant: 'danger', confirmText: t('common.delete'), cancelText: t('common.cancel') }
    );
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleAssignmentModalClose = () => {
    setAssignmentModalOpen(false);
    setSelectedUserForAssignment(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.users')}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {users.length} {users.length === 1 ? t('common.user') : t('common.users')}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={Plus}>
          {t('admin.addUser')}
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => (
            <div key={user.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      {Boolean(user.is_admin) && (
                        <span title={t('admin.admin')}>
                          <Shield className="h-4 w-4 text-yellow-500" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    {user.oidc_provider && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {t('admin.oidcUser')}: {user.oidc_provider}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Network}
                    onClick={() => handleManageTeams(user)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => handleEdit(user)}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(user.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <UserModal
        user={editingUser}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSuccess={loadUsers}
      />

      {selectedUserForAssignment && (
        <TeamAssignmentModal
          mode="user"
          userId={selectedUserForAssignment.id}
          userName={selectedUserForAssignment.name}
          isOpen={assignmentModalOpen}
          onClose={handleAssignmentModalClose}
          onSuccess={loadUsers}
        />
      )}

      <ConfirmDialog {...dialogState} />
    </div>
  );
}
