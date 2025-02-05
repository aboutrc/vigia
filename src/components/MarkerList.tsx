import React from 'react';
import { MapPin, ThumbsUp } from 'lucide-react';
import { Marker, MarkerCategory } from '../types';
import { translations } from '../translations';

interface MarkerListProps {
  markers: Marker[];
  selectedMarker: Marker | null;
  onMarkerSelect: (marker: Marker) => void;
  onUpvote: (markerId: string) => void;
  searchTerm: string;
  selectedCategory: MarkerCategory | 'all';
  isGuest?: boolean;
  language?: 'en' | 'es';
}

export default function MarkerList({
  markers,
  selectedMarker,
  onMarkerSelect,
  onUpvote,
  searchTerm,
  selectedCategory,
  isGuest = false,
  language = 'en'
}: MarkerListProps) {
  const t = translations[language];

  const filteredMarkers = markers
    .filter((marker) => {
      const matchesCategory = selectedCategory === 'all' || marker.category === selectedCategory;
      return matchesCategory;
    })
    .sort((a, b) => b.upvotes - a.upvotes);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="divide-y divide-gray-700">
        {filteredMarkers.map((marker) => (
          <div
            key={marker.id}
            className={`p-4 hover:bg-gray-700 cursor-pointer ${
              selectedMarker?.id === marker.id ? 'bg-gray-700' : ''
            }`}
            onClick={() => onMarkerSelect(marker)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <MapPin className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    {t.categories[marker.category]}
                  </p>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(marker.createdAt).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpvote(marker.id);
                }}
                className={`flex items-center space-x-1 ${
                  isGuest ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-blue-400'
                }`}
                disabled={isGuest}
              >
                <ThumbsUp size={16} />
                <span className="text-sm">{marker.upvotes}</span>
              </button>
            </div>
          </div>
        ))}
        {filteredMarkers.length === 0 && (
          <div className="p-4 text-center text-gray-400">
            {t.noMarkers}
          </div>
        )}
      </div>
    </div>
  );
}