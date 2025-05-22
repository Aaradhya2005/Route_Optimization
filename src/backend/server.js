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
            console.log('Road data response:', response.data);
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

        console.log(`Processed ${this.nodes.size} nodes and ${this.roadNetwork.elements.length} elements.`);
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

        const distances = new Map();
        const previous = new Map();
        const priorityQueue = new Set([startNode]);

        // Initialize distances
        this.nodes.forEach((_, nodeId) => {
            distances.set(nodeId, Infinity);
            previous.set(nodeId, null);
        });
        distances.set(startNode, 0);

        while (priorityQueue.size > 0) {
            // Get the node with the smallest distance
            let current = null;
            let smallestDistance = Infinity;

            for (const nodeId of priorityQueue) {
                if (distances.get(nodeId) < smallestDistance) {
                    smallestDistance = distances.get(nodeId);
                    current = nodeId;
                }
            }

            if (current === endNode) {
                // Reconstruct path
                const path = [];
                let node = current;
                while (node) {
                    path.unshift(node);
                    node = previous.get(node);
                }

                return {
                    path: path.map(id => this.nodes.get(id)),
                    distance: distances.get(endNode)
                };
            }

            priorityQueue.delete(current);

            for (const [neighbor, distance] of this.nodes.get(current).neighbors) {
                const tentativeDistance = distances.get(current) + distance;

                if (tentativeDistance < distances.get(neighbor)) {
                    distances.set(neighbor, tentativeDistance);
                    previous.set(neighbor, current);
                    priorityQueue.add(neighbor);
                }
            }
        }

        return { path: [], distance: Infinity };
    }
}

const graph = new Graph();

function calculateBoundingBox(startLat, startLon, endLat, endLon) {
    const minLat = Math.min(startLat, endLat);
    const maxLat = Math.max(startLat, endLat);
    const minLon = Math.min(startLon, endLon);
    const maxLon = Math.max(startLon, endLon);
    return `${minLat},${minLon},${maxLat},${maxLon}`;
}

app.post('/api/find-path', async (req, res) => {
    const { startLat, startLon, endLat, endLon } = req.body;
    try {
        console.log('Finding path from', startLat, startLon, 'to', endLat, endLon);

        // Use a fixed bounding box for Uttarakhand
        const BBOX = '29.0,77.5,31.5,80.5'; // Covers the entire area of Uttarakhand
        console.log('Using BBOX for road data:', BBOX);

        // Initialize the road network with the fixed BBOX
        await graph.initializeRoadNetwork(BBOX);

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