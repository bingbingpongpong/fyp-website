// pages/login.js
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function Login() {
  return (
    <>
      <Navigation />
      <main className="container mx-auto px-6 py-12 max-w-md">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        <form onSubmit={(e)=>e.preventDefault()} className="space-y-4">
          <input type="text" placeholder="Username" className="w-full px-4 py-2 border rounded" />
          <input type="password" placeholder="Password" className="w-full px-4 py-2 border rounded" />
          <button className="w-full bg-primary text-white py-2 rounded">Sign In</button>
        </form>
      </main>
      <Footer />
    </>
  );
}
