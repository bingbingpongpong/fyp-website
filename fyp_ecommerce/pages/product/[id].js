// pages/product/[id].js
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Product {id}</h1>
        <p>Product details placeholder for product ID: {id}</p>
      </main>
      <Footer />
    </>
  );
}
