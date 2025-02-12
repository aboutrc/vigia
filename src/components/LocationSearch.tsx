import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { translations } from '../translations';

interface LocationSearchProps {
  onLocationSelect: (lat: number, lng: number) => void;
  language?: 'en' | 'es';
}

interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
}

export default function LocationSearch({ onLocationSelect, language = 'en' }: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const t = translations[language];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);
      setIsOpen(true);
    } catch (err) {
      console.error('Search error:', err);
      setError(t.errors.location);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onLocationSelect(Number(result.lat), Number(result.lon));
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.locationSearch.placeholder}
          className="w-full px-4 py-2 pr-10 bg-black/80 backdrop-blur-md text-gray-100 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
          disabled={isLoading}
        >
          <Search size={20} />
        </button>
      </form>

      {error && (
        <div className="absolute top-full mt-2 w-full">
          <div className="bg-red-900/90 backdrop-blur-sm text-red-100 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 max-h-60 overflow-y-auto z-50">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-2 text-left text-gray-100 hover:bg-gray-800/80 focus:outline-none focus:bg-gray-800/80 border-b border-gray-700 last:border-b-0"
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}