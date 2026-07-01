import React, { useState, useEffect } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { 
  AreaChart, Area, 
  LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// --- BENGALURU METRO ROAD NETWORK DATA ---
const INITIAL_NODES = [
  { id: '1', name: 'Majestic Transport Hub', x: 200, y: 250, baselineCentrality: 0.85, status: 'active', info: 'Primary city transport intersection connecting west and east corridors.' },
  { id: '2', name: 'Koramangala Inner Ring', x: 380, y: 380, baselineCentrality: 0.72, status: 'active', info: 'High-density commercial corridor prone to canopy occlusions.' },
  { id: '3', name: 'Silk Board Junction', x: 420, y: 480, baselineCentrality: 0.95, status: 'active', info: 'Critical southern entry/exit bottleneck; single point of failure.' },
  { id: '4', name: 'Indiranagar 100ft Rd', x: 450, y: 220, baselineCentrality: 0.60, status: 'active', info: 'Major commercial & arterial street with heavy tree shadow covers.' },
  { id: '5', name: 'Hebbal Flyover', x: 280, y: 80, baselineCentrality: 0.88, status: 'active', info: 'Northern gateway connection to Kempegowda Airport.' },
  { id: '6', name: 'MG Road Metro Crossing', x: 330, y: 240, baselineCentrality: 0.78, status: 'active', info: 'Central Business District hub; overlaps high-rise shadows.' },
  { id: '7', name: 'Yeshwanthpur Industrial', x: 120, y: 150, baselineCentrality: 0.55, status: 'active', info: 'Industrial freight connector node supporting heavy cargo transport.' },
  { id: '8', name: 'Whitefield Tech Corridor', x: 600, y: 300, baselineCentrality: 0.65, status: 'active', info: 'IT hub perimeter gatekeeper; subject to rapid expansion occlusions.' },
  { id: '9', name: 'Electronic City Tollway', x: 500, y: 580, baselineCentrality: 0.50, status: 'active', info: 'Elevated highway gateway managing southern tech commuter routes.' },
  { id: '10', name: 'Outer Ring Rd East', x: 550, y: 390, baselineCentrality: 0.68, status: 'active', info: 'Critical bypass route segment linking key tech zones.' }
];

const INITIAL_EDGES = [
  { source: '1', target: '5', length: 180, isHealed: false, type: 'arterial', health: 100 },
  { source: '1', target: '7', length: 110, isHealed: false, type: 'arterial', health: 100 },
  { source: '1', target: '6', length: 130, isHealed: false, type: 'highway', health: 100 },
  { source: '7', target: '5', length: 170, isHealed: false, type: 'arterial', health: 100 },
  { source: '6', target: '4', length: 120, isHealed: false, type: 'arterial', health: 100 },
  { source: '4', target: '8', length: 190, isHealed: false, type: 'arterial', health: 100 },
  { source: '6', target: '2', length: 150, isHealed: false, type: 'arterial', health: 100 },
  { source: '2', target: '3', length: 110, isHealed: false, type: 'highway', health: 100 },
  { source: '3', target: '9', length: 140, isHealed: false, type: 'highway', health: 100 },
  { source: '2', target: '10', length: 170, isHealed: false, type: 'arterial', health: 100 },
  { source: '10', target: '8', length: 130, isHealed: false, type: 'arterial', health: 100 },
  { source: '3', target: '10', length: 150, isHealed: false, type: 'arterial', health: 100 },
  
  // Broken segments (Occlusions) healed by MST topological algorithm
  { source: '5', target: '6', length: 160, isHealed: true, type: 'healed', occlusion: 'Tree Canopy', gapScore: 'Dist: 32m, Dev: 14°' },
  { source: '4', target: '10', length: 180, isHealed: true, type: 'healed', occlusion: 'Building Shadows', gapScore: 'Dist: 48m, Dev: 22°' },
  { source: '8', target: '9', length: 280, isHealed: true, type: 'healed', occlusion: 'Cloud Cover', gapScore: 'Dist: 85m, Dev: 31°' }
];

export default function App() {
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
  
  // System metrics
  const [resilienceIndex, setResilienceIndex] = useState(1.0);
  const [ablationLog, setAblationLog] = useState([
    { time: '10:30:59', event: 'Grid Telemetry Active', cause: 'Initialization', impact: 'Baseline established at R = 1.0' }
  ]);

  // Stepper states for Phase II Graph Healing Step-by-Step
  const [mstStep, setMstStep] = useState(0);

  // Model Playground State
  const [lossFunction, setLossFunction] = useState('occlusion-recall');
  const [sliderVal, setSliderVal] = useState(65);
  const [satelliteType, setSatelliteType] = useState('cartosat');

  // Trigger Routing logic when structural settings shift
  useEffect(() => {
    calculateRoute();
  }, [nodes, edges, mstEnabled, startNode, endNode]);

  // Handle Dynamic resilience index calculations
  useEffect(() => {
    recalculateNetworkMetrics();
  }, [nodes, edges, mstEnabled]);

  const calculateRoute = () => {
    const adj = {};
    nodes.forEach(n => {
      if (n.status === 'active') adj[n.id] = [];
    });

    edges.forEach(e => {
      const u = e.source;
      const v = e.target;
      if (e.isHealed && !mstEnabled) return; // Skip healed edges if MST disabled
      
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

    // Dijkstra's Algorithm
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

    const totalEdges = edges.length;
    
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
        
        // Log the collapse impact
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

  // Pre-configured Stress Scenarios (What-if simulations)
  const triggerScenario = (type) => {
    resetNetwork();
    if (type === 'monsoon') {
      // Flood both Silk Board (3) and Koramangala (2)
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
      // Block Hebbal Flyover (5)
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
    setAblationLog([{
      time: new Date().toLocaleTimeString(),
      event: 'Baseline Re-established',
      cause: 'System Reset Command',
      impact: 'All nodes restored; topological networks active.'
    }]);
  };

  // Data mapping from PPT
  const learningCurve = [
    { epoch: 10, Standard_BCE: 0.61, Custom_OcclusionRecall: 0.74 },
    { epoch: 20, Standard_BCE: 0.69, Custom_OcclusionRecall: 0.81 },
    { epoch: 30, Standard_BCE: 0.74, Custom_OcclusionRecall: 0.87 },
    { epoch: 40, Standard_BCE: 0.79, Custom_OcclusionRecall: 0.91 },
    { epoch: 50, Standard_BCE: 0.82, Custom_OcclusionRecall: 0.94 }
  ];

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col font-sans select-none text-slate-100">
      
      {/* GLOWING HEADER */}
      <header className="glass-panel-heavy border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600/30 flex items-center justify-center border border-[#00E5FF]/40 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
            <Cpu className="h-6 w-6 text-[#00E5FF] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
                ISRO NNRMS PIPELINE
              </span>
              <span className="text-xs text-white/40">Powered by Cartosat-3</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white mt-0.5">
              Route Resilience Command: Occlusion-Robust Road Graph Analyst
            </h1>
          </div>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-900/90 border border-white/5 px-3 py-2 rounded-lg flex items-center gap-2">
            <Network className="h-4 w-4 text-[#00E5FF]" />
            <span className="text-white/50">Connectivity:</span>
            <span className="text-emerald-400 font-bold">{mstEnabled ? '94.1% (Healed)' : '53.3% (Fragmented)'}</span>
          </div>

          <div className="bg-slate-900/90 border border-white/5 px-3 py-2 rounded-lg flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="text-white/50">Resilience Index (R):</span>
            <span className={`font-bold ${resilienceIndex > 0.7 ? 'text-emerald-400' : 'text-rose-400'}`}>{resilienceIndex}</span>
          </div>

          <button 
            onClick={resetNetwork}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg border border-blue-500/30 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reset Grid
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* NAVIGATION SIDEBAR */}
        <aside className="w-64 bg-[#030712] border-r border-white/5 p-4 flex flex-col gap-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">SYSTEM STAGES</div>
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              activeTab === 'dashboard' ? 'bg-blue-600/15 border-l-4 border-[#00E5FF] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Activity className="h-4 w-4 text-[#00E5FF]" />
            00. Mission Control
          </button>

          <button 
            onClick={() => setActiveTab('extraction')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              activeTab === 'extraction' ? 'bg-blue-600/15 border-l-4 border-[#00E5FF] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4 text-[#00E5FF]" />
            01. Segment & Inpaint
          </button>

          <button 
            onClick={() => setActiveTab('reconstruction')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              activeTab === 'reconstruction' ? 'bg-blue-600/15 border-l-4 border-[#00E5FF] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <GitCommit className="h-4 w-4 text-[#00E5FF]" />
            02. MST Healing Debugger
          </button>

          <button 
            onClick={() => setActiveTab('simulation')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              activeTab === 'simulation' ? 'bg-blue-600/15 border-l-4 border-[#00E5FF] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <MapIcon className="h-4 w-4 text-[#00E5FF]" />
            03. Stress Simulator
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              activeTab === 'analytics' ? 'bg-blue-600/15 border-l-4 border-[#00E5FF] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <TrendingUp className="h-4 w-4 text-[#00E5FF]" />
            04. Model Evaluation
          </button>

          <div className="mt-auto p-4 rounded-xl glass-panel text-[11px] text-white/50 border border-white/5">
            <div className="flex items-center gap-2 text-[#00E5FF] font-bold uppercase text-[10px] tracking-wider mb-2">
              <Shield className="h-3.5 w-3.5" /> Pipeline Telemetry
            </div>
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Loss Func:</span>
                <span className="text-[#00E5FF] uppercase font-bold">{lossFunction}</span>
              </div>
              <div className="flex justify-between">
                <span>MST Tolerance:</span>
                <span className="text-amber-400 font-bold">35° Max Angle</span>
              </div>
              <div className="flex justify-between">
                <span>Active Targets:</span>
                <span className="text-emerald-400 font-bold">LISS-4 / Cartosat-3</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENT LAYOUT CONTAINER */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950 flex flex-col gap-6">

          {/* PAGE 00: MISSION CONTROL */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              
              {/* SLIDES 1 & 5 CONCEPT: PROBLEM & SOLUTIONS */}
              <div className="grid grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl border-l-4 border-rose-500/70 relative">
                  <div className="text-[10px] text-rose-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Spectral Blindness
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Tree covers and building shadows block standard satellite road extractions, creating broken segmentation masks.
                  </p>
                </div>
                
                <div className="glass-panel p-4 rounded-xl border-l-4 border-purple-500/70 relative">
                  <div className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <GitCommit className="h-3.5 w-3.5" /> Broken Topology
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Pixel outputs lack topological continuity, making raw masks useless for GIS path planning or route verification.
                  </p>
                </div>

                <div className="glass-panel p-4 rounded-xl border-l-4 border-blue-500/70 relative">
                  <div className="text-[10px] text-[#00E5FF] font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Activity className="h-3.5 w-3.5" /> Bottleneck Intel
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Identifies high-betweenness structural centers acting as "Gatekeeper Nodes" during emergency scenarios.
                  </p>
                </div>

                <div className="glass-panel p-4 rounded-xl border-l-4 border-emerald-500/70 relative">
                  <div className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Shield className="h-3.5 w-3.5" /> What-If Simulation
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Allows planners to systematically disable critical junctions to analyze detour delay metrics and routing curves.
                  </p>
                </div>
              </div>

              {/* DYNAMIC PIPELINE MAP */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 glass-panel p-5 rounded-xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <MapIcon className="h-4.5 w-4.5 text-[#00E5FF]" /> Active Network Grid (Bengaluru Sector)
                      </h2>
                      <p className="text-xs text-white/40">Topologically healed layout representing major corridors.</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setMstEnabled(!mstEnabled)} 
                        className={`px-3 py-1.5 rounded-lg text-xs border font-bold transition-all cursor-pointer ${
                          mstEnabled ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/45 shadow-[0_0_10px_rgba(0,229,255,0.1)]' : 'bg-slate-900/60 text-slate-500 border-white/5'
                        }`}
                      >
                        MST GAP HEALING: {mstEnabled ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </div>
                  </div>

                  <div className="relative h-[320px] bg-slate-950/80 rounded-lg overflow-hidden border border-white/5">
                    <svg className="w-full h-full" style={{ background: '#020617' }}>
                      {/* Grid Lines */}
                      <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.015)" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* Path connections */}
                      {edges.map((edge, idx) => {
                        const u = nodes.find(n => n.id === edge.source);
                        const v = nodes.find(n => n.id === edge.target);
                        if (!u || !v) return null;
                        
                        const isShortest = shortestPath.indexOf(edge.source) !== -1 && 
                                           shortestPath.indexOf(edge.target) !== -1 &&
                                           Math.abs(shortestPath.indexOf(edge.source) - shortestPath.indexOf(edge.target)) === 1;

                        const isEdgeDisabled = u.status === 'disabled' || v.status === 'disabled' || (edge.isHealed && !mstEnabled);
                        
                        return (
                          <line
                            key={idx}
                            x1={u.x}
                            y1={u.y}
                            x2={v.x}
                            y2={v.y}
                            stroke={isEdgeDisabled ? '#1e293b' : isShortest ? '#00E5FF' : edge.isHealed ? '#a855f7' : '#2563EB'}
                            strokeWidth={isShortest ? 4.5 : edge.isHealed ? 2.5 : 2}
                            strokeDasharray={edge.isHealed ? '5,4' : '0'}
                            opacity={isEdgeDisabled ? 0.15 : 0.8}
                          />
                        );
                      })}

                      {/* Node markers */}
                      {nodes.map((node) => {
                        const isNodeOnShortestPath = shortestPath.includes(node.id);
                        return (
                          <g 
                            key={node.id} 
                            transform={`translate(${node.x}, ${node.y})`}
                            className="cursor-pointer"
                            onClick={() => handleNodeClick(node)}
                          >
                            <circle
                              r={isNodeOnShortestPath ? 10 : 8}
                              fill={node.status === 'disabled' ? '#ef4444' : isNodeOnShortestPath ? '#00E5FF' : '#2563EB'}
                              className={isNodeOnShortestPath && node.status === 'active' ? 'pulse-node' : ''}
                              stroke="rgba(0, 0, 0, 0.4)"
                              strokeWidth={1.5}
                            />
                            <circle r={3} fill="#ffffff" />
                            <text
                              y={-14}
                              textAnchor="middle"
                              fill="#94a3b8"
                              fontSize={9}
                              fontWeight="bold"
                              className="pointer-events-none select-none"
                            >
                              {node.name.split(' ')[0]}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Dynamic overlay label */}
                    <div className="absolute top-3 right-3 bg-slate-900/90 border border-white/10 px-2 py-1 rounded text-[10px] font-mono text-emerald-400">
                      R-VALUE: {resilienceIndex}
                    </div>
                  </div>
                </div>

                {/* SIDE STATS / WHAT-IF ACTIONS */}
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

                    <div className="flex-1 flex flex-col gap-2">
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

          {/* PAGE 01: SEGMENT & INPAINT (SLIDE 4 CONCEPTS) */}
          {activeTab === 'extraction' && (
            <div className="flex flex-col gap-6">
              <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-4.5 w-4.5 text-[#00E5FF]" /> Deep Learning Preprocessing Sandbox
                    </h2>
                    <p className="text-xs text-white/40">Phase I Model Inferences under heavy urban tree shadow cover.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setLossFunction('occlusion-recall')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        lossFunction === 'occlusion-recall' ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/45' : 'bg-slate-800 text-white/50 border-white/5'
                      }`}
                    >
                      Occlusion-Recall Loss
                    </button>
                    <button 
                      onClick={() => setLossFunction('standard-iou')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        lossFunction === 'standard-iou' ? 'bg-slate-800 text-white border-white/10' : 'bg-slate-900 text-white/30 border-white/5'
                      }`}
                    >
                      Standard BCE Loss
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {/* Model Architecture Layer Panel */}
                  <div className="glass-panel p-4 rounded-xl flex flex-col gap-2.5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 text-[#00E5FF]">Model Architecture (Slide 4)</h3>
                    
                    <div className="flex flex-col gap-2">
                      <div className="bg-slate-900 border border-white/10 p-2.5 rounded-lg text-[10px] flex justify-between items-center">
                        <span className="font-bold text-white/70">1. MULTI-RES INPUT</span>
                        <span className="text-white/40">Cartosat 0.28m</span>
                      </div>
                      
                      <div className="bg-slate-900 border border-[#00E5FF]/20 p-2.5 rounded-lg text-[10px] flex flex-col gap-1">
                        <div className="flex justify-between items-center font-bold text-[#00E5FF]">
                          <span>2. ATTENTION ENCODER</span>
                          <span>Spatial & Channel</span>
                        </div>
                        <p className="text-[9px] text-white/40">Captures road context 200+ pixels away to guess roads hidden by canopy.</p>
                      </div>

                      <div className="bg-slate-900 border border-white/10 p-2.5 rounded-lg text-[10px] flex justify-between items-center">
                        <span className="font-bold text-white/70">3. TRANSFORMER CONTEXT</span>
                        <span className="text-white/40">Long-Range</span>
                      </div>

                      <div className="bg-slate-900 border border-white/10 p-2.5 rounded-lg text-[10px] flex justify-between items-center">
                        <span className="font-bold text-white/70">4. ROAD MASK DECODER</span>
                        <span className="text-white/40">UNet++ Base</span>
                      </div>

                      <div className="bg-slate-900 border border-emerald-500/20 p-2.5 rounded-lg text-[10px] flex flex-col gap-1">
                        <div className="flex justify-between items-center font-bold text-emerald-400">
                          <span>5. OCCLUSION RECOVERY</span>
                          <span>Connected Vector</span>
                        </div>
                        <p className="text-[9px] text-white/40">Re-integrates fragments using spatial priors.</p>
                      </div>
                    </div>
                  </div>

                  {/* Imagery sliders */}
                  <div className="col-span-2 flex flex-col gap-4">
                    <div className="relative aspect-[16/8] bg-slate-950 border border-white/5 rounded-xl overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-[#020617] flex flex-col justify-center items-start pl-16">
                        <div className="w-[350px] h-1.5 bg-[#2563EB]/40 rounded"></div>
                        {/* Broken occlusion part */}
                        <div className="w-[80px] h-1.5 bg-slate-900/50 my-6 border border-dashed border-rose-500/40 rounded flex items-center justify-center">
                          <span className="text-[7px] text-rose-400 font-bold uppercase">Occlusion Gap</span>
                        </div>
                        <div className="w-[300px] h-1.5 bg-[#2563EB]/40 rounded"></div>
                      </div>

                      {/* Right overlay */}
                      <div 
                        className="absolute top-0 bottom-0 right-0 bg-slate-950 border-l border-[#00E5FF] flex flex-col justify-center items-start pl-16 transition-all duration-75"
                        style={{ left: `${sliderVal}%` }}
                      >
                        <div className="w-[450px] h-2 bg-gradient-to-r from-[#00E5FF] to-blue-500 rounded shadow-[0_0_12px_rgba(0,229,255,0.7)]"></div>
                        <span className="text-[8px] text-[#00E5FF] font-bold mt-4 tracking-widest uppercase bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
                          Attention-Recovered Highway (Routable)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-lg border border-white/5">
                      <Sliders className="h-5 w-5 text-[#00E5FF]" />
                      <span className="text-xs text-white/60 font-medium">Reconstruction Threshold:</span>
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
                </div>
              </div>
            </div>
          )}

          {/* PAGE 02: MST HEALING STEP-BY-STEP (SLIDE 3 CONCEPTS) */}
          {activeTab === 'reconstruction' && (
            <div className="flex flex-col gap-6">
              <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <GitCommit className="h-4.5 w-4.5 text-[#00E5FF]" /> Phase II Graph Topological Healing Debugger
                    </h2>
                    <p className="text-xs text-white/40">Step-by-step visual workflow of the Disjoint Set MST healing algorithm.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-lg border border-white/5">
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

                <div className="grid grid-cols-3 gap-6">
                  {/* Stepper info cards */}
                  <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
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

                  {/* Visual canvas depicting the active step */}
                  <div className="col-span-2 relative h-[280px] bg-slate-950 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
                    <svg className="w-full h-full" style={{ background: '#020617' }}>
                      {/* Original edges */}
                      {edges.filter(e => !e.isHealed).map((edge, idx) => {
                        const u = nodes.find(n => n.id === edge.source);
                        const v = nodes.find(n => n.id === edge.target);
                        if (!u || !v) return null;
                        return (
                          <line
                            key={idx}
                            x1={u.x}
                            y1={u.y}
                            x2={v.x}
                            y2={v.y}
                            stroke="#2563EB"
                            strokeWidth={3}
                            opacity={0.8}
                          />
                        );
                      })}

                      {/* Step specific edge indicators */}
                      {mstStep >= 1 && edges.filter(e => e.isHealed).map((edge, idx) => {
                        const u = nodes.find(n => n.id === edge.source);
                        const v = nodes.find(n => n.id === edge.target);
                        if (!u || !v) return null;
                        
                        const strokeColor = mstStep === 1 ? '#eab308' : mstStep === 2 ? '#a855f7' : '#00E5FF';
                        
                        return (
                          <g key={idx}>
                            <line
                              x1={u.x}
                              y1={u.y}
                              x2={v.x}
                              y2={v.y}
                              stroke={strokeColor}
                              strokeWidth={3}
                              strokeDasharray="5,4"
                            />
                            {mstStep === 1 && (
                              <text
                                x={(u.x + v.x) / 2}
                                y={(u.y + v.y) / 2 - 4}
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

                      {/* Nodes */}
                      {nodes.map((node) => (
                        <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                          <circle r={6} fill="#2563EB" />
                          <circle r={2} fill="#fff" />
                        </g>
                      ))}
                    </svg>

                    {/* Step Legend indicator */}
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

          {/* PAGE 03: STRESS SIMULATION (SLIDE 5 CONCEPTS) */}
          {activeTab === 'simulation' && (
            <div className="grid grid-cols-3 gap-6">
              
              {/* GIS PATH SIMULATION PLAYGROUND */}
              <div className="col-span-2 glass-panel p-5 rounded-xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <MapIcon className="h-4.5 w-4.5 text-[#00E5FF]" /> Criticality Ablation Playground
                    </h2>
                    <p className="text-xs text-white/40">Select node targets to evaluate detour lengths and Resilience Indices ($R$).</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={resetNetwork}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg text-xs font-bold border border-rose-500/20 cursor-pointer"
                    >
                      Clear All Closures
                    </button>
                  </div>
                </div>

                <div className="relative h-[340px] bg-slate-950 rounded-xl overflow-hidden border border-white/5">
                  <svg className="w-full h-full" style={{ background: '#020617' }}>
                    {/* Render connections */}
                    {edges.map((edge, idx) => {
                      const u = nodes.find(n => n.id === edge.source);
                      const v = nodes.find(n => n.id === edge.target);
                      if (!u || !v) return null;
                      
                      const isShortest = shortestPath.indexOf(edge.source) !== -1 && 
                                         shortestPath.indexOf(edge.target) !== -1 &&
                                         Math.abs(shortestPath.indexOf(edge.source) - shortestPath.indexOf(edge.target)) === 1;
                      
                      const isEdgeDisabled = u.status === 'disabled' || v.status === 'disabled' || (edge.isHealed && !mstEnabled);
                      
                      return (
                        <g key={idx}>
                          <line
                            x1={u.x}
                            y1={u.y}
                            x2={v.x}
                            y2={v.y}
                            stroke={isEdgeDisabled ? '#1e293b' : isShortest ? '#00E5FF' : edge.isHealed ? '#a855f7' : '#2563EB'}
                            strokeWidth={isShortest ? 4 : edge.isHealed ? 2.5 : 2}
                            strokeDasharray={edge.isHealed ? '6,6' : '0'}
                            opacity={isEdgeDisabled ? 0.2 : 0.8}
                          />
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {nodes.map((node) => {
                      const isNodeOnShortestPath = shortestPath.includes(node.id);
                      return (
                        <g 
                          key={node.id} 
                          transform={`translate(${node.x}, ${node.y})`}
                          className="cursor-pointer"
                          onClick={() => handleNodeClick(node)}
                        >
                          <circle
                            r={node.status === 'disabled' ? 12 : 9}
                            fill={node.status === 'disabled' ? '#ef4444' : isNodeOnShortestPath ? '#00E5FF' : '#2563EB'}
                            className={isNodeOnShortestPath && node.status === 'active' ? 'pulse-node' : ''}
                            stroke="rgba(0,0,0,0.5)"
                            strokeWidth={1.5}
                          />
                          <circle r={3} fill="#fff" />
                          <text
                            y={-16}
                            textAnchor="middle"
                            fill="#f8fafc"
                            fontSize={10}
                            fontWeight="bold"
                            className="pointer-events-none select-none"
                          >
                            {node.name.split(' ')[0]}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* DYNAMIC TELEMETRY RESPONSE SIDEBAR */}
              <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider text-[#00E5FF]">Vulnerability Assessment</h3>

                {selectedNode ? (
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 flex flex-col gap-2 flex-grow">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-[#00E5FF]">{selectedNode.name}</span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold ${
                        selectedNode.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {selectedNode.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50">{selectedNode.info}</p>
                    
                    <div className="text-[11px] mt-2 space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-white/40">Baseline Centrality:</span>
                        <span className="text-white font-bold">{selectedNode.baselineCentrality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Shortest Route length:</span>
                        <span className="text-white font-bold">{activePathLength > 0 ? `${activePathLength}m` : 'INF'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleNodeStatus(selectedNode.id)}
                      className={`w-full mt-auto py-2 text-xs font-bold rounded-lg transition-all border cursor-pointer ${
                        selectedNode.status === 'active' 
                          ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border-rose-500/30' 
                          : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {selectedNode.status === 'active' ? 'Disable Node (Simulate Blockage)' : 'Restore Node Operations'}
                    </button>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-lg text-white/30 text-xs">
                    <Info className="h-6 w-6 mb-2" />
                    Select a node to run simulations.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAGE 04: MODEL EVALUATION */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-2 gap-6">
              
              {/* IoU comparisons */}
              <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider text-[#00E5FF]">Model Learning Performance (Dice IoU vs Epoch)</h2>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={learningCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="epoch" stroke="rgba(255,255,255,0.3)" />
                      <YAxis stroke="rgba(255,255,255,0.3)" />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="Custom_OcclusionRecall" stroke="#00E5FF" strokeWidth={2.5} name="Custom Loss (Dice + Occlusion-Recall)" />
                      <Line type="monotone" dataKey="Standard_BCE" stroke="#2563EB" strokeWidth={1.5} name="Standard BCE Loss" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* R degradation info */}
              <div className="glass-panel p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3 text-[#00E5FF]">Mission Outcome Metrics (Slide 3 & 4)</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5">
                      <div className="text-[10px] text-white/40 uppercase font-bold">Standard BCE IoU</div>
                      <div className="text-xl font-extrabold text-rose-500">74.2%</div>
                      <p className="text-[9px] text-white/30 mt-1">Leaves gaps under canopies.</p>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-lg border border-[#00E5FF]/20">
                      <div className="text-[10px] text-[#00E5FF] uppercase font-bold">Custom Occlusion IoU</div>
                      <div className="text-xl font-extrabold text-emerald-400">92.4%</div>
                      <p className="text-[9px] text-[#00E5FF]/50 mt-1">Restores continuity with spatial attention.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/30 p-3 rounded-lg border border-white/5 text-[11px] text-white/50 leading-relaxed font-mono">
                  <span className="text-[#00E5FF] font-bold">Summary:</span> Transitioning from legacy pixel segmentation to our attention-guided topological graph healing improves routable network extraction accuracy from <span className="text-rose-400 font-bold">53% to 94.1%</span> across highly occluded Indian metropolis environments.
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
