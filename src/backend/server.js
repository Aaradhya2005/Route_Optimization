const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

class Graph {
    constructor() {
        this.nodes = new Map();
        this.roadNetwork = null;
        this.spatialIndex = new Map(); // Grid-based spatial index
        this.gridSize = 0.01; // Grid cell size in degrees
    }

    async initializeRoadNetwork(bbox) {
        const query = `
            [out:json][timeout:60];
            (
                way["highway"~"motorway|trunk|primary|secondary|tertiary|residential"](${bbox});
                >;
            );
            out body;
        `;

        try {
            console.log('Fetching road data...');
            const response = await axios.post('https://overpass-api.de/api/interpreter', query);
            this.roadNetwork = response.data;
            this.processRoadData();
            console.log(`Road network initialized with ${this.nodes.size} nodes`);
        } catch (error) {
            console.error('Error fetching road data:', error);
            throw error;
        }
    }

    getGridKey(lat, lon) {
        const latGrid = Math.floor(lat / this.gridSize);
        const lonGrid = Math.floor(lon / this.gridSize);
        return `${latGrid},${lonGrid}`;
    }

    addToSpatialIndex(nodeId, lat, lon) {
        const key = this.getGridKey(lat, lon);
        if (!this.spatialIndex.has(key)) {
            this.spatialIndex.set(key, new Set());
        }
        this.spatialIndex.get(key).add(nodeId);
    }

    processRoadData() {
        // Process nodes first
        this.roadNetwork.elements.forEach(element => {
            if (element.type === 'node') {
                const nodeId = element.id.toString();
                this.nodes.set(nodeId, {
                    lat: element.lat,
                    lon: element.lon,
                    neighbors: new Map()
                });
                this.addToSpatialIndex(nodeId, element.lat, element.lon);
            }
        });

        // Process ways to build connections
        this.roadNetwork.elements.forEach(element => {
            if (element.type === 'way' && element.tags && element.tags.highway) {
                const nodes = element.nodes;
                for (let i = 0; i < nodes.length - 1; i++) {
                    const from = nodes[i].toString();
                    const to = nodes[i + 1].toString();
                    if (this.nodes.has(from) && this.nodes.has(to)) {
                        const distance = this.calculateDistance(
                            this.nodes.get(from),
                            this.nodes.get(to)
                        );
                        this.nodes.get(from).neighbors.set(to, distance);
                        this.nodes.get(to).neighbors.set(from, distance);
                    }
                }
            }
        });
    }

    calculateDistance(a, b) {
        const R = 6371.0;
        const lat1 = a.lat * Math.PI / 180.0;
        const lat2 = b.lat * Math.PI / 180.0;
        const dlat = (b.lat - a.lat) * Math.PI / 180.0;
        const dlon = (b.lon - a.lon) * Math.PI / 180.0;

        const a_val = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dlon / 2) * Math.sin(dlon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a_val), Math.sqrt(1 - a_val));
        return R * c;
    }

    findNearestRoadNode(lat, lon) {
        const searchRadius = 0.01; // Search radius in degrees
        const centerGridKey = this.getGridKey(lat, lon);
        const [centerLat, centerLon] = centerGridKey.split(',').map(Number);

        let nearestNode = null;
        let minDistance = Infinity;

        // Search in neighboring grid cells
        for (let latOffset = -1; latOffset <= 1; latOffset++) {
            for (let lonOffset = -1; lonOffset <= 1; lonOffset++) {
                const key = `${centerLat + latOffset},${centerLon + lonOffset}`;
                const nodesInCell = this.spatialIndex.get(key);

                if (nodesInCell) {
                    for (const nodeId of nodesInCell) {
                        const node = this.nodes.get(nodeId);
                        const distance = this.calculateDistance(
                            { lat, lon },
                            { lat: node.lat, lon: node.lon }
                        );
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestNode = nodeId;
                        }
                    }
                }
            }
        }

        return nearestNode;
    }

    findShortestPath(startLat, startLon, endLat, endLon) {
        const startNode = this.findNearestRoadNode(startLat, startLon);
        const endNode = this.findNearestRoadNode(endLat, endLon);

        if (!startNode || !endNode) {
            return { path: [], distance: Infinity };
        }

        // A* pathfinding implementation
        const openSet = new Set([startNode]);
        const closedSet = new Set();
        const gScore = new Map([[startNode, 0]]);
        const fScore = new Map([[startNode, this.calculateDistance(
            this.nodes.get(startNode),
            this.nodes.get(endNode)
        )]]);
        const cameFrom = new Map();
        const startTime = Date.now();
        const TIMEOUT = 2000; // 2 second timeout

        while (openSet.size > 0) {
            if (Date.now() - startTime > TIMEOUT) {
                console.log('Pathfinding timed out');
                return { path: [], distance: Infinity };
            }

            // Find node with lowest fScore
            let current = null;
            let lowestFScore = Infinity;
            for (const nodeId of openSet) {
                const score = fScore.get(nodeId);
                if (score < lowestFScore) {
                    lowestFScore = score;
                    current = nodeId;
                }
            }

            if (current === endNode) {
                // Reconstruct path
                const path = [];
                let node = current;
                while (node) {
                    path.unshift(node);
                    node = cameFrom.get(node);
                }

                const finalPath = [
                    { lat: startLat, lon: startLon },
                    ...path.map(id => this.nodes.get(id)),
                    { lat: endLat, lon: endLon }
                ];

                return {
                    path: finalPath,
                    distance: gScore.get(endNode)
                };
            }

            openSet.delete(current);
            closedSet.add(current);

            for (const [neighbor, distance] of this.nodes.get(current).neighbors) {
                if (closedSet.has(neighbor)) continue;

                const tentativeGScore = gScore.get(current) + distance;

                if (!openSet.has(neighbor)) {
                    openSet.add(neighbor);
                } else if (tentativeGScore >= gScore.get(neighbor)) {
                    continue;
                }

                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                fScore.set(neighbor, tentativeGScore + this.calculateDistance(
                    this.nodes.get(neighbor),
                    this.nodes.get(endNode)
                ));
            }
        }

        return { path: [], distance: Infinity };
    }
}

const graph = new Graph();
// Expanded bounding box to cover a larger area of Dehradun
const BBOX = '30.0,77.7,30.5,78.2'; // Covers a much larger area

console.log('Initializing road network for expanded area:', BBOX);
graph.initializeRoadNetwork(BBOX).catch(error => {
    console.error('Failed to initialize road network:', error);
    process.exit(1);
});

app.post('/api/find-path', async (req, res) => {
    const { startLat, startLon, endLat, endLon } = req.body;
    try {
        console.log('Finding path from', startLat, startLon, 'to', endLat, endLon);
        const result = graph.findShortestPath(startLat, startLon, endLat, endLon);

        if (result.path.length === 0) {
            return res.status(404).json({ error: 'No path found' });
        }

        res.json({
            path: result.path,
            distance: result.distance
        });
    } catch (error) {
        console.error('Error finding path:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 