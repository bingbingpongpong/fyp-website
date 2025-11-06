// pages/kids.js
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function Kids() {
  return (
    <>
      <Navigation />
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Kids' Collection</h1>
        <p>Placeholder page for kids' products. Populate with product list or API-driven data.</p>
      </main>
      <Footer />
    </>
  );
}
