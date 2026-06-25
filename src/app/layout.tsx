import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AlertProvider } from '@/components/AlertProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Code Reviewer - Análisis Automático de Código',
  description:
    'Obtené revisiones de código automáticas generadas por IA de tus repositorios y Pull Requests de GitHub.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark h-full">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-full flex flex-col antialiased`}>
        <AlertProvider>
          <Navbar />
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>
        </AlertProvider>
      </body>
    </html>
  );
}
