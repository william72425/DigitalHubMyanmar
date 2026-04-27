import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminNavbar from '@/components/AdminNavbar';
import AdminThemeSwitcher from '@/components/AdminThemeSwitcher';
import { useTheme } from '@/context/ThemeContext';

export default function AdminThemes() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminAuth = sessionStorage.getItem('admin_auth');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-secondary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Theme Settings | Admin | Digital Hub Myanmar</title></Head>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--bg-primary), var(--bg-secondary), var(--bg-primary))' }}>
        <AdminNavbar />

        <div className="container mx-auto px-4 py-24 max-w-4xl">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
            Theme Settings
          </h1>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
            Change the global theme for all users. Day/Dark mode is controlled individually by each user.
          </p>

          <AdminThemeSwitcher />
        </div>
      </div>
    </>
  );
}
