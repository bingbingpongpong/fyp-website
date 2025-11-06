// pages/admin/home.js
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function AdminHome() {
  return (
    <>
      <Navigation />
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">Sales (30d)</h2>
            <p className="text-3xl font-bold">SGD 4,532</p>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">Products</h2>
            <p className="text-3xl font-bold">128</p>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">Active Users</h2>
            <p className="text-3xl font-bold">342</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Quick Actions</h3>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-primary text-white rounded">Add Product</button>
            <button className="px-4 py-2 border rounded">View Orders</button>
            <button className="px-4 py-2 border rounded">Manage Users</button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
