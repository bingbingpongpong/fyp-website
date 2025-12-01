// pages/search.js - VULNERABLE TO REFLECTED XSS
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import ProductGrid from '../components/ProductGrid';

export default function Search({ searchQuery }) {
  const router = useRouter();
  const q = searchQuery || router.query.q;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(q || '');

  useEffect(() => {
    if (q) {
      setSearchTerm(q);
      performSearch(q);
    }
  }, [q]);

  const highlightedTerm = useMemo(() => {
    if (!q) return '';
    // Build a small highlight message for the hero banner
    return `Showing results for <strong>${q}</strong>`;
  }, [q]);

  const announcement = useMemo(() => {
    if (!q) return '';
    const chips = q
      .split(' ')
      .filter(Boolean)
      .map((part) => `<span class="px-2 py-1 bg-white text-xs rounded">${part}</span>`)
      .join('');
    return `<div class="flex flex-wrap gap-2">${chips}</div>`;
  }, [q]);

  async function performSearch(term) {
    if (!term) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    router.push(`/search?q=${searchTerm}`);
    performSearch(searchTerm);
  }

  return (
    <>
      <Head>
        <title>Search | GreenFactory</title>
      </Head>
      <Navigation />
      <main className="container mx-auto px-6 py-10">
        <h1 className="mb-6 text-3xl font-bold">Search Products</h1>
        
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for products..."
              className="flex-1 rounded border px-4 py-2"
            />
            <button
              type="submit"
              className="rounded bg-black px-6 py-2 text-white"
            >
              Search
            </button>
          </div>
        </form>

        {q && (
          <div className="mb-6 space-y-3">
            <div
              className="rounded bg-amber-50 p-3 text-sm text-amber-900"
              dangerouslySetInnerHTML={{ __html: highlightedTerm }}
            />
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Found {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
            <div
              className="rounded border border-dashed border-gray-300 bg-white/70 p-3"
              dangerouslySetInnerHTML={{ __html: announcement }}
            />
          </div>
        )}

        {loading ? (
          <p>Searching...</p>
        ) : products.length > 0 ? (
          <ProductGrid products={products} />
        ) : q ? (
          <p className="text-gray-600">No products found.</p>
        ) : (
          <p className="text-gray-600">Enter a search term to begin.</p>
        )}
      </main>
      <Footer />
    </>
  );
}

// Get server-side props to ensure query parameter is available
export async function getServerSideProps(context) {
  const { q } = context.query;
  return {
    props: {
      searchQuery: q || null, // Pass raw query parameter
    },
  };
}

