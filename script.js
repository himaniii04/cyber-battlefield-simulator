const initialNetwork = [
  {
    id: "A",
    name: "Gateway Router",
    type: "Router",
    icon: "📡",
    status: "safe",
    securityLevel: 8,
    vulnerability: 3,
    critical: false
  },
  {
    id: "B",
    name: "User Laptop 1",
    type: "Endpoint",
    icon: "💻",
    status: "safe",
    securityLevel: 4,
    vulnerability: 8,
    critical: false
  },
  {
    id: "C",
    name: "Database Server",
    type: "Server",
    icon: "🗄️",
    status: "critical",
    securityLevel: 9,
    vulnerability: 2,
    critical: true
  },
  {
    id: "D",
    name: "Mail Server",
    type: "Server",
    icon: "📧",
    status: "safe",
    securityLevel: 6,
    vulnerability: 5,
    critical: false
  },
  {
    id: "E",
    name: "Admin System",
    type: "Admin Node",
    icon: "🔐",
    status: "safe",
    securityLevel: 7,
    vulnerability: 4,
    critical: true
  },
  {
    id: "F",
    name: "User Laptop 2",
    type: "Endpoint",
    icon: "🖥️",
    status: "safe",
    securityLevel: 3,
    vulnerability: 9,
    critical: false
  }
];

let network = JSON.parse(JSON.stringify(initialNetwork));
let attackStartedAt = null;

// ─────────────────────────────────────────
// 🧠 RENDER NETWORK
// ─────────────────────────────────────────
function renderNetwork() {
  const networkDiv = document.getElementById("network");
  networkDiv.innerHTML = "";

  network.forEach(node => {
    const card = document.createElement("div");
    card.className = `node-card ${node.status}`;

    card.innerHTML = `
      <div class="node-top">
        <div class="node-icon">${node.icon}</div>
        <div class="node-id">${node.id}</div>
      </div>

      <div>
        <div class="badge ${node.status}">${capitalize(node.status)}</div>
        <h3>${node.name}</h3>
        <div class="node-type">${node.type}</div>
      </div>

      <div class="node-info">
        <p><strong>Security:</strong> ${node.securityLevel}/10</p>
        <p><strong>Vulnerability:</strong> ${node.vulnerability}/10</p>
      </div>
    `;

    networkDiv.appendChild(card);
  });

  updateMetrics();
}

// ─────────────────────────────────────────
// 📊 UPDATE METRICS
// ─────────────────────────────────────────
function updateMetrics() {
  const total    = network.length;
  const attacked = network.filter(n => n.status === "attacked").length;
  const blocked  = network.filter(n => n.status === "blocked").length;
  const safe     = network.filter(n => n.status === "safe" || n.status === "critical").length;
  const survival = Math.round((safe / total) * 100);

  document.getElementById("totalNodes").textContent    = total;
  document.getElementById("attackedCount").textContent = attacked;
  document.getElementById("blockedCount").textContent  = blocked;
  document.getElementById("survivalRate").textContent  = `${survival}%`;
}

// ─────────────────────────────────────────
// 📝 ACTIVITY LOG
// ─────────────────────────────────────────
function addLog(message) {
  const logs = document.getElementById("logs");
  const li   = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  logs.prepend(li);
}

// ─────────────────────────────────────────
// 🔵 SYSTEM STATUS PILL
// ─────────────────────────────────────────
function setSystemStatus(type, text) {
  const status    = document.getElementById("systemMode");
  status.className   = `status-pill ${type}`;
  status.textContent = text;
}

// ─────────────────────────────────────────
// 🚨 START ATTACK — calls backend API
// ─────────────────────────────────────────
function startAttack() {
  const attackMode  = document.getElementById("attackMode").value;
  const defenseMode = document.getElementById("defenseMode").value;

  attackStartedAt = Date.now();

  setSystemStatus("attack", "⚔️ Attack Running");
  addLog(`⚔️ Attack started — mode: ${attackMode} | defense: ${defenseMode}`);

  fetch(`https://cyber-battlefield-simulator-1.onrender.com/attack?attackMode=${attackMode}&defenseMode=${defenseMode}`)
    .then(res => res.json())
    .then(data => {
      applyBackendResult(data);
    })
    .catch(err => {
      console.error(err);
      addLog("❌ Error connecting to backend — check server");
      setSystemStatus("idle", "System Idle");
    });
}

