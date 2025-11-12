// pages/women.js
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import ProductGrid from '../components/ProductGrid';

export default function Women({ products }) {
  return (
    <>
      <Navigation />
      <ProductGrid title="Women's Collection" products={products} />
      <Footer />
    </>
  );
}

export async function getServerSideProps(context) {
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  try {
    const res = await fetch(`${protocol}://${host}/api/products?gender=2`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const products = await res.json();
    return { props: { products: Array.isArray(products) ? products : [] } };
  } catch (error) {
    console.error('Women page fetch error:', error);
    return { props: { products: [] } };
  }
}
