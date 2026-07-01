import networkx as nx
import numpy as np

def calculate_resilience_index(G_baseline, G_perturbed):
    """
    Calculates the Resilience Index (R).
    R = (Average Shortest Path Length in baseline) / (Average Shortest Path Length in perturbed)
    Note: For disconnected subgraphs, we average path lengths of the connected components
    or use the global network efficiency (harmonic mean of shortest paths).
    """
    def average_shortest_path_efficiency(G):
        if len(G) <= 1:
            return 0.0
        # Compute shortest paths for all pairs
        lengths = []
        for node in G.nodes():
            path_lengths = nx.single_source_shortest_path_length(G, node)
            for target, dist in path_lengths.items():
                if node != target:
                    lengths.append(dist)
        if not lengths:
            return 0.0
        # Return average path length (lower is more efficient/shorter)
        return sum(lengths) / len(lengths)

    eff_baseline = average_shortest_path_efficiency(G_baseline)
    eff_perturbed = average_shortest_path_efficiency(G_perturbed)
    
    if eff_perturbed == 0:
        return 0.0
    # Higher path length in perturbed means lower resilience, R decreases.
    # In standard terms, R = baseline_length / perturbed_length.
    return eff_baseline / eff_perturbed

def simulate_node_ablation(nodes, edges, num_removals=3):
    """
    Simulates systemic failures by removing the highest-betweenness-centrality nodes sequentially.
    """
    # Initialize NetworkX graph
    G = nx.Graph()
    for n_id, coords in nodes.items():
        G.add_node(n_id, pos=coords)
    G.add_edges_from(edges)
    
    G_current = G.copy()
    ablation_log = []
    
    # Calculate baseline average path length
    # If G is empty or disconnected, average_shortest_path_length might fail, so we handle it gracefully.
    try:
        baseline_efficiency = nx.average_shortest_path_length(G_current)
    except nx.NetworkXNoPath:
        # Fallback to largest connected component
        largest_cc = max(nx.connected_components(G_current), key=len)
        baseline_efficiency = nx.average_shortest_path_length(G_current.subgraph(largest_cc))
        
    ablation_log.append({
        "step": 0,
        "removed_node": None,
        "betweenness": 0.0,
        "resilience_index": 1.0,
        "nodes_remaining": len(G_current.nodes),
        "edges_remaining": len(G_current.edges)
    })
    
    for step in range(1, num_removals + 1):
        if len(G_current.nodes) <= 1:
            break
            
        # 1. Compute Betweenness Centrality
        centrality = nx.betweenness_centrality(G_current)
        if not centrality:
            break
            
        # 2. Find node with highest centrality
        target_node = max(centrality, key=centrality.get)
        target_val = centrality[target_node]
        
        # 3. Remove node
        G_current.remove_node(target_node)
        
        # 4. Calculate perturbed efficiency & Resilience Index
        try:
            current_efficiency = nx.average_shortest_path_length(G_current)
        except (nx.NetworkXNoPath, nx.NetworkXError, ZeroDivisionError, ValueError):
            # Fallback to largest connected component if disconnected
            ccs = [G_current.subgraph(c) for c in nx.connected_components(G_current)]
            if ccs:
                largest_cc = max(ccs, key=len)
                if len(largest_cc) > 1:
                    current_efficiency = nx.average_shortest_path_length(largest_cc)
                else:
                    current_efficiency = float('inf')
            else:
                current_efficiency = float('inf')
                
        # Calculate R
        if current_efficiency == float('inf'):
            r_index = 0.0
        else:
            r_index = baseline_efficiency / current_efficiency
            
        ablation_log.append({
            "step": step,
            "removed_node": target_node,
            "betweenness": target_val,
            "resilience_index": r_index,
            "nodes_remaining": len(G_current.nodes),
            "edges_remaining": len(G_current.edges)
        })
        
    return ablation_log

if __name__ == "__main__":
    # Test simulation on a simple network
    nodes = {
        1: (0, 0), 2: (1, 0), 3: (2, 0),
        4: (1, 1), 5: (1, -1)
    }
    # 2 is a central hub (star topology)
    edges = [(1, 2), (3, 2), (4, 2), (5, 2)]
    
    results = simulate_node_ablation(nodes, edges, num_removals=2)
    for res in results:
        print(f"Step {res['step']}: Removed Node={res['removed_node']} | Betweenness={res['betweenness']:.3f} | R={res['resilience_index']:.3f}")
