import Head from 'next/head';
import Navbar from '@/components/Navbar';
import { useTheme } from '@/context/ThemeContext';

export default function ThemePage() {
  const { isDarkMode, toggleMode } = useTheme();

  return (
    <>
      <Head><title>Theme | Digital Hub Myanmar</title></Head>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--bg-primary), var(--bg-secondary), var(--bg-primary))' }}>
        <Navbar />
        <div className="container mx-auto px-4 py-24 max-w-4xl">
          <div className="max-w-md mx-auto p-6" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Theme Settings</h1>
            <div className="flex justify-between items-center p-4" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Dark Mode</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Switch between dark and light theme</p>
              </div>
              <button onClick={toggleMode} className="px-4 py-2 theme-btn-primary">
                {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
