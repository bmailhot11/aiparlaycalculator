import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-MXBFQ4D4VH" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-MXBFQ4D4VH');
            `,
          }}
        />
        
        {/* Favicon */}
        <link rel="icon" href="/betchekr_owl_logo.ico" />
        
        {/* Meta tags for SEO */}
        <meta name="theme-color" content="#0B0F14" />
        <meta name="author" content="BetChekr" />
        
        {/* Open Graph defaults */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BetChekr" />
        
        {/* Twitter Card defaults */}
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}