import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function AdminNavbar() {
  const router = useRouter();
  const { isDarkMode, toggleMode } = useTheme();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && !e.target.closest('.admin-menu-container')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    await signOut(auth);
    setMenuOpen(false);
    router.push('/auth');
  };

  const isAdmin = user?.email === 'thantzin84727@gmail.com';

  // List of admin pages (from screenshot, excluding partner-commission-dashboard.js)
  const adminPages = [
    { href: '/admin', label: '📦 Products & Features', icon: '📦' },
    { href: '/admin/rewards', label: '🎁 Rewards', icon: '🎁' },
    { href: '/admin/points-settings', label: '💰 Points Settings', icon: '💰' },
    { href: '/admin/orders', label: '📋 Orders', icon: '📋' },
    { href: '/admin/promo', label: '🏷️ Promo Codes', icon: '🏷️' },
    { href: '/admin/users', label: '👥 Users', icon: '👥' },
    { href: '/admin/reviews', label: '⭐ Reviews', icon: '⭐' },
    { href: '/admin/themes', label: '🎨 Themes', icon: '🎨' },
    { href: '/admin/commission-payments', label: '💰 Commission Payments', icon: '💰' },
    { href: '/admin/promo-partners', label: '🤝 Promo Partners', icon: '🤝' }
  ];

  // If not admin or not logged in, don't show anything
  if (!user || !isAdmin) return null;

  return (
    <div className="fixed top-5 right-5 z-50 admin-menu-container">
      {/* 🔘 Admin Corner Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
        style={{
          background: isDarkMode ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <span className="text-xl" style={{ color: isDarkMode ? '#f1f5f9' : '#334155' }}>
          🛡️
        </span>
      </motion.button>

      {/* 📋 Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-12 right-0 w-64 rounded-xl shadow-xl overflow-hidden"
            style={{
              background: isDarkMode ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <div className="py-2 max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="px-4 py-3 border-b" style={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}>
                  Admin Panel
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>
                  {user?.email || 'Admin'}
                </p>
              </div>

              {/* Navigation Links */}
              <div className="py-2">
                {adminPages.map((page) => {
                  const isActive = router.pathname === page.href;
                  return (
                    <Link key={page.href} href={page.href} onClick={() => setMenuOpen(false)}>
                      <div
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#00D4FF]/10 border-l-4 border-[#FF6B35]'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}
                      >
                        <span className="text-lg">{page.icon}</span>
                        <span>{page.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t my-1" style={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0' }} />

              {/* Settings & Logout */}
              <div className="py-2">
                <button
                  onClick={toggleMode}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700"
                  style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}
                >
                  <span className="text-lg">{isDarkMode ? '☀️' : '🌙'}</span>
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                >
                  <span className="text-lg">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
