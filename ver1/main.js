const stage = document.getElementById('stage');
let selectedLamps = [];
let lines = [];
let isConnecting = false;
let connectStartLamp = null;
let connectStartStand = null;
let selectedStands = [];
let selectedLine = null;
let undoStack = [];



// 灯体追加ボタン
document.getElementById('addLampBtn').addEventListener('click', (e) => {
  e.preventDefault();
  const lampType = document.getElementById('lampTypeSelector').value;
  const lamp = document.createElement('div');
  lamp.className = `lamp ${lampType}`;
  lamp.textContent = lampType.toUpperCase();
  lamp.style.left = '100px';
  lamp.style.top = '100px';
  lamp._lines = [];
  stage.appendChild(lamp);

  lamp.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });

  lamp.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isConnecting) {
      if (!connectStartLamp) {
        connectStartLamp = lamp;
        lamp.classList.add('selected');
      } else if (connectStartLamp !== lamp) {
        drawLine(connectStartLamp, lamp);
        connectStartLamp.classList.remove('selected');
        connectStartLamp = null;
      }
    } else {
      if (selectedLamps.includes(lamp)) {
        lamp.classList.remove('selected');
        selectedLamps = selectedLamps.filter(l => l !== lamp);
      } else {
        lamp.classList.add('selected');
        selectedLamps.push(lamp);
        enableLampDragging(lamp);  // ← ドラッグ有効化
      }
    }
  });
});

// スタンド追加ボタン
document.getElementById('addStandBtn').addEventListener('click', (e) => {
  e.preventDefault();
  const standType = document.getElementById('standTypeSelector').value;
  const stand = document.createElement('div');
  stand.className = `stand ${standType}`;
  
  stand.style.left = '100px';
  stand.style.top = '100px';
  stand._lines = [];
  stage.appendChild(stand);

  stand.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });

  stand.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isConnecting) {
      if (!connectStartStand) {
        connectStartStand = stand;
        stand.classList.add('selected');
      } else if (connectStartStand !== stand) {
        drawLine(connectStartStand, stand);
        connectStartStand.classList.remove('selected');
        connectStartStand = null;
      }
    } else {
      if (selectedStands.includes(stand)) {
        stand.classList.remove('selected');
        selectedStands = selectedStands.filter(l => l !== stand);
      } else {
        stand.classList.add('selected');
        selectedStands.push(stand);
        enableStandDragging(stand);  // ← ドラッグ有効化
      }
    }
  });
});

// 接続モード切り替え
document.getElementById('connectModeBtn').addEventListener('click', (e) => {
  e.preventDefault();
  isConnecting = !isConnecting;
  connectStartLamp = null;
  connectStartStand = null;

  const button = document.getElementById('connectModeBtn');
  if (isConnecting) {
    button.textContent = '接続モード: ON';
    button.style.backgroundColor = 'green';
  } else {
    button.textContent = '接続モード: OFF';
    button.style.backgroundColor = '';
  }
});

// 灯体削除ボタン
document.getElementById('deleteLampBtn').addEventListener('click', (e) => {
  e.preventDefault();
  deleteSelectedLamps();
});

// スタンド消去ボタン
document.getElementById('deleteStandBtn').addEventListener('click', (e) => {
  e.preventDefault();
  deleteSelectedStands();
});

// ステージクリックで選択解除
stage.addEventListener('click', () => {
  selectedLamps.forEach(lamp => lamp.classList.remove('selected'));
  selectedLamps = [];
  selectedStands.forEach(stand => stand.classList.remove('selected'));
  selectedStands = [];
  if (selectedLine) {
    selectedLine.elem.classList.remove('selected-line');
    selectedLine = null;
  }
});

// 線を描画する関数
function drawLine(startLamp, endLamp) {
  const line = document.createElement('div');
  line.className = 'line';
  stage.insertBefore(line, stage.firstChild); // 灯体の下に配置

  const lineObj = { start: startLamp, end: endLamp, elem: line };
  lines.push(lineObj);
  startLamp._lines.push(lineObj);
  endLamp._lines.push(lineObj);

  updateLine(lineObj);
  enableLineSelection(line, lineObj);
}

// 線を選択できるようにする
function enableLineSelection(lineElem, lineObj) {
  lineElem.addEventListener('click', (e) => {
    e.stopPropagation();
    if (selectedLine) {
      selectedLine.elem.classList.remove('selected-line');
    }
    selectedLine = lineObj;
    selectedLine.elem.classList.add('selected-line');
  });
}

