import numpy as np
import math
import networkx as nx

class DisjointSet:
    def __init__(self, elements):
        self.parent = {el: el for el in elements}
        self.rank = {el: 0 for el in elements}

    def find(self, i):
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def union(self, i, j):
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            if self.rank[root_i] < self.rank[root_j]:
                self.parent[root_i] = root_j
            elif self.rank[root_i] > self.rank[root_j]:
                self.parent[root_j] = root_i
            else:
                self.parent[root_j] = root_i
                self.rank[root_i] += 1
            return True
        return False

def calculate_angle(p1, p2):
    """Calculate the angle of vector p1 -> p2 in degrees."""
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    return math.degrees(math.atan2(dy, dx)) % 360

def angular_diff(a1, a2):
    """Compute the absolute difference between two angles in degrees."""
    diff = abs(a1 - a2) % 360
    return min(diff, 360 - diff)

def heal_road_network(nodes, fragmented_edges, max_gap_distance=50.0, angle_tolerance=45.0):
    """
    Heals a fragmented road network mask by connecting disconnected sub-graphs
    using a custom Minimum Spanning Tree (MST) approach constrained by Euclidean distance
    and angular continuity.
    
    Args:
        nodes (dict): Mapping of node ID to (x, y) coordinates.
        fragmented_edges (list): List of (u, v) edge tuples representing raw extracted roads.
        max_gap_distance (float): Maximum allowed gap length to heal.
        angle_tolerance (float): Maximum angular deviation allowed for continuation.
        
    Returns:
        healed_edges (list): Original edges plus newly created healing edges.
        added_edges (list): Only the new bridging edges.
    """
    # 1. Group nodes into connected components using Disjoint Sets
    ds = DisjointSet(nodes.keys())
    for u, v in fragmented_edges:
        ds.union(u, v)
        
    # Find active endpoints (nodes connected to only 1 edge in their component)
    degree = {n: 0 for n in nodes.keys()}
    for u, v in fragmented_edges:
        degree[u] += 1
        degree[v] += 1
        
    endpoints = [n for n, deg in degree.items() if deg <= 1]
    
    # 2. Identify candidate healing links between endpoints of different components
    candidates = []
    for i in range(len(endpoints)):
        u = endpoints[i]
        u_coords = nodes[u]
        u_root = ds.find(u)
        
        # Find neighboring nodes in the same component to establish direction vector
        u_neighbors = [v for u_edge, v in fragmented_edges if u_edge == u] + \
                      [v for v, u_edge in fragmented_edges if u_edge == u]
        
        u_angle = None
        if u_neighbors:
            u_angle = calculate_angle(nodes[u_neighbors[0]], u_coords)
            
        for j in range(i + 1, len(endpoints)):
            v = endpoints[j]
            v_root = ds.find(v)
            
            # Avoid healing within the same connected component
            if u_root == v_root:
                continue
                
            v_coords = nodes[v]
            dist = math.hypot(v_coords[0] - u_coords[0], v_coords[1] - u_coords[1])
            
            if dist <= max_gap_distance:
                # Check angular alignment: vector u -> v should align with road direction
                link_angle = calculate_angle(u_coords, v_coords)
                
                v_neighbors = [n for n_edge, n in fragmented_edges if n_edge == v] + \
                              [n for n, n_edge in fragmented_edges if n_edge == v]
                v_angle = None
                if v_neighbors:
                    v_angle = calculate_angle(v_coords, nodes[v_neighbors[0]])
                
                aligns = True
                if u_angle is not None:
                    if angular_diff(u_angle, link_angle) > angle_tolerance:
                        aligns = False
                if v_angle is not None and aligns:
                    if angular_diff(link_angle, v_angle) > angle_tolerance:
                        aligns = False
                        
                if aligns:
                    candidates.append((dist, u, v))
                    
    # Sort candidates by distance (shortest gaps first)
    candidates.sort()
    
    # 3. Add edges using Kruskal's-like logic to form the MST of connections
    added_edges = []
    healed_edges = list(fragmented_edges)
    
    for dist, u, v in candidates:
        if ds.union(u, v):
            healed_edges.append((u, v))
            added_edges.append((u, v))
            
    return healed_edges, added_edges

if __name__ == "__main__":
    mock_nodes = {
        0: (10, 10), 1: (50, 10),
        2: (70, 12), 3: (110, 15),
        4: (10, 50), 5: (50, 50),
        6: (60, 90), 7: (60, 130)
    }
    mock_edges = [(0, 1), (2, 3), (4, 5), (6, 7)]
    healed, added = heal_road_network(mock_nodes, mock_edges, max_gap_distance=30.0, angle_tolerance=30.0)
    print("Original Edges:", mock_edges)
    print("Healed Edges:", healed)
    print("Bridging links added:", added)
