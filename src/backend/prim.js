<<<<<<< HEAD
class Graph {
    constructor() {
        this.nodes = new Map(); 
          this.roadNetwork = null;
        this.spatialIndex = new Map();
        this.gridSize = 0.01;
    }

    addNode(nodeId, coords) {
        if (!this.nodes.has(nodeId)) {
            this.nodes.set(nodeId, { neighbors: new Map(), coords });
        }
    }

    addEdge(from, to, weight, fromCoords, toCoords) {
        this.addNode(from, fromCoords);
        this.addNode(to, toCoords);
        this.nodes.get(from).neighbors.set(to, weight);
        this.nodes.get(to).neighbors.set(from, weight);
    }

    findMinimumSpanningTree(startNodeId) {
        if (!this.nodes.has(startNodeId)) return { mst: [], totalWeight: 0 };

        const visited = new Set();
        const mstEdges = [];
        const minHeap = new Set([startNodeId]);
        const edgeWeights = new Map();
        const parent = new Map();

        this.nodes.forEach((_, nodeId) => {
            edgeWeights.set(nodeId, Infinity);
            parent.set(nodeId, null);
        });
        edgeWeights.set(startNodeId, 0);

        while (minHeap.size > 0) {
            let current = null;
            let minWeight = Infinity;
            for (const nodeId of minHeap) {
                if (edgeWeights.get(nodeId) < minWeight) {
                    minWeight = edgeWeights.get(nodeId);
                    current = nodeId;
                }
            }

            minHeap.delete(current);
            visited.add(current);

            if (parent.get(current) !== null) {
                const from = parent.get(current);
                const to = current;
                mstEdges.push({
                    from,
                    to,
                    weight: edgeWeights.get(current),
                    coordinates: [
                        this.nodes.get(from).coords,
                        this.nodes.get(to).coords
                    ]
                });
            }

            for (const [neighbor, weight] of this.nodes.get(current).neighbors) {
                if (!visited.has(neighbor) && weight < edgeWeights.get(neighbor)) {
                    edgeWeights.set(neighbor, weight);
                    parent.set(neighbor, current);
                    minHeap.add(neighbor);
                }
            }
        }

        const totalWeight = mstEdges.reduce((sum, edge) => sum + edge.weight, 0);
        return { mst: mstEdges, totalWeight };
    }
}

const graph = new Graph();

const gpsEdges = [
  {
    from: "A", to: "B", weight: 4,
    fromCoords: [28.6139, 77.2090], toCoords: [28.7041, 77.1025]
  },
  {
    from: "A", to: "C", weight: 2,
    fromCoords: [28.6139, 77.2090], toCoords: [28.5355, 77.3910]
  },
  {
    from: "B", to: "C", weight: 5,
    fromCoords: [28.7041, 77.1025], toCoords: [28.5355, 77.3910]
  },
  {
    from: "B", to: "D", weight: 10,
    fromCoords: [28.7041, 77.1025], toCoords: [28.4595, 77.0266]
  },
  {
    from: "C", to: "D", weight: 3,
    fromCoords: [28.5355, 77.3910], toCoords: [28.4595, 77.0266]
  },
  {
    from: "D", to: "E", weight: 8,
    fromCoords: [28.4595, 77.0266], toCoords: [28.4089, 77.3178]
  },
  {
    from: "E", to: "F", weight: 1,
    fromCoords: [28.4089, 77.3178], toCoords: [28.4081, 77.5806]
  },
  {
    from: "F", to: "C", weight: 4,
    fromCoords: [28.4081, 77.5806], toCoords: [28.5355, 77.3910]
  }
];


gpsEdges.forEach(edge => {
    graph.addEdge(edge.from, edge.to, edge.weight, edge.fromCoords, edge.toCoords);
});


const result = graph.findMinimumSpanningTree("A");

console.log("Minimum Spanning Tree Edges:");
result.mst.forEach(edge => {
    console.log(`${edge.from} -> ${edge.to} (weight: ${edge.weight})`);
    console.log(`   Coordinates: ${JSON.stringify(edge.coordinates)}`);
});
console.log("Total Weight:", result.totalWeight);
=======
class Graph {
    constructor() {
        this.nodes = new Map(); 
          this.roadNetwork = null;
        this.spatialIndex = new Map();
        this.gridSize = 0.01;
    }