// ─────────────────────────────────────────
// 🧠 APPLY BACKEND RESULT TO UI
// ✅ FIXED: maps by node ID not array index
// ─────────────────────────────────────────
function applyBackendResult(data) {
  const infected = data.infected; // e.g. [1, 2, 3] — backend node IDs
  const blocked  = data.blocked;  // e.g. [1]       — backend node IDs

  // Step 1: reset all nodes to their default status
  network.forEach(node => {
    node.status = node.critical ? "critical" : "safe";
  });

  // Step 2: mark infected nodes
  // Backend sends IDs starting at 1, frontend array starts at 0
  // So backend ID 1 → network[0] (Node A), ID 2 → network[1] (Node B), etc.
  infected.forEach(backendId => {
    const frontendIndex = backendId - 1;
    if (network[frontendIndex]) {
      network[frontendIndex].status = "attacked";
    }
  });

  // Step 3: mark blocked nodes (overrides attacked — blocked is stronger)
  blocked.forEach(backendId => {
    const frontendIndex = backendId - 1;
    if (network[frontendIndex]) {
      network[frontendIndex].status = "blocked";
    }
  });

  // Step 4: update detection time from backend metrics
  if (data.metrics && data.metrics.detectionTime) {
    document.getElementById("detectionTime").textContent = data.metrics.detectionTime;
  }

  // Step 5: log result with details
  const attackedCount = infected.length;
  const blockedCount  = blocked.length;
  const safeCount     = network.length - attackedCount - blockedCount;

  addLog(`✅ Simulation complete — ${attackedCount} attacked, ${blockedCount} blocked, ${safeCount} safe`);

  // Step 6: show extra metrics if backend sends them
  if (data.metrics) {
    if (data.metrics.threatScore) {
      addLog(`🔥 Threat Score: ${data.metrics.threatScore}`);
    }
    if (data.metrics.defenseEffectiveness) {
      addLog(`🛡️ Defense Effectiveness: ${data.metrics.defenseEffectiveness}`);
    }
    if (data.metrics.criticalNodesBreached > 0) {
      addLog(`🚨 WARNING: ${data.metrics.criticalNodesBreached} critical node(s) breached!`);
    }
  }

  // Step 7: update status pill
  setSystemStatus("defense", "🛡️ Defense Active");
  setTimeout(() => {
    setSystemStatus("idle", "System Idle");
  }, 3000);

  // Step 8: re-render cards with new statuses
  renderNetwork();
}

// ─────────────────────────────────────────
// 🔄 RESET — clears both frontend + backend
// ─────────────────────────────────────────
function resetSimulation() {
  // Call backend reset so server graph also resets
  fetch("https://cyber-battlefield-simulator-1.onrender.com/reset", {
    method: "POST"
  })
    .then(() => addLog("🔄 Backend network reset successfully"))
    .catch(() => addLog("⚠️ Backend reset failed — only frontend reset"));

  // Reset frontend state
  network         = JSON.parse(JSON.stringify(initialNetwork));
  attackStartedAt = null;

  // Reset all metric displays
  document.getElementById("detectionTime").textContent = "--";
  document.getElementById("logs").innerHTML            = "";

  setSystemStatus("reset", "System Reset");
  addLog("🔄 Network reset — all nodes restored to safe state");

  setTimeout(() => {
    setSystemStatus("idle", "System Idle");
  }, 1000);

  renderNetwork();
}

// ─────────────────────────────────────────
// 🔤 HELPER
// ─────────────────────────────────────────
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// ─────────────────────────────────────────
// 🚀 INIT — runs on page load
// ─────────────────────────────────────────
renderNetwork();
setSystemStatus("idle", "System Idle");
addLog("🚀 Frontend connected to backend successfully");
