import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const manifestHref =
  process.env.NODE_ENV === 'production'
    ? '/familieknappen/manifest.webmanifest'
    : '/manifest.webmanifest';

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="nb">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#2b6cb0" />
        <link rel="manifest" href={manifestHref} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