    addNode(nodeId, coords) {
        if (!this.nodes.has(nodeId)) {
            this.nodes.set(nodeId, { neighbors: new Map(), coords });
        }
    }

    addEdge(from, to, weight, fromCoords, toCoords) {
        this.addNode(from, fromCoords);
        this.addNode(to, toCoords);
        this.nodes.get(from).neighbors.set(to, weight);
        this.nodes.get(to).neighbors.set(from, weight);
    }

    findMinimumSpanningTree(startNodeId) {
        if (!this.nodes.has(startNodeId)) return { mst: [], totalWeight: 0 };

        const visited = new Set();
        const mstEdges = [];
        const minHeap = new Set([startNodeId]);
        const edgeWeights = new Map();
        const parent = new Map();

        this.nodes.forEach((_, nodeId) => {
            edgeWeights.set(nodeId, Infinity);
            parent.set(nodeId, null);
        });
        edgeWeights.set(startNodeId, 0);

        while (minHeap.size > 0) {
            let current = null;
            let minWeight = Infinity;
            for (const nodeId of minHeap) {
                if (edgeWeights.get(nodeId) < minWeight) {
                    minWeight = edgeWeights.get(nodeId);
                    current = nodeId;
                }
            }

            minHeap.delete(current);
            visited.add(current);

            if (parent.get(current) !== null) {
                const from = parent.get(current);
                const to = current;
                mstEdges.push({
                    from,
                    to,
                    weight: edgeWeights.get(current),
                    coordinates: [
                        this.nodes.get(from).coords,
                        this.nodes.get(to).coords
                    ]
                });
            }

            for (const [neighbor, weight] of this.nodes.get(current).neighbors) {
                if (!visited.has(neighbor) && weight < edgeWeights.get(neighbor)) {
                    edgeWeights.set(neighbor, weight);
                    parent.set(neighbor, current);
                    minHeap.add(neighbor);
                }
            }
        }

        const totalWeight = mstEdges.reduce((sum, edge) => sum + edge.weight, 0);
        return { mst: mstEdges, totalWeight };
    }
}

const graph = new Graph();

const gpsEdges = [
  {
    from: "A", to: "B", weight: 4,
    fromCoords: [28.6139, 77.2090], toCoords: [28.7041, 77.1025]
  },
  {
    from: "A", to: "C", weight: 2,
    fromCoords: [28.6139, 77.2090], toCoords: [28.5355, 77.3910]
  },
  {
    from: "B", to: "C", weight: 5,
    fromCoords: [28.7041, 77.1025], toCoords: [28.5355, 77.3910]
  },
  {
    from: "B", to: "D", weight: 10,
    fromCoords: [28.7041, 77.1025], toCoords: [28.4595, 77.0266]
  },
  {
    from: "C", to: "D", weight: 3,
    fromCoords: [28.5355, 77.3910], toCoords: [28.4595, 77.0266]
  },
  {
    from: "D", to: "E", weight: 8,
    fromCoords: [28.4595, 77.0266], toCoords: [28.4089, 77.3178]
  },
  {
    from: "E", to: "F", weight: 1,
    fromCoords: [28.4089, 77.3178], toCoords: [28.4081, 77.5806]
  },
  {
    from: "F", to: "C", weight: 4,
    fromCoords: [28.4081, 77.5806], toCoords: [28.5355, 77.3910]
  }
];


gpsEdges.forEach(edge => {
    graph.addEdge(edge.from, edge.to, edge.weight, edge.fromCoords, edge.toCoords);
});


const result = graph.findMinimumSpanningTree("A");

console.log("Minimum Spanning Tree Edges:");
result.mst.forEach(edge => {
    console.log(`${edge.from} -> ${edge.to} (weight: ${edge.weight})`);
    console.log(`   Coordinates: ${JSON.stringify(edge.coordinates)}`);
});
console.log("Total Weight:", result.totalWeight);
>>>>>>> a6f66702c81aee0e8eb4b05623afd7aabf8981f5
