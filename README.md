# 🗺️ Route Optimization App

A React-based web application that implements two powerful graph algorithms for route optimization: **Dijkstra's Algorithm** for shortest path finding and **Prim's Algorithm** for Minimum Spanning Tree (MST) calculation. The app uses real road network data from OpenStreetMap to provide accurate routing solutions.

## ✨ Features

### 🚀 Shortest Path (Dijkstra's Algorithm)
- **Real Road Network**: Uses actual road data from OpenStreetMap
- **Interactive Map**: Click to set start and destination points
- **Visual Path Display**: Shows the shortest route with blue dashed lines
- **Distance Calculation**: Displays total distance in kilometers
- **Responsive UI**: Modern, user-friendly interface

### 🌳 Minimum Spanning Tree (Prim's Algorithm)
- **Multi-Point Selection**: Add up to 10 points on the map
- **Road-Based MST**: Calculates MST using actual road distances
- **Visual Network**: Displays the minimum spanning tree with road paths
- **Total Distance**: Shows the sum of all road segments
- **Performance Optimized**: Limited to 10 points for optimal performance

### 🎯 General Features
- **Algorithm Selection**: Switch between shortest path and MST modes
- **Interactive Help**: Built-in usage guide with step-by-step instructions
- **Real-time Updates**: Dynamic UI updates based on user interactions
- **Error Handling**: Comprehensive error messages and validation
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern React with hooks
- **Leaflet** - Interactive maps
- **React-Leaflet** - React bindings for Leaflet
- **Vite** - Fast build tool and dev server
- **CSS3** - Modern styling with animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Axios** - HTTP client for API calls
- **CORS** - Cross-origin resource sharing
- **OpenStreetMap Overpass API** - Road network data

### Algorithms
- **Dijkstra's Algorithm** - Shortest path finding
- **Prim's Algorithm** - Minimum spanning tree calculation
- **Haversine Formula** - Distance calculations
- **Spatial Indexing** - Efficient nearest neighbor search

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Frontend Setup
1. Clone the repository:
```bash
git clone <repository-url>
cd Route-Optimization
```

2. Install frontend dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup
1. Navigate to the backend directory:
```bash
cd src/backend
```

2. Install backend dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
```

The backend API will be available at `http://localhost:3001`

## 🚀 Usage

### Shortest Path Mode
1. **Select Algorithm**: Choose "Shortest Path" from the dropdown
2. **Set Start Point**: Click on the map to set your starting location
3. **Set Destination**: Click on the map to set your destination
4. **Find Path**: Click the "Find Path" button
5. **View Result**: The shortest route will be displayed as a blue dashed line
6. **Check Distance**: Total distance is shown in kilometers

### MST Mode
1. **Select Algorithm**: Choose "MST" from the dropdown
2. **Add Points**: Click multiple points on the map (2-10 points maximum)
3. **Find MST**: Click the "Find MST" button
4. **View Result**: The minimum spanning tree will be displayed with blue lines
5. **Check Total Distance**: Sum of all road segments is shown

### Help Guide
- Click the "Help ??" button in the header to access the interactive guide
- The guide provides step-by-step instructions for both algorithms
- Tips and warnings are included for optimal usage

## 🏗️ Project Structure

```
Route-Optimization/
├── public/                 # Static assets
├── src/
│   ├── backend/           # Backend server
│   │   ├── server.js      # Express server with API endpoints
│   │   ├── prim.js        # Prim's algorithm implementation
│   │   └── package.json   # Backend dependencies
│   ├── App.jsx           # Main React component
│   ├── MapPath.jsx       # Map component with algorithm logic
│   ├── MapPath.css       # Map styling
│   └── main.jsx          # React entry point
├── package.json          # Frontend dependencies
└── README.md            # This file
```

## 🔧 API Endpoints

### POST `/api/find-path`
Finds the shortest path between two points using Dijkstra's algorithm.

**Request Body:**
```json
{
  "start": { "lat": 30.26, "lon": 77.99 },
  "end": { "lat": 30.27, "lon": 78.00 }
}
```

**Response:**
```json
{
  "path": [
    { "lat": 30.26, "lon": 77.99 },
    { "lat": 30.27, "lon": 78.00 }
  ],
  "distance": 1.23
}
```

### POST `/api/find-mst`
Calculates the minimum spanning tree for multiple points using Prim's algorithm.

**Request Body:**
```json
{
  "points": [
    { "lat": 30.26, "lon": 77.99 },
    { "lat": 30.27, "lon": 78.00 },
    { "lat": 30.28, "lon": 78.01 }
  ]
}
```

**Response:**
```json
{
  "mst": [
    {
      "from": { "lat": 30.26, "lon": 77.99 },
      "to": { "lat": 30.27, "lon": 78.00 },
      "distance": 1.23,
      "path": [...]
    }
  ],
  "totalDistance": 3.45
}
```

## 🧮 Algorithm Details

### Dijkstra's Algorithm
- **Purpose**: Find shortest path between two points
- **Complexity**: O(V²) where V is the number of vertices
- **Implementation**: Uses priority queue for efficiency
- **Features**: Real road network integration, spatial indexing

### Prim's Algorithm
- **Purpose**: Find minimum spanning tree for multiple points
- **Complexity**: O(V²) where V is the number of vertices
- **Implementation**: Greedy algorithm with priority queue
- **Features**: Road-based distance calculations, path reconstruction

## 🎨 UI Components

### Map Interface
- **Interactive Leaflet Map**: OpenStreetMap tiles
- **Custom Markers**: Different styles for start, end, and MST points
- **Path Visualization**: Blue dashed lines for routes
- **Responsive Design**: Adapts to different screen sizes

### Controls
- **Algorithm Selector**: Dropdown to choose between shortest path and MST
- **Action Buttons**: Find Path/Find MST buttons with loading states
- **Status Indicators**: Real-time feedback on current mode and point count
- **Help Panel**: Collapsible guide with instructions

## 🔍 Performance Optimizations

- **Spatial Indexing**: Grid-based nearest neighbor search
- **Road Network Caching**: Efficient data structure for graph operations
- **Limited MST Points**: Maximum 10 points to maintain performance
- **Lazy Loading**: Road data fetched only when needed
- **Memory Management**: Efficient cleanup of map markers and paths

## 🐛 Troubleshooting

### Common Issues

1. **Backend Not Starting**
   - Ensure Node.js is installed (v16+)
   - Check if port 3001 is available
   - Verify all dependencies are installed

2. **Map Not Loading**
   - Check internet connection (requires OpenStreetMap tiles)
   - Verify CORS settings in backend
   - Check browser console for errors

3. **API Calls Failing**
   - Ensure backend server is running on port 3001
   - Check network connectivity
   - Verify request format matches API specification

4. **Performance Issues**
   - Reduce number of MST points (max 10)
   - Check browser memory usage
   - Clear browser cache if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenStreetMap** for providing road network data
- **Leaflet** for the interactive mapping library
- **React** team for the amazing frontend framework
- **Express.js** for the robust backend framework

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the help guide in the application

---

**Happy Routing! 🗺️✨**
