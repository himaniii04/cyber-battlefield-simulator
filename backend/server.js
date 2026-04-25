const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// 🌐 NETWORK GRAPH
// ─────────────────────────────────────────
let network = {
  nodes: [
    { id: 1, name: "Gateway Router",  type: "Router",    status: "safe",     security: 8, vulnerability: 3,  critical: false, isHoneypot: false },
    { id: 2, name: "User Laptop 1",   type: "Endpoint",  status: "safe",     security: 4, vulnerability: 8,  critical: false, isHoneypot: false },
    { id: 3, name: "Database Server", type: "Server",    status: "critical", security: 9, vulnerability: 2,  critical: true,  isHoneypot: false },
    { id: 4, name: "Mail Server",     type: "Server",    status: "safe",     security: 6, vulnerability: 5,  critical: false, isHoneypot: false },
    { id: 5, name: "Admin System",    type: "AdminNode", status: "critical", security: 7, vulnerability: 4,  critical: true,  isHoneypot: false },
    { id: 6, name: "User Laptop 2",   type: "Endpoint",  status: "safe",     security: 3, vulnerability: 9,  critical: false, isHoneypot: false },
    { id: 7, name: "Honeypot",        type: "Trap",      status: "honeypot", security: 1, vulnerability: 10, critical: false, isHoneypot: true  }
  ],
  edges: [
    { from: 1, to: 2 },
    { from: 1, to: 4 },
    { from: 2, to: 3 },
    { from: 2, to: 5 },
    { from: 4, to: 6 },
    { from: 5, to: 3 },
    { from: 1, to: 7 },
    { from: 4, to: 7 }
  ]
};

const originalNetwork = JSON.parse(JSON.stringify(network));

// ─────────────────────────────────────────
// 📜 ACTIVITY LOG
// ─────────────────────────────────────────
let activityLog = [];

function addLog(message, type = "info") {
  const entry = {
    timestamp: new Date().toLocaleTimeString(),
    message,
    type
  };
  activityLog.unshift(entry);
  if (activityLog.length > 50) activityLog.pop();
}

// ─────────────────────────────────────────
// 💊 NODE RECOVERY — heals nodes after 10 seconds
// ─────────────────────────────────────────
let recoveryTimers = {};

function scheduleRecovery(nodeId) {
  if (recoveryTimers[nodeId]) clearTimeout(recoveryTimers[nodeId]);

  recoveryTimers[nodeId] = setTimeout(() => {
    const node = network.nodes.find(n => n.id === nodeId);
    if (node && (node.status === "attacked" || node.status === "compromised")) {
      node.status = node.critical ? "critical" : "safe";
      addLog(`💊 Node ${node.name} has fully recovered and is back online!`, "recovery");
    }
  }, 10000); // heals after 10 seconds
}

