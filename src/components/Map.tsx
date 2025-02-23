import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import { MapPin, Plus, AlertTriangle, Database, CheckCircle } from 'lucide-react';
import { translations } from '../translations';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';
import type { Marker as MarkerType, MarkerCategory } from '../types';
import LocationSearch from './LocationSearch';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useIsMobile } from '../hooks/useIsMobile';

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
  zoom: 3
};

// MapTiler API key
const MAPTILER_KEY = 'SuHEhypMCIOnIZIVbC95';

const MapComponent = ({ language = 'en' }: { language?: 'en' | 'es' }) => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<{lat: number; lng: number} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MarkerCategory>('ice');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const mapRef = useRef<any>(null);
  const isMobile = useIsMobile();
  const t = translations[language];

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const checkSupabaseConnection = async () => {
    try {
      if (!isSupabaseConfigured()) {
        setError(language === 'es' 
          ? 'Error de conexión a la base de datos. Por favor, conecte a Supabase usando el botón "Connect to Supabase".'
          : 'Database connection error. Please connect to Supabase using the "Connect to Supabase" button.');
        return;
      }

      const isConnected = await testSupabaseConnection();
      setIsSupabaseConnected(isConnected);
      setError(null);
      
      if (isConnected) {
        await fetchMarkers();
      }
    } catch (err) {
      console.error('Supabase connection error:', err);
      setIsSupabaseConnected(false);
      setError(language === 'es' 
        ? 'Error de conexión a la base de datos. Por favor, conecte a Supabase usando el botón "Connect to Supabase".'
        : 'Database connection error. Please connect to Supabase using the "Connect to Supabase" button.');
    }
  };

  useEffect(() => {
    checkSupabaseConnection();
  }, []);

  const fetchMarkers = async () => {
    try {
      if (!isSupabaseConnected) {
        await checkSupabaseConnection();
        if (!isSupabaseConnected) return;
      }

      const { data, error } = await supabase
        .from('markers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedMarkers = data.map(marker => ({
          id: marker.id,
          position: { lat: marker.latitude, lng: marker.longitude },
          category: marker.category as MarkerCategory,
          createdAt: new Date(marker.created_at),
          active: marker.active,
          lastConfirmed: marker.last_confirmed,
          confirmationsCount: marker.confirmations_count,
          lastStatusChange: marker.last_status_change,
          reliabilityScore: marker.reliability_score,
          negativeConfirmations: marker.negative_confirmations
        }));
        setMarkers(formattedMarkers);
      }
    } catch (err) {
      console.error('Error fetching markers:', err);
      showFeedback(t.errors?.fetchMarkers || 'Error loading markers', 'error');
    }
  };

  useEffect(() => {
    if (isSupabaseConnected) {
      fetchMarkers();
    }
  }, [isSupabaseConnected]);

  const handleMapClick = useCallback((event: any) => {
    if (!isAddingMarker || !mapLoaded) return;

    // Get click coordinates
    const { lng, lat } = event.lngLat;
    
    // Validate coordinates are within US bounds
    if (lng < US_BOUNDS.minLng || lng > US_BOUNDS.maxLng ||
        lat < US_BOUNDS.minLat || lat > US_BOUNDS.maxLat) {
      return;
    }

    // Set pending marker and show category dialog
    setPendingMarker({ lat, lng });
    setShowCategoryDialog(true);
    setIsAddingMarker(false);
  }, [isAddingMarker, mapLoaded]);

  const handleConfirm = async (markerId: string, isActive: boolean) => {
    try {
      if (!userLocation) {
        showFeedback(
          language === 'es' 
            ? 'Se requiere tu ubicación para confirmar marcadores'
            : 'Your location is required to confirm markers',
          'error'
        );
        return;
      }

      const { error } = await supabase.rpc('handle_marker_confirmation', {
        in_marker_id: markerId,
        in_is_present: isActive,
        in_user_ip: 'anonymous',
        in_user_lat: userLocation.lat,
        in_user_lng: userLocation.lng
      });

      if (error) {
        if (error.message.includes('too far')) {
          showFeedback(
            language === 'es'
              ? 'Estás demasiado lejos de este marcador'
              : error.message,
            'error'
          );
        } else {
          throw error;
        }
        return;
      }

      showFeedback(
        language === 'es' 
          ? 'Gracias por tu confirmación' 
          : 'Thank you for your confirmation'
      );
      
      setSelectedMarker(null);
      await fetchMarkers();
    } catch (err) {
      console.error('Error confirming marker:', err);
      showFeedback(t.errors?.general || 'Error confirming marker', 'error');
    }
  };

  const handleCategorySelect = async () => {
    if (!pendingMarker) return;

    try {
      // Add marker to database
      const { data, error } = await supabase
        .from('markers')
        .insert({
          latitude: pendingMarker.lat,
          longitude: pendingMarker.lng,
          category: selectedCategory,
          active: true,
          title: `${selectedCategory.toUpperCase()} Sighting`,
          description: `${selectedCategory.toUpperCase()} activity reported in this area`
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newMarker: MarkerType = {
          id: data.id,
          position: { lat: data.latitude, lng: data.longitude },
          category: data.category as MarkerCategory,
          createdAt: new Date(data.created_at),
          active: data.active,
          reliabilityScore: 1.0,
          negativeConfirmations: 0
        };

        setMarkers(prev => [...prev, newMarker]);
        showFeedback(
          language === 'es'
            ? 'Marcador agregado exitosamente'
            : 'Marker added successfully'
        );
      }
    } catch (err) {
      console.error('Error adding marker:', err);
      showFeedback(t.errors?.general || 'Error adding marker', 'error');
    } finally {
      setPendingMarker(null);
      setShowCategoryDialog(false);
    }
  };

  const getMarkerColor = (marker: MarkerType) => {
    if (!marker.reliabilityScore) return marker.category === 'police' ? '#ef4444' : '#3b82f6';
    
    const baseColor = marker.category === 'police' ? '239, 68, 68' : '59, 130, 246';
    const opacity = 0.2 + (marker.reliabilityScore * 0.8);
    return `rgba(${baseColor}, ${opacity})`;
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setViewState({
      ...viewState,
      latitude: lat,
      longitude: lng,
      zoom: 16
    });
  };
  
  const markerSize = 30;

  return (
    <div className="h-screen w-screen relative">
      {!isSupabaseConnected && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1002] px-4">
          <div className="bg-[#1a1f2e] p-8 rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-gray-700/50">
            <div className="flex items-center justify-center mb-6 text-blue-500">
              <Database size={48} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 text-center">
              {language === 'es' ? 'Conexión Requerida' : 'Connection Required'}
            </h3>
            <p className="text-gray-300 text-center mb-6">
              {language === 'es'
                ? 'Por favor, conecte a Supabase usando el botón "Connect to Supabase" en la esquina superior derecha.'
                : 'Please connect to Supabase using the "Connect to Supabase" button in the top right corner.'}
            </p>
            <div className="flex justify-center">
              <button
                onClick={checkSupabaseConnection}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                {language === 'es' ? 'Reintentar Conexión' : 'Retry Connection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`absolute ${isMobile ? 'top-32' : 'top-[calc(15%+20px)]'} right-4 z-[1001] space-y-2 w-72`}>
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

        <div className="relative">
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            language={language}
          />
        </div>
      </div>

      {feedback && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[1001] animate-fade-in">
          <div className={`${
            feedback.type === 'error' ? 'bg-red-900/90' : 'bg-green-900/90'
          } backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg flex items-center`}>
            {feedback.type === 'error' ? (
              <AlertTriangle className="mr-2 flex-shrink-0" size={20} />
            ) : (
              <CheckCircle className="mr-2 flex-shrink-0" size={20} />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
        </div>
      )}

      {showCategoryDialog && pendingMarker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1002] px-4">
          <div className="bg-[#1a1f2e] p-8 rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-gray-700/50">
            <h3 className="text-2xl font-bold text-white mb-6">
              {language === 'es' ? 'Seleccionar Categoría' : 'Select Category'}
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedCategory('ice')}
                  className={`w-full px-6 py-4 rounded-xl text-lg font-medium transition-all ${
                    selectedCategory === 'ice'
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-[#1a1f2e]'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  ICE
                </button>
                <button
                  onClick={() => setSelectedCategory('police')}
                  className={`w-full px-6 py-4 rounded-xl text-lg font-medium transition-all ${
                    selectedCategory === 'police'
                      ? 'bg-red-600 text-white ring-2 ring-red-400 ring-offset-2 ring-offset-[#1a1f2e]'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {language === 'es' ? 'Policía' : 'Police'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => {
                    setPendingMarker(null);
                    setShowCategoryDialog(false);
                  }}
                  className="w-full px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors text-lg font-medium"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={handleCategorySelect}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-lg font-medium"
                >
                  {language === 'es' ? 'Guardar' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`}
        onClick={handleMapClick}
        maxBounds={[
          [US_BOUNDS.minLng, US_BOUNDS.minLat],
          [US_BOUNDS.maxLng, US_BOUNDS.maxLat]
        ]}
        minZoom={3}
        maxZoom={19}
        mapLib={maplibregl}
        onLoad={() => {
          setMapLoaded(true);
        }}
        ref={mapRef}
        renderWorldCopies={false}
        preserveDrawingBuffer={true}
        attributionControl={false}
      >
        {mapLoaded && (
          <>
            <GeolocateControl
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
              onGeolocate={(e) => {
                setUserLocation({
                  lat: e.coords.latitude,
                  lng: e.coords.longitude
                });
              }}
            />
            <NavigationControl position="top-left" />
          </>
        )}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.position.lng}
            latitude={marker.position.lat}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedMarker(marker);
            }}
          >
            <div className="cursor-pointer">
              <MapPin
                size={markerSize}
                color={getMarkerColor(marker)}
                className="transform -translate-x-1/2 -translate-y-1/2 transition-colors"
              />
            </div>
          </Marker>
        ))}

        {selectedMarker && (
          <Popup
            longitude={selectedMarker.position.lng}
            latitude={selectedMarker.position.lat}
            onClose={() => setSelectedMarker(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="bottom"
            className="marker-popup"
          >
            <div className="p-6 min-w-[300px] bg-[#1a1f2e] text-gray-100 rounded-xl border border-gray-700/50">
              <div className="font-bold text-2xl mb-4 flex items-center justify-between">
                <span>{t.categories[selectedMarker.category]}</span>
                {selectedMarker.reliabilityScore && selectedMarker.reliabilityScore < 0.5 && (
                  <AlertTriangle className="text-yellow-500" size={20} title="Low reliability" />
                )}
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="text-gray-300">
                  {t.lastConfirmed}: {selectedMarker.lastConfirmed ? 
                    new Date(selectedMarker.lastConfirmed).toLocaleString(language === 'es' ? 'es-ES' : 'en-US') : 
                    'N/A'
                  }
                </div>
                <div className="text-gray-300">
                  {t.confirmations}: {selectedMarker.confirmationsCount || 0}
                </div>
                {selectedMarker.reliabilityScore && (
                  <div className="mt-4">
                    <div className="text-xs text-gray-400 mb-1">Reliability</div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2">
                      <div
                        className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${selectedMarker.reliabilityScore * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirm(selectedMarker.id, true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  {t.stillPresent}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirm(selectedMarker.id, false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  {t.notPresent}
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default MapComponent;