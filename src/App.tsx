import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Languages, Map as MapIcon, Music, Scale, FileText } from 'lucide-react';
import { translations } from './translations';
import Map from './components/Map';
import Encounter from './components/Encounter';
import Rights from './components/Rights';
import Registro from './components/Registro';
import Footer from './components/Footer';

function App() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(current => current === 'en' ? 'es' : 'en');
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-900">
        <header className="fixed top-0 left-0 right-0 z-50 bg-black shadow-lg">
          <div className="flex items-center justify-center py-3 px-4">
            <svg className="h-8" viewBox="0 0 557 212" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M78.17 209.15H52.32L0 68.85h37.28l30.46 91h.2l32.67-91h35.88l-58.32 140.3Z" fill="#fff"/>
              <path fill="#fff" d="M151.51 68.85h32.47v140.3h-32.47z"/>
              <path fill="#9e005d" d="m171.95 48 29-48 26 32-55 16z"/>
              <path d="M278.98 153.83v-26.86h65.34v55.32c-15.23 20.64-37.88 29.26-62.53 29.26-42.29 0-74.56-29.66-74.56-72.55s33.27-72.55 74.36-72.55c24.65 0 44.69 9.82 60.93 28.66l-22.45 19.64c-9.62-11.62-22.45-20.24-38.28-20.24-23.25 0-40.09 19.84-40.09 44.49s15.43 44.49 39.89 44.49c10.22 0 21.85-4.41 30.26-12.43v-17.24h-32.87Z" fill="#fff"/>
              <path fill="#fff" d="M370.56 209.15V68.85h32.47v140.3h-32.47z"/>
              <path d="m519.67 209.15-8.22-24.65h-46.3l-8.82 24.65h-35.88l58.32-140.3h25.85l52.31 140.3h-37.28Zm-45.1-50.51h28.06l-13.43-40.49h-.2l-14.43 40.49Z" fill="#fff"/>
            </svg>
          </div>
          
          <div className="grid grid-cols-5 divide-x divide-gray-700 border-t border-gray-700">
            <button
              onClick={toggleLanguage}
              className="flex flex-col items-center justify-center py-2 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <Languages size={20} className="mb-1" />
              <span className="text-xs font-medium">
                {language.toUpperCase()}
              </span>
            </button>

            <Link 
              to="/map" 
              className="flex flex-col items-center justify-center py-2 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <MapIcon size={20} className="mb-1" />
              <span className="text-xs font-medium">
                {language === 'es' ? 'Mapa' : 'Map'}
              </span>
            </Link>
            
            <Link 
              to="/encounter" 
              className="flex flex-col items-center justify-center py-2 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <Music size={20} className="mb-1" />
              <span className="text-xs font-medium">
                {language === 'es' ? 'Encuentro' : 'Encounter'}
              </span>
            </Link>

            <Link 
              to="/rights" 
              className="flex flex-col items-center justify-center py-2 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <Scale size={20} className="mb-1" />
              <span className="text-xs font-medium">
                {language === 'es' ? 'Derechos' : 'Rights'}
              </span>
            </Link>

            <Link 
              to="/registro" 
              className="flex flex-col items-center justify-center py-2 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <FileText size={20} className="mb-1" />
              <span className="text-xs font-medium">
                {language === 'es' ? 'Registro' : 'Proof'}
              </span>
            </Link>
          </div>
        </header>
        
        <main className="flex-1 pt-[116px] pb-[68px]">
          <Routes>
            <Route path="/" element={<Map language={language} />} />
            <Route path="/map" element={<Map language={language} />} />
            <Route path="/encounter" element={<Encounter language={language} />} />
            <Route path="/rights" element={<Rights language={language} />} />
            <Route path="/registro" element={<Registro language={language} />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;