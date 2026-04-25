const initialNetwork = [
  {
    id: "A",
    name: "Gateway Router",
    type: "Router",
    icon: "📡",
    status: "safe",
    securityLevel: 8,
    vulnerability: 3,
    critical: false,
    isHoneypot: false
  },
  {
    id: "B",
    name: "User Laptop 1",
    type: "Endpoint",
    icon: "💻",
    status: "safe",
    securityLevel: 4,
    vulnerability: 8,
    critical: false,
    isHoneypot: false
  },
  {
    id: "C",
    name: "Database Server",
    type: "Server",
    icon: "🗄️",
    status: "critical",
    securityLevel: 9,
    vulnerability: 2,
    critical: true,
    isHoneypot: false
  },
  {
    id: "D",
    name: "Mail Server",
    type: "Server",
    icon: "📧",
    status: "safe",
    securityLevel: 6,
    vulnerability: 5,
    critical: false,
    isHoneypot: false
  },
  {
    id: "E",
    name: "Admin System",
    type: "Admin Node",
    icon: "🔐",
    status: "critical",
    securityLevel: 7,
    vulnerability: 4,
    critical: true,
    isHoneypot: false
  },
  {
    id: "F",
    name: "User Laptop 2",
    type: "Endpoint",
    icon: "🖥️",
    status: "safe",
    securityLevel: 3,
    vulnerability: 9,
    critical: false,
    isHoneypot: false
  },
  {
    id: "G",
    name: "Honeypot",
    type: "Trap",
    icon: "🍯",
    status: "honeypot",
    securityLevel: 1,
    vulnerability: 10,
    critical: false,
    isHoneypot: true
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
  const total       = network.filter(n => !n.isHoneypot).length;
  const attacked    = network.filter(n => n.status === "attacked").length;
  const compromised = network.filter(n => n.status === "compromised").length;
  const blocked     = network.filter(n => n.status === "blocked").length;
  const safe        = network.filter(n => n.status === "safe" || n.status === "critical").length;
  const survival    = Math.round((safe / total) * 100);

  document.getElementById("totalNodes").textContent    = total;
  document.getElementById("attackedCount").textContent = attacked;
  document.getElementById("blockedCount").textContent  = blocked;
  document.getElementById("survivalRate").textContent  = `${survival}%`;

  // update compromised count if element exists
  const compEl = document.getElementById("compromisedCount");
  if (compEl) compEl.textContent = compromised;
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
  const status       = document.getElementById("systemMode");
  status.className   = `status-pill ${type}`;
  status.textContent = text;
}

// ─────────────────────────────────────────
// 🚨 START ATTACK
// ─────────────────────────────────────────
function startAttack() {
  const attackMode  = document.getElementById("attackMode").value;
  const defenseMode = document.getElementById("defenseMode").value;
  const multiPoint  = document.getElementById("multiPoint")?.checked;

  attackStartedAt = Date.now();

  // 🎯 multi point attack — starts from node 1 AND node 6 simultaneously
  const startNodes = multiPoint ? "1,6" : "1";

  setSystemStatus("attack", "⚔️ Attack Running");
  addLog(`⚔️ Attack started${multiPoint ? " (MULTI-POINT from A + F)" : ""} | mode: ${attackMode} | defense: ${defenseMode}`);

  fetch(`https://cyber-battlefield-simulator-1.onrender.com/attack?attackMode=${attackMode}&defenseMode=${defenseMode}&startNodes=${startNodes}`)
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
// ─────────────────────────────────────────
function applyBackendResult(data) {
  const infected    = data.infected    || [];
  const compromised = data.compromised || [];
  const blocked     = data.blocked     || [];

  // Step 1: reset all to default
  network.forEach(node => {
    if (node.isHoneypot) {
      node.status = "honeypot";
    } else {
      node.status = node.critical ? "critical" : "safe";
    }
  });

  // Step 2: mark infected — backendId - 1 = frontend index
  infected.forEach(backendId => {
    const index = backendId - 1;
    if (network[index]) network[index].status = "attacked";
  });

  // Step 3: 🔶 mark compromised (partial infection)
  compromised.forEach(backendId => {
    const index = backendId - 1;
    if (network[index]) network[index].status = "compromised";
  });

  // Step 4: mark blocked (overrides everything)
  blocked.forEach(backendId => {
    const index = backendId - 1;
    if (network[index]) network[index].status = "blocked";
  });

  // Step 5: 🍯 honeypot special handling
  if (data.honeypotHit) {
    // node G (index 6) is honeypot
    if (network[6]) network[6].status = "attacked";
    addLog("🍯 HONEYPOT WAS TRIGGERED!! Defense got a boost!!");
  }

  // Step 6: update detection time
  if (data.metrics?.detectionTime) {
    document.getElementById("detectionTime").textContent = data.metrics.detectionTime;
  }

  // Step 7: log all results
  addLog(`✅ ${infected.length} attacked, ${compromised.length} compromised, ${blocked.length} blocked`);

  if (data.metrics?.threatScore) {
    addLog(`🔥 Threat Score: ${data.metrics.threatScore}`);
  }
  if (data.metrics?.defenseEffectiveness) {
    addLog(`🛡️ Defense Effectiveness: ${data.metrics.defenseEffectiveness}`);
  }
  if (data.metrics?.criticalNodesBreached > 0) {
    addLog(`🚨 WARNING: ${data.metrics.criticalNodesBreached} critical node(s) breached!!`);
  }
  if (data.metrics?.multiPointAttack) {
    addLog(`🎯 Multi-point attack was used — simultaneous entry from nodes ${data.startNodes?.join(" and ")}`);
  }

  // Step 8: 💊 recovery — revert attacked nodes back to safe after 10 seconds
  infected.forEach(backendId => {
    const index = backendId - 1;
    setTimeout(() => {
      if (network[index] && network[index].status === "attacked") {
        network[index].status = network[index].critical ? "critical" : "safe";
        addLog(`💊 Node ${network[index].name} has recovered!!`);
        renderNetwork(); // re-render after recovery
      }
    }, 10000);
  });

  // Step 9: update status pill
  setSystemStatus("defense", "🛡️ Defense Active");
  setTimeout(() => setSystemStatus("idle", "System Idle"), 3000);

  // Step 10: re-render
  renderNetwork();
}

// ─────────────────────────────────────────
// 🔄 RESET
// ─────────────────────────────────────────
function resetSimulation() {
  fetch("https://cyber-battlefield-simulator-1.onrender.com/reset", {
    method: "POST"
  })
    .then(() => addLog("🔄 Backend network reset successfully"))
    .catch(() => addLog("⚠️ Backend reset failed — only frontend reset"));

  network         = JSON.parse(JSON.stringify(initialNetwork));
  attackStartedAt = null;

  document.getElementById("detectionTime").textContent = "--";
  document.getElementById("logs").innerHTML            = "";

  setSystemStatus("reset", "System Reset");
  addLog("🔄 Network reset — all nodes restored to safe state");

  setTimeout(() => setSystemStatus("idle", "System Idle"), 1000);

  renderNetwork();
}

// ─────────────────────────────────────────
// 🔤 HELPER
// ─────────────────────────────────────────
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// ─────────────────────────────────────────
// 🚀 INIT
// ─────────────────────────────────────────
renderNetwork();
setSystemStatus("idle", "System Idle");
addLog("🚀 Frontend connected to backend successfully");
