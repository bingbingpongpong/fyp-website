// pages/admin/reviews.js
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function AdminReviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    rating: 5,
    comment: '',
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const alertShown = useRef({});
  const reloadInitiated = useRef(false);

  // Client-side auth guard
  useEffect(() => {
    const isAuthed = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthed) {
      router.replace('/login');
      return;
    }
    fetchAllReviews();
  }, []);

  async function fetchAllReviews() {
    setLoading(true);
    setError('');
    try {
      // Call without product_id to get all reviews
      const res = await fetch('/api/reviews');
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load reviews');
      console.error('Fetch reviews error:', e);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(review) {
    setEditingId(review.id);
    setEditForm({
      name: review.name,
      rating: review.rating,
      comment: review.comment,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: '', rating: 5, comment: '' });
  }

  async function handleSave(reviewId) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/reviews?review_id=${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update review');
      }
      await fetchAllReviews();
      setEditingId(null);
      setEditForm({ name: '', rating: 5, comment: '' });
    } catch (e) {
      setError(e.message || 'Failed to save review');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    setDeletingId(reviewId);
    setError('');
    try {
      // Get product_id from the review first
      const review = reviews.find((r) => r.id === reviewId);
      if (!review) {
        throw new Error('Review not found');
      }
      const res = await fetch(`/api/reviews?product_id=${review.product_id}&review_id=${reviewId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete review');
      }
      await fetchAllReviews();
    } catch (e) {
      setError(e.message || 'Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Reviews</h1>
            <p className="mt-1 text-sm text-gray-600">Edit or delete customer reviews</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/admin/home')}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Admin
            </button>
            <button
              onClick={fetchAllReviews}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('xssEnabled', 'true');
                }
              }}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Enable XSS
            </button>
            <button
              onClick={async () => {
                if (!confirm('Disable XSS and remove all malicious scripts? This will disable XSS execution.')) return;
                // Prevent multiple executions
                if (reloadInitiated.current) return;
                reloadInitiated.current = true;
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('xssEnabled');
                  // Reload only once
                  window.location.reload();
                }
              }}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Disable XSS
            </button>
            <button
              onClick={async () => {
                if (!confirm('Delete ALL reviews and clear all malicious scripts? This cannot be undone!')) return;
                setLoading(true);
                try {
                  // Use cleanup endpoint for faster deletion
                  const res = await fetch('/api/reviews-cleanup', {
                    method: 'DELETE',
                  });
                  if (!res.ok) throw new Error('Failed to clear reviews');
                  
                  // Also clear XSS
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('xssEnabled');
                  }
                  
                  await fetchAllReviews();
                } catch (e) {
                  setError('Failed to delete all reviews');
                } finally {
                  setLoading(false);
                }
              }}
              className="rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Clear All Reviews & Scripts
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-600">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-600">No reviews found.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border bg-white p-6 shadow-sm"
              >
                {editingId === review.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Editing Review #{review.id}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(review.id)}
                          disabled={saving}
                          className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full rounded border px-3 py-2 text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Rating</label>
                        <select
                          value={editForm.rating}
                          onChange={(e) => setEditForm({ ...editForm, rating: Number(e.target.value) })}
                          className="w-full rounded border px-3 py-2 text-sm"
                        >
                          {[5, 4, 3, 2, 1].map((r) => (
                            <option key={r} value={r}>
                              {r} star{r !== 1 ? 's' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Comment</label>
                      <textarea
                        value={editForm.comment}
                        onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                        className="w-full rounded border px-3 py-2 text-sm"
                        rows={4}
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Note: HTML in comments will be rendered as-is (stored XSS vulnerability).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="font-semibold">{review.name}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            Product #{review.product_id}
                          </span>
                        </div>
                        <span className="text-yellow-500">
                          {'★'.repeat(Number(review.rating) || 5)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(review)}
                          className="rounded border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={deletingId === review.id}
                          className="rounded border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === review.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>

                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Comment Preview:</p>
                      <div className="prose max-w-none text-sm text-gray-800 whitespace-pre-wrap">
                        {review.comment}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-gray-400">
                      Created: {new Date(review.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

