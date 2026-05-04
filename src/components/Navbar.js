import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function Navbar() {
  const router = useRouter();
  const { isDarkMode, toggleMode } = useTheme();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setMenuOpen(false);
    router.push('/auth');
  };

  const isAdmin = user?.email === 'thantzin84727@gmail.com';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && !e.target.closest('.nav-menu-container')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  return (
    <>
      {/* Top Right Corner - Simple Button */}
      <div className="fixed top-5 right-5 z-50 nav-menu-container">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200"
          style={{
            background: isDarkMode ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: isDarkMode ? '#f1f5f9' : '#334155' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.button>

        {/* Dropdown Menu - Small, from top-right corner */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-12 right-0 w-56 rounded-xl shadow-xl overflow-hidden"
              style={{
                background: isDarkMode ? '#1e293b' : '#ffffff',
                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.02)'
              }}
            >
              {/* Menu Items */}
              <div className="py-2">
                <Link href="/" onClick={() => setMenuOpen(false)}>
                  <div className="px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>
                    Shop
                  </div>
                </Link>
                <Link href="/orders" onClick={() => setMenuOpen(false)}>
                  <div className="px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>
                    My Orders
                  </div>
                </Link>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                  <div className="px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>
                    Referral Dashboard
                  </div>
                </Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)}>
                  <div className="px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>
                    Profile
                  </div>
                </Link>

                <div className="border-t my-1" style={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0' }} />

                <Link href="/settings" onClick={() => setMenuOpen(false)}>
                  <div className="px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>
                    Settings
                  </div>
                </Link>

                {isAdmin && (
                  <Link href="/admin-dashboard" onClick={() => setMenuOpen(false)}>
                    <div className="px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>
                      Admin Panel
                    </div>
                  </Link>
                )}

                <div className="border-t my-1" style={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0' }} />

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
