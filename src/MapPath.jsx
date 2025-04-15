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

  const handleMapClick = (latlng) => {
    if (!source) {
      setSource(latlng);
    } else if (!destination) {
      setDestination(latlng);
    }
  };

  const handleFindPath = () => {
    if (source && destination) {
      setPath([source, destination]);
    }
  };

  return (
    <div className="map-wrapper">
      <div className="input-group">
        <button
          onClick={() => {
            setSource(null);
            setDestination(null);
            setPath([]);
          }}
        >
          Reset
        </button>
        <button onClick={handleFindPath}>Find Path</button>
        {source && (
          <span>
            Source: {source.lat.toFixed(5)}, {source.lng.toFixed(5)}
          </span>
        )}
        {destination && (
          <span style={{ marginLeft: "10px" }}>
            Destination: {destination.lat.toFixed(5)},{" "}
            {destination.lng.toFixed(5)}
          </span>
        )}
      </div>

      <MapContainer center={[51.505, -0.09]} zoom={13} className="leaflet-map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <ClickHandler onMapClick={handleMapClick} />

        {source && (
          <Marker position={source}>
            <Popup>
              Source: {source.lat.toFixed(5)}, {source.lng.toFixed(5)}
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={destination}>
            <Popup>
              Destination: {destination.lat.toFixed(5)},{" "}
              {destination.lng.toFixed(5)}
            </Popup>
          </Marker>
        )}

        {path.length > 0 && <Polyline positions={path} color="blue" />}
      </MapContainer>
    </div>
  );
};

export default MapPath;
