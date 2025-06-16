let currentMode = "move"; // "move" or "connect"
let selectedForConnection = null;
let undoStack = [];

const canvas = document.getElementById("canvas");
const addLightButton = document.getElementById("add-light");
const addStandButton = document.getElementById("add-stand");
const connectModeButton = document.getElementById("connect-mode");
const undoButton = document.getElementById("undo");

function createElement(type) {
  const el = document.createElement("div");
  el.classList.add("element", type);
  el.textContent = type === "light" ? "灯体" : "スタンド";
  el.style.left = "100px";
  el.style.top = "100px";

  makeDraggable(el);
  el.dataset.type = type;
  canvas.appendChild(el);
  saveState();
}

function makeDraggable(el) {
  let offsetX, offsetY;

  el.addEventListener("mousedown", (e) => {
    if (currentMode === "connect") {
      handleConnectClick(el);
      return;
    }

    offsetX = e.offsetX;
    offsetY = e.offsetY;

    function onMouseMove(e) {
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      saveState();
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
}

function handleConnectClick(el) {
  if (!selectedForConnection) {
    selectedForConnection = el;
    el.style.outline = "3px solid red";
  } else {
    if (selectedForConnection !== el) {
      connectElements(selectedForConnection, el);
    }
    selectedForConnection.style.outline = "";
    selectedForConnection = null;
  }
}

function connectElements(fromEl, toEl) {
  const line = document.createElement("div");
  line.classList.add("connection-line");

  updateLinePosition(line, fromEl, toEl);
  canvas.appendChild(line);
  saveState();
}

function updateLinePosition(line, fromEl, toEl) {
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();

  const x1 = fromRect.left + fromRect.width / 2 - canvasRect.left;
  const y1 = fromRect.top + fromRect.height / 2 - canvasRect.top;
  const x2 = toRect.left + toRect.width / 2 - canvasRect.left;
  const y2 = toRect.top + toRect.height / 2 - canvasRect.top;

  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  line.style.left = `${x1}px`;
  line.style.top = `${y1}px`;
  line.style.width = `${length}px`;
  line.style.transform = `rotate(${angle}deg)`;
}

function saveState() {
  undoStack.push(canvas.innerHTML);
  if (undoStack.length > 20) undoStack.shift();
}

function undo() {
  if (undoStack.length > 1) {
    undoStack.pop();
    canvas.innerHTML = undoStack[undoStack.length - 1];

    // 再度ドラッグ機能を有効化
    document.querySelectorAll(".element").forEach(makeDraggable);
  }
}

// 初期イベント設定
addLightButton.addEventListener("click", () => createElement("light"));
addStandButton.addEventListener("click", () => createElement("stand"));
connectModeButton.addEventListener("click", () => {
  currentMode = currentMode === "connect" ? "move" : "connect";
  connectModeButton.textContent =
    currentMode === "connect" ? "接続モード中" : "接続モード";
});
undoButton.addEventListener("click", undo);

// 初期状態保存
saveState();

// 角度変更処理
document.getElementById("panSlider").addEventListener("input", (e) => {
  const angle = parseFloat(e.target.value);
  updateLightDirection(angle, currentTilt);
});

document.getElementById("tiltSlider").addEventListener("input", (e) => {
  const angle = parseFloat(e.target.value);
  updateLightDirection(currentPan, angle);
});

function updateLightDirection(pan, tilt) {
  const radius = 10; // 照らす距離
  const x = radius * Math.sin(THREE.MathUtils.degToRad(pan)) * Math.cos(THREE.MathUtils.degToRad(tilt));
  const y = radius * Math.sin(THREE.MathUtils.degToRad(tilt));
  const z = radius * Math.cos(THREE.MathUtils.degToRad(pan)) * Math.cos(THREE.MathUtils.degToRad(tilt));
  light.target.position.set(x, y, z);
}




function saveToFile() {
  const designName = document.getElementById('designName').value.trim() || "stage-layout";

  const lights = Array.from(document.querySelectorAll('.light')).map(light => ({
    id: light.dataset.id,
    x: parseFloat(light.style.left),
    y: parseFloat(light.style.top)
  }));

  const stands = Array.from(document.querySelectorAll('.stand')).map(stand => ({
    id: stand.dataset.id,
    x: parseFloat(stand.style.left),
    y: parseFloat(stand.style.top)
  }));

  const connections = lines.map(line => ({
    lightId: line.light.dataset.id,
    standId: line.stand.dataset.id
  }));

  const data = { lights, stands, connections };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${designName}.json`;  // デザイン名をファイル名に
  a.click();
}