// 線の更新
function updateLine(lineObj) {
  const startRect = lineObj.start.getBoundingClientRect();
  const endRect = lineObj.end.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();

  const startX = startRect.left + startRect.width / 2 - stageRect.left;
  const startY = startRect.top + startRect.height / 2 - stageRect.top;
  const endX = endRect.left + endRect.width / 2 - stageRect.left;
  const endY = endRect.top + endRect.height / 2 - stageRect.top;

  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  lineObj.elem.style.width = length + 'px';
  lineObj.elem.style.transform = `rotate(${angle}deg)`;
  lineObj.elem.style.left = startX + 'px';
  lineObj.elem.style.top = startY + 'px';
}

// すべての線を更新
function updateLines() {
  lines.forEach(updateLine);
}

// 灯体削除
function deleteSelectedLamps() {
  if (selectedLamps.length === 0) return;

  const snapshot = selectedLamps.map(lamp => {
    return {
      lamp: lamp,
      x: lamp.offsetLeft,
      y: lamp.offsetTop,
      lines: lamp._lines.map(line => ({
        start: line.start,
        end: line.end
      }))
    };
  });

  undoStack.push(snapshot);

  selectedLamps.forEach(lamp => {
    lamp._lines.forEach(line => {
      if (stage.contains(line.elem)) stage.removeChild(line.elem);
      const idx1 = line.start._lines.indexOf(line);
      if (idx1 > -1) line.start._lines.splice(idx1, 1);
      const idx2 = line.end._lines.indexOf(line);
      if (idx2 > -1) line.end._lines.splice(idx2, 1);
    });
    stage.removeChild(lamp);
  });

  selectedLamps = [];
}


// スタンド削除
function deleteSelectedStands() {
  if (selectedStands.length === 0) return;

  const snapshot = selectedStands.map(stand => {
    return {
      stand: stand,
      x: stand.offsetLeft,
      y: stand.offsetTop,
      lines: stand._lines.map(line => ({
        start: line.start,
        end: line.end
      }))
    };
  });

  undoStack.push(snapshot);

  selectedStands.forEach(stand => {
    stand._lines.forEach(line => {
      if (stage.contains(line.elem)) stage.removeChild(line.elem);
      const idx1 = line.start._lines.indexOf(line);
      if (idx1 > -1) line.start._lines.splice(idx1, 1);
      const idx2 = line.end._lines.indexOf(line);
      if (idx2 > -1) line.end._lines.splice(idx2, 1);
    });
    stage.removeChild(stand);  // この行でスタンドを削除
  });

  selectedStands = [];
}


// Undo機能
function undo() {
  const snapshot = undoStack.pop();
  if (!snapshot) return;

  snapshot.forEach(item => {
    item.lamp.draggable = false;
    item.stand.draggable = false;
    stage.appendChild(item.lamp);
    stage.appendChild(item.stand);
    item.lamp.style.left = `${item.x}px`;
    item.stand.style.left = `${item.x}px`;
    item.lamp.style.top = `${item.y}px`;
    item.stand.style.top = `${item.y}px`;
    item.lamp._lines = [];
    item.stand._lines = [];

    item.lines.forEach(({ start, end }) => {
      drawLine(start, end);
    });
  });
}

// 線の削除
function deleteLine(lineObj) {
  const idx = lines.indexOf(lineObj);
  if (idx > -1) lines.splice(idx, 1);

  const idxStart = lineObj.start._lines.indexOf(lineObj);
  if (idxStart > -1) lineObj.start._lines.splice(idxStart, 1);

  const idxEnd = lineObj.end._lines.indexOf(lineObj);
  if (idxEnd > -1) lineObj.end._lines.splice(idxEnd, 1);

  stage.removeChild(lineObj.elem);
}

// キーボード操作
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    undo();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedLine) {
      deleteLine(selectedLine);
      selectedLine = null;
    } else {
      deleteSelectedLamps();
      deleteSelectedStands();
    }
  }
});

// 灯体のドラッグ処理
function enableLampDragging(lamp) {
  lamp.onmousedown = (e) => {
    if (isConnecting) return;

    e.preventDefault(); // ← これも大事（ブラウザのデフォルト動作防止）

    const startX = e.pageX;
    const startY = e.pageY;
    const origLeft = lamp.offsetLeft;
    const origTop = lamp.offsetTop;

    function onMouseMove(e) {
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;

      lamp.style.left = (origLeft + dx) + 'px';
      lamp.style.top = (origTop + dy) + 'px';
      updateLines();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', onMouseMove);
    }, { once: true });
  };
}

