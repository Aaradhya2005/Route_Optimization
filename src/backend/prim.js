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
module.exports = { Graph };
