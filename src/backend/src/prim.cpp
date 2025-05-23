#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>
#include <unordered_set>
#include <cmath>
#include <limits>
#include <string>
#include "json.hpp"

using namespace std;
using json = nlohmann::json;

struct Node {
    double lat, lon;
    string id;
    vector<pair<string, double>> neighbors; // neighbor_id, distance
};

class Graph {
private:
    unordered_map<string, Node> nodes;

    double calculateDistance(const Node& a, const Node& b) {
        const double R = 6371.0;
        double dLat = (b.lat - a.lat) * M_PI / 180.0;
        double dLon = (b.lon - a.lon) * M_PI / 180.0;
        double lat1 = a.lat * M_PI / 180.0;
        double lat2 = b.lat * M_PI / 180.0;

        double a_val = sin(dLat/2)*sin(dLat/2) +
                       cos(lat1)*cos(lat2)*sin(dLon/2)*sin(dLon/2);
        double c = 2 * atan2(sqrt(a_val), sqrt(1 - a_val));
        return R * c;
    }

public:
    void addNode(const string& id, double lat, double lon) {
        nodes[id] = {lat, lon, id, {}};
    }

    void addEdge(const string& from, const string& to) {
        if (nodes.count(from) && nodes.count(to)) {
            double dist = calculateDistance(nodes[from], nodes[to]);
            nodes[from].neighbors.push_back({to, dist});
            nodes[to].neighbors.push_back({from, dist});
        }
    }

    vector<pair<string, string>> findMST(const string& start) {
        unordered_map<string, double> key;
        unordered_map<string, string> parent;
        unordered_set<string> Visited;
        priority_queue<pair<double, string>, vector<pair<double, string>>, greater<>> pq;

        for (auto& it : nodes)
            key[it.first] = numeric_limits<double>::infinity();

        key[start] = 0;
        pq.push({0, start});

        while (!pq.empty()) {
            string u = pq.top().second; pq.pop();
            if (Visited.count(u)) continue;
            Visited.insert(u);

            for (auto& neighbor : nodes[u].neighbors) {
                string v = neighbor.first;
                double weight = neighbor.second;
                if (!Visited.count(v) && weight < key[v]) {
                    key[v] = weight;
                    parent[v] = u;
                    pq.push({weight, v});
                }
            }
        }

        vector<pair<string, string>> mstEdges;
        for (auto& it : parent)
            mstEdges.push_back({it.second, it.first});
        return mstEdges;
    }

    json getMSTCoordinates(const vector<pair<string, string>>& mst) {
        json result = json::array();
        for (auto& edge : mst) {
            json entry;
            entry["from"] = {{"lat", nodes[edge.first].lat}, {"lon", nodes[edge.first].lon}};
            entry["to"] = {{"lat", nodes[edge.second].lat}, {"lon", nodes[edge.second].lon}};
            result.push_back(entry);
        }
        return result;
    }
};

extern "C" {
    const char* findMST(const char* startId) {
        static string result;
        Graph g;


        g.addNode("A", 51.505, -0.09);
        g.addNode("B", 51.51, -0.1);
        g.addNode("C", 51.515, -0.095);
        g.addNode("D", 51.52, -0.085);
        g.addEdge("A", "B");
        g.addEdge("A", "C");
        g.addEdge("B", "C");
        g.addEdge("B", "D");
        g.addEdge("C", "D");

        auto mst = g.findMST(startId);
        json coords = g.getMSTCoordinates(mst);
        result = coords.dump();
        return result.c_str();
    }
}
/*int main() {
    const char* result = findMST("A");
    cout << result << endl;
    return 0;
}*/

