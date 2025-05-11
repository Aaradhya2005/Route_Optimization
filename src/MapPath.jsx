import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "./MapPath.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const ClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const MapPath = () => {
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [path, setPath] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);

  const handleMapClick = (latlng) => {
    if (!source) {
      setSource(latlng);
    } else if (!destination) {
      setDestination(latlng);
    }
  };

  const handleFindPath = async () => {
    if (source && destination) {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:3001/api/find-path', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startLat: source.lat,
            startLon: source.lng,
            endLat: destination.lat,
            endLon: destination.lng,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to find path');
        }

        const data = await response.json();
        const pathCoordinates = data.path.map(point => [point.lat, point.lon]);
        setPath(pathCoordinates);
        setDistance(data.distance);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReset = () => {
    setSource(null);
    setDestination(null);
    setPath([]);
    setError(null);
    setDistance(null);
  };

  // Custom path style
  const pathStyle = {
    color: '#2196F3', // Bright blue color
    weight: 5,
    opacity: 0.8,
    lineJoin: 'round',
    lineCap: 'round',
    dashArray: '5, 10', // Creates a dashed line effect
  };

  return (
    <div className="map-wrapper">
      <div className="input-group">
        <button onClick={handleReset}>Reset</button>
        <button
          onClick={handleFindPath}
          disabled={loading || !source || !destination}
        >
          {loading ? 'Finding Path...' : 'Find Path'}
        </button>
        {source && (
          <span>
            Source: {source.lat.toFixed(5)}, {source.lng.toFixed(5)}
          </span>
        )}
        {destination && (
          <span style={{ marginLeft: "10px" }}>
            Destination: {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
          </span>
        )}
        {distance && (
          <span style={{ marginLeft: "10px" }}>
            Distance: {distance.toFixed(2)} km
          </span>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <MapContainer
        center={[30.26, 77.99]}
        zoom={15}
        className="leaflet-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <ClickHandler onMapClick={handleMapClick} />

        {source && (
          <Marker
            position={source}
            icon={L.divIcon({
              className: 'marker-icon',
              html: '<div class="marker-label">Start</div>',
            })}
          >
            <Popup>
              Start Point<br />
              Coordinates: {source.lat.toFixed(5)}, {source.lng.toFixed(5)}
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker
            position={destination}
            icon={L.divIcon({
              className: 'marker-icon',
              html: '<div class="marker-label">End</div>',
            })}
          >
            <Popup>
              End Point<br />
              Coordinates: {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
            </Popup>
          </Marker>
        )}

        {path.length > 0 && (
          <Polyline
            positions={path}
            pathOptions={pathStyle}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapPath;