// ─────────────────────────────────────────
// 🔥 ATTACK FUNCTION — BFS with all edge cases
// ─────────────────────────────────────────
function simulateAttack(startNodes, mode) {
  let infected    = new Set();
  let compromised = new Set(); // 🔶 partial infection — caught between safe and attacked
  let honeypotHit  = false;
  let defenseBoost = false;

  // 🎯 MULTI POINT — queue starts with ALL attack entry points
  let queue = [...startNodes];

  while (queue.length > 0) {
    let currentId = queue.shift();

    if (infected.has(currentId)) continue;

    const currentNode = network.nodes.find(n => n.id === currentId);
    if (!currentNode) continue;

    // 🍯 HONEYPOT CHECK
    if (currentNode.isHoneypot) {
      honeypotHit  = true;
      defenseBoost = true;
      addLog(`🍯 HONEYPOT TRIGGERED!! Attacker walked into the trap at ${currentNode.name}!! Defense is now alerted and boosted!!`, "honeypot");
      infected.add(currentId);
      continue; // attacker gets stuck — no further spread from honeypot
    }

    // 🔶 PARTIAL INFECTION — node is compromised first before fully infected
    if (!compromised.has(currentId)) {
      compromised.add(currentId);
      addLog(`🔶 ${currentNode.name} is compromised — attacker is inside but not fully in control yet`, "compromised");

      // 70% chance it becomes fully infected, 30% defense catches it in time
      if (Math.random() < 0.7) {
        infected.add(currentId);
        addLog(`🔴 ${currentNode.name} fully infected!!`, "attack");
        scheduleRecovery(currentId); // 💊 schedule auto recovery after 10s
      } else {
        addLog(`✅ ${currentNode.name} defended at compromised stage — not fully taken over`, "defense");
        continue; // stopped here — don't spread further from this node
      }
    }

    // find neighbors
    let neighbors = network.edges
      .filter(edge => edge.from === currentId)
      .map(edge => edge.to);

    // targeted: weakest security node first
    if (mode === "targeted") {
      neighbors.sort((a, b) => {
        const nodeA = network.nodes.find(n => n.id === a);
        const nodeB = network.nodes.find(n => n.id === b);
        return (nodeA?.security || 0) - (nodeB?.security || 0);
      });
    }

    neighbors.forEach(neighborId => {
      if (infected.has(neighborId)) return;

      const neighborNode = network.nodes.find(n => n.id === neighborId);
      if (!neighborNode) return;

      if (mode === "stealth") {
        const spreadChance = neighborNode.vulnerability / 10;
        if (Math.random() > spreadChance) return;
      }

      if (mode !== "aggressive") {
        const resistChance = neighborNode.security / 10;
        if (Math.random() < resistChance * 0.3) {
          addLog(`💪 ${neighborNode.name} resisted the attack!`, "defense");
          return;
        }
      }

      queue.push(neighborId);
    });
  }

  return {
    infected:    Array.from(infected),
    compromised: Array.from(compromised).filter(id => !infected.has(id)),
    honeypotHit,
    defenseBoost
  };
}

// ─────────────────────────────────────────
// 🛡️ DEFENSE FUNCTION
// ─────────────────────────────────────────
function defendNetwork(infectedNodes, compromisedNodes, mode, defenseBoost) {
  let blocked = [];

  // 🍯 honeypot boost — upgrades defense one level
  const effectiveMode = defenseBoost
    ? (mode === "passive" ? "active" : "adaptive")
    : mode;

  if (defenseBoost) {
    addLog(`🚀 Defense upgraded to ${effectiveMode} mode because honeypot was triggered!!`, "honeypot");
  }

  if (effectiveMode === "active") {
    if (infectedNodes.length >= 1) blocked.push(infectedNodes[0]);
    if (infectedNodes.length >= 2) blocked.push(infectedNodes[1]);
    compromisedNodes.forEach(id => {
      if (!blocked.includes(id)) blocked.push(id);
    });

  } else if (effectiveMode === "adaptive") {
    if (infectedNodes.length === 0) {
      addLog("Adaptive: no major threat", "info");
    } else if (infectedNodes.length <= 2) {
      blocked.push(...infectedNodes.slice(0, 1));
      addLog("Adaptive: low threat — blocking entry point", "defense");
    } else if (infectedNodes.length <= 4) {
      blocked.push(...infectedNodes.slice(0, 2));
      addLog("Adaptive: medium threat — containing spread", "defense");
    } else {
      blocked.push(...infectedNodes);
      addLog("Adaptive: CRITICAL — full emergency lockdown!!", "defense");
    }

  } else {
    // passive
    if (infectedNodes.length >= 2) {
      blocked.push(infectedNodes[infectedNodes.length - 1]);
      addLog("Passive: late response — blocking last infected node", "defense");
    } else {
      addLog("Passive: threat not detected yet 😴", "info");
    }
  }

  return blocked;
}

