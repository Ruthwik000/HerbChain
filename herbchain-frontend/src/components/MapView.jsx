
import { MapPin } from 'lucide-react';

const MapView = ({ location, coordinates }) => {
  // For now, we'll show a placeholder map since we don't have Google Maps API
  // In a real implementation, you would integrate with Google Maps or Leaflet
  
  const handleOpenMap = () => {
    if (coordinates && coordinates.lat && coordinates.lng) {
      const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-3">
      {/* Map placeholder */}
      <div 
        className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleOpenMap}
      >
        <div className="text-center">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">{location}</p>
          {coordinates && (
            <p className="text-xs text-gray-500 mt-1">
              {coordinates.lat?.toFixed(4)}, {coordinates.lng?.toFixed(4)}
            </p>
          )}
          <p className="text-xs text-blue-600 mt-2">Click to open in Google Maps</p>
        </div>
      </div>
      
      {/* Location info */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <MapPin className="w-4 h-4" />
        <span>{location}</span>
      </div>
    </div>
  );
};

export default MapView;