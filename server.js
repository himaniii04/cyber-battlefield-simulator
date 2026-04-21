const express = require("express");
const cors = require("cors");

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// network graph
const network = {
  nodes: [
    { id: 1, status: "safe" },
    { id: 2, status: "safe" },
    { id: 3, status: "safe" },
    { id: 4, status: "safe" }
  ],
  edges: [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 2, to: 4 }
  ]
};

//
// 🔥 ATTACK FUNCTION (with modes)
//
function simulateAttack(startNode, mode) {
  let infected = new Set();
  let queue = [startNode];

  while (queue.length > 0) {
    let current = queue.shift();

    if (!infected.has(current)) {
      infected.add(current);

      network.edges.forEach(edge => {
        if (edge.from === current && !infected.has(edge.to)) {

          // 🔹 STEALTH MODE → slow spread
          if (mode === "stealth") {
            if (Math.random() < 0.5) return;
          }

          queue.push(edge.to);
        }
      });
    }
  }

  return Array.from(infected);
}

//
// 🛡️ DEFENSE FUNCTION (with modes)
//
function defendNetwork(infectedNodes, mode) {
  let blocked = [];

  if (mode === "active") {
    // strong defense
    if (infectedNodes.length > 1) {
      blocked.push(infectedNodes[1]);
    }
  } else {
    // passive defense
    if (infectedNodes.length > 2) {
      blocked.push(infectedNodes[2]);
    }
  }

  return blocked;
}

//
// ROUTES
//

// test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// send network
app.get("/network", (req, res) => {
  res.json(network);
});

// ⚔️ MAIN API (attack + defense + modes + metrics)
app.get("/attack", (req, res) => {
  const attackMode = req.query.attackMode || "aggressive";
  const defenseMode = req.query.defenseMode || "passive";

  const startTime = Date.now(); // ⏱ start timing

  const infectedNodes = simulateAttack(1, attackMode);
  const blockedNodes = defendNetwork(infectedNodes, defenseMode);

  const safeNodes = network.nodes
    .map(n => n.id)
    .filter(id =>
      !infectedNodes.includes(id) && !blockedNodes.includes(id)
    );

  const totalNodes = network.nodes.length;

  // 📊 METRICS
  const spreadRate = (infectedNodes.length / totalNodes) * 100;
  const survivalRate = (safeNodes.length / totalNodes) * 100;
  const detectionTime = Date.now() - startTime;

  res.json({
    attackMode,
    defenseMode,
    infected: infectedNodes,
    blocked: blockedNodes,
    safe: safeNodes,
    metrics: {
      spreadRate: spreadRate.toFixed(2) + "%",
      survivalRate: survivalRate.toFixed(2) + "%",
      detectionTime: detectionTime + " ms"
    }
  });
});

// start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});