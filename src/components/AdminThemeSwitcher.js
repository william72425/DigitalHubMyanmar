import { useState } from 'react';
import { useTheme, themes } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { Sun, Moon, Palette, Check } from 'lucide-react';

const themePreviewColors = {
  'midnight-matrix': {
    bg: '#020617',
    accent: '#00D4FF',
    secondary: '#FF6B35',
    label: 'Tech',
  },
  'royal-amethyst': {
    bg: '#0c0a1d',
    accent: '#a855f7',
    secondary: '#14b8a6',
    label: 'Premium',
  },
  'minimalist-slate': {
    bg: '#111118',
    accent: '#e2e8f0',
    secondary: '#64748b',
    label: 'Clean',
  },
};

export default function AdminThemeSwitcher() {
  const { themeId, setTheme, mode, isDarkMode, toggleMode } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 rounded-xl transition-all"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-3">
          <Palette size={20} style={{ color: 'var(--brand-primary)' }} />
          <div className="text-left">
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Global Theme
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {themes[themeId]?.name || 'Midnight Matrix'} &middot; {isDarkMode ? 'Dark' : 'Light'}
            </p>
          </div>
        </div>
        <span
          className="text-xs font-medium px-2 py-1 rounded-md"
          style={{
            background: 'var(--brand-primary)',
            color: 'var(--text-inverse)',
          }}
        >
          {expanded ? 'Close' : 'Configure'}
        </span>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          {/* Day/Dark Mode Toggle */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Mode
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => !isDarkMode || toggleMode()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isDarkMode ? 'var(--surface)' : 'var(--brand-primary)',
                  color: isDarkMode ? 'var(--text-secondary)' : 'var(--text-inverse)',
                  border: `1px solid ${isDarkMode ? 'var(--border)' : 'transparent'}`,
                }}
              >
                <Sun size={16} />
                Day
              </button>
              <button
                onClick={() => isDarkMode || toggleMode()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isDarkMode ? 'var(--brand-primary)' : 'var(--surface)',
                  color: isDarkMode ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  border: `1px solid ${!isDarkMode ? 'var(--border)' : 'transparent'}`,
                }}
              >
                <Moon size={16} />
                Dark
              </button>
            </div>
          </div>

          {/* Theme Presets */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Theme Preset
            </p>
            <div className="space-y-2">
              {Object.entries(themes).map(([id, theme]) => {
                const preview = themePreviewColors[id];
                const isActive = themeId === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-all"
                    style={{
                      background: isActive ? 'var(--surface-active)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--brand-primary)' : 'var(--border)'}`,
                    }}
                  >
                    {/* Color swatch */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden relative" style={{ background: preview.bg }}>
                      <div
                        className="absolute bottom-0 left-0 w-full h-1/2"
                        style={{ background: `linear-gradient(135deg, ${preview.accent}, ${preview.secondary})` }}
                      />
                    </div>

                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {theme.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {theme.description}
                      </p>
                    </div>

                    {isActive && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--brand-primary)' }}
                      >
                        <Check size={14} style={{ color: 'var(--text-inverse)' }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Live Preview
            </p>
            <div
              className="p-4 rounded-lg"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                Sample Heading
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  marginBottom: '12px',
                }}
              >
                This is how content text looks with the current theme.
              </p>
              <div className="flex gap-2">
                <span
                  className="px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: 'var(--brand-primary)',
                    color: 'var(--text-inverse)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  Primary
                </span>
                <span
                  className="px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: 'var(--brand-secondary)',
                    color: 'var(--text-inverse)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  Secondary
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
