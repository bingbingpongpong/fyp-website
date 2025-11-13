// pages/search.js - VULNERABLE TO REFLECTED XSS
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import ProductGrid from '../components/ProductGrid';

export default function Search({ searchQuery }) {
  const router = useRouter();
  // Use server-side query if available, otherwise use client-side
  const q = searchQuery || router.query.q;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(q || '');
  const xssRef = useRef(null);
  const xssRef2 = useRef(null);
  const xssRef3 = useRef(null);

  useEffect(() => {
    if (q) {
      setSearchTerm(q);
      performSearch(q);
      
      // VULNERABLE: Direct DOM manipulation to ensure XSS works
      if (xssRef.current) {
        xssRef.current.innerHTML = String(q);
      }
      if (xssRef2.current) {
        xssRef2.current.innerHTML = `Results for: ${String(q)}`;
      }
      if (xssRef3.current) {
        xssRef3.current.innerHTML = `<strong>You searched for:</strong> ${String(q)}`;
      }
    }
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
    // VULNERABLE: Don't encode the search term in URL to allow XSS
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

        {/* VULNERABLE: Reflected XSS - Search term rendered without sanitization */}
        {q && (
          <div className="mb-6">
            <p className="text-gray-600">
              Search results for: <span ref={xssRef} />
            </p>
            {/* VULNERABLE: Also render in heading without sanitization */}
            <h2 className="text-xl font-semibold mb-2" ref={xssRef2} />
            <p className="text-sm text-gray-500 mt-2">
              Found {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
            {/* VULNERABLE: Render in div as well */}
            <div className="mt-4 p-4 bg-gray-100 rounded" ref={xssRef3} />
            {/* VULNERABLE: Also use dangerouslySetInnerHTML as backup */}
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm">Raw search term (dangerouslySetInnerHTML):</p>
              <div dangerouslySetInnerHTML={{ __html: String(q) }} />
            </div>
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

