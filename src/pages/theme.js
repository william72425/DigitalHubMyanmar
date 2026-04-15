import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';

export default function ThemePage() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <>
      <Head><title>Theme | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        <div className="container mx-auto px-4 py-24 max-w-4xl">
          <div className={`max-w-md mx-auto p-6 rounded-2xl ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}>
            <h1 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🎨 Theme Settings</h1>
            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5">
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Dark Mode</p>
                <p className="text-sm text-gray-400">Switch between dark and light theme</p>
              </div>
              <button onClick={toggleTheme} className="px-4 py-2 rounded-lg bg-[#FF6B35] text-white">
                {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
