// pages/admin/tools.js - Admin Tools Page with Vulnerable Command Execution
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function AdminTools() {
  const router = useRouter();
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupFilename, setBackupFilename] = useState('site_data.tar');

  // Client-side auth guard
  useEffect(() => {
    const isAuthed = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthed) {
      router.replace('/login');
    }
  }, [router]);

  async function handleBackup() {
    setBackupLoading(true);
    
    try {
      // Construct command - visible in Network tab for Burp Suite interception
      const command = `tar -cvf ${backupFilename} .`;
      
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filename: backupFilename,
          command: command  // Include command in request body for Burp Suite interception
        }),
      });

      const data = await res.json();
      
      // Command and output visible in Network tab → Response
      // Request body shows the command that will be executed (can be modified in Burp Suite)
    } catch (error) {
      // Silent error handling
    } finally {
      setBackupLoading(false);
    }
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Tools</h1>
          <Link
            href="/admin/home"
            className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* System Maintenance Section */}
        <div className="rounded bg-white p-6 shadow max-w-md">
          <h2 className="mb-4 text-xl font-semibold">System Maintenance</h2>
          <div className="mb-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Backup Filename
            </label>
            <input
              type="text"
              value={backupFilename}
              onChange={(e) => setBackupFilename(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="site_data.tar"
            />
          </div>
          <button
            onClick={handleBackup}
            disabled={backupLoading}
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {backupLoading ? 'Running Backup...' : 'Run System Backup'}
          </button>
        </div>

      </main>
      <Footer />
    </>
  );
}
