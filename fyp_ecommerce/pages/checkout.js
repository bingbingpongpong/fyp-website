// pages/checkout.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function Checkout() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
  });

  useEffect(() => {
    async function loadCart() {
      try {
        const res = await fetch('/api/cart');
        const items = await res.json();
        setCartItems(Array.isArray(items) ? items : []);
      } catch (e) {
        setError('Failed to load cart');
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, []);

  const totals = {
    subtotal: cartItems.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0),
    shipping: cartItems.length ? 5 : 0,
    grand: 0,
  };
  totals.grand = totals.subtotal + totals.shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Format card number (add spaces every 4 digits)
    if (name === 'cardNumber') {
      const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
      const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
      setFormData({ ...formData, [name]: formatted.substring(0, 19) });
    }
    // Format expiry date (MM/YY)
    else if (name === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      if (cleaned.length >= 2) {
        formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
      }
      setFormData({ ...formData, [name]: formatted.substring(0, 5) });
    }
    // Format CVV (3-4 digits only)
    else if (name === 'cvv') {
      setFormData({ ...formData, [name]: value.replace(/\D/g, '').substring(0, 4) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems,
          totals,
          payment: {
            cardNumber: formData.cardNumber.replace(/\s/g, ''),
            expiryDate: formData.expiryDate,
            cvv: formData.cvv,
            cardholderName: formData.cardholderName,
          },
          shipping: {
            email: formData.email,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Checkout failed');
      }

      setSuccess(true);
      // Clear cart - delete all items
      for (const item of cartItems) {
        await fetch(`/api/cart?id=${item.id}`, { method: 'DELETE' });
      }
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto px-6 py-10">
          <p>Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (cartItems.length === 0 && !success) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto px-6 py-10">
          <h1 className="mb-4 text-3xl font-bold">Checkout</h1>
          <p className="text-gray-600">Your cart is empty.</p>
          <a href="/cart" className="mt-4 inline-block text-blue-600 hover:underline">
            Return to Cart
          </a>
        </main>
        <Footer />
      </>
    );
  }

  if (success) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto px-6 py-10 text-center">
          <div className="mx-auto max-w-md rounded-lg border border-green-200 bg-green-50 p-8">
            <div className="mb-4 text-5xl">✓</div>
            <h1 className="mb-2 text-2xl font-bold text-green-800">Order Placed Successfully!</h1>
            <p className="text-green-700">Thank you for your purchase. Redirecting to home...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout | GreenFactory</title>
      </Head>
      <Navigation />
      <main className="container mx-auto px-6 py-10">
        <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Information */}
              <section className="rounded-xl border p-6">
                <h2 className="mb-4 text-xl font-semibold">Payment Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Cardholder Name</label>
                    <input
                      type="text"
                      name="cardholderName"
                      value={formData.cardholderName}
                      onChange={handleChange}
                      required
                      className="w-full rounded border px-4 py-2"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      required
                      className="w-full rounded border px-4 py-2"
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        required
                        className="w-full rounded border px-4 py-2"
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        required
                        className="w-full rounded border px-4 py-2"
                        placeholder="123"
                        maxLength="4"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Shipping Information */}
              <section className="rounded-xl border p-6">
                <h2 className="mb-4 text-xl font-semibold">Shipping Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded border px-4 py-2"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full rounded border px-4 py-2"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full rounded border px-4 py-2"
                        placeholder="Singapore"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                        className="w-full rounded border px-4 py-2"
                        placeholder="123456"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-black py-3 text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {submitting ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <aside className="rounded-xl border p-6 h-fit">
            <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
            <div className="mb-4 space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="font-medium">S${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">S${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">S${totals.shipping.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">S${totals.grand.toFixed(2)}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

