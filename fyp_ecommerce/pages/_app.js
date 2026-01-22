// pages/_app.js
import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Tailwind CSS is now loaded locally via globals.css (not CDN) */}
      {/* This ensures the UI works offline and in VMware without internet access */}

      <Component {...pageProps} />
    </>
  );
}
