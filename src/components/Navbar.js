import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';

export default function Navbar({ isDarkMode, toggleTheme }) {
  const router = useRouter();
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] bg-clip-text text-transparent">
            Digital Hub
          </Link>
          
          <div className="hidden md:flex items-center gap-4">
            <Link href="/theme" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:text-[#FF6B35]`}>
              🎨 Theme
            </Link>
            {user && isAdmin && (
              <Link href="/admin-dashboard" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:text-[#FF6B35]`}>
                🔧 Admin
              </Link>
            )}
            {user ? (
              <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-500">
                🚪 Logout
              </button>
            ) : (
              <Link href="/auth" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:text-[#FF6B35]`}>
                🔐 Login
              </Link>
            )}
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/10">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-white/10">
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/20 flex flex-col gap-3">
            <Link href="/theme" onClick={() => setMobileMenuOpen(false)} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:text-[#FF6B35]`}>
              🎨 Theme
            </Link>
            {user && isAdmin && (
              <Link href="/admin-dashboard" onClick={() => setMobileMenuOpen(false)} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:text-[#FF6B35]`}>
                🔧 Admin
              </Link>
            )}
            {user ? (
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-sm text-red-400 hover:text-red-500 text-left">
                🚪 Logout
              </button>
            ) : (
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:text-[#FF6B35]`}>
                🔐 Login
              </Link>
            )}
            <button onClick={() => { toggleTheme(); setMobileMenuOpen(false); }} className="text-sm text-left">
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
