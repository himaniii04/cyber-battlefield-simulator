const express = require("express");
const cors = require("cors");
const app = express();

// ─────────────────────────────────────────
// MIDDLEWARES
// ─────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// 🌐 NETWORK GRAPH — 6 nodes, realistic topology
// Each node has: security (how hard to breach), vulnerability (how exposed)
// ─────────────────────────────────────────
let network = {
  nodes: [
    { id: 1, name: "Gateway Router",  type: "Router",    status: "safe", security: 8, vulnerability: 3 },
    { id: 2, name: "User Laptop 1",   type: "Endpoint",  status: "safe", security: 4, vulnerability: 8 },
    { id: 3, name: "Database Server", type: "Server",    status: "safe", security: 9, vulnerability: 2 },
    { id: 4, name: "Mail Server",     type: "Server",    status: "safe", security: 6, vulnerability: 5 },
    { id: 5, name: "Admin System",    type: "AdminNode", status: "safe", security: 7, vulnerability: 4 },
    { id: 6, name: "User Laptop 2",   type: "Endpoint",  status: "safe", security: 3, vulnerability: 9 }
  ],
  edges: [
    { from: 1, to: 2 },
    { from: 1, to: 4 },
    { from: 2, to: 3 },
    { from: 2, to: 5 },
    { from: 4, to: 6 },
    { from: 5, to: 3 }
  ]
};

// Keep a clean copy for reset
const originalNetwork = JSON.parse(JSON.stringify(network));

// ─────────────────────────────────────────
// 📜 ACTIVITY LOG — stores simulation history
// ─────────────────────────────────────────
let activityLog = [];

function addLog(message, type = "info") {
  const entry = {
    timestamp: new Date().toLocaleTimeString(),
    message,
    type // "attack" | "defense" | "info" | "critical"
  };
  activityLog.unshift(entry); // newest first
  if (activityLog.length > 50) activityLog.pop(); // keep max 50 entries
}

// ─────────────────────────────────────────
// 🔥 ATTACK FUNCTION — BFS with smarter spread logic
// 
// Modes:
//   aggressive → infects all reachable nodes, ignores security
//   stealth    → probabilistic spread based on node vulnerability
//   targeted   → NEW: goes straight for high-value (low security) nodes first
// ─────────────────────────────────────────
function simulateAttack(startNodeId, mode) {
  let infected = new Set();
  let queue = [startNodeId];
  let spreadLog = [];

  while (queue.length > 0) {
    let currentId = queue.shift();

    if (infected.has(currentId)) continue;

    const currentNode = network.nodes.find(n => n.id === currentId);
    if (!currentNode) continue;

    infected.add(currentId);
    spreadLog.push(`Node ${currentNode.name} infected`);

    // Find all neighbors
    let neighbors = network.edges
      .filter(edge => edge.from === currentId)
      .map(edge => edge.to);

    // 🆕 TARGETED mode: sort neighbors by lowest security first (juicy targets first)
    if (mode === "targeted") {
      neighbors.sort((a, b) => {
        const nodeA = network.nodes.find(n => n.id === a);
        const nodeB = network.nodes.find(n => n.id === b);
        return nodeA.security - nodeB.security; // lowest security = first target
      });
    }

    neighbors.forEach(neighborId => {
      if (infected.has(neighborId)) return;

      const neighborNode = network.nodes.find(n => n.id === neighborId);
      if (!neighborNode) return;

      if (mode === "stealth") {
        // Spread chance based on vulnerability — higher vuln = more likely to get infected
        const spreadChance = neighborNode.vulnerability / 10; // 0.0 to 1.0
        if (Math.random() > spreadChance) {
          spreadLog.push(`Stealth: skipped ${neighborNode.name} (low vulnerability)`);
          return;
        }
      }

      if (mode === "aggressive") {
        // Aggressive ignores security entirely — brute force
        queue.push(neighborId);
      } else {
        // Stealth + targeted: high security nodes have a chance to resist
        const resistChance = neighborNode.security / 10;
        if (Math.random() < resistChance * 0.3) {
          spreadLog.push(`${neighborNode.name} resisted attack (security: ${neighborNode.security})`);
          return;
        }
        queue.push(neighborId);
      }
    });
  }

  spreadLog.forEach(log => addLog(log, "attack"));
  return Array.from(infected);
}

// ─────────────────────────────────────────
// 🛡️ DEFENSE FUNCTION — smarter blocking logic
//
// Modes:
//   passive → slow to react, blocks only after 2+ infections
//   active  → reacts immediately, blocks infected node + warns neighbors
//   adaptive → NEW: adjusts based on how severe the attack is
// ─────────────────────────────────────────
function defendNetwork(infectedNodes, mode) {
  let blocked = [];
  let defenseLog = [];

  if (mode === "active") {
    // ✅ FIXED: reacts to even 1 infected node (was >1 before, now >=1)
    if (infectedNodes.length >= 1) {
      blocked.push(infectedNodes[0]); // isolate the very first infected node
      defenseLog.push(`Active defense: blocked node ${infectedNodes[0]} immediately`);
    }
    // Also try to block spread — block second infected too if it exists
    if (infectedNodes.length >= 2) {
      blocked.push(infectedNodes[1]);
      defenseLog.push(`Active defense: contained spread at node ${infectedNodes[1]}`);
    }

  } else if (mode === "adaptive") {
    // 🆕 ADAPTIVE: scales response with attack severity
    if (infectedNodes.length === 0) {
      defenseLog.push("Adaptive: no threat detected");
    } else if (infectedNodes.length === 1) {
      // Minor threat — just monitor, don't block yet
      defenseLog.push("Adaptive: monitoring single infected node, holding response");
    } else if (infectedNodes.length <= 3) {
      // Medium threat — block most infected nodes
      blocked.push(...infectedNodes.slice(0, 2));
      defenseLog.push(`Adaptive: medium threat — blocking ${blocked.length} nodes`);
    } else {
      // Severe threat — emergency lockdown, block everything infected
      blocked.push(...infectedNodes);
      defenseLog.push(`Adaptive: CRITICAL threat — full lockdown of ${blocked.length} nodes`);
    }

  } else {
    // passive — slow response, only reacts after 2+ infected
    if (infectedNodes.length >= 2) {
      blocked.push(infectedNodes[infectedNodes.length - 1]); // block last infected
      defenseLog.push(`Passive: late detection — blocked node ${blocked[0]}`);
    } else {
      defenseLog.push("Passive: threat not detected yet");
    }
  }

  defenseLog.forEach(log => addLog(log, "defense"));
  return blocked;
}

// ─────────────────────────────────────────
// 📊 METRICS CALCULATOR
// ─────────────────────────────────────────
function calculateMetrics(infectedNodes, blockedNodes, safeNodes, startTime, attackMode, defenseMode) {
  const totalNodes = network.nodes.length;
  const detectionTime = Date.now() - startTime;

  // 🆕 Threat Score: weighted by node security levels
  const threatScore = infectedNodes.reduce((sum, id) => {
    const node = network.nodes.find(n => n.id === id);
    return sum + (node ? node.vulnerability : 0);
  }, 0);

  // 🆕 Defense Effectiveness: how many infected nodes were blocked
  const defenseEffectiveness = infectedNodes.length > 0
    ? ((blockedNodes.length / infectedNodes.length) * 100).toFixed(1)
    : 100;

  // 🆕 Critical nodes check (Database Server id=3, Admin System id=5)
  const criticalNodes = [3, 5];
  const criticalCompromised = criticalNodes.filter(id => infectedNodes.includes(id));

  return {
    totalNodes,
    spreadRate:            ((infectedNodes.length / totalNodes) * 100).toFixed(2) + "%",
    survivalRate:          ((safeNodes.length / totalNodes) * 100).toFixed(2) + "%",
    detectionTime:         detectionTime + " ms",
    threatScore:           threatScore + "/90",
    defenseEffectiveness:  defenseEffectiveness + "%",
    criticalNodesBreached: criticalCompromised.length,
    attackMode,
    defenseMode
  };
}

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Backend running 🚀", version: "2.0" });
});

