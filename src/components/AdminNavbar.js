import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function AdminNavbar() {
  const router = useRouter();
  const { isDarkMode, toggleMode } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Check if admin is logged in via sessionStorage (ADMIN_PASSWORD)
    const checkAdminAuth = () => {
      const adminAuth = sessionStorage.getItem('admin_auth');
      setIsAdmin(adminAuth === 'true');
    };
    
    checkAdminAuth();
    
    // Optional: Listen for storage changes (if needed)
    window.addEventListener('storage', checkAdminAuth);
    return () => window.removeEventListener('storage', checkAdminAuth);
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

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAdmin(false);
    setMenuOpen(false);
    router.push('/admin');
  };

  // Clean, professional admin page list (no emojis in labels)
  const adminPages = [
    { href: '/admin', label: 'Products & Features' },
    { href: '/admin/rewards', label: 'Rewards' },
    { href: '/admin/points-settings', label: 'Points Settings' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/promo', label: 'Promo Codes' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/reviews', label: 'Reviews' },
    { href: '/admin/themes', label: 'Themes' },
    { href: '/admin/commission-payments', label: 'Commission Payments' },
    { href: '/admin/promo-partners', label: 'Promo Partners' }
  ];

  // If not admin, don't show anything
  if (!isAdmin) return null;

  return (
    <div className="fixed top-6 right-6 z-50 admin-menu-container">
      {/* Menu Button - Clean, no emoji */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 border"
        style={{
          background: isDarkMode ? '#1e293b' : '#ffffff',
          borderColor: isDarkMode ? '#334155' : '#e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        <span className="text-lg font-medium" style={{ color: isDarkMode ? '#f1f5f9' : '#334155' }}>
          Menu
        </span>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-12 right-0 w-56 rounded-lg shadow-lg overflow-hidden"
            style={{
              background: isDarkMode ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <div className="py-1 max-h-[70vh] overflow-y-auto">
              {/* Admin Header - Clean */}
              <div className="px-4 py-3 border-b" style={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60" style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}>
                  Admin Panel
                </p>
              </div>

              {/* Navigation Links - No emojis */}
              <div className="py-1">
                {adminPages.map((page) => {
                  const isActive = router.pathname === page.href;
                  return (
                    <Link key={page.href} href={page.href} onClick={() => setMenuOpen(false)}>
                      <div
                        className={`px-4 py-2 text-sm transition-colors duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-gray-100 dark:bg-gray-700 font-medium'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        style={{ 
                          color: isActive 
                            ? (isDarkMode ? '#f1f5f9' : '#0f172a')
                            : (isDarkMode ? '#cbd5e1' : '#475569')
                        }}
                      >
                        {page.label}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t my-1" style={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0' }} />

              {/* Settings & Logout */}
              <div className="py-1">
                <button
                  onClick={toggleMode}
                  className="w-full text-left px-4 py-2 text-sm transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800"
                  style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
                >
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800 text-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
