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

function renderNetwork() {
  const networkDiv = document.getElementById("network");
  networkDiv.innerHTML = "";

  network.forEach(node => {
    const card = document.createElement("div");
    card.className = `node-card ${node.status}`;

    let badgeClass = node.status;
    let badgeText = capitalize(node.status);

    if (node.status === "critical") {
      badgeClass = "critical";
      badgeText = "Critical";
    }

    card.innerHTML = `
      <div class="node-top">
        <div class="node-icon">${node.icon}</div>
        <div class="node-id">${node.id}</div>
      </div>

      <div>
        <div class="badge ${badgeClass}">${badgeText}</div>
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

function updateMetrics() {
  const total = network.length;
  const attacked = network.filter(n => n.status === "attacked").length;
  const blocked = network.filter(n => n.status === "blocked").length;
  const safeOrCritical = network.filter(
    n => n.status === "safe" || n.status === "critical"
  ).length;

  const survival = Math.round((safeOrCritical / total) * 100);

  document.getElementById("totalNodes").textContent = total;
  document.getElementById("attackedCount").textContent = attacked;
  document.getElementById("blockedCount").textContent = blocked;
  document.getElementById("survivalRate").textContent = `${survival}%`;
}

function addLog(message) {
  const logs = document.getElementById("logs");
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  logs.prepend(li);
}

function setSystemStatus(type, text) {
  const status = document.getElementById("systemMode");
  status.className = `status-pill ${type}`;
  status.textContent = text;
}

function startAttack() {
  const attackMode = document.getElementById("attackMode").value;
  attackStartedAt = Date.now();

  setSystemStatus("attack", "Attack Running");
  addLog(`Attack started in ${capitalize(attackMode)} mode.`);

  let targetNode = null;

  if (attackMode === "aggressive") {
    targetNode = network.reduce((max, node) =>
      node.vulnerability > max.vulnerability ? node : max
    );
    addLog(`Aggressive scan selected weakest node ${targetNode.id}.`);
  } else if (attackMode === "stealth") {
    const safeNodes = network.filter(node => node.status === "safe");
    if (safeNodes.length > 0) {
      targetNode = safeNodes[0];
      targetNode.status = "suspicious";
      addLog(`${targetNode.name} is showing suspicious low-profile behavior.`);
      renderNetwork();
      return;
    }
  } else if (attackMode === "targeted") {
    targetNode = network.find(node => node.critical) || network[0];
    addLog(`Targeted attack focused on high-value node ${targetNode.id}.`);
  }

  if (targetNode) {
    if (targetNode.status !== "blocked") {
      targetNode.status = "attacked";
      addLog(`${targetNode.name} has been compromised.`);
    }
  }

  spreadAttack(attackMode);
  renderNetwork();
}

function spreadAttack(attackMode) {
  let extraTargets = [];

  if (attackMode === "aggressive") {
    extraTargets = network
      .filter(node => node.status === "safe")
      .sort((a, b) => b.vulnerability - a.vulnerability)
      .slice(0, 2);
  } else if (attackMode === "targeted") {
    extraTargets = network
      .filter(node => node.status === "safe" && node.critical)
      .slice(0, 1);
  }

  extraTargets.forEach(node => {
    node.status = "attacked";
    addLog(`${node.name} infected during lateral movement.`);
  });
}

function runDefense() {
  const defenseMode = document.getElementById("defenseMode").value;
  setSystemStatus("defense", "Defense Active");
  addLog(`Defense activated in ${capitalize(defenseMode)} mode.`);

  const attackedNodes = network.filter(node => node.status === "attacked");
  const suspiciousNodes = network.filter(node => node.status === "suspicious");

  if (defenseMode === "passive") {
    suspiciousNodes.forEach(node => {
      addLog(`Passive monitoring raised alert for ${node.name}.`);
    });

    attackedNodes.forEach(node => {
      addLog(`Threat observed on ${node.name}, awaiting manual action.`);
    });
  }

  if (defenseMode === "active") {
    attackedNodes.slice(0, 1).forEach(node => {
      node.status = "blocked";
      addLog(`${node.name} isolated by active scanning response.`);
    });

    suspiciousNodes.forEach(node => {
      node.status = "blocked";
      addLog(`${node.name} blocked after anomaly detection.`);
    });
  }

  if (defenseMode === "auto") {
    attackedNodes.forEach(node => {
      node.status = "blocked";
      addLog(`${node.name} auto-quarantined immediately.`);
    });

    suspiciousNodes.forEach(node => {
      node.status = "blocked";
      addLog(`${node.name} auto-blocked from suspicious activity.`);
    });
  }

  if (attackStartedAt) {
    const diffSeconds = ((Date.now() - attackStartedAt) / 1000).toFixed(1);
    document.getElementById("detectionTime").textContent = `${diffSeconds}s`;
    addLog(`Detection completed in ${diffSeconds}s.`);
  }

  renderNetwork();
}

function resetSimulation() {
  network = JSON.parse(JSON.stringify(initialNetwork));
  attackStartedAt = null;
  document.getElementById("detectionTime").textContent = "--";
  document.getElementById("logs").innerHTML = "";
  setSystemStatus("reset", "System Reset");
  addLog("Simulation reset.");

  setTimeout(() => {
    setSystemStatus("idle", "System Idle");
  }, 1200);

  renderNetwork();
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

renderNetwork();
setSystemStatus("idle", "System Idle");
addLog("Frontend battlefield loaded successfully.");