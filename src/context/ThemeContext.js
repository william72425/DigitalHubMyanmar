import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';

const ThemeContext = createContext(null);

// ─── Theme Definitions ───────────────────────────────────────────────
const themes = {
  'midnight-matrix': {
    name: 'Midnight Matrix',
    description: 'Tech vibe — Navy/Cyan, Mono fonts, sharp frames',
    dark: {
      '--bg-primary': '#020617',
      '--bg-secondary': '#0a0f2a',
      '--bg-tertiary': '#0f172a',
      '--surface': 'rgba(255,255,255,0.05)',
      '--surface-hover': 'rgba(255,255,255,0.10)',
      '--surface-active': 'rgba(255,255,255,0.15)',
      '--border': 'rgba(255,255,255,0.10)',
      '--border-hover': 'rgba(0,212,255,0.40)',
      '--brand-primary': '#00D4FF',
      '--brand-secondary': '#FF6B35',
      '--brand-gradient': 'linear-gradient(135deg, #00D4FF, #0099CC)',
      '--accent-gradient': 'linear-gradient(135deg, #FF6B35, #00D4FF)',
      '--text-primary': '#f1f5f9',
      '--text-secondary': '#94a3b8',
      '--text-muted': '#64748b',
      '--text-inverse': '#020617',
      '--font-heading': "'JetBrains Mono', 'Fira Code', monospace",
      '--font-body': "'Inter', sans-serif",
      '--radius-sm': '4px',
      '--radius-md': '8px',
      '--radius-lg': '12px',
      '--radius-xl': '16px',
      '--shadow-sm': '0 2px 8px rgba(0,0,0,0.4)',
      '--shadow-md': '0 8px 24px rgba(0,0,0,0.5)',
      '--shadow-lg': '0 20px 50px rgba(0,0,0,0.6)',
      '--shadow-glow': '0 0 20px rgba(0,212,255,0.15)',
    },
    light: {
      '--bg-primary': '#f0f4f8',
      '--bg-secondary': '#e2e8f0',
      '--bg-tertiary': '#ffffff',
      '--surface': 'rgba(255,255,255,0.80)',
      '--surface-hover': 'rgba(255,255,255,0.95)',
      '--surface-active': 'rgba(255,255,255,1)',
      '--border': 'rgba(0,0,0,0.08)',
      '--border-hover': 'rgba(0,150,200,0.40)',
      '--brand-primary': '#0099CC',
      '--brand-secondary': '#FF6B35',
      '--brand-gradient': 'linear-gradient(135deg, #0099CC, #006699)',
      '--accent-gradient': 'linear-gradient(135deg, #FF6B35, #0099CC)',
      '--text-primary': '#0f172a',
      '--text-secondary': '#475569',
      '--text-muted': '#94a3b8',
      '--text-inverse': '#ffffff',
      '--font-heading': "'JetBrains Mono', 'Fira Code', monospace",
      '--font-body': "'Inter', sans-serif",
      '--radius-sm': '4px',
      '--radius-md': '8px',
      '--radius-lg': '12px',
      '--radius-xl': '16px',
      '--shadow-sm': '0 2px 8px rgba(0,0,0,0.06)',
      '--shadow-md': '0 8px 24px rgba(0,0,0,0.08)',
      '--shadow-lg': '0 20px 50px rgba(0,0,0,0.10)',
      '--shadow-glow': '0 0 20px rgba(0,150,200,0.08)',
    },
  },

  'royal-amethyst': {
    name: 'Royal Amethyst',
    description: 'Premium vibe — Purple/Teal, Sans-serif fonts, rounded frames',
    dark: {
      '--bg-primary': '#0c0a1d',
      '--bg-secondary': '#1a1333',
      '--bg-tertiary': '#231b42',
      '--surface': 'rgba(255,255,255,0.06)',
      '--surface-hover': 'rgba(255,255,255,0.12)',
      '--surface-active': 'rgba(255,255,255,0.18)',
      '--border': 'rgba(168,85,247,0.15)',
      '--border-hover': 'rgba(168,85,247,0.40)',
      '--brand-primary': '#a855f7',
      '--brand-secondary': '#14b8a6',
      '--brand-gradient': 'linear-gradient(135deg, #a855f7, #7c3aed)',
      '--accent-gradient': 'linear-gradient(135deg, #a855f7, #14b8a6)',
      '--text-primary': '#f5f3ff',
      '--text-secondary': '#a5a0c8',
      '--text-muted': '#6b6494',
      '--text-inverse': '#0c0a1d',
      '--font-heading': "'Playfair Display', Georgia, serif",
      '--font-body': "'DM Sans', 'Inter', sans-serif",
      '--radius-sm': '8px',
      '--radius-md': '16px',
      '--radius-lg': '24px',
      '--radius-xl': '32px',
      '--shadow-sm': '0 2px 12px rgba(168,85,247,0.08)',
      '--shadow-md': '0 8px 30px rgba(168,85,247,0.12)',
      '--shadow-lg': '0 20px 50px rgba(168,85,247,0.15)',
      '--shadow-glow': '0 0 25px rgba(168,85,247,0.15)',
    },
    light: {
      '--bg-primary': '#faf5ff',
      '--bg-secondary': '#ede9fe',
      '--bg-tertiary': '#ffffff',
      '--surface': 'rgba(255,255,255,0.85)',
      '--surface-hover': 'rgba(255,255,255,0.95)',
      '--surface-active': 'rgba(255,255,255,1)',
      '--border': 'rgba(168,85,247,0.12)',
      '--border-hover': 'rgba(168,85,247,0.35)',
      '--brand-primary': '#9333ea',
      '--brand-secondary': '#0d9488',
      '--brand-gradient': 'linear-gradient(135deg, #9333ea, #7c3aed)',
      '--accent-gradient': 'linear-gradient(135deg, #9333ea, #0d9488)',
      '--text-primary': '#1e1035',
      '--text-secondary': '#6b5b95',
      '--text-muted': '#a99dc4',
      '--text-inverse': '#ffffff',
      '--font-heading': "'Playfair Display', Georgia, serif",
      '--font-body': "'DM Sans', 'Inter', sans-serif",
      '--radius-sm': '8px',
      '--radius-md': '16px',
      '--radius-lg': '24px',
      '--radius-xl': '32px',
      '--shadow-sm': '0 2px 12px rgba(128,0,255,0.05)',
      '--shadow-md': '0 8px 30px rgba(128,0,255,0.08)',
      '--shadow-lg': '0 20px 50px rgba(128,0,255,0.10)',
      '--shadow-glow': '0 0 25px rgba(128,0,255,0.06)',
    },
  },

  'minimalist-slate': {
    name: 'Minimalist Slate',
    description: 'Clean vibe — Slate/Gray, Modern fonts, thin borders',
    dark: {
      '--bg-primary': '#111118',
      '--bg-secondary': '#1c1c24',
      '--bg-tertiary': '#25252f',
      '--surface': 'rgba(255,255,255,0.04)',
      '--surface-hover': 'rgba(255,255,255,0.08)',
      '--surface-active': 'rgba(255,255,255,0.12)',
      '--border': 'rgba(255,255,255,0.06)',
      '--border-hover': 'rgba(255,255,255,0.15)',
      '--brand-primary': '#e2e8f0',
      '--brand-secondary': '#64748b',
      '--brand-gradient': 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
      '--accent-gradient': 'linear-gradient(135deg, #e2e8f0, #64748b)',
      '--text-primary': '#e2e8f0',
      '--text-secondary': '#94a3b8',
      '--text-muted': '#64748b',
      '--text-inverse': '#111118',
      '--font-heading': "'Space Grotesk', 'Inter', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--radius-sm': '3px',
      '--radius-md': '6px',
      '--radius-lg': '10px',
      '--radius-xl': '14px',
      '--shadow-sm': '0 1px 3px rgba(0,0,0,0.3)',
      '--shadow-md': '0 4px 12px rgba(0,0,0,0.4)',
      '--shadow-lg': '0 12px 36px rgba(0,0,0,0.5)',
      '--shadow-glow': 'none',
    },
    light: {
      '--bg-primary': '#f8fafc',
      '--bg-secondary': '#f1f5f9',
      '--bg-tertiary': '#ffffff',
      '--surface': 'rgba(255,255,255,0.90)',
      '--surface-hover': 'rgba(255,255,255,1)',
      '--surface-active': 'rgba(255,255,255,1)',
      '--border': 'rgba(0,0,0,0.06)',
      '--border-hover': 'rgba(0,0,0,0.12)',
      '--brand-primary': '#334155',
      '--brand-secondary': '#94a3b8',
      '--brand-gradient': 'linear-gradient(135deg, #334155, #475569)',
      '--accent-gradient': 'linear-gradient(135deg, #334155, #94a3b8)',
      '--text-primary': '#1e293b',
      '--text-secondary': '#475569',
      '--text-muted': '#94a3b8',
      '--text-inverse': '#ffffff',
      '--font-heading': "'Space Grotesk', 'Inter', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--radius-sm': '3px',
      '--radius-md': '6px',
      '--radius-lg': '10px',
      '--radius-xl': '14px',
      '--shadow-sm': '0 1px 3px rgba(0,0,0,0.04)',
      '--shadow-md': '0 4px 12px rgba(0,0,0,0.06)',
      '--shadow-lg': '0 12px 36px rgba(0,0,0,0.08)',
      '--shadow-glow': 'none',
    },
  },
};

