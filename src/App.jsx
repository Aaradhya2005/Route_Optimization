import React, { useState } from "react";
import MapPath from "./MapPath";
import "leaflet/dist/leaflet.css";

function App() {
  const [algorithm, setAlgorithm] = useState("shortest");
  const [showGuide, setShowGuide] = useState(false);

  const handleAlgorithmChange = (e) => {
    setAlgorithm(e.target.value);
  };

  const toggleGuide = () => {
    setShowGuide(!showGuide);
  };

  return (
    <div>
      <div className="app-header">
        <div className="header-content">
          <h1> Path Finder</h1>
          <div className="header-controls">
            <div className="header-algo-select">
              <label htmlFor="header-algo-select">Algorithm:</label>
              <select
                id="header-algo-select"
                value={algorithm}
                onChange={handleAlgorithmChange}
              >
                <option value="shortest">Shortest Path (Dijkstra)</option>
                <option value="mst">MST (Prim's)</option>
              </select>
            </div>
            <button onClick={toggleGuide} className="header-help-button">
              {showGuide ? "Close" : "Help ??"}
            </button>
          </div>
        </div>
      </div>
      <MapPath
        algorithm={algorithm}
        setAlgorithm={setAlgorithm}
        showGuide={showGuide}
        setShowGuide={setShowGuide}
      />
    </div>
  );
}

export default App;
