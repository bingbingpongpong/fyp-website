import Link from 'next/link';
import { useState } from 'react';

export default function ProductGrid({ title, products }) {
  const productList = Array.isArray(products) ? products : [];
  const [feedback, setFeedback] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  const handleAddToCart = async (productId) => {
    setLoadingId(productId);
    setFeedback('');
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      if (res.ok) {
        setFeedback('Added to cart');
      } else {
        const data = await res.json();
        setFeedback(data.message || 'Unable to add to cart');
      }
    } catch (e) {
      setFeedback('Network error, try again');
    } finally {
      setLoadingId(null);
      setTimeout(() => setFeedback(''), 2500);
    }
  };

  return (
    <section className="container mx-auto px-6 py-10">
      <header className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-gray-500">Browse the latest arrivals tailored for you.</p>
        </div>
        {feedback && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
            {feedback}
          </span>
        )}
      </header>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {productList.map((product) => (
          <article
            key={product.id}
            className="group relative rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <Link href={`/product/${product.id}`} className="block">
              <div className="relative h-72 overflow-hidden rounded-t-3xl bg-gray-50">
                <img
                  src={product.image || '/2.png'}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {product.sale && (
                  <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    Sale
                  </span>
                )}
              </div>
              <div className="space-y-3 p-6 pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">#{product.id.toString().padStart(4, '0')}</p>
                </div>
              </div>
            </Link>
            <div className="flex items-center justify-between px-6 pb-6 pt-0">
              <div className="flex flex-col">
                {product.sale && product.sale_price !== null && product.sale_price !== undefined ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-red-600">S${Number(product.sale_price).toFixed(2)}</span>
                      <span className="text-sm text-gray-400 line-through">S${product.price.toFixed(2)}</span>
                    </div>
                    <span className="text-xs text-red-600 font-semibold">
                      {Math.round((1 - product.sale_price / product.price) * 100)}% OFF
                    </span>
                  </>
                ) : (
                  <p className="text-xl font-bold text-gray-900">S${product.price.toFixed(2)}</p>
                )}
              </div>
              <button
                onClick={() => handleAddToCart(product.id)}
                disabled={loadingId === product.id}
                className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loadingId === product.id ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </article>
        ))}
      </div>
      {!productList.length && (
        <p className="mt-6 text-center text-sm text-gray-500">
          No products available right now. Check back soon!
        </p>
      )}
    </section>
  );
}


