
import { useState, useEffect } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

const MapView = ({ location, coordinates }) => {
  const [mapCoords, setMapCoords] = useState(coordinates);
  const [loading, setLoading] = useState(false);

  // Geocode location name to coordinates if not provided
  useEffect(() => {
    const geocodeLocation = async () => {
      if (!coordinates && location && location.trim()) {
        setLoading(true);
        try {
          // Use Nominatim (OpenStreetMap) geocoding service
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
          );
          const data = await response.json();
          
          if (data && data.length > 0) {
            const coords = {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            };
            setMapCoords(coords);
            console.log('📍 Geocoded location:', location, '→', coords);
          }
        } catch (error) {
          console.error('❌ Geocoding failed:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    geocodeLocation();
  }, [location, coordinates]);

  const handleOpenGoogleMaps = () => {
    if (mapCoords && mapCoords.lat && mapCoords.lng) {
      const url = `https://www.google.com/maps?q=${mapCoords.lat},${mapCoords.lng}`;
      window.open(url, '_blank');
    } else if (location) {
      const url = `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    }
  };

  const handleOpenOSM = () => {
    if (mapCoords && mapCoords.lat && mapCoords.lng) {
      const url = `https://www.openstreetmap.org/?mlat=${mapCoords.lat}&mlon=${mapCoords.lng}&zoom=15`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Embedded Map */}
      {mapCoords && mapCoords.lat && mapCoords.lng ? (
        <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lng-0.01},${mapCoords.lat-0.01},${mapCoords.lng+0.01},${mapCoords.lat+0.01}&layer=mapnik&marker=${mapCoords.lat},${mapCoords.lng}`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            title={`Map of ${location}`}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl border border-gray-200 flex items-center justify-center">
          <div className="text-center p-6">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Loading map...</p>
              </>
            ) : (
              <>
                <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-900 mb-2">{location}</p>
                <p className="text-sm text-gray-600 mb-4">Click below to view on map</p>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Map Actions */}
      <div className="flex space-x-3">
        <button
          onClick={handleOpenGoogleMaps}
          className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
        >
          <ExternalLink size={16} className="mr-2" />
          Google Maps
        </button>
        
        {mapCoords && (
          <button
            onClick={handleOpenOSM}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
          >
            <MapPin size={16} className="mr-2" />
            OpenStreetMap
          </button>
        )}
      </div>
      
      {/* Location Details */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">{location}</p>
            {mapCoords && (
              <p className="text-sm text-gray-600 mt-1 font-mono">
                {mapCoords.lat.toFixed(6)}, {mapCoords.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;