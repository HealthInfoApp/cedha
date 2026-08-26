'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, LogOut, MessageSquare, LayoutDashboard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { AppNavbar } from '@/components/app-navbar';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  specialization?: string;
  phone_number?: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: '',
    specialization: '',
    phone_number: '',
    profile_image: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFormData({
          full_name: data.user.full_name || '',
          specialization: data.user.specialization || '',
          phone_number: data.user.phone_number || '',
          profile_image: data.user.profile_image || '',
        });
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file (JPEG, PNG, etc.)', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showMessage('Image size must be less than 2MB', 'error');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('profileImage', file);

    try {
      const response = await fetch('/api/user/upload-profile-image', {
        method: 'POST',
        body: uploadData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, profile_image: data.imageUrl }));
        setUser((prev) => (prev ? { ...prev, profile_image: data.imageUrl } : null));
        showMessage('Profile image updated successfully!', 'success');
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to upload image', 'error');
      }
    } catch (error) {
      showMessage('Failed to upload image. Please try again.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        showMessage('Profile updated successfully!', 'success');
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to update profile', 'error');
      }
    } catch (error) {
      showMessage('Failed to update profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
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
          <p className="text-muted">Loading profile…</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.user_type === 'admin';

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <AppNavbar title="DietechAI Profile">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => router.push(isAdmin ? '/dashboard/admin' : '/chat')}
        >
          {isAdmin ? <LayoutDashboard size={16} /> : <MessageSquare size={16} />}
          <span className="hidden sm:inline">{isAdmin ? 'Admin Dashboard' : 'Back to Chat'}</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={handleLogout}>
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </AppNavbar>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div
            className={cn(
              'mb-6 rounded-xl border px-4 py-3 text-sm',
              messageType === 'success'
                ? 'border-success-border bg-success-surface text-success'
                : 'border-danger-border bg-danger-surface text-danger'
            )}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Photo + account */}
          <Card className="p-6 lg:col-span-1">
            <h3 className="mb-4 text-lg font-semibold">Profile Photo</h3>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar name={formData.full_name} src={formData.profile_image || null} size={128} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload photo"
                  className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lift transition-transform hover:scale-105 dark:from-emerald-500 dark:to-teal-500"
                >
                  <Camera size={16} />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-center text-sm text-muted">
                Click the camera icon to upload a new profile photo. Max 2MB.
              </p>
            </div>

            <div className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
              <h4 className="font-medium text-foreground">Account Information</h4>
              <div>
                <span className="text-subtle">Email</span>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <span className="text-subtle">User Type</span>
                <p className="font-medium capitalize">{user?.user_type?.replace('-', ' ')}</p>
              </div>
              <div>
                <span className="text-subtle">Member Since</span>
                <p className="font-medium">
                  {user ? new Date(user.created_at).toLocaleDateString() : ''}
                </p>
              </div>
            </div>
          </Card>

          {/* Form + security */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6">
              <h3 className="mb-6 text-lg font-semibold">Profile Information</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialization">Specialization / Field</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="e.g., Cardiology, Pediatrics, etc."
                  />
                  <p className="mt-1.5 text-sm text-subtle">
                    Leave empty if you&apos;re a medical student or not specialized.
                  </p>
                </div>

                <div className="flex justify-end gap-3 border-t border-border pt-5">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSaving}>
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Security</h3>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-medium text-foreground">Change Password</h4>
                    <p className="text-sm text-muted">Update your password regularly for security.</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => router.push('/change-password')}>
                    Change Password
                  </Button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted">Add an extra layer of security to your account.</p>
                  </div>
                  <Button size="sm" variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
