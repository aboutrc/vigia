import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import { ThumbsUp, List, Plus } from 'lucide-react';
import { Marker as MarkerType, MarkerCategory, MarkerFormData } from '../types';
import MarkerForm from './MarkerForm';
import MarkerList from './MarkerList';
import LocationSearch from './LocationSearch';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { translations } from '../translations';
import 'maplibre-gl/dist/maplibre-gl.css';

// US bounds
const US_BOUNDS = {
  minLng: -125.0,
  minLat: 24.396308,
  maxLng: -66.934570,
  maxLat: 49.384358
};

// Continental US center
const INITIAL_VIEW_STATE = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 4
};

// MapTiler API key
const MAPTILER_KEY = 'SuHEhypMCIOnIZIVbC95';

interface MapProps {
  session?: Session | null;
  isGuest?: boolean;
  language?: 'en' | 'es';
}

function MapComponent({ session, isGuest = false, language = 'en' }: MapProps) {
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MarkerCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tempMarker, setTempMarker] = useState<MarkerType | null>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const mapRef = useRef(null);
  const geolocateControlRef = useRef(null);

  const t = translations[language];

  useEffect(() => {
    // Trigger geolocation after map loads with a slight delay
    const timeoutId = setTimeout(() => {
      if (geolocateControlRef.current) {
        (geolocateControlRef.current as any).trigger();
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, []);

  const fetchMarkers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('markers')
        .select(`
          *,
          marker_votes(*),
          marker_confirmations(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching markers:', error);
        setError(t.errors?.fetchMarkers || 'Error loading markers');
        return;
      }

      if (data) {
        const formattedMarkers = data.map(marker => ({
          id: marker.id,
          position: { lat: marker.latitude, lng: marker.longitude },
          category: marker.category,
          upvotes: marker.marker_votes.length,
          createdAt: new Date(marker.created_at),
          user_id: marker.user_id,
          active: marker.active,
          lastConfirmed: marker.last_confirmed,
          confirmationsCount: marker.confirmations_count,
          lastStatusChange: marker.last_status_change
        }));
        setMarkers(formattedMarkers);
      }
    } catch (err) {
      console.error('Error fetching markers:', err);
      setError(t.errors?.fetchMarkers || 'Error loading markers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkers();
  }, []);

  const handleMapClick = useCallback((event) => {
    if (!isAddingMarker) return;

    const { lngLat } = event;
    
    // Check if click is within US bounds
    if (lngLat.lng < US_BOUNDS.minLng || lngLat.lng > US_BOUNDS.maxLng ||
        lngLat.lat < US_BOUNDS.minLat || lngLat.lat > US_BOUNDS.maxLat) {
      return;
    }

    const newMarker: MarkerType = {
      id: `temp-${Date.now()}`,
      position: { lat: lngLat.lat, lng: lngLat.lng },
      category: 'ice',
      upvotes: 0,
      createdAt: new Date(),
      isEditing: true,
    };

    setTempMarker(newMarker);
    setSelectedMarker(newMarker);
    setIsAddingMarker(false);
  }, [isAddingMarker]);

  const handleMarkerSubmit = async (markerId: string, formData: MarkerFormData) => {
    try {
      setIsSaving(true);
      setError(null);
      
      const marker = tempMarker || markers.find(m => m.id === markerId);
      if (!marker) {
        console.error('Marker not found:', markerId);
        setError(t.errors.general);
        return;
      }

      const markerData = {
        category: formData.category,
        latitude: marker.position.lat,
        longitude: marker.position.lng,
        user_id: session?.user?.id || null,
        title: formData.category === 'ice' ? 'ICE Activity' : 'Police Activity',
        description: `${formData.category.toUpperCase()} activity reported at ${marker.position.lat.toFixed(6)}, ${marker.position.lng.toFixed(6)}`
      };

      const { data, error: insertError } = await supabase
        .from('markers')
        .insert([markerData])
        .select()
        .single();

      if (insertError) {
        console.error('Database error saving marker:', insertError);
        setError(t.errors.general);
        return;
      }

      setTempMarker(null);
      setSelectedMarker(null);
      
      await fetchMarkers();
    } catch (error) {
      console.error('Error in handleMarkerSubmit:', error);
      setError(t.errors.general);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async (markerId: string, isActive: boolean) => {
    if (!session?.user?.id) return;

    try {
      const { error: confirmError } = await supabase
        .from('marker_confirmations')
        .insert({
          marker_id: markerId,
          user_id: session.user.id,
          is_active: isActive
        });

      if (confirmError) {
        console.error('Error confirming marker:', confirmError);
        setError(t.errors.general);
        return;
      }

      const { error: updateError } = await supabase
        .from('markers')
        .update({
          active: isActive,
          last_confirmed: new Date().toISOString(),
          confirmations_count: isActive ? supabase.sql`confirmations_count + 1` : 1,
          last_status_change: new Date().toISOString()
        })
        .eq('id', markerId);

      if (updateError) {
        console.error('Error updating marker:', updateError);
        setError(t.errors.general);
        return;
      }

      await fetchMarkers();
    } catch (error) {
      console.error('Error in handleConfirm:', error);
      setError(t.errors.general);
    }
  };

  const handleUpvote = async (markerId: string) => {
    if (isGuest || !session?.user?.id) return;

    try {
      const { error } = await supabase
        .from('marker_votes')
        .insert({
          marker_id: markerId,
          user_id: session.user.id,
        });

      if (error) {
        if (error.code === '23505') {
          await supabase
            .from('marker_votes')
            .delete()
            .match({ marker_id: markerId, user_id: session.user.id });
        } else {
          console.error('Error voting:', error);
          return;
        }
      }

      await fetchMarkers();
    } catch (error) {
      console.error('Error in handleUpvote:', error);
    }
  };

  const handleMarkerClick = async (marker: MarkerType) => {
    if (marker.id.startsWith('temp-')) {
      setSelectedMarker(marker);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('markers')
        .select('*, marker_votes(*)')
        .eq('id', marker.id)
        .single();

      if (error) {
        console.error('Error fetching marker details:', error);
        return;
      }

      if (data) {
        const updatedMarker = {
          id: data.id,
          position: { lat: data.latitude, lng: data.longitude },
          category: data.category,
          upvotes: data.marker_votes.length,
          createdAt: new Date(data.created_at),
          user_id: data.user_id,
          active: data.active,
          lastConfirmed: data.last_confirmed,
          confirmationsCount: data.confirmations_count,
          lastStatusChange: data.last_status_change
        };

        setSelectedMarker(updatedMarker);
      }
    } catch (err) {
      console.error('Error fetching marker details:', err);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setViewState({
      ...viewState,
      latitude: lat,
      longitude: lng,
      zoom: 16
    });
  };

  return (
    <div className="h-screen w-screen relative">
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1001]">
          <div className="bg-red-900/90 backdrop-blur-sm text-red-100 px-6 py-3 rounded-lg shadow-lg">
            {error}
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-[1001] space-y-2">
        <div className="w-full">
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            language={language}
          />
        </div>

        <button
          className="w-full px-4 py-2 bg-gray-800/90 backdrop-blur-sm text-gray-100 rounded-lg shadow-md hover:bg-gray-700 flex items-center justify-center"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <List className="mr-2" size={20} />
          {t.showList}
        </button>

        <button
          className={`w-full px-4 py-2 rounded-lg shadow-md flex items-center justify-center ${
            isAddingMarker
              ? 'bg-green-600/90 backdrop-blur-sm text-white hover:bg-green-700'
              : 'bg-gray-800/90 backdrop-blur-sm text-gray-100 hover:bg-gray-700'
          }`}
          onClick={() => setIsAddingMarker(!isAddingMarker)}
        >
          <Plus className="mr-2" size={20} />
          {isAddingMarker ? t.clickToPlace : t.addLocation}
        </button>
      </div>

      <div className={`absolute inset-y-0 left-0 w-96 bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-[1000] ${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">{t.title}</h2>
          </div>

          <div className="space-y-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as MarkerCategory | 'all')}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-100"
            >
              <option value="all">{t.categories.all}</option>
              <option value="ice">{t.categories.ice}</option>
              <option value="police">{t.categories.police}</option>
            </select>

            <MarkerList
              markers={markers}
              selectedMarker={selectedMarker}
              onMarkerSelect={(marker) => {
                setSelectedMarker(marker);
                setShowSidebar(false);
                setViewState({
                  ...viewState,
                  latitude: marker.position.lat,
                  longitude: marker.position.lng,
                  zoom: 16
                });
              }}
              onUpvote={handleUpvote}
              searchTerm=""
              selectedCategory={selectedCategory}
              isGuest={isGuest}
              language={language}
            />
          </div>
        </div>
      </div>

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`}
        onClick={handleMapClick}
        ref={mapRef}
        maxBounds={[
          [US_BOUNDS.minLng, US_BOUNDS.minLat],
          [US_BOUNDS.maxLng, US_BOUNDS.maxLat]
        ]}
        minZoom={4}
        maxZoom={19}
        mapLib={import('maplibre-gl')}
      >
        <GeolocateControl
          ref={geolocateControlRef}
          position="top-left"
          trackUserLocation
          showUserLocation
          showAccuracyCircle
          fitBoundsOptions={{ maxZoom: 16 }}
          positionOptions={{
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 0
          }}
          auto
        />
        <NavigationControl position="top-left" />
        
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.position.lng}
            latitude={marker.position.lat}
            onClick={() => handleMarkerClick(marker)}
            color={marker.category === 'police' ? '#ef4444' : '#3b82f6'}
          >
            {selectedMarker?.id === marker.id && (
              <Popup
                longitude={marker.position.lng}
                latitude={marker.position.lat}
                onClose={() => setSelectedMarker(null)}
                closeButton={true}
                closeOnClick={false}
                anchor="bottom"
                className="marker-popup"
              >
                <div className="p-4 min-w-[250px] bg-gray-900 text-gray-100 rounded-lg">
                  <div className="font-semibold text-xl mb-3">
                    {t.categories[marker.category]}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      {t.lastConfirmed}: {marker.lastConfirmed ? 
                        new Date(marker.lastConfirmed).toLocaleString(language === 'es' ? 'es-ES' : 'en-US') : 
                        'N/A'
                      }
                    </div>
                    <div>
                      {t.confirmations}: {marker.confirmationsCount || 0}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirm(marker.id, true);
                      }}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                    >
                      {t.stillPresent}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirm(marker.id, false);
                      }}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                    >
                      {t.notPresent}
                    </button>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        {tempMarker && (
          <Marker
            longitude={tempMarker.position.lng}
            latitude={tempMarker.position.lat}
            draggable={true}
            onDragEnd={(e) => {
              const lngLat = e.lngLat;
              if (lngLat.lng < US_BOUNDS.minLng || lngLat.lng > US_BOUNDS.maxLng ||
                  lngLat.lat < US_BOUNDS.minLat || lngLat.lat > US_BOUNDS.maxLat) {
                return;
              }
              setTempMarker({
                ...tempMarker,
                position: { lat: lngLat.lat, lng: lngLat.lng }
              });
            }}
            color="#22c55e"
          >
            <Popup
              longitude={tempMarker.position.lng}
              latitude={tempMarker.position.lat}
              onClose={() => {
                setTempMarker(null);
                setSelectedMarker(null);
              }}
              closeButton={true}
              closeOnClick={false}
              anchor="bottom"
              className="marker-popup"
            >
              <MarkerForm
                onSubmit={(formData) => handleMarkerSubmit(tempMarker.id, formData)}
                onCancel={() => {
                  setTempMarker(null);
                  setSelectedMarker(null);
                }}
                language={language}
                isSaving={isSaving}
              />
            </Popup>
          </Marker>
        )}
      </Map>
    </div>
  );
}

export default MapComponent;