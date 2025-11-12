import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import ProductGrid from '../components/ProductGrid';

export default function Sale({ products }) {
  return (
    <>
      <Navigation />
      <ProductGrid title="Sale Picks" products={products} />
      <Footer />
    </>
  );
}

export async function getServerSideProps(context) {
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  try {
    const res = await fetch(`${protocol}://${host}/api/products?sale=true`);
    if (!res.ok) throw new Error('Failed to fetch sale products');
    const products = await res.json();
    return { props: { products: Array.isArray(products) ? products : [] } };
  } catch (error) {
    console.error('Sale page fetch error:', error);
    return { props: { products: [] } };
  }
}


