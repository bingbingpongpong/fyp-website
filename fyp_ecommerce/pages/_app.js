// pages/_app.js
import Head from 'next/head';
import Script from 'next/script';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Load Tailwind CDN for quick setup */}
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />

      <Component {...pageProps} />
    </>
  );
}
