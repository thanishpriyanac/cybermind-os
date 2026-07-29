import './global.css';
import { Providers } from '../components/providers';
import { AuthProvider } from '../contexts/auth-context';
import { AppShell } from '../components/layout/app-shell';

export const metadata = {
  title: 'CYBERMIND OS - Analyst Console',
  description: 'v0.8.0-alpha Analyst Console',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <Providers>
          <AuthProvider>
            <AppShell>
              {children}
            </AppShell>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
