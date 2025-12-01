import { useEffect, useMemo, useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

// Simple "cashback prize" page used in phishing-style demos.
// Looks like a normal marketing/notifications page.

const AMOUNTS = [12.54, 48.2, 942.03, 5.99, 120.0, 33.33];

function randomTxId() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `TX-${n}`;
}

function randomAmount() {
  const value = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
  return `$${value.toFixed(2)}`;
}

export default function PrizePage() {
  const [counter, setCounter] = useState(3);
  const [rows, setRows] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Initialize rows only on client to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    setRows(
      Array.from({ length: 4 }).map(() => ({
        id: randomTxId(),
        amount: randomAmount(),
      }))
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((c) => c + 1);
      setRows((existing) => {
        const next = [{ id: randomTxId(), amount: randomAmount() }, ...existing];
        return next.slice(0, 6);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const headline = useMemo(
    () => `Congratulations, your cashback is ready`,
    []
  );

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-3xl border border-emerald-100 bg-white/80 p-8 shadow-xl backdrop-blur">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
                  Rewards Center
                </p>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">
                  {headline}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Your latest cashback transaction has been generated based on your recent
                  purchases.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                <p className="text-[10px] uppercase tracking-wide text-emerald-500">
                  Ready payouts
                </p>
                <p className="text-2xl font-semibold text-emerald-700">{counter}</p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                Latest generated cashback
              </p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {mounted && rows[0]?.amount ? rows[0].amount : '$0.00'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Transaction reference: <span className="font-mono text-xs">{mounted && rows[0]?.id ? rows[0].id : '---'}</span>
              </p>
            </div>

            <div className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-gray-800">
                Recent cashback generations
              </h2>
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Transaction ID
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mounted && rows.length > 0 ? (
                      rows.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-2 font-mono text-xs text-gray-700">
                            {row.id}
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-emerald-700">
                            {row.amount}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-center text-xs text-gray-400">
                          Loading...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-gray-50/80 p-4 text-sm">
              <p className="font-medium text-gray-800">
                Download your cashback confirmation
              </p>
              <p className="text-xs text-gray-500">
                For security checks, some browsers may show a warning when downloading
                executables. This demo file is harmless and only used for educational purposes.
              </p>
              <a
                href="/downloads/reward.exe.txt"
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-black"
              >
                <span>Download cashback confirmation</span>
              </a>
            </div>
          </div>
        </div>
      </main>
  
    </>
  );
}


