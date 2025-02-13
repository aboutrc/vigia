import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import { MapPin, Plus, List, AlertTriangle, CheckCircle } from 'lucide-react';
import { translations } from '../translations';
import { supabase } from '../lib/supabase';
import type { Marker as MarkerType, MarkerCategory } from '../types';
import LocationSearch from './LocationSearch';
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
  zoom: 3
};

// MapTiler API key
const MAPTILER_KEY = 'SuHEhypMCIOnIZIVbC95';

interface MapProps {
  language?: 'en' | 'es';
}

function MapComponent({ language = 'en' }: MapProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<{lat: number; lng: number} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MarkerCategory>('ice');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const mapRef = useRef<any>(null);
  const t = translations[language];

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchMarkers = async () => {
    try {
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
    fetchMarkers();
  }, []);

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

  return (
    <div className="h-screen w-screen relative">
      <div className="absolute top-[10%] right-4 z-[1001] space-y-2 w-72">
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

        <button
          className="w-full px-4 py-2 bg-gray-800/90 backdrop-blur-sm text-gray-100 rounded-lg shadow-md hover:bg-gray-700 flex items-center justify-center"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <List className="mr-2" size={20} />
          {t.showList}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1002]">
          <div className="bg-gray-900 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              {language === 'es' ? 'Seleccionar Categoría' : 'Select Category'}
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedCategory('ice')}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    selectedCategory === 'ice'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  ICE
                </button>
                <button
                  onClick={() => setSelectedCategory('police')}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    selectedCategory === 'police'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {language === 'es' ? 'Policía' : 'Police'}
                </button>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setPendingMarker(null);
                    setShowCategoryDialog(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={handleCategorySelect}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  {language === 'es' ? 'Guardar' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSidebar && (
        <div className="absolute inset-y-0 left-0 w-96 bg-gray-800/90 backdrop-blur-sm shadow-xl transform transition-transform duration-300 ease-in-out z-[1000]">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">{t.title}</h2>
            <div className="space-y-4">
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  className="p-4 bg-black/30 rounded-lg hover:bg-black/40 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedMarker(marker);
                    setViewState({
                      ...viewState,
                      longitude: marker.position.lng,
                      latitude: marker.position.lat,
                      zoom: 14
                    });
                    setShowSidebar(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <MapPin 
                      className="flex-shrink-0"
                      size={20}
                      color={getMarkerColor(marker)}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        {t.categories[marker.category]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(marker.createdAt).toLocaleDateString(
                          language === 'es' ? 'es-ES' : 'en-US'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {markers.length === 0 && (
                <div className="text-center text-gray-400">
                  {t.noMarkers}
                </div>
              )}
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
        mapLib={import('maplibre-gl')}
        onLoad={() => setMapLoaded(true)}
        ref={mapRef}
        renderWorldCopies={false}
        preserveDrawingBuffer={true}
        attributionControl={false}
      >
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
          auto
        />
        <NavigationControl position="top-left" />

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
                size={24}
                color={getMarkerColor(marker)}
                className="transform -translate-x-1/2 -translate-y-1/2"
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
            <div className="p-4 min-w-[250px] bg-gray-900 text-gray-100 rounded-lg">
              <div className="font-semibold text-xl mb-3 flex items-center justify-between">
                <span>{t.categories[selectedMarker.category]}</span>
                {selectedMarker.reliabilityScore && selectedMarker.reliabilityScore < 0.5 && (
                  <AlertTriangle className="text-yellow-500" size={20} title="Low reliability" />
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  {t.lastConfirmed}: {selectedMarker.lastConfirmed ? 
                    new Date(selectedMarker.lastConfirmed).toLocaleString(language === 'es' ? 'es-ES' : 'en-US') : 
                    'N/A'
                  }
                </div>
                <div>
                  {t.confirmations}: {selectedMarker.confirmationsCount || 0}
                </div>
                {selectedMarker.reliabilityScore && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-400 mb-1">Reliability</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${selectedMarker.reliabilityScore * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirm(selectedMarker.id, true);
                  }}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                >
                  {t.stillPresent}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirm(selectedMarker.id, false);
                  }}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
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
}

export default MapComponent;