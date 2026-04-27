import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function AdminNavbar() {
  const router = useRouter();
  const { isDarkMode, toggleMode } = useTheme();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth');
  };

  const isAdmin = user?.email === 'thantzin84727@gmail.com';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'var(--surface)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold gradient-text">
            Digital Hub
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/theme" className="text-sm hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
              Theme
            </Link>
            
            {user && isAdmin && (
              <div className="relative group">
                <button className="text-sm hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
                  Admin &#9660;
                </button>
                <div className="absolute right-0 mt-2 w-48 backdrop-blur-md overflow-hidden hidden group-hover:block" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                  <Link href="/admin" className="block px-4 py-2 text-sm hover:opacity-80" style={{ color: 'var(--text-primary)' }}>Products & Features</Link>
                  <Link href="/admin/users" className="block px-4 py-2 text-sm hover:opacity-80" style={{ color: 'var(--text-primary)' }}>Users & Promo</Link>
                  <Link href="/admin/orders" className="block px-4 py-2 text-sm hover:opacity-80" style={{ color: 'var(--text-primary)' }}>Orders</Link>
                  <Link href="/admin/reviews" className="block px-4 py-2 text-sm hover:opacity-80" style={{ color: 'var(--text-primary)' }}>Reviews</Link>
                </div>
              </div>
            )}
            
            {user ? (
              <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-500">
                Logout
              </button>
            ) : (
              <Link href="/auth" className="text-sm hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
                Login
              </Link>
            )}
            
            <button onClick={toggleMode} className="p-2 rounded-full hover:opacity-80" style={{ background: 'var(--surface)' }}>
              {isDarkMode ? '\u2600\uFE0F' : '\u{1F319}'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
            {mobileMenuOpen ? '\u2715' : '\u2630'}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
            <Link href="/theme" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
              Theme
            </Link>
            {user && isAdmin && (
              <>
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:underline" style={{ color: 'var(--brand-primary)' }}>
                  Products & Features
                </Link>
                <Link href="/admin/users" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:underline" style={{ color: 'var(--brand-primary)' }}>
                  Users & Promo
                </Link>
                <Link href="/admin/reviews" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:underline" style={{ color: 'var(--brand-primary)' }}>
                  Reviews
                </Link>
              </>
            )}
            {user ? (
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-sm text-red-400 hover:text-red-500 text-left">
                Logout
              </button>
            ) : (
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
                Login
              </Link>
            )}
            <button onClick={() => { toggleMode(); setMobileMenuOpen(false); }} className="text-sm text-left" style={{ color: 'var(--text-secondary)' }}>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
