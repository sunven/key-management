import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { getLocale, getMessages } from 'next-intl/server';
import { Navbar } from '@/components/layout/navbar';
import { IntlProvider } from '@/components/providers/intl-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Key Management System',
  description: 'Manage your API providers and tokens',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <IntlProvider locale={locale} messages={messages}>
            <div className="fixed inset-0 z-[-1] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <Navbar />
            {children}
            <Toaster className="font-mono" />
          </IntlProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
