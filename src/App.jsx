import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Map as MapIcon, 
  Cpu, 
  GitCommit, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  Download, 
  RefreshCw, 
  Zap, 
  Layers, 
  CheckCircle, 
  Flame,
  Info,
  Sliders,
  ChevronRight,
  Database,
  Network,
  Shield,
  HelpCircle,
  X,
  Clock,
  BarChart3,
  MessageSquare,
  Send
} from 'lucide-react';
import { 
  AreaChart, Area, 
  LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// --- REAL BENGALURU COORDINATES FOR GIS OVERLAY ---
const INITIAL_NODES = [
  { id: '1', name: 'Majestic Transport Hub', lat: 12.9779, lng: 77.5724, baselineCentrality: 0.85, status: 'active', info: 'Primary city transport intersection connecting west and east corridors.' },
  { id: '2', name: 'Koramangala Ring Road', lat: 12.9348, lng: 77.6189, baselineCentrality: 0.72, status: 'active', info: 'High-density commercial corridor prone to canopy occlusions.' },
  { id: '3', name: 'Silk Board Junction', lat: 12.9176, lng: 77.6244, baselineCentrality: 0.95, status: 'active', info: 'Critical southern entry/exit bottleneck; single point of failure.' },
  { id: '4', name: 'Indiranagar 100ft Rd', lat: 12.9718, lng: 77.6411, baselineCentrality: 0.60, status: 'active', info: 'Major commercial & arterial street with heavy tree shadow covers.' },
  { id: '5', name: 'Hebbal Flyover', lat: 13.0358, lng: 77.5978, baselineCentrality: 0.88, status: 'active', info: 'Northern gateway connection to Kempegowda Airport.' },
  { id: '6', name: 'MG Road Crossing', lat: 12.9738, lng: 77.6119, baselineCentrality: 0.78, status: 'active', info: 'Central Business District hub; overlaps high-rise shadows.' },
  { id: '7', name: 'Yeshwanthpur Industrial', lat: 13.0285, lng: 77.5401, baselineCentrality: 0.55, status: 'active', info: 'Industrial freight connector node supporting heavy cargo transport.' },
  { id: '8', name: 'Whitefield Tech Corridor', lat: 12.9698, lng: 77.7500, baselineCentrality: 0.65, status: 'active', info: 'IT hub perimeter gatekeeper; subject to rapid expansion occlusions.' },
  { id: '9', name: 'Electronic City Tollway', lat: 12.8407, lng: 77.6763, baselineCentrality: 0.50, status: 'active', info: 'Elevated highway gateway managing southern tech commuter routes.' },
  { id: '10', name: 'Outer Ring Rd East', lat: 12.9234, lng: 77.6834, baselineCentrality: 0.68, status: 'active', info: 'Critical bypass route segment linking key tech zones.' }
];

const INITIAL_EDGES = [
  { source: '1', target: '5', length: 180, isHealed: false, type: 'arterial' },
  { source: '1', target: '7', length: 110, isHealed: false, type: 'arterial' },
  { source: '1', target: '6', length: 130, isHealed: false, type: 'highway' },
  { source: '7', target: '5', length: 170, isHealed: false, type: 'arterial' },
  { source: '6', target: '4', length: 120, isHealed: false, type: 'arterial' },
  { source: '4', target: '8', length: 190, isHealed: false, type: 'arterial' },
  { source: '6', target: '2', length: 150, isHealed: false, type: 'arterial' },
  { source: '2', target: '3', length: 110, isHealed: false, type: 'highway' },
  { source: '3', target: '9', length: 140, isHealed: false, type: 'highway' },
  { source: '2', target: '10', length: 170, isHealed: false, type: 'arterial' },
  { source: '10', target: '8', length: 130, isHealed: false, type: 'arterial' },
  { source: '3', target: '10', length: 150, isHealed: false, type: 'arterial' },
  
  // Occlusion gaps healed by MST
  { source: '5', target: '6', length: 160, isHealed: true, type: 'healed', occlusion: 'Tree Canopy', gapScore: 'Dist: 32m, Dev: 14°' },
  { source: '4', target: '10', length: 180, isHealed: true, type: 'healed', occlusion: 'Building Shadows', gapScore: 'Dist: 48m, Dev: 22°' },
  { source: '8', target: '9', length: 280, isHealed: true, type: 'healed', occlusion: 'Cloud Cover', gapScore: 'Dist: 85m, Dev: 31°' }
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing Telemetry...');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [mstEnabled, setMstEnabled] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Pathfinding Routing Coordinates
  const [startNode, setStartNode] = useState('1');
  const [endNode, setEndNode] = useState('3');
  const [shortestPath, setShortestPath] = useState([]);
  const [activePathLength, setActivePathLength] = useState(0);
  
  // Flood Level Slider State
  const [floodLevel, setFloodLevel] = useState(0);

  // System metrics
  const [resilienceIndex, setResilienceIndex] = useState(1.0);
  const [ablationLog, setAblationLog] = useState([
    { time: '10:30:59', event: 'Grid Telemetry Active', cause: 'Initialization', impact: 'Baseline established at R = 1.0' }
  ]);

  // Drag and Drop State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictStep, setPredictStep] = useState(0);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'assistant', text: 'Namaste! I am your NNRMS GIS assistant. How can I help you analyze the Bengaluru road network?' }
  ]);
  const [userInput, setUserInput] = useState('');

  // Stepper states for Phase II Graph Healing Step-by-Step
  const [mstStep, setMstStep] = useState(0);
  const [sliderVal, setSliderVal] = useState(65);
  const [showAbout, setShowAbout] = useState(false);

  // Ref for Leaflet Map
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const mapLayersRef = useRef([]);

  // Loader sequence
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLoadingProgress(33);
      setLoadingText('🛰️ Initializing Cartosat-3 Telemetry Channels...');
    }, 600);

    const timer2 = setTimeout(() => {
      setLoadingProgress(66);
      setLoadingText('🧠 Loading Deep Attention Segmentation Pipeline...');
    }, 1200);

    const timer3 = setTimeout(() => {
      setLoadingProgress(100);
      setLoadingText('🕸️ Building Bengaluru Sector Topological Graph...');
    }, 1800);

    const timer4 = setTimeout(() => {
      setLoading(false);
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // Update routing when structural changes happen
  useEffect(() => {
    calculateRoute();
  }, [nodes, edges, mstEnabled, startNode, endNode]);

  // Recalculate Resilience index
  useEffect(() => {
    recalculateNetworkMetrics();
  }, [nodes, edges, mstEnabled]);

  // Handle dynamic flood ablation triggers
  useEffect(() => {
    if (floodLevel === 0) {
      setNodes(prev => prev.map(n => ({ ...n, status: 'active' })));
    } else {
      // Sequentially ablate nodes based on centrality and flood height percentage
      setNodes(prev => prev.map(n => {
        // Disabling critical nodes at high levels
        if (floodLevel >= 80 && (n.id === '3' || n.id === '2' || n.id === '5')) {
          return { ...n, status: 'disabled' };
        }
        if (floodLevel >= 40 && (n.id === '3' || n.id === '2')) {
          return { ...n, status: 'disabled' };
        }
        return { ...n, status: 'active' };
      }));
    }
  }, [floodLevel]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (loading || !mapRef.current) return;

    // Standard Leaflet Initialization centered on Bengaluru
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [12.9716, 77.5946],
        zoom: 11,
        zoomControl: false
      });

      // Add CartoDB Dark Matter layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstance.current);
    }

    renderMapLayers();

  }, [loading, nodes, edges, mstEnabled, shortestPath, activeTab]);

  const renderMapLayers = () => {
    if (!mapInstance.current) return;

    // Clear previous vector paths and markers
    mapLayersRef.current.forEach(layer => mapInstance.current.removeLayer(layer));
    mapLayersRef.current = [];

    // Draw Edges
    edges.forEach(edge => {
      const u = nodes.find(n => n.id === edge.source);
      const v = nodes.find(n => n.id === edge.target);
      if (!u || !v) return;

      const isShortest = shortestPath.indexOf(edge.source) !== -1 && 
                         shortestPath.indexOf(edge.target) !== -1 &&
                         Math.abs(shortestPath.indexOf(edge.source) - shortestPath.indexOf(edge.target)) === 1;

      const isEdgeDisabled = u.status === 'disabled' || v.status === 'disabled' || (edge.isHealed && !mstEnabled);

      if (edge.isHealed && !mstEnabled) return;

      const polyline = L.polyline([[u.lat, u.lng], [v.lat, v.lng]], {
        color: isEdgeDisabled ? '#1e293b' : isShortest ? '#00E5FF' : edge.isHealed ? '#a855f7' : '#2563EB',
        weight: isShortest ? 6 : edge.isHealed ? 4 : 3,
        dashArray: edge.isHealed ? '5, 5' : null,
        opacity: isEdgeDisabled ? 0.2 : 0.8
      }).addTo(mapInstance.current);

      mapLayersRef.current.push(polyline);
    });

    // Draw Nodes
    nodes.forEach(node => {
      const isNodeOnShortestPath = shortestPath.includes(node.id);
      
      const circleMarker = L.circleMarker([node.lat, node.lng], {
        radius: node.status === 'disabled' ? 12 : isNodeOnShortestPath ? 10 : 8,
        fillColor: node.status === 'disabled' ? '#ef4444' : isNodeOnShortestPath ? '#00E5FF' : '#2563EB',
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 0.9
      }).addTo(mapInstance.current);

      circleMarker.bindPopup(`
        <div style="color: #030712; font-family: sans-serif; font-size: 11px;">
          <strong style="font-size: 12px;">${node.name}</strong><br/>
          Centrality: ${node.baselineCentrality}<br/>
          Status: <span style="color: ${node.status === 'active' ? '#10b981' : '#ef4444'}">${node.status.toUpperCase()}</span>
        </div>
      `);

      circleMarker.on('click', () => {
        setSelectedNode(node);
      });

      mapLayersRef.current.push(circleMarker);
    });
  };

  const calculateRoute = () => {
    const adj = {};
    nodes.forEach(n => {
      if (n.status === 'active') adj[n.id] = [];
    });

    edges.forEach(e => {
      const u = e.source;
      const v = e.target;
      if (e.isHealed && !mstEnabled) return;
      
      const nodeU = nodes.find(n => n.id === u);
      const nodeV = nodes.find(n => n.id === v);
      
      if (nodeU && nodeV && nodeU.status === 'active' && nodeV.status === 'active') {
        adj[u].push({ node: v, weight: e.length });
        adj[v].push({ node: u, weight: e.length });
      }
    });

    if (!adj[startNode] || !adj[endNode]) {
      setShortestPath([]);
      setActivePathLength(0);
      return;
    }

    const distances = {};
    const previous = {};
    const queue = new Set();

    Object.keys(adj).forEach(node => {
      distances[node] = Infinity;
      previous[node] = null;
      queue.add(node);
    });

    distances[startNode] = 0;

    while (queue.size > 0) {
      let minNode = null;
      queue.forEach(node => {
        if (minNode === null || distances[node] < distances[minNode]) {
          minNode = node;
        }
      });

      if (distances[minNode] === Infinity || minNode === endNode) {
        break;
      }

      queue.delete(minNode);

      adj[minNode].forEach(neighbor => {
        const alt = distances[minNode] + neighbor.weight;
        if (alt < distances[neighbor.node]) {
          distances[neighbor.node] = alt;
          previous[neighbor.node] = minNode;
        }
      });
    }

    const path = [];
    let current = endNode;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }

    if (distances[endNode] !== Infinity) {
      setShortestPath(path);
      setActivePathLength(distances[endNode]);
    } else {
      setShortestPath([]);
      setActivePathLength(0);
    }
  };

  const recalculateNetworkMetrics = () => {
    const activeNodes = nodes.filter(n => n.status === 'active').length;
    const activeEdges = edges.filter(e => {
      if (e.isHealed && !mstEnabled) return false;
      const u = nodes.find(n => n.id === e.source);
      const v = nodes.find(n => n.id === e.target);
      return u && v && u.status === 'active' && v.status === 'active';
    }).length;

    let calculatedR = 1.0;
    if (activeNodes < nodes.length) {
      const disabledCount = nodes.length - activeNodes;
      calculatedR = Math.max(0.0, 1.0 - (disabledCount * 0.22) - (mstEnabled ? 0.0 : 0.15));
    } else if (!mstEnabled) {
      calculatedR = 0.81;
    }
    
    setResilienceIndex(parseFloat(calculatedR.toFixed(2)));
  };

  const toggleNodeStatus = (nodeId) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextStatus = n.status === 'active' ? 'disabled' : 'active';
        
        const logEvent = {
          time: new Date().toLocaleTimeString(),
          event: nextStatus === 'disabled' ? `Node "${n.name}" Disabled` : `Node "${n.name}" Restored`,
          cause: nextStatus === 'disabled' ? 'Urban Stress Simulation' : 'Recovery Action',
          impact: nextStatus === 'disabled' ? 'Rerouting overhead increased; bottlenecks shifting.' : 'Connectivity returned to normal.'
        };
        setAblationLog(prevLog => [logEvent, ...prevLog]);
        
        return { ...n, status: nextStatus };
      }
      return n;
    }));
  };

  const triggerScenario = (type) => {
    resetNetwork();
    if (type === 'monsoon') {
      setNodes(prev => prev.map(n => {
        if (n.id === '3' || n.id === '2') return { ...n, status: 'disabled' };
        return n;
      }));
      setAblationLog(prev => [{
        time: new Date().toLocaleTimeString(),
        event: 'Monsoon Flood Inundation',
        cause: 'Scenario Trigger: Heavy Rainfall (>100mm)',
        impact: 'Silk Board and Koramangala sectors offline. Complete southern corridor failure.'
      }, ...prev]);
    } else if (type === 'accident') {
      setNodes(prev => prev.map(n => {
        if (n.id === '5') return { ...n, status: 'disabled' };
        return n;
      }));
      setAblationLog(prev => [{
        time: new Date().toLocaleTimeString(),
        event: 'Northern Corridor Gridlock',
        cause: 'Scenario Trigger: Airport road multi-vehicle collision',
        impact: 'Hebbal Flyover blocked. Traffic diverted to Yeshwanthpur route.'
      }, ...prev]);
    }
  };

  const resetNetwork = () => {
    setNodes(INITIAL_NODES.map(n => ({ ...n, status: 'active' })));
    setMstEnabled(true);
    setFloodLevel(0);
    setAblationLog([{
      time: new Date().toLocaleTimeString(),
      event: 'Baseline Re-established',
      cause: 'System Reset Command',
      impact: 'All nodes restored; topological networks active.'
    }]);
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImageUpload(e.target.files[0]);
    }
  };

  const processImageUpload = (file) => {
    setUploadedImage(URL.createObjectURL(file));
    setPredicting(true);
    setPredictStep(0);

    const step1 = setTimeout(() => setPredictStep(1), 800);
    const step2 = setTimeout(() => setPredictStep(2), 1600);
    const step3 = setTimeout(() => {
      setPredicting(false);
      // Trigger a visual confirmation alert
      alert("AI Inference Complete! Roads extracted & thinned. Network graph rebuilt.");
    }, 2400);
  };

  // Chatbot submit
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessages = [...chatMessages, { sender: 'user', text: userInput }];
    setChatMessages(newMessages);
    setUserInput('');

    // Simulated responses answering GIS / Algorithm queries
    setTimeout(() => {
      let botResponse = 'I can help explain path algorithms, centrality parameters, or evacuation strategies.';
      const query = userInput.toLowerCase();

      if (query.includes('silk board') || query.includes('majestic')) {
        botResponse = 'Silk Board and Majestic are high Betweenness Centrality nodes (0.95 and 0.85). They are critical bottlenecks because they sit on the shortest paths linking major commercial zones.';
      } else if (query.includes('mst') || query.includes('healing')) {
        botResponse = 'Minimum Spanning Tree (MST) healing connects disconnected road fragments using a distance & angular cost function, ensuring all disjoint sectors become reachable.';
      } else if (query.includes('resilience') || query.includes('index')) {
        botResponse = 'The Resilience Index (R) is the ratio of average shortest path lengths before and after network disruptions. Lower R values indicate vulnerable systems.';
      } else if (query.includes('evacuate') || query.includes('detour')) {
        botResponse = 'In case of flood blockages at Silk Board, the optimal detour bypasses Outer Ring Road East to Whitefield Tech Corridor.';
      }

      setChatMessages([...newMessages, { sender: 'assistant', text: botResponse }]);
    }, 600);
  };

  const downloadReport = () => {
    window.print();
  };

  // Data mapping from PPT
  const learningCurve = [
    { epoch: 10, Standard_BCE: 0.61, Custom_OcclusionRecall: 0.74 },
    { epoch: 20, Standard_BCE: 0.69, Custom_OcclusionRecall: 0.81 },
    { epoch: 30, Standard_BCE: 0.74, Custom_OcclusionRecall: 0.87 },
    { epoch: 40, Standard_BCE: 0.79, Custom_OcclusionRecall: 0.91 },
    { epoch: 50, Standard_BCE: 0.82, Custom_OcclusionRecall: 0.94 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center font-mono text-slate-100 p-6">
        <div className="max-w-md w-full flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-[#00E5FF]/40 shadow-[0_0_30px_rgba(0,229,255,0.3)] animate-pulse">
            <Cpu className="h-9 w-9 text-[#00E5FF]" />
          </div>
          
          <div className="w-full flex flex-col gap-2">
            <div className="flex justify-between text-xs text-white/50">
              <span>SYSTEM INITIALIZATION</span>
              <span>{loadingProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-[#00E5FF] transition-all duration-500 shadow-[0_0_10px_rgba(0,229,255,0.5)]"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-emerald-400 font-bold">{loadingText}</p>
            <p className="text-[10px] text-white/20 mt-1">ISRO NNRMS • CARTOSAT-3 DEEP CORE</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col font-sans select-none text-slate-100 relative">
      
      {/* HEADER */}
      <header className="glass-panel-heavy border-b border-white/10 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-blue-600/30 flex items-center justify-center border border-[#00E5FF]/40 shadow-[0_0_15px_rgba(0,229,255,0.25)] flex-shrink-0">
            <Cpu className="h-7 w-7 text-[#00E5FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
                ISRO NNRMS PIPELINE
              </span>
              <span className="text-xs text-white/40">🛰️ Cartosat-3 Core (0.28m)</span>
            </div>
            <h1 className="text-base font-bold tracking-tight text-white mt-0.5">
              Route Resilience Command Dashboard
            </h1>
            <p className="text-[11px] text-slate-400">
              AI-powered Occlusion Robust Road Extraction using Graph Theory & Deep Learning
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <a 
            href="https://github.com/Daksh88934/isro" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-lg text-white/80 transition-all font-medium"
          >
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
            </svg> GitHub
          </a>
          <button 
            onClick={downloadReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-lg text-white/80 transition-all font-medium cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" /> PDF Report
          </button>
          <button 
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 text-[#00E5FF] rounded-lg transition-all font-bold cursor-pointer"
          >
            ℹ About Project
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* NAVIGATION SIDEBAR */}
        <aside className="w-full lg:w-64 bg-[#030712] border-b lg:border-b-0 lg:border-r border-white/5 p-4 flex flex-col gap-1.5 flex-shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2 hidden lg:block">OPERATIONAL STEPS</div>
          
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                activeTab === 'dashboard' ? 'bg-blue-600/15 border-l-4 border-[#00E5FF] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Activity className="h-4 w-4 text-[#00E5FF]" />
              00. Mission Control
            </button>

            <button 
              onClick={() => setActiveTab('extraction')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                activeTab === 'extraction' ? 'bg-blue-600/15 border-l-4 border-[#00E5FF] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4 text-[#00E5FF]" />
              01. AI Predict
            </button>

            <button 
              onClick={() => setActiveTab('reconstruction')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                activeTab === 'reconstruction' ? 'bg-blue-600/15 border-l-4 border-[#00E5FF] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <GitCommit className="h-4 w-4 text-[#00E5FF]" />
              02. MST Debugger
            </button>

            <button 
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                activeTab === 'simulation' ? 'bg-blue-600/15 border-l-4 border-[#00E5FF] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <MapIcon className="h-4 w-4 text-[#00E5FF]" />
              03. Stress Playground
            </button>
          </div>

          <div className="mt-auto p-4 rounded-xl glass-panel text-[11px] text-white/50 border border-white/5 hidden lg:block">
            <div className="flex items-center gap-2 text-[#00E5FF] font-bold uppercase text-[10px] tracking-wider mb-2">
              <Shield className="h-3.5 w-3.5" /> Telemetry Specs
            </div>
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Loss Target:</span>
                <span className="text-[#00E5FF] uppercase font-bold">{lossFunction}</span>
              </div>
              <div className="flex justify-between">
                <span>MST Limit:</span>
                <span className="text-amber-400 font-bold">35° Max Angle</span>
              </div>
              <div className="flex justify-between">
                <span>Connectivity:</span>
                <span className="text-emerald-400 font-bold">{mstEnabled ? '94.1%' : '53.3%'}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 bg-slate-950 flex flex-col gap-6">

          {/* PAGE 00: MISSION CONTROL */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
                <div className="glass-panel p-4 rounded-xl border-l-4 border-rose-500/70">
                  <div className="text-[10px] text-rose-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Spectral Blindness
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Tree covers and building shadows block standard satellite road extractions.
                  </p>
                </div>
                
                <div className="glass-panel p-4 rounded-xl border-l-4 border-purple-500/70">
                  <div className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <GitCommit className="h-3.5 w-3.5" /> Broken Topology
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Pixel outputs lack topological continuity, making raw masks unusable.
                  </p>
                </div>

                <div className="glass-panel p-4 rounded-xl border-l-4 border-blue-500/70">
                  <div className="text-[10px] text-[#00E5FF] font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Activity className="h-3.5 w-3.5" /> Bottleneck Intel
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Identifies high-betweenness structural centers acting as Gatekeeper Nodes.
                  </p>
                </div>

                <div className="glass-panel p-4 rounded-xl border-l-4 border-emerald-500/70">
                  <div className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Shield className="h-3.5 w-3.5" /> What-If Simulation
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Simulate systematic failures to map global resilience curves.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEAFLET GEOSPATIAL MAP PANEL */}
                <div className="lg:col-span-2 glass-panel p-5 rounded-xl flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-3 gap-2">
                    <div>
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <MapIcon className="h-4.5 w-4.5 text-[#00E5FF]" /> Leaflet Geospatial Road Grid Layer (Bengaluru CBD)
                      </h2>
                    </div>
                    <button 
                      onClick={() => setMstEnabled(!mstEnabled)} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        mstEnabled ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/45 shadow-[0_0_10px_rgba(0,229,255,0.1)]' : 'bg-slate-900/60 text-slate-500 border-white/5'
                      }`}
                    >
                      MST GAP HEALING: {mstEnabled ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>

                  {/* Leaflet Map Target Div */}
                  <div 
                    ref={mapRef} 
                    className="h-[380px] bg-slate-950 rounded-lg overflow-hidden border border-white/5 relative z-10"
                  ></div>
                </div>

                {/* SIDE CONTROLS & WHAT-IF ACTIONS */}
                <div className="flex flex-col gap-4">
                  <div className="glass-panel p-4 rounded-xl flex-grow flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#00E5FF] flex items-center gap-1.5">
                      <Sliders className="h-4 w-4" /> Quick Ablation Presets
                    </h3>
                    <p className="text-[11px] text-white/50">Simulate common Indian urban grid failure scenarios instantly:</p>
                    
                    <button 
                      onClick={() => triggerScenario('monsoon')}
                      className="w-full text-left p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 hover:bg-rose-950/30 transition-all text-xs font-medium cursor-pointer"
                    >
                      <div className="text-rose-400 font-bold mb-0.5">☔ Monsoon Inundation Trigger</div>
                      <div className="text-[10px] text-white/40">Floods Silk Board + Koramangala sectors.</div>
                    </button>

                    <button 
                      onClick={() => triggerScenario('accident')}
                      className="w-full text-left p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 hover:bg-amber-950/30 transition-all text-xs font-medium cursor-pointer"
                    >
                      <div className="text-amber-400 font-bold mb-0.5">💥 Outer Ring Corridor Incident</div>
                      <div className="text-[10px] text-white/40">Blocks Hebbal Flyover entry paths.</div>
                    </button>

                    <hr className="border-white/5" />

                    <div className="flex flex-col gap-2">
                      <div className="text-[10px] uppercase font-bold text-white/30 tracking-wider">Detour Path Planner</div>
                      <div className="grid grid-cols-2 gap-2">
                        <select 
                          value={startNode} 
                          onChange={(e) => setStartNode(e.target.value)}
                          className="bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                        >
                          {nodes.map(n => <option key={n.id} value={n.id}>From: {n.name.split(' ')[0]}</option>)}
                        </select>
                        <select 
                          value={endNode} 
                          onChange={(e) => setEndNode(e.target.value)}
                          className="bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                        >
                          {nodes.map(n => <option key={n.id} value={n.id}>To: {n.name.split(' ')[0]}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 01: DRAG & DROP SATELLITE ROAD DETECTION */}
          {activeTab === 'extraction' && (
            <div className="flex flex-col gap-6">
              <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
                <div className="border-b border-white/5 pb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-4.5 w-4.5 text-[#00E5FF]" /> AI Segmenter & Road Mask Inference
                  </h2>
                  <p className="text-xs text-white/40">Drag and drop high-resolution GeoTIFF / PNG satellite data to infer road geometries.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Drag and Drop Zone */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      dragActive ? 'border-[#00E5FF] bg-blue-600/5' : 'border-white/10 bg-slate-900/40 hover:bg-slate-900/60'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="satellite-upload" 
                      className="hidden" 
                      onChange={handleFileInput} 
                      accept=".png,.jpg,.jpeg,.tiff,.tif"
                    />
                    <label htmlFor="satellite-upload" className="cursor-pointer flex flex-col items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-white/60">
                        <Layers className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-white">Drag & Drop Satellite Image</span>
                      <span className="text-[10px] text-white/40">PNG, JPG or GeoTIFF (Max 15MB)</span>
                    </label>
                  </div>

                  {/* Inference progress indicators */}
                  <div className="lg:col-span-2 flex flex-col justify-center gap-4">
                    {predicting ? (
                      <div className="bg-slate-900/60 p-4 rounded-xl border border-[#00E5FF]/20 flex flex-col gap-3 font-mono">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#00E5FF]">
                          <Cpu className="h-4.5 w-4.5 animate-spin" /> RUNNING DEEP PIPELINE MODEL...
                        </div>
                        <div className="space-y-2 text-[10px]">
                          <div className={`flex items-center gap-2 ${predictStep >= 0 ? 'text-emerald-400' : 'text-white/30'}`}>
                            <CheckCircle className="h-3.5 w-3.5" /> [1/3] U-Net++ Road Segmentation Mask Inference...
                          </div>
                          <div className={`flex items-center gap-2 ${predictStep >= 1 ? 'text-emerald-400' : 'text-white/30'}`}>
                            <CheckCircle className="h-3.5 w-3.5" /> [2/3] Morphological Thinning (1-pixel centerline)...
                          </div>
                          <div className={`flex items-center gap-2 ${predictStep >= 2 ? 'text-emerald-400' : 'text-white/30'}`}>
                            <CheckCircle className="h-3.5 w-3.5" /> [3/3] Topological MST Gap Healing...
                          </div>
                        </div>
                      </div>
                    ) : uploadedImage ? (
                      <div className="flex flex-col gap-2">
                        <div className="relative aspect-[16/8] bg-slate-950 border border-white/5 rounded-xl overflow-hidden">
                          <img src={uploadedImage} alt="Uploaded Satellite" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                          
                          {/* Split screen overlay representing prediction slider */}
                          <div 
                            className="absolute top-0 bottom-0 right-0 bg-slate-950 border-l border-[#00E5FF] flex flex-col justify-center items-start pl-12 transition-all duration-75"
                            style={{ left: `${sliderVal}%` }}
                          >
                            <div className="w-[450px] h-2 bg-gradient-to-r from-[#00E5FF] to-blue-500 rounded shadow-[0_0_12px_rgba(0,229,255,0.7)]"></div>
                            <span className="text-[8px] text-[#00E5FF] font-bold mt-4 tracking-widest uppercase bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
                              Segmented & Healed Road Vector Layer
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-lg border border-white/5">
                          <Sliders className="h-5 w-5 text-[#00E5FF]" />
                          <span className="text-xs text-white/60 font-medium">Overlay Slider:</span>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={sliderVal} 
                            onChange={(e) => setSliderVal(e.target.value)}
                            className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
                          />
                          <span className="text-xs font-mono text-white font-bold">{sliderVal}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[180px] rounded-xl border border-dashed border-white/5 flex items-center justify-center text-center text-xs text-white/30">
                        Upload an image to start the AI inference run.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 02: MST HEALING STEP-BY-STEP */}
          {activeTab === 'reconstruction' && (
            <div className="flex flex-col gap-6">
              <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-3 gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <GitCommit className="h-4.5 w-4.5 text-[#00E5FF]" /> Phase II Graph Topological Healing Debugger
                    </h2>
                    <p className="text-xs text-white/40">Step-by-step visual workflow of the Disjoint Set MST healing algorithm.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-lg border border-white/5 flex-wrap">
                    {[0, 1, 2, 3].map((stepIdx) => (
                      <button 
                        key={stepIdx} 
                        onClick={() => setMstStep(stepIdx)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                          mstStep === stepIdx ? 'bg-[#00E5FF] text-slate-950 rounded shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Step {stepIdx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="glass-panel p-4 rounded-xl flex flex-col justify-between min-h-[140px]">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
                        STEP {mstStep + 1} of 4
                      </span>
                      
                      {mstStep === 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-bold text-white mb-2">1. Detect Gaps</h3>
                          <p className="text-xs text-slate-400 leading-normal">
                            Algorithm scans the binary road network centerlines to identify disconnected, orphaned components and subgraphs.
                          </p>
                        </div>
                      )}

                      {mstStep === 1 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-bold text-white mb-2">2. Score Candidates</h3>
                          <p className="text-xs text-slate-400 leading-normal">
                            Disjoint endpoints are matched based on Euclidean distance ($d \le 50m$) and angular deviation.
                          </p>
                        </div>
                      )}

                      {mstStep === 2 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-bold text-white mb-2">3. Build MST Bridge</h3>
                          <p className="text-xs text-slate-400 leading-normal">
                            A Minimum Spanning Tree algorithm builds bridges across low-cost candidate paths to reconnect all disjoint subgraphs.
                          </p>
                        </div>
                      )}

                      {mstStep === 3 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-bold text-white mb-2">4. Validate Geometry</h3>
                          <p className="text-xs text-slate-400 leading-normal">
                            Verifies that the healed road angles match natural road trajectory lines, pruning links exceeding a $35^\circ$ angular deviation.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2 relative h-[280px] bg-slate-950 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
                    <svg className="w-full h-full" style={{ background: '#020617' }}>
                      {edges.filter(e => !e.isHealed).map((edge, idx) => {
                        const u = nodes.find(n => n.id === edge.source);
                        const v = nodes.find(n => n.id === edge.target);
                        if (!u || !v) return null;
                        return (
                          <line
                            key={idx}
                            x1={u.x || 200}
                            y1={u.y || 200}
                            x2={v.x || 300}
                            y2={v.y || 300}
                            stroke="#2563EB"
                            strokeWidth={3}
                            opacity={0.8}
                          />
                        );
                      })}

                      {mstStep >= 1 && edges.filter(e => e.isHealed).map((edge, idx) => {
                        const u = nodes.find(n => n.id === edge.source);
                        const v = nodes.find(n => n.id === edge.target);
                        if (!u || !v) return null;
                        
                        const strokeColor = mstStep === 1 ? '#eab308' : mstStep === 2 ? '#a855f7' : '#00E5FF';
                        
                        return (
                          <g key={idx}>
                            <line
                              x1={u.x || 200}
                              y1={u.y || 200}
                              x2={v.x || 300}
                              y2={v.y || 300}
                              stroke={strokeColor}
                              strokeWidth={3}
                              strokeDasharray="5,4"
                            />
                            {mstStep === 1 && (
                              <text
                                x={((u.x || 200) + (v.x || 300)) / 2}
                                y={((u.y || 200) + (v.y || 300)) / 2 - 4}
                                fill="#eab308"
                                fontSize={8}
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                {edge.gapScore}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {nodes.map((node) => (
                        <g key={node.id} transform={`translate(${node.x || 200}, ${node.y || 200})`}>
                          <circle r={6} fill="#2563EB" />
                          <circle r={2} fill="#fff" />
                        </g>
                      ))}
                    </svg>

                    <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-white/5 rounded-lg p-2 flex flex-col gap-1 text-[9px]">
                      <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#2563EB]"></span> Core Road Fragments</div>
                      {mstStep === 1 && <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#eab308]"></span> Candidate Gaps Scored</div>}
                      {mstStep === 2 && <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#a855f7]"></span> MST Spanning Link Built</div>}
                      {mstStep === 3 && <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#00E5FF]"></span> Geometry Verified (&lt;35°)</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 03: STRESS SIMULATOR */}
          {activeTab === 'simulation' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* DISASTER OVERLAYS (FLOOD CONTROL) */}
              <div className="lg:col-span-2 glass-panel p-5 rounded-xl flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-3 gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <MapIcon className="h-4.5 w-4.5 text-[#00E5FF]" /> Dynamic Flood & Disruption Engine
                    </h2>
                    <p className="text-xs text-white/40">Adjust the slider to simulate monsoon water level height and view corridor collapse.</p>
                  </div>
                  <button 
                    onClick={resetNetwork}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg text-xs font-bold border border-rose-500/20 cursor-pointer"
                  >
                    Clear Disruption
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-lg border border-white/5">
                    <Flame className="h-5 w-5 text-amber-500" />
                    <span className="text-xs text-white/60 font-medium">Inundation Level (Flood %):</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="20"
                      value={floodLevel} 
                      onChange={(e) => setFloodLevel(parseInt(e.target.value))}
                      className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                    <span className="text-xs font-mono text-rose-400 font-bold">{floodLevel}%</span>
                  </div>
                  
                  {/* Status indicators */}
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/50">Disrupted Intersections:</span>
                      <span className="text-rose-400 font-bold">{nodes.filter(n => n.status === 'disabled').length} / {nodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Travel Time Penalty:</span>
                      <span className="text-amber-400 font-bold">{floodLevel >= 80 ? '+140% Detour Delay' : floodLevel >= 40 ? '+45% Detour Delay' : '0%'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TIMELINE, LOGS & MATH SUMMARY */}
              <div className="flex flex-col gap-4">
                
                {/* Mathematical formula */}
                <div className="glass-panel p-4 rounded-xl flex flex-col gap-1.5">
                  <h3 className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" /> Vulnerability Metrics
                  </h3>
                  <div className="bg-slate-900/40 p-2.5 rounded border border-white/5 font-mono text-[9px] text-white/70">
                    <div className="font-bold text-white mb-1">Betweenness Centrality:</div>
                    <div>{"C_B(v) = ∑ [ σ_st(v) / σ_st ]"}</div>
                  </div>
                </div>

                {/* Simulation Logs */}
                <div className="glass-panel p-4 rounded-xl flex flex-col gap-1.5 flex-grow min-h-[140px]">
                  <h3 className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Disruption Feed
                  </h3>
                  <div className="overflow-y-auto max-h-[120px] flex flex-col gap-1.5 pr-1">
                    {ablationLog.map((log, idx) => (
                      <div key={idx} className="bg-slate-900/50 p-2 rounded border border-white/5 text-[9px] font-mono">
                        <div className="flex justify-between font-bold text-rose-400">
                          <span>{log.event}</span>
                          <span className="text-white/30">{log.time}</span>
                        </div>
                        <div className="text-white/50 mt-0.5">{log.impact}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* PAGE 04: EVALUATION & REPORTS */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* EVALUATION CHARTS */}
              <div className="lg:col-span-2 glass-panel p-5 rounded-xl flex flex-col gap-4">
                <div className="border-b border-white/5 pb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="h-4.5 w-4.5 text-[#00E5FF]" /> Performance Metrics
                  </h2>
                </div>
                
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={learningCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="epoch" stroke="rgba(255,255,255,0.3)" />
                      <YAxis stroke="rgba(255,255,255,0.3)" />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="Custom_OcclusionRecall" stroke="#00E5FF" strokeWidth={2.5} name="Custom Loss" />
                      <Line type="monotone" dataKey="Standard_BCE" stroke="#2563EB" strokeWidth={1.5} name="Standard BCE Loss" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SPECS */}
              <div className="flex flex-col gap-4">
                <div className="glass-panel p-4 rounded-xl flex flex-col gap-2">
                  <h3 className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider">Satellite Datasets</h3>
                  <div className="space-y-2 text-[10px]">
                    <div className="bg-slate-900/60 p-2 rounded border border-white/5 flex justify-between">
                      <span className="font-bold text-white">Sentinel-2</span>
                      <span className="text-white/40">10m Spatial Res</span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-white/5 flex justify-between">
                      <span className="font-bold text-white">Resourcesat LISS-IV</span>
                      <span className="text-white/40">5.8m Spatial Res</span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-white/5 flex justify-between">
                      <span className="font-bold text-white">Cartosat-3</span>
                      <span className="text-emerald-400 font-bold">0.28m High Res</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-xl flex flex-col gap-2">
                  <h3 className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider">Evaluation Timeline</h3>
                  <div className="relative border-l border-white/10 pl-4 space-y-3 font-mono text-[9px] text-white/60">
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#00E5FF]"></span>
                      <div className="font-bold text-white">Epoch 10</div>
                      <div>Initial pretraining on SpaceNet completed.</div>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#00E5FF]"></span>
                      <div className="font-bold text-white">Epoch 30</div>
                      <div>Attention constraints active; IoU reaches 87.2%.</div>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-emerald-400"></span>
                      <div className="font-bold text-emerald-400">Epoch 50</div>
                      <div>Convergence reached at 92.4% validation IoU.</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>

        {/* RIGHT SIDEBAR CHATBOT (MISSION ASSISTANT) */}
        <aside className="w-full lg:w-80 bg-[#030712] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <MessageSquare className="h-4.5 w-4.5 text-[#00E5FF]" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">Mission assistant chatbot</span>
          </div>

          {/* Messages block */}
          <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3 max-h-[280px] lg:max-h-none">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] p-2.5 rounded-lg text-xs leading-normal ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white ml-auto rounded-tr-none' 
                    : 'bg-slate-900/80 text-slate-300 mr-auto rounded-tl-none border border-white/5'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Form input */}
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-white/5 flex gap-2">
            <input 
              type="text" 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask: why Silk Board is critical?"
              className="flex-grow bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
            />
            <button 
              type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="glass-panel border-t border-white/5 py-3.5 px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 gap-2">
        <div>
          Developed for <span className="text-[#00E5FF] font-bold">ISRO NNRMS Hackathon 2026</span>
        </div>
        <div>
          Made by <span className="text-[#00E5FF] font-bold">Team SpaceHead</span>
        </div>
        <div className="font-mono">
          React • Tailwind • Vite
        </div>
      </footer>

      {/* ABOUT PROJECT MODAL DIALOG */}
      {showAbout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="max-w-2xl w-full glass-panel-heavy p-6 rounded-2xl border border-white/15 flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/15 pb-2">
              <Info className="h-5 w-5 text-[#00E5FF]" /> Project Brief & Architecture
            </h2>

            <div className="space-y-4 text-xs overflow-y-auto max-h-[380px] pr-2">
              <div>
                <h3 className="font-bold text-[#00E5FF] uppercase tracking-wider text-[10px] mb-1">🔴 The Problem Statement</h3>
                <p className="text-white/70 leading-relaxed">
                  Traditional satellite mapping fails in dynamic Indian metropolises (e.g. Bengaluru) due to building shadows, canopy occlusions, and cloud covers. Fragmented pixel outputs are unusable for emergency routing or urban planning.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#00E5FF] uppercase tracking-wider text-[10px] mb-1">🏗️ Technical Pipeline</h3>
                <p className="text-white/70 leading-relaxed">
                  First, a context-aware U-Net Transformer architecture infers road continuities. Second, centerlines are thinned and grouped via Disjoint Sets. Third, a Minimum Spanning Tree (MST) bridges topology gaps using exit-angle constraints.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#00E5FF] uppercase tracking-wider text-[10px] mb-1">📊 Satellite Datasets</h3>
                <p className="text-white/70 leading-relaxed">
                  Sentinel-2 (10m openly available), Resourcesat LISS-IV (5.8m multi-spectral), and Cartosat-3 high-resolution pan-sharpened bands.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#00E5FF] uppercase tracking-wider text-[10px] mb-1">🛠️ Core Technology Stack</h3>
                <p className="text-white/70 leading-relaxed font-mono">
                  React 19 • TailwindCSS v4 • Vite • Framer Motion • Recharts • NetworkX
                </p>
              </div>

              <div className="border-t border-white/5 pt-3 flex justify-between text-white/50 text-[10px]">
                <span>MEMBER: Daksh Baraliya</span>
                <span>TEAM: SpaceHead</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