// ─── Provider ────────────────────────────────────────────────────────
export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState('midnight-matrix');
  const [mode, setMode] = useState('dark');
  const [mounted, setMounted] = useState(false);

  // Load global theme from Firestore (admin-controlled), fall back to localStorage cache
  useEffect(() => {
    const savedMode = localStorage.getItem('theme') || 'dark';
    setMode(savedMode);

    const loadGlobalTheme = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'theme'));
        if (snap.exists()) {
          const data = snap.data();
          const firestoreTheme = data.themeId || 'midnight-matrix';
          if (themes[firestoreTheme]) {
            setThemeId(firestoreTheme);
            localStorage.setItem('global_theme', firestoreTheme);
          }
        } else {
          // No Firestore doc yet — use localStorage cache or default
          const cached = localStorage.getItem('global_theme');
          if (cached && themes[cached]) setThemeId(cached);
        }
      } catch {
        // Firestore unavailable — use localStorage cache
        const cached = localStorage.getItem('global_theme');
        if (cached && themes[cached]) setThemeId(cached);
      } finally {
        // Ensure mounted is set to true regardless of success/failure
        setMounted(true);
      }
    };

    loadGlobalTheme();
  }, []);

  // Apply CSS variables whenever theme or mode changes (with transition fix)
  useEffect(() => {
    if (!mounted) return;
    
    // Small delay to ensure DOM is ready for transition
    const timeoutId = setTimeout(() => {
      const vars = themes[themeId]?.[mode];
      if (!vars) return;

      const root = document.documentElement;
      Object.entries(vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });

      // Add class to body for CSS transitions
      if (mode === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
      }
    }, 10);
    
    return () => clearTimeout(timeoutId);
  }, [themeId, mode, mounted]);

  // Admin-only: save theme via API so all users see the change
  const setTheme = useCallback(async (newThemeId) => {
    if (!themes[newThemeId]) return;
    const prevThemeId = themeId;
    setThemeId(newThemeId);
    localStorage.setItem('global_theme', newThemeId);
    try {
      const password = typeof window !== 'undefined'
        ? sessionStorage.getItem('admin_password') || ''
        : '';
      const res = await fetch('/api/admin/update-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId: newThemeId, password }),
      });
      if (!res.ok) {
        // Revert on failure so admin sees the actual state
        setThemeId(prevThemeId);
        localStorage.setItem('global_theme', prevThemeId);
        console.error('Failed to save theme:', await res.text());
      }
    } catch (err) {
      setThemeId(prevThemeId);
      localStorage.setItem('global_theme', prevThemeId);
      console.error('Failed to save theme:', err);
    }
  }, [themeId]);

  // User-controlled: Day/Dark mode stays in localStorage (per-browser)
  const toggleMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  const setModeDirectly = useCallback((newMode) => {
    setMode(newMode);
    localStorage.setItem('theme', newMode);
  }, []);

  const isDarkMode = mode === 'dark';
  const currentTheme = themes[themeId] || themes['midnight-matrix'];
  const currentVars = currentTheme[mode] || currentTheme.dark;

  // Provide default values for server-side rendering
  const value = {
    themeId,
    setTheme,
    mode,
    isDarkMode,
    toggleMode,
    setMode: setModeDirectly,
    currentTheme,
    currentVars,
    themes,
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback for components not wrapped in ThemeProvider (SSR safe)
    const fallbackTheme = themes['midnight-matrix'];
    return {
      themeId: 'midnight-matrix',
      setTheme: () => {},
      mode: 'dark',
      isDarkMode: true,
      toggleMode: () => {},
      setMode: () => {},
      currentTheme: fallbackTheme,
      currentVars: fallbackTheme.dark,
      themes,
      mounted: false,
    };
  }
  return ctx;
}

export { themes };
export default ThemeContext;
