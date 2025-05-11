#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>
#include <cmath>
#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

struct Node {
    double lat, lon;
    std::string id;
    std::vector<std::pair<std::string, double>> neighbors; // neighbor_id, distance
};

class Graph {
private:
    std::unordered_map<std::string, Node> nodes;
    
    double calculateDistance(const Node& a, const Node& b) {
        // Haversine formula to calculate distance between two points on Earth
        const double R = 6371.0; // Earth's radius in kilometers
        double lat1 = a.lat * M_PI / 180.0;
        double lat2 = b.lat * M_PI / 180.0;
        double dlat = (b.lat - a.lat) * M_PI / 180.0;
        double dlon = (b.lon - a.lon) * M_PI / 180.0;

        double a_val = sin(dlat/2) * sin(dlat/2) +
                      cos(lat1) * cos(lat2) *
                      sin(dlon/2) * sin(dlon/2);
        double c = 2 * atan2(sqrt(a_val), sqrt(1-a_val));
        return R * c;
    }

public:
    void addNode(const std::string& id, double lat, double lon) {
        nodes[id] = {lat, lon, id, {}};
    }

    void addEdge(const std::string& from, const std::string& to) {
        if (nodes.count(from) && nodes.count(to)) {
            double distance = calculateDistance(nodes[from], nodes[to]);
            nodes[from].neighbors.push_back({to, distance});
            nodes[to].neighbors.push_back({from, distance});
        }
    }

    std::vector<std::string> findShortestPath(const std::string& start, const std::string& end) {
        std::unordered_map<std::string, double> distances;
        std::unordered_map<std::string, std::string> previous;
        std::priority_queue<std::pair<double, std::string>,
                          std::vector<std::pair<double, std::string>>,
                          std::greater<>> pq;

        for (const auto& node : nodes) {
            distances[node.first] = std::numeric_limits<double>::infinity();
        }
        distances[start] = 0;
        pq.push({0, start});

        while (!pq.empty()) {
            auto current = pq.top().second;
            pq.pop();

            if (current == end) break;

            for (const auto& neighbor : nodes[current].neighbors) {
                double newDist = distances[current] + neighbor.second;
                if (newDist < distances[neighbor.first]) {
                    distances[neighbor.first] = newDist;
                    previous[neighbor.first] = current;
                    pq.push({newDist, neighbor.first});
                }
            }
        }

        std::vector<std::string> path;
        if (distances[end] == std::numeric_limits<double>::infinity()) {
            return path;
        }

        for (std::string current = end; current != start; current = previous[current]) {
            path.push_back(current);
        }
        path.push_back(start);
        std::reverse(path.begin(), path.end());
        return path;
    }

    json getPathCoordinates(const std::vector<std::string>& path) {
        json result = json::array();
        for (const auto& nodeId : path) {
            json point;
            point["lat"] = nodes[nodeId].lat;
            point["lon"] = nodes[nodeId].lon;
            result.push_back(point);
        }
        return result;
    }
};

extern "C" {
    const char* findPath(const char* startId, const char* endId) {
        static std::string result;
        Graph graph;
        
        // TODO: Load real road data here
        // For now, using sample data
        graph.addNode("A", 51.505, -0.09);
        graph.addNode("B", 51.51, -0.1);
        graph.addNode("C", 51.515, -0.095);
        graph.addEdge("A", "B");
        graph.addEdge("B", "C");

        auto path = graph.findShortestPath(startId, endId);
        json pathCoords = graph.getPathCoordinates(path);
        result = pathCoords.dump();
        
        return result.c_str();
    }
} 