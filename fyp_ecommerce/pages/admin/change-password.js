// pages/admin/change-password.js
// Simple change password form.
// POTENTIALLY VULNERABLE TO CSRF:
//  - No CSRF token
//  - Relies only on adminSession cookie set on login
//  - Any third-party site can POST to /api/change-password while the user is logged in

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function ChangePassword() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Client-side auth guard (same pattern as admin/home)
  useEffect(() => {
    const isAuthed =
      typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthed) {
      router.replace('/login');
    }
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to change password');
        return;
      }

      setSuccess(data.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setError('An error occurred. Please try again.');
      console.error('Change password error:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-6 py-10 max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Change Password</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update your admin password. (Demo is intentionally missing CSRF protection.)
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/home')}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Current password"
            />
            <p className="mt-1 text-xs text-gray-500">
              For demo, server only lightly checks this. Real apps must validate strictly.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="New password"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}