// ─────────────────────────────────────────
// 📊 METRICS
// ─────────────────────────────────────────
function calculateMetrics(infectedNodes, compromisedNodes, blockedNodes, safeNodes, startTime, attackMode, defenseMode, honeypotHit, startNodes) {
  const totalNodes    = network.nodes.filter(n => !n.isHoneypot).length;
  const detectionTime = Date.now() - startTime;

  const threatScore = infectedNodes.reduce((sum, id) => {
    const node = network.nodes.find(n => n.id === id);
    return sum + (node ? node.vulnerability : 0);
  }, 0);

  const defenseEffectiveness = infectedNodes.length > 0
    ? ((blockedNodes.length / infectedNodes.length) * 100).toFixed(1)
    : 100;

  const criticalCompromised = [3, 5].filter(id => infectedNodes.includes(id));

  return {
    totalNodes,
    spreadRate:            ((infectedNodes.length / totalNodes) * 100).toFixed(2) + "%",
    survivalRate:          ((safeNodes.length / totalNodes) * 100).toFixed(2) + "%",
    compromisedCount:      compromisedNodes.length,
    detectionTime:         detectionTime + " ms",
    threatScore:           threatScore + "/90",
    defenseEffectiveness:  defenseEffectiveness + "%",
    criticalNodesBreached: criticalCompromised.length,
    honeypotTriggered:     honeypotHit,
    multiPointAttack:      startNodes.length > 1,
    attackStartPoints:     startNodes,
    attackMode,
    defenseMode
  };
}

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ status: "Cyber Battlefield Backend v3.0 🚀" });
});

app.get("/network", (req, res) => {
  res.json(network);
});

app.get("/logs", (req, res) => {
  res.json({ logs: activityLog });
});

app.post("/reset", (req, res) => {
  Object.values(recoveryTimers).forEach(timer => clearTimeout(timer));
  recoveryTimers = {};
  network        = JSON.parse(JSON.stringify(originalNetwork));
  activityLog    = [];
  addLog("🔄 Network reset to safe state", "info");
  res.json({ message: "Network reset successfully", network });
});

// ⚔️ MAIN ATTACK ROUTE
app.get("/attack", (req, res) => {
  const attackMode      = req.query.attackMode  || "aggressive";
  const defenseMode     = req.query.defenseMode || "passive";
  const startNodesParam = req.query.startNodes  || "1";

  // 🎯 multi point — "1,6" becomes [1, 6]
  const startNodes = startNodesParam.split(",").map(Number);

  const startTime = Date.now();

  addLog(`⚔️ Attack from node(s) [${startNodes.join(", ")}] | attack: ${attackMode} | defense: ${defenseMode}`, "attack");

  const attackResult   = simulateAttack(startNodes, attackMode);
  const { infected: infectedNodes, compromised: compromisedNodes, honeypotHit, defenseBoost } = attackResult;

  const blockedNodes = defendNetwork(infectedNodes, compromisedNodes, defenseMode, defenseBoost);

  const safeNodes = network.nodes
    .filter(n => !n.isHoneypot)
    .map(n => n.id)
    .filter(id =>
      !infectedNodes.includes(id) &&
      !compromisedNodes.includes(id) &&
      !blockedNodes.includes(id)
    );

  const metrics = calculateMetrics(
    infectedNodes, compromisedNodes, blockedNodes, safeNodes,
    startTime, attackMode, defenseMode, honeypotHit, startNodes
  );

  addLog(`✅ Done — ${infectedNodes.length} infected, ${compromisedNodes.length} compromised, ${blockedNodes.length} blocked`, "info");

  res.json({
    attackMode,
    defenseMode,
    startNodes,
    infected:    infectedNodes,
    compromised: compromisedNodes,
    blocked:     blockedNodes,
    safe:        safeNodes,
    honeypotHit,
    metrics,
    log: activityLog.slice(0, 15)
  });
});

app.get("/node/:id", (req, res) => {
  const node = network.nodes.find(n => n.id === parseInt(req.params.id));
  if (!node) return res.status(404).json({ error: "Node not found" });
  res.json(node);
});

app.get("/modes", (req, res) => {
  res.json({
    attackModes: [
      { id: "aggressive", label: "Aggressive", description: "Brute force — infects everything" },
      { id: "stealth",    label: "Stealth",    description: "Quiet spread based on vulnerability" },
      { id: "targeted",   label: "Targeted",   description: "Hits weakest security nodes first" }
    ],
    defenseModes: [
      { id: "passive",  label: "Passive",  description: "Slow — reacts after 2+ infections" },
      { id: "active",   label: "Active",   description: "Fast — blocks on first infection" },
      { id: "adaptive", label: "Adaptive", description: "Smart — scales with attack severity" }
    ]
  });
});

app.listen(3000, () => {
  console.log("🚀 Cyber Battlefield v3.0 running on port 3000");
});
