import { useEffect, useMemo, useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function Cart({ initialItems }) {
  const [items, setItems] = useState(Array.isArray(initialItems) ? initialItems : []);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Ensure hydration consistency
    setItems(Array.isArray(initialItems) ? initialItems : []);
  }, [initialItems]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity)), 0);
    const shipping = items.length ? 5 : 0;
    const grand = subtotal + shipping;
    return {
      subtotal,
      shipping,
      grand,
    };
  }, [items]);

  async function refresh() {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore
    }
  }

  async function updateQuantity(id, quantity) {
    setUpdatingId(id);
    setError('');
    try {
      const qty = Math.max(1, Number(quantity) || 1);
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity: qty }),
      });
      if (!res.ok) throw new Error('Failed to update quantity');
      await refresh();
    } catch (e) {
      setError(e.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(id) {
    setUpdatingId(id);
    setError('');
    try {
      const res = await fetch(`/api/cart?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove item');
      await refresh();
    } catch (e) {
      setError(e.message || 'Remove failed');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-6 py-10">
        <h1 className="mb-6 text-3xl font-bold">Your Cart</h1>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-gray-600">Your cart is empty.</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-4 rounded-xl border p-4">
                  <img
                    src={it.image || '/2.png'}
                    alt={it.product_name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{it.product_name}</h3>
                      <span className="font-semibold">S${Number(it.price).toFixed(2)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="text-sm text-gray-500">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => updateQuantity(it.id, e.target.value)}
                        className="w-20 rounded border px-2 py-1"
                        disabled={updatingId === it.id}
                      />
                      <button
                        onClick={() => removeItem(it.id)}
                        className="ml-auto rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-700"
                        disabled={updatingId === it.id}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <aside className="rounded-xl border p-4 h-fit">
              <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">S${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">S${totals.shipping.toFixed(2)}</span>
                </div>
                <div className="mt-2 border-t pt-2 flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">S${totals.grand.toFixed(2)}</span>
                </div>
              </div>
              <a
                href="/checkout"
                className="mt-4 block w-full rounded-full bg-black py-3 text-center text-white transition hover:bg-gray-900"
              >
                Checkout
              </a>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export async function getServerSideProps(context) {
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  try {
    const res = await fetch(`${protocol}://${host}/api/cart`);
    const items = await res.json();
    return { props: { initialItems: Array.isArray(items) ? items : [] } };
  } catch {
    return { props: { initialItems: [] } };
  }
}