// スタンドのドラッグ処理
function enableStandDragging(stand) {
  stand.onmousedown = (e) => {
    if (isConnecting) return;

    e.preventDefault(); // ← これも大事（ブラウザのデフォルト動作防止）

    const startX = e.pageX;
    const startY = e.pageY;
    const origLeft = stand.offsetLeft;
    const origTop = stand.offsetTop;

    function onMouseMove(e) {
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;

      stand.style.left = (origLeft + dx) + 'px';
      stand.style.top = (origTop + dy) + 'px';
      updateLines();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', onMouseMove);
    }, { once: true });
  };
}

// ステージの背景を変更する処理
document.getElementById('backgroundSelector').addEventListener('change', (e) => {
  const stage = document.getElementById('stage');

  stage.innerHTML = '';

  
  // すべての背景クラスを削除
  stage.classList.remove('stage1', 'stage2', 'stage3');
  
  // 選択された背景にクラスを追加
  if (e.target.value) {
    stage.classList.add(e.target.value);
    
    // stage1の背景が選ばれたら長方形を追加
    if (e.target.value === 'stage1') {
      addRectangle();
    }

    if (e.target.value === 'stage2') {
      addBaton();
    }

    if (e.target.value === 'stage3') {
      addRectangle_medhiho();
    }
  }
});


// 長方形をステージに追加する関数
function addRectangle() {
  const rectangle = document.createElement('div');
  rectangle.className = 'rectangle';
  document.getElementById('stage').appendChild(rectangle);
  const kyoutaku = document.createElement('div');
  kyoutaku.className = 'kyoutaku';
  document.getElementById('stage').appendChild(kyoutaku);
}

function addBaton() {
  const baton1 = document.createElement('div');
  baton1.className = 'baton1';
  document.getElementById('stage').appendChild(baton1);
  const baton2 = document.createElement('div');
  baton2.className = 'baton2';
  document.getElementById('stage').appendChild(baton2);
}

function addRectangle_medhiho() {
  const rectangle_medhiho = document.createElement('div');
  rectangle_medhiho.className = 'rectangle_medhiho';
  document.getElementById('stage').appendChild(rectangle_medhiho);
  const rectangle_medhiho2 = document.createElement('div');
  rectangle_medhiho2.className = 'rectangle_medhiho2';
  document.getElementById('stage').appendChild(rectangle_medhiho2);
}

function addRect() {
  const rect = document.createElement('div');
  rect.className = 'rect';
  rect.draggable = true;

  rect.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', null);
    rect.dataset.dragging = 'true';
  });

  rect.addEventListener('dragend', e => {
    const canvas = document.getElementById('editorCanvas');
    const rectBounds = canvas.getBoundingClientRect();
    rect.style.left = `${e.pageX - rectBounds.left - 50}px`;
    rect.style.top = `${e.pageY - rectBounds.top - 25}px`;
  });

  document.getElementById('editorCanvas').appendChild(rect);
}

function clearEditor() {
  document.getElementById('editorCanvas').innerHTML = '';
}

function saveStageToLocalStorage() {
  const data = {
    lamps: Array.from(document.querySelectorAll('.lamp')).map(l => ({
      type: l.className,
      left: l.style.left,
      top: l.style.top
    })),
    stands: Array.from(document.querySelectorAll('.stand')).map(s => ({
      type: s.className,
      left: s.style.left,
      top: s.style.top
    })),
    lines: lines.map(line => ({
      startIndex: getElementIndex(line.start),
      endIndex: getElementIndex(line.end)
    }))
  };
  localStorage.setItem('stageData', JSON.stringify(data));
  alert('保存しました！');
}

function getElementIndex(elem) {
  return Array.from(stage.children).indexOf(elem);
}
function exportToFile() {
  const data = {
    lamps: Array.from(document.querySelectorAll('.lamp')).map(l => ({
      type: l.className,
      left: l.style.left,
      top: l.style.top
    })),
    stands: Array.from(document.querySelectorAll('.stand')).map(s => ({
      type: s.className,
      left: s.style.left,
      top: s.style.top
    })),
    lines: lines.map(line => ({
      startIndex: getElementIndex(line.start),
      endIndex: getElementIndex(line.end)
    }))
  };

  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'stage_data.json';
  a.click();
  URL.revokeObjectURL(url);
}
