'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, CheckCircle2, Upload, MessageSquare, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppNavbar } from '@/components/app-navbar';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  specialization?: string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
}

interface Textbook {
  id: number;
  title: string;
  filename: string;
  file_size: number;
  upload_date: string;
  is_processed: boolean;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user.user_type !== 'admin') {
          router.push('/chat');
          return;
        }
        setUser(data.user);
        loadUsers();
        loadTextbooks();
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadTextbooks = async () => {
    try {
      const response = await fetch('/api/admin/textbooks');
      if (response.ok) {
        const data = await response.json();
        setTextbooks(data.textbooks);
      }
    } catch (error) {
      console.error('Failed to load textbooks:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload only PDF files');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('textbook', file);

    try {
      const response = await fetch('/api/admin/upload-textbook', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Textbook uploaded successfully!');
        loadTextbooks();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });

      if (response.ok) {
        loadUsers();
      } else {
        alert('Failed to update user status');
      }
    } catch (error) {
      alert('Error updating user status');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users },
    { label: 'Textbooks', value: textbooks.length, icon: BookOpen },
    { label: 'Processed', value: textbooks.filter((t) => t.is_processed).length, icon: CheckCircle2 },
  ];

  const badge = (active: boolean) =>
    cn(
      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
      active
        ? 'bg-success-surface text-success border border-success-border'
        : 'bg-danger-surface text-danger border border-danger-border'
    );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <AppNavbar title="DietechAI Admin">
        <span className="mr-1 hidden text-sm text-muted sm:inline">Welcome, {user?.full_name}</span>
        <Button size="sm" variant="secondary" onClick={() => router.push('/chat')}>
          <MessageSquare size={16} />
          <span className="hidden sm:inline">Go to Chat</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={handleLogout}>
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </AppNavbar>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {stats.map((s, i) => (
            <Card
              key={s.label}
              style={{ animationDelay: `${i * 0.08}s` }}
              className="animate-fade-up flex items-center gap-4 p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon size={22} />
              </div>
              <div>
                <p className="text-sm text-muted">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs + tables */}
        <Card className="overflow-hidden">
          <div className="flex border-b border-border">
            {[
              { key: 'users', label: 'Users Management' },
              { key: 'textbooks', label: 'Textbook Management' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'cursor-pointer border-b-2 px-6 py-4 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Users List</h3>
                  <span className="text-sm text-muted">
                    {users.filter((u) => u.is_active).length} active users
                  </span>
                </div>

                <div className="scrollbar-slim overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-subtle">
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Specialization</th>
                        <th className="px-4 py-3 font-medium">Joined</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-border/60 transition-colors hover:bg-elevated/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{u.full_name}</div>
                            <div className="text-xs text-subtle">{u.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                              {u.user_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted">{u.specialization || '—'}</td>
                          <td className="px-4 py-3 text-muted">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={badge(u.is_active)}>{u.is_active ? 'Active' : 'Inactive'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleUserStatus(u.id, u.is_active)}
                              className={cn(
                                'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                                u.is_active
                                  ? 'bg-danger-surface text-danger hover:opacity-80'
                                  : 'bg-success-surface text-success hover:opacity-80'
                              )}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'textbooks' && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Textbooks</h3>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-lift dark:from-emerald-500 dark:to-teal-500">
                    <Upload size={16} />
                    {uploading ? 'Uploading…' : 'Upload Textbook'}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="scrollbar-slim overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-subtle">
                        <th className="px-4 py-3 font-medium">Textbook</th>
                        <th className="px-4 py-3 font-medium">Size</th>
                        <th className="px-4 py-3 font-medium">Uploaded</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {textbooks.map((t) => (
                        <tr key={t.id} className="border-b border-border/60 transition-colors hover:bg-elevated/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{t.title}</div>
                            <div className="text-xs text-subtle">{t.filename}</div>
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {(t.file_size / (1024 * 1024)).toFixed(2)} MB
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {new Date(t.upload_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                t.is_processed
                                  ? 'border border-success-border bg-success-surface text-success'
                                  : 'border border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                              )}
                            >
                              {t.is_processed ? 'Processed' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {textbooks.length === 0 && (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-elevated text-subtle">
                      <BookOpen size={30} />
                    </div>
                    <h3 className="mb-1 text-lg font-medium text-foreground">No textbooks uploaded</h3>
                    <p className="text-muted">Upload your first medical textbook to get started.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