// Get network topology
app.get("/network", (req, res) => {
  res.json(network);
});

// Get activity log
app.get("/logs", (req, res) => {
  res.json({ logs: activityLog });
});

// 🆕 Reset network to original state
app.post("/reset", (req, res) => {
  network = JSON.parse(JSON.stringify(originalNetwork));
  activityLog = [];
  addLog("Network reset to safe state", "info");
  res.json({ message: "Network reset successfully", network });
});

// ⚔️ MAIN ATTACK + DEFENSE SIMULATION
app.get("/attack", (req, res) => {
  const attackMode  = req.query.attackMode  || "aggressive"; // aggressive | stealth | targeted
  const defenseMode = req.query.defenseMode || "passive";    // passive | active | adaptive
  const startNode   = parseInt(req.query.startNode) || 1;    // 🆕 allow custom start node

  const startTime = Date.now();

  addLog(`Attack started — mode: ${attackMode}, defense: ${defenseMode}`, "info");

  // Run simulation
  const infectedNodes = simulateAttack(startNode, attackMode);
  const blockedNodes  = defendNetwork(infectedNodes, defenseMode);

  // Safe = not infected AND not blocked
  const safeNodes = network.nodes
    .map(n => n.id)
    .filter(id => !infectedNodes.includes(id) && !blockedNodes.includes(id));

  // Calculate all metrics
  const metrics = calculateMetrics(infectedNodes, blockedNodes, safeNodes, startTime, attackMode, defenseMode);

  addLog(`Simulation complete — ${infectedNodes.length} infected, ${blockedNodes.length} blocked`, "info");

  res.json({
    attackMode,
    defenseMode,
    startNode,
    infected: infectedNodes,
    blocked:  blockedNodes,
    safe:     safeNodes,
    metrics,
    log: activityLog.slice(0, 10) // send latest 10 logs with response
  });
});

// 🆕 GET node details individually
app.get("/node/:id", (req, res) => {
  const node = network.nodes.find(n => n.id === parseInt(req.params.id));
  if (!node) return res.status(404).json({ error: "Node not found" });
  res.json(node);
});

// 🆕 GET simulation summary (what modes are available)
app.get("/modes", (req, res) => {
  res.json({
    attackModes: [
      { id: "aggressive", label: "Aggressive", description: "Brute force — infects all reachable nodes instantly, ignores security" },
      { id: "stealth",    label: "Stealth",    description: "Slow & quiet — spread probability based on node vulnerability" },
      { id: "targeted",   label: "Targeted",   description: "Smart attack — prioritizes low-security nodes first" }
    ],
    defenseModes: [
      { id: "passive",   label: "Passive",   description: "Slow detection — only reacts after 2+ infections" },
      { id: "active",    label: "Active",    description: "Fast response — blocks first infected node immediately" },
      { id: "adaptive",  label: "Adaptive",  description: "Scales with threat level — lockdown on severe attacks" }
    ]
  });
});

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────
app.listen(3000, () => {
  console.log("🚀 Cyber Battlefield Server running on port 3000");
  console.log("📡 Routes available:");
  console.log("   GET  /           → health check");
  console.log("   GET  /network    → get full network topology");
  console.log("   GET  /attack     → run attack+defense simulation");
  console.log("   GET  /logs       → get activity log");
  console.log("   GET  /modes      → list available modes");
  console.log("   GET  /node/:id   → get single node details");
  console.log("   POST /reset      → reset network to safe state");
});
