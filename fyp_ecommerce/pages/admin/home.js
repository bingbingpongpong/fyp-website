// pages/admin/home.js
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useRouter } from 'next/router';

export default function AdminHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    gender_id: '1',
    sale: false,
    sale_price: '',
    image: '/2.png',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Client-side auth guard
  useEffect(() => {
    const isAuthed = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthed) {
      router.replace('/login');
      return;
    }
    fetchProducts();
    fetchSearchHistory();
  }, []);

  async function fetchSearchHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/search-history');
      const data = await res.json();
      setSearchHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load search history:', e);
    } finally {
      setLoadingHistory(false);
    }
  }

  const stats = useMemo(() => {
    return {
      total: products.length,
      onSale: products.filter(p => p.sale).length,
      avgPrice: products.length
        ? (products.reduce((s, p) => s + Number(p.price || 0), 0) / products.length).toFixed(2)
        : '0.00',
    };
  }, [products]);

  async function fetchProducts() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setEditingId(null);
    setForm({ name: '', price: '', gender_id: '1', sale: false, sale_price: '', image: '/2.png' });
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: String(p.price),
      gender_id: String(p.gender_id),
      sale: Boolean(p.sale),
      sale_price: p.sale_price ? String(p.sale_price) : '',
      image: p.image || '/2.png',
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (!form.name || form.price === '') {
        setError('Name and price are required');
        return;
      }
      const payload = {
        name: form.name,
        price: Number(form.price),
        gender_id: Number(form.gender_id),
        sale: Boolean(form.sale),
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        image: form.image || '/2.png',
      };
      if (editingId) {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (!res.ok) throw new Error('Update failed');
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Create failed');
      }
      await fetchProducts();
      startCreate();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchProducts();
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Link
            href="/admin/reviews"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Manage Reviews
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">Total Products</h2>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">On Sale</h2>
            <p className="text-3xl font-bold">{stats.onSale}</p>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">Avg Price</h2>
            <p className="text-3xl font-bold">S${stats.avgPrice}</p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* Create / Edit form */}
        <div className="mb-8 rounded bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{editingId ? 'Edit Product' : 'Create Product'}</h3>
            {editingId && (
              <button
                className="text-sm text-gray-500 underline"
                onClick={startCreate}
              >
                Cancel edit
              </button>
            )}
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <input
              className="md:col-span-2 rounded border px-3 py-2"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className="md:col-span-1 rounded border px-3 py-2"
              type="number"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              required
            />
            <select
              className="md:col-span-1 rounded border px-3 py-2"
              value={form.gender_id}
              onChange={(e) => setForm((f) => ({ ...f, gender_id: e.target.value }))}
            >
              <option value="1">Men</option>
              <option value="2">Women</option>
              <option value="3">Kids</option>
            </select>
            <label className="md:col-span-1 flex items-center gap-2 rounded border px-3 py-2">
              <input
                type="checkbox"
                checked={form.sale}
                onChange={(e) => setForm((f) => ({ ...f, sale: e.target.checked }))}
              />
              <span>Sale</span>
            </label>
            {form.sale && (
              <input
                className="md:col-span-1 rounded border px-3 py-2"
                type="number"
                step="0.01"
                placeholder="Sale Price"
                value={form.sale_price}
                onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))}
              />
            )}
            <input
              className="md:col-span-6 rounded border px-3 py-2"
              placeholder="Image path (e.g., /2.png)"
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            />
            <div className="md:col-span-6">
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-black px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>

        {/* Products table */}
        <div className="overflow-x-auto rounded bg-white shadow">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Sale</th>
                <th className="px-4 py-3">Price (S$)</th>
                <th className="px-4 py-3">Sale Price (S$)</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6" colSpan={8}>Loading...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td className="px-4 py-6" colSpan={8}>No products</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">{p.id}</td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">
                      {p.gender_id === 1 ? 'Men' : p.gender_id === 2 ? 'Women' : 'Kids'}
                    </td>
                    <td className="px-4 py-3">{p.sale ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">{Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {p.sale_price ? Number(p.sale_price).toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs">{p.image || '/2.png'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="rounded border px-3 py-1"
                          onClick={() => startEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded border border-red-300 bg-red-50 px-3 py-1 text-red-700"
                          onClick={() => handleDelete(p.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Search History - VULNERABLE TO STORED XSS */}
        <div className="mt-8 rounded bg-white p-4 shadow">
          <h3 className="mb-4 text-lg font-semibold">Search History</h3>
          {loadingHistory ? (
            <p className="text-gray-600">Loading search history...</p>
          ) : searchHistory.length === 0 ? (
            <p className="text-gray-600">No search history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Search Term</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {searchHistory.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">{item.id}</td>
                      {/* Safe rendering - search term rendered as plain text */}
                      <td className="px-4 py-3">{item.search_term}</td>
                      <td className="px-4 py-3">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
