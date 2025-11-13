
import type { Metadata } from 'next';
import './globals.css'; // Global styles must be imported at the top level (not inside JSX)

export const metadata: Metadata = {
  title: 'Threat Watch Dashboard',
  description: 'Threat Watch Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
