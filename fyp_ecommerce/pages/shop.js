// pages/shop.js
import Head from 'next/head';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import ProductGrid from '../components/ProductGrid';

export async function getServerSideProps(context) {
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  try {
    const res = await fetch(`${protocol}://${host}/api/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const products = await res.json();
    return { props: { products: Array.isArray(products) ? products : [] } };
  } catch (error) {
    console.error('Shop page error:', error);
    return { props: { products: [] } };
  }
}

export default function Shop({ products }) {
  return (
    <>
      <Head>
        <title>Shop All Products | GreenFactory</title>
      </Head>
      <Navigation />
      <ProductGrid title="Shop All Products" products={products} />
      <Footer />
    </>
  );
}

