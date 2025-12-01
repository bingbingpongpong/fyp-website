// pages/index.js
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function Home() {
  const router = useRouter();
  const { redirect } = router.query;

  // VULNERABLE: Reflected XSS via redirect parameter
  // This is intentionally vulnerable for educational/demonstration purposes
  useEffect(() => {
    if (redirect && typeof window !== 'undefined') {
      // POTENTIALLY VULNERABLE: Using redirect parameter directly without sanitization
      // This allows javascript: protocol and other XSS vectors
      try {
        // Decode URL if needed
        const decodedRedirect = decodeURIComponent(redirect);
        
        // Check if it's a javascript: protocol (XSS vector)
        if (decodedRedirect.toLowerCase().startsWith('javascript:')) {
          // Execute the JavaScript (VULNERABLE)
          const jsCode = decodedRedirect.substring(11); // Remove 'javascript:' prefix
          // Use Function constructor to execute (more reliable than eval in some contexts)
          new Function(jsCode)();
        } else if (decodedRedirect.startsWith('http://') || decodedRedirect.startsWith('https://') || decodedRedirect.startsWith('/')) {
          // Regular URL redirect
          window.location.href = decodedRedirect;
        } else {
          // Try as relative path or direct assignment
          window.location.href = decodedRedirect;
        }
      } catch (e) {
        console.error('Redirect error:', e);
      }
    }
  }, [redirect]);

  return (
    <>
      <Head>
        <title>SwiftKicks Commerce | Premium Sportswear</title>
      </Head>

      <div className="bg-secondary font-sans">
        <Navigation />

        <section className="relative h-screen bg-black text-white overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
          <div className="container mx-auto px-6 h-full flex items-center relative z-20">
            <div className="max-w-lg">
              <h1 className="text-5xl font-bold mb-4">Elevate Your Game</h1>
              <p className="text-xl mb-8">Premium sportswear designed for performance and style</p>
              <Link href="/shop" className="bg-accent bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-8 rounded-full transition duration-300 inline-block">
                Shop Now
              </Link>
            </div>
          </div>
          <img src="/1.png" alt="Athlete running" className="absolute inset-0 w-full h-full object-cover z-0" />
        </section>

        <section className="py-16 container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Shop By Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/men" className="group relative overflow-hidden rounded-lg shadow-lg h-96">
              <img src="/2.png" alt="Men's collection" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-2xl font-bold">Men</h3>
                <p className="opacity-80">Performance & Style</p>
              </div>
            </Link>

            <Link href="/women" className="group relative overflow-hidden rounded-lg shadow-lg h-96">
              <img src="/3.png" alt="Women's collection" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-2xl font-bold">Women</h3>
                <p className="opacity-80">Designed for Movement</p>
              </div>
            </Link>

            <Link href="/kids" className="group relative overflow-hidden rounded-lg shadow-lg h-96">
              <img src="/4.png" alt="Kids collection" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-2xl font-bold">Kids</h3>
                <p className="opacity-80">Active & Playful</p>
              </div>
            </Link>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1,2,3,4].map((i) => (
                <div key={i} className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                  <div className="relative overflow-hidden h-64">
                    <img src={`/${4+i}.png`} alt={`Product ${i}`} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">Product {i} Name</h3>
                    <p className="text-gray-600 text-sm mb-2">Collection</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">${(49.99 + i*10).toFixed(2)}</span>
                      <button className="bg-primary text-white rounded-full px-4 py-2 text-sm hover:bg-opacity-90 transition-colors duration-300">Add to Cart</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/shop" className="inline-block border-2 border-primary text-primary font-bold py-3 px-8 rounded-full bg-white text-black hover:bg-black hover:text-white transition duration-300">
                View All Products
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-black text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="max-w-lg mx-auto mb-8">Subscribe to our newsletter for exclusive offers, new arrivals, and fitness tips.</p>
            <form className="max-w-md mx-auto flex" onSubmit={(e)=>e.preventDefault()}>
              <input type="email" placeholder="Your email address" className="flex-grow px-4 py-3 rounded-l-lg focus:outline-none text-gray-900" aria-label="email" />
              <button type="submit" className="bg-accent bg-red-700 hover:bg-red-800 px-6 py-3 rounded-r-lg font-bold transition duration-300">Subscribe</button>
            </form>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
