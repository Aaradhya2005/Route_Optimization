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

const MapPath = ({ algorithm, setAlgorithm, showGuide, setShowGuide }) => {
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [mstPoints, setMstPoints] = useState([]);
  const [path, setPath] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);

  const handleAlgorithmChange = (e) => {
    setAlgorithm(e.target.value);
    handleReset();
  };

  const toggleGuide = () => {
    setShowGuide(!showGuide);
  };

  const handleMapClick = (latlng) => {
    if (algorithm === "shortest") {
      if (!source) {
        setSource(latlng);
      } else if (!destination) {
        setDestination(latlng);
      }
    } else if (algorithm === "mst") {
      if (mstPoints.length < 10) {
        setMstPoints((prev) => [...prev, latlng]);
      } else {
        setError("Maximum 10 points allowed for MST");
      }
    }
  };

  const handleFindPath = async () => {
    setLoading(true);
    setError(null);
    try {
      if (algorithm === "shortest") {
        if (source && destination) {
          const response = await fetch("http://localhost:3001/api/find-path", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startLat: source.lat,
              startLon: source.lng,
              endLat: destination.lat,
              endLon: destination.lng,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to find path");
          }

          const data = await response.json();
          const pathCoordinates = data.path.map((point) => [
            point.lat,
            point.lon,
          ]);
          setPath(pathCoordinates);
          setDistance(data.distance);
        }
      } else if (algorithm === "mst") {
        if (mstPoints.length < 2) {
          setError("Select at least two points for MST");
          setLoading(false);
          return;
        }
        const response = await fetch("http://localhost:3001/api/find-mst", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            points: mstPoints.map((pt) => ({ lat: pt.lat, lon: pt.lng })),
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to find MST");
        }
        const data = await response.json();
        console.log("MST data:", data);
        const mstLines = data.mst.map((edge) => {
          if (edge.path && edge.path.length > 0) {
            return edge.path.map((point) => [point.lat, point.lon]);
          } else {
            return [
              [edge.from.lat, edge.from.lon],
              [edge.to.lat, edge.to.lon],
            ];
          }
        });
        setPath(mstLines);
        setDistance(data.totalWeight);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSource(null);
    setDestination(null);
    setMstPoints([]);
    setPath([]);
    setError(null);
    setDistance(null);
  };

  const pathStyle = {
    color: "#2196F3",
    weight: 5,
    opacity: 0.8,
    lineJoin: "round",
    lineCap: "round",
    dashArray: "5, 10",
  };

  return (
    <div className="map-wrapper">
      <div className="input-group">
        <button onClick={handleReset}>Reset</button>
        <button
          onClick={handleFindPath}
          disabled={
            loading ||
            (algorithm === "shortest" && (!source || !destination)) ||
            (algorithm === "mst" && mstPoints.length < 2)
          }
        >
          {loading
            ? algorithm === "shortest"
              ? "Finding Path..."
              : "Finding MST..."
            : algorithm === "shortest"
            ? "Find Path"
            : "Find MST"}
        </button>
        {algorithm === "shortest" && source && (
          <span>
            Source: {source.lat.toFixed(5)}, {source.lng.toFixed(5)}
          </span>
        )}
        {algorithm === "shortest" && destination && (
          <span style={{ marginLeft: "10px" }}>
            Destination: {destination.lat.toFixed(5)},{" "}
            {destination.lng.toFixed(5)}
          </span>
        )}
        {algorithm === "mst" && mstPoints.length > 0 && (
          <span style={{ marginLeft: "10px" }}>
            MST Points ({mstPoints.length}/10):{" "}
            {mstPoints
              .map((pt, idx) => `(${pt.lat.toFixed(5)}, ${pt.lng.toFixed(5)})`)
              .join(" | ")}
            {mstPoints.length >= 10 && (
              <span style={{ color: "red", fontWeight: "bold" }}>
                {" "}
                - Maximum reached
              </span>
            )}
          </span>
        )}
        {distance && (
          <span
            style={{ marginLeft: "10px", fontWeight: "bold", color: "#1976d2" }}
          >
            {algorithm === "shortest"
              ? `Distance: ${distance.toFixed(2)} km`
              : `Total Distance: ${distance.toFixed(2)} km`}
          </span>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Floating Guide Panel */}
      {showGuide && (
        <div className="floating-guide">
          <div className="guide-header">
            <h3>📖 How to Use</h3>
            <button onClick={toggleGuide} className="close-guide">
              ×
            </button>
          </div>
          <div className="guide-content">
            {algorithm === "shortest" ? (
              <div>
                <h4>Shortest Path (Dijkstra's Algorithm)</h4>
                <ol>
                  <li>
                    <strong>Select Algorithm:</strong> Choose "Shortest Path"
                    from dropdown
                  </li>
                  <li>
                    <strong>Click First Point:</strong> Click on map to set
                    starting location
                  </li>
                  <li>
                    <strong>Click Second Point:</strong> Click on map to set
                    destination
                  </li>
                  <li>
                    <strong>Find Path:</strong> Click "Find Path" button
                  </li>
                  <li>
                    <strong>View Result:</strong> Blue line shows shortest road
                    route
                  </li>
                  <li>
                    <strong>Distance:</strong> Total distance shown in
                    kilometers
                  </li>
                </ol>
                <div className="guide-tip">
                  <strong>Tip:</strong> The algorithm finds the shortest path
                  following actual roads, not straight lines.
                </div>
              </div>
            ) : (
              <div>
                <h4>Minimum Spanning Tree (Prim's Algorithm)</h4>
                <ol>
                  <li>
                    <strong>Select Algorithm:</strong> Choose "MST" from
                    dropdown
                  </li>
                  <li>
                    <strong>Add Points:</strong> Click multiple points on map
                    (2-10 points)
                  </li>
                  <li>
                    <strong>Find MST:</strong> Click "Find MST" button
                  </li>
                  <li>
                    <strong>View Result:</strong> Blue lines show minimum
                    spanning tree
                  </li>
                  <li>
                    <strong>Total Distance:</strong> Sum of all road segments
                    shown
                  </li>
                </ol>
                <div className="guide-tip">
                  <strong>Tip:</strong> MST connects all points with minimum
                  total road distance, creating an efficient network.
                </div>
                <div className="guide-warning">
                  <strong>Limit:</strong> Maximum 10 points allowed for
                  performance.
                </div>
              </div>
            )}
            <div className="guide-features">
              <h4>Features:</h4>
              <ul>
                <li>Real road network data from OpenStreetMap</li>
                <li>Accurate distance calculations</li>
                <li>Interactive map with markers</li>
                <li>Reset button to clear selections</li>
                <li>Error handling and validation</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="status-indicator">
        {algorithm === "shortest" ? (
          <div> Shortest Path Mode</div>
        ) : (
          <div>MST Mode ({mstPoints.length}/10 points)</div>
        )}
      </div>

      <MapContainer center={[30.26, 77.99]} zoom={15} className="leaflet-map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <ClickHandler onMapClick={handleMapClick} />

        {algorithm === "shortest" && source && (
          <Marker
            position={source}
            icon={L.divIcon({
              className: "marker-icon",
              html: '<div class="marker-label">Start</div>',
            })}
          >
            <Popup>
              Start Point
              <br />
              Coordinates: {source.lat.toFixed(5)}, {source.lng.toFixed(5)}
            </Popup>
          </Marker>
        )}

        {algorithm === "shortest" && destination && (
          <Marker
            position={destination}
            icon={L.divIcon({
              className: "marker-icon",
              html: '<div class="marker-label">End</div>',
            })}
          >
            <Popup>
              End Point
              <br />
              Coordinates: {destination.lat.toFixed(5)},{" "}
              {destination.lng.toFixed(5)}
            </Popup>
          </Marker>
        )}

        {algorithm === "mst" &&
          mstPoints.map((pt, idx) => (
            <Marker
              key={idx}
              position={pt}
              icon={L.divIcon({
                className: "marker-icon",
                html: `<div class="marker-label">${idx + 1}</div>`,
              })}
            >
              <Popup>
                MST Point {idx + 1}
                <br />
                Coordinates: {pt.lat.toFixed(5)}, {pt.lng.toFixed(5)}
              </Popup>
            </Marker>
          ))}

        {/* Draw path or MST lines */}
        {algorithm === "shortest" && path.length > 0 && (
          <Polyline positions={path} pathOptions={pathStyle} />
        )}
        {algorithm === "mst" &&
          path.length > 0 &&
          (path.every((line) =>
            line.every(
              ([lat, lon]) => typeof lat === "number" && typeof lon === "number"
            )
          ) ? (
            path.map((line, idx) => (
              <Polyline key={idx} positions={line} pathOptions={pathStyle} />
            ))
          ) : (
            <div className="error-message">Invalid MST data received.</div>
          ))}
      </MapContainer>
    </div>
  );
};

export default MapPath;
