const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Importing the prim.js functionality
const { Graph: PrimsGraph } = require('./prim');

const app = express();
app.use(cors());
app.use(express.json());

class Graph {
    constructor() {
        this.nodes = new Map();
        this.roadNetwork = null;
        this.spatialIndex = new Map();
        this.gridSize = 0.01;
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
        const searchRadius = 0.01;
        const centerGridKey = this.getGridKey(lat, lon);
        const [centerLat, centerLon] = centerGridKey.split(',').map(Number);

        let nearestNode = null;
        let minDistance = Infinity;

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

        this.nodes.forEach((_, nodeId) => {
            distances.set(nodeId, Infinity);
            previous.set(nodeId, null);
        });
        distances.set(startNode, 0);

        while (priorityQueue.size > 0) {
            let current = null;
            let smallestDistance = Infinity;

            for (const nodeId of priorityQueue) {
                if (distances.get(nodeId) < smallestDistance) {
                    smallestDistance = distances.get(nodeId);
                    current = nodeId;
                }
            }

            if (current === endNode) {
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
        const BBOX = '29.0,77.5,31.5,80.5'; 
        console.log('Using BBOX for road data:', BBOX);
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

app.post('/api/find-mst', async (req, res) => {
    const { points } = req.body;
    try {
        console.log('Finding MST for points:', points);

        if (!points || points.length < 2) {
            return res.status(400).json({ error: 'Need at least 2 points for MST' });
        }

        if (points.length > 10) {
            return res.status(400).json({ error: 'Maximum 10 points allowed for MST' });
        }
        const BBOX = '29.0,77.5,31.5,80.5';
        console.log('Using BBOX for road data:', BBOX);

        // Initialize the road network with the fixed BBOX
        await graph.initializeRoadNetwork(BBOX);

        // Create a new graph instance for MST
        const mstGraph = new PrimsGraph();
        
        // Find nearest road nodes for all points
        const roadNodes = [];
        for (let i = 0; i < points.length; i++) {
            const nearestNode = graph.findNearestRoadNode(points[i].lat, points[i].lon);
            if (nearestNode) {
                const nodeData = graph.nodes.get(nearestNode);
                roadNodes.push({
                    id: nearestNode,
                    lat: nodeData.lat,
                    lon: nodeData.lon,
                    originalIndex: i
                });
            }
        }

        if (roadNodes.length < 2) {
            return res.status(400).json({ error: 'Could not find road nodes for enough points' });
        }

        // Calculate road distances between all pairs of points using Dijkstra
        for (let i = 0; i < roadNodes.length; i++) {
            for (let j = i + 1; j < roadNodes.length; j++) {
                const fromNode = roadNodes[i];
                const toNode = roadNodes[j];
                
                // Use Dijkstra to find shortest path between these road nodes
                const pathResult = graph.findShortestPath(
                    fromNode.lat, fromNode.lon,
                    toNode.lat, toNode.lon
                );
                
                if (pathResult.path.length > 0) {
                    // Add edge with road distance
                    mstGraph.addEdge(
                        `point_${i}`, 
                        `point_${j}`, 
                        pathResult.distance,
                        [fromNode.lat, fromNode.lon],
                        [toNode.lat, toNode.lon]
                    );
                }
            }
        }

        // Find MST using road distances
        const result = mstGraph.findMinimumSpanningTree("point_0");

        // Transform the MST data to include actual road paths
        const transformedMst = [];
        for (const edge of result.mst) {
            const fromIndex = parseInt(edge.from.replace('point_', ''));
            const toIndex = parseInt(edge.to.replace('point_', ''));
            
            const fromNode = roadNodes[fromIndex];
            const toNode = roadNodes[toIndex];
            
            // Get the actual road path between these nodes
            const pathResult = graph.findShortestPath(
                fromNode.lat, fromNode.lon,
                toNode.lat, toNode.lon
            );
            
            if (pathResult.path.length > 0) {
                transformedMst.push({
                    from: {
                        lat: fromNode.lat,
                        lon: fromNode.lon
                    },
                    to: {
                        lat: toNode.lat,
                        lon: toNode.lon
                    },
                    weight: edge.weight,
                    path: pathResult.path.map(node => ({ lat: node.lat, lon: node.lon }))
                });
            }
        }

        console.log('Road-based MST:', transformedMst);

        res.json({
            mst: transformedMst,
            totalWeight: result.totalWeight
        });
    } catch (error) {
        console.error('Error finding MST:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to calculate distance between two points
function calculateHaversineDistance(a, b) {
    const R = 6371.0; // Earth's radius in kilometers
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 