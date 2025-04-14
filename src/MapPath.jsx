import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet icon issues with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const MapPath = () => {
  const [source, setSource] = useState({ lat: 51.505, lng: -0.09 });
  const [destination, setDestination] = useState({ lat: 51.51, lng: -0.1 });
  const [path, setPath] = useState([]);

  const handleFindPath = () => {
    // Placeholder: just connect source and destination directly
    setPath([source, destination]);
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Source lat,lng"
          value={`${source.lat},${source.lng}`}
          onChange={(e) => {
            const [lat, lng] = e.target.value.split(",").map(Number);
            setSource({ lat, lng });
          }}
        />
        <input
          type="text"
          placeholder="Destination lat,lng"
          value={`${destination.lat},${destination.lng}`}
          onChange={(e) => {
            const [lat, lng] = e.target.value.split(",").map(Number);
            setDestination({ lat, lng });
          }}
          style={{ marginLeft: "10px" }}
        />
        <button onClick={handleFindPath} style={{ marginLeft: "10px" }}>
          Find Path
        </button>
      </div>

      <MapContainer center={source} zoom={13} style={{ height: "500px", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={source} />
        <Marker position={destination} />
        {path.length > 0 && <Polyline positions={path} color="blue" />}
      </MapContainer>
    </div>
  );
};

export default MapPath;
