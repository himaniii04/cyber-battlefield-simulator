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

// 🧠 RENDER NETWORK
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

// 📊 UPDATE METRICS
function updateMetrics() {
  const total = network.length;
  const attacked = network.filter(n => n.status === "attacked").length;
  const blocked = network.filter(n => n.status === "blocked").length;
  const safe = network.filter(n => n.status === "safe" || n.status === "critical").length;

  const survival = Math.round((safe / total) * 100);

  document.getElementById("totalNodes").textContent = total;
  document.getElementById("attackedCount").textContent = attacked;
  document.getElementById("blockedCount").textContent = blocked;
  document.getElementById("survivalRate").textContent = `${survival}%`;
}

// 📝 LOGS
function addLog(message) {
  const logs = document.getElementById("logs");
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  logs.prepend(li);
}

// 🔵 SYSTEM STATUS
function setSystemStatus(type, text) {
  const status = document.getElementById("systemMode");
  status.className = `status-pill ${type}`;
  status.textContent = text;
}

// 🚨 START ATTACK (CONNECTED TO BACKEND)
function startAttack() {
  const attackMode = document.getElementById("attackMode").value;
  const defenseMode = document.getElementById("defenseMode").value;

  attackStartedAt = Date.now();

  setSystemStatus("attack", "Attack Running");
  addLog(`Attack started (${attackMode}) with defense (${defenseMode})`);

  fetch(`https://cyber-battlefield-simulator-1.onrender.com/attack?attackMode=${attackMode}&defenseMode=${defenseMode}`)
    .then(res => res.json())
    .then(data => {
      applyBackendResult(data);
    })
    .catch(err => {
      console.error(err);
      addLog("Error connecting to backend ❌");
    });
}

// 🧠 APPLY BACKEND DATA TO UI
function applyBackendResult(data) {
  const infected = data.infected;
  const blocked = data.blocked;

  // reset all to safe
  network.forEach(node => {
    node.status = node.critical ? "critical" : "safe";
  });

  // map backend numbers → frontend nodes
  infected.forEach((_, index) => {
    if (network[index]) network[index].status = "attacked";
  });

  blocked.forEach((_, index) => {
    if (network[index]) network[index].status = "blocked";
  });

  // update detection time
  if (data.metrics && data.metrics.detectionTime) {
    document.getElementById("detectionTime").textContent = data.metrics.detectionTime;
  }

  addLog("Attack + Defense simulation completed.");
  renderNetwork();
}

// 🔄 RESET
function resetSimulation() {
  network = JSON.parse(JSON.stringify(initialNetwork));
  attackStartedAt = null;

  document.getElementById("detectionTime").textContent = "--";
  document.getElementById("logs").innerHTML = "";

  setSystemStatus("reset", "System Reset");
  addLog("Simulation reset.");

  setTimeout(() => {
    setSystemStatus("idle", "System Idle");
  }, 1000);

  renderNetwork();
}

// 🔤 HELPER
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// INIT
renderNetwork();
setSystemStatus("idle", "System Idle");
addLog("Frontend connected to backend successfully 🚀");
