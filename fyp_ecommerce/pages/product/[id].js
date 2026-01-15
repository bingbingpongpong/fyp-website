// pages/product/[id].js
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;

  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [xssEnabled, setXssEnabled] = useState(false);
  const [shouldRenderXSS, setShouldRenderXSS] = useState(false);
  const alertShown = useRef(false);
  const reloadInitiated = useRef(false);
  const redirectExecuted = useRef(false);

  useEffect(() => {
    if (!id) return;

    // Check if user is admin (for demo purposes)
    if (typeof window !== 'undefined') {
      const isAuthed = localStorage.getItem('isAuthenticated') === 'true';
      setIsAdmin(isAuthed);

      // Check if XSS is enabled (simple boolean flag)
      const xssEnabledFlag = localStorage.getItem('xssEnabled') === 'true';
      setXssEnabled(xssEnabledFlag);
      
      // Set shouldRenderXSS based on flag
      if (xssEnabledFlag) {
        setShouldRenderXSS(true);
      }
    }

    async function loadReviews() {
      try {
        const res = await fetch(`/api/reviews?product_id=${id}`);
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch (e) {
        // ignore errors for demo
        setReviews([]);
      }
    }

    loadReviews();
  }, [id]);

  // Update shouldRenderXSS when xssEnabled changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShouldRenderXSS(xssEnabled);
  }, [xssEnabled]);

  // Note: Removed redirect protection to allow XSS to work properly
  // In a real scenario, this would be a security vulnerability

  async function handleSubmit(e) {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews?product_id=${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rating, comment }),
      });
      if (res.ok) {
        const created = await res.json();
        setReviews((prev) => [created, ...prev]);
        setName('');
        setRating(5);
        setComment('');
      }
    } catch {
      // ignore for demo
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews?product_id=${id}&review_id=${reviewId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    } catch {
      // ignore for demo
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-6 py-12 space-y-10">
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Product {id}</h1>
              <p className="text-gray-600">
                Product details placeholder for product ID:{' '}
                <span className="font-mono">{id}</span>
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {/* XSS Control - Available to all users for demo */}
              {shouldRenderXSS ? (
                <button
                  onClick={() => {
                    localStorage.removeItem('xssEnabled');
                    setXssEnabled(false);
                    setShouldRenderXSS(false);
                    window.location.reload();
                  }}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  🚨 Disable XSS
                </button>
              ) : (
                <button
                  onClick={() => {
                    localStorage.setItem('xssEnabled', 'true');
                    setXssEnabled(true);
                    setShouldRenderXSS(true);
                  }}
                  className="rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                >
                  ⚠️ Enable XSS (Demo)
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={async () => {
                    if (!confirm('Clear ALL reviews?')) return;
                    try {
                      const res = await fetch('/api/reviews-cleanup', { method: 'DELETE' });
                      if (res.ok) {
                        window.location.reload();
                      }
                    } catch (e) {
                      console.error('Failed to clear reviews:', e);
                    }
                  }}
                  className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                >
                  Clear All Reviews
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Customer Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-600 text-sm">
                No reviews yet. Be the first to write one.
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border bg-white/60 p-4 shadow-sm"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{review.name}</span>
                        <span className="text-xs text-yellow-500">
                          {'★'.repeat(Number(review.rating) || 5)}
                        </span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={deletingId === review.id}
                          className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === review.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>

                    {/* POTENTIALLY VULNERABLE (for lab demonstration):
                        Rendering with HTML because reviews may contain formatting.
                        NOTE: XSS is enabled when shouldRenderXSS flag is true.
                        Redirects are limited to once per session to prevent loops. */}
                    {shouldRenderXSS ? (
                      <div
                        className="prose max-w-none text-sm text-gray-800"
                        dangerouslySetInnerHTML={{ __html: review.comment }}
                      />
                    ) : (
                      <div className="prose max-w-none text-sm text-gray-800 whitespace-pre-wrap">
                        {review.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Write a Review</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} star{r !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  rows={4}
                  placeholder="Share your experience with this product..."
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supports basic formatting like &lt;b&gt;bold&lt;/b&gt; and
                  &lt;i&gt;italic&lt;/i&gt;.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-70"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

