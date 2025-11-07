// --- CONFIGURACIÓN INICIAL ---
const l1 = 0.12, l2 = 0.12, lPinza = 0.02;
const xi = 0.14, yi = 0.14, ti = 0, tf = 20;

const world = document.getElementById('world');
const W = world.width, H = world.height;
const wctx = world.getContext('2d');
const q1c = document.getElementById('q1canvas').getContext('2d');
const q2c = document.getElementById('q2canvas').getContext('2d');
const xdIn = document.getElementById('xd'), ydIn = document.getElementById('yd');
const homeBtn = document.getElementById('homeBtn');
const inicioBtn = document.getElementById('inicioBtn');
const alerta = document.getElementById('alerta');

let currentTCP = { x: xi, y: yi }, sampled = [];

// --- ELEMENTOS DOM PARA INFO ---
const tcpX = document.getElementById('tcpX'), tcpY = document.getElementById('tcpY');
const q1radEl = document.getElementById('q1rad'), q1degEl = document.getElementById('q1deg');
const q2radEl = document.getElementById('q2rad'), q2degEl = document.getElementById('q2deg');
const rmaxEl = document.getElementById('rmax');
const gq1rad = document.getElementById('gq1rad'), gq1deg = document.getElementById('gq1deg');
const gq2rad = document.getElementById('gq2rad'), gq2deg = document.getElementById('gq2deg');

// --- MAPEOS Y FUNCIONES DE DIBUJO ---
const scale = 1200; // px / m

function toCanvas(xm, ym) {
  const cx = W / 2;
  const cy = H * 0.58;
  return { x: cx + xm * scale, y: cy - ym * scale };
}

// Dibuja cuadrícula, workspace y marcador q₁=90°
function drawGridAndWorkspace(ctx) {
  const gridSpacingM = 0.02;
  const gpx = gridSpacingM * scale;
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  const o = toCanvas(0, 0);

  for (let x = o.x % gpx; x <= W; x += gpx) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = o.y % gpx; y <= H; y += gpx) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath(); ctx.moveTo(0, o.y); ctx.lineTo(W, o.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(o.x, 0); ctx.lineTo(o.x, H); ctx.stroke();

  // Círculo workspace
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.arc(o.x, o.y, (l1 + l2) * scale, 0, Math.PI * 2);
  ctx.stroke();

  // Marcador q₁ = 90° en (0.14, 0.14)
  const marker = toCanvas(0.14, 0.14);
  ctx.fillStyle = '#ffaa00';
  ctx.beginPath(); ctx.arc(marker.x, marker.y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,220,120,0.95)';
  ctx.font = '13px monospace';
  ctx.fillText('q₁ = θ₁ = 90°', marker.x + 10, marker.y - 10);

  // Etiquetas de escala
  ctx.fillStyle = 'rgba(200,220,255,0.85)';
  ctx.font = '12px monospace';
  const tickM = 0.04;
  for (let xm = -(l1 + l2); xm <= (l1 + l2); xm += tickM) {
    const p = toCanvas(xm, 0);
    ctx.fillText(xm.toFixed(2), p.x - 10, o.y + 14);
  }
  for (let ym = -(l1 + l2); ym <= (l1 + l2); ym += tickM) {
    const p = toCanvas(0, ym);
    ctx.fillText(ym.toFixed(2), o.x + 6, p.y + 4);
  }

  ctx.restore();
}

// Dibuja el robot
function drawRobot(q1, q2, ctx) {
  ctx.clearRect(0, 0, W, H);
  drawGridAndWorkspace(ctx);

  const o = toCanvas(0, 0);
  const x1 = l1 * Math.cos(q1), y1 = l1 * Math.sin(q1);
  const p1 = toCanvas(x1, y1);
  const x2 = x1 + l2 * Math.cos(q1 + q2), y2 = y1 + l2 * Math.sin(q1 + q2);
  const p2 = toCanvas(x2, y2);
  const xt = x2 + lPinza * Math.cos(q1 + q2), yt = y2 + lPinza * Math.sin(q1 + q2);
  const pt = toCanvas(xt, yt);

  // Trayectoria punteada
  if (sampled.length) {
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    const start = toCanvas(0, 0);
    ctx.moveTo(start.x, start.y);
    sampled.forEach(p => {
      const s = toCanvas(p.x, p.y);
      ctx.lineTo(s.x, s.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Base
  ctx.fillStyle = '#b725d8ff';
  ctx.fillRect(o.x - 35, o.y + 12, 70, 14);
  ctx.fillStyle = '#d138c4ff';
  ctx.fillRect(o.x - 25, o.y - 5, 50, 20);
  ctx.fillStyle = '#52095cff';
  ctx.fillRect(o.x - 15, o.y + 5, 30, 6);

  // Brazo superior
  const dx1 = p1.x - o.x, dy1 = p1.y - o.y;
  const ang1 = Math.atan2(dy1, dx1);
  const len1 = Math.hypot(dx1, dy1);
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(ang1);
  ctx.fillStyle = '#c988e2ff';
  ctx.fillRect(0, -10, len1, 20);
  ctx.strokeStyle = '#a200ffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, -10, len1, 20);
  ctx.restore();

  // Codo
  ctx.beginPath();
  ctx.fillStyle = '#e100ffff';
  ctx.arc(o.x, o.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = '#1b1e25';
  ctx.arc(o.x, o.y, 6, 0, Math.PI * 2);
  ctx.fill();

  // Brazo inferior
  const dx2 = p2.x - p1.x, dy2 = p2.y - p1.y;
  const ang2 = Math.atan2(dy2, dx2);
  const len2 = Math.hypot(dx2, dy2);
  ctx.save();
  ctx.translate(p1.x, p1.y);
  ctx.rotate(ang2);
  ctx.fillStyle = '#cb00ddff';
  ctx.fillRect(0, -8, len2, 16);
  ctx.strokeStyle = '#a200ffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, -8, len2, 16);
  ctx.restore();

  // Codo (segunda junta)
  ctx.beginPath();
  ctx.fillStyle = '#b700ffff';
  ctx.arc(p1.x, p1.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = '#1b1e25';
  ctx.arc(p1.x, p1.y, 5, 0, Math.PI * 2);
  ctx.fill();

  // Pinza
  const dx3 = pt.x - p2.x, dy3 = pt.y - p2.y;
  const ang3 = Math.atan2(dy3, dx3);
  ctx.save();
  ctx.translate(p2.x, p2.y);
  ctx.rotate(ang3);
  ctx.fillStyle = '#f700ffff';
  ctx.fillRect(0, -5, 20, 10);
  ctx.strokeStyle = '#ff00ffff';
  ctx.strokeRect(0, -5, 20, 10);
  ctx.fillStyle = '#ff00bfff';
  ctx.beginPath();
  ctx.moveTo(20, 0); ctx.lineTo(28, -6); ctx.lineTo(28, -2); ctx.lineTo(22, 2); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, 0); ctx.lineTo(28, 6); ctx.lineTo(28, 2); ctx.lineTo(22, -2); ctx.closePath(); ctx.fill();
  ctx.restore();

  // Junta final
  ctx.beginPath();
  ctx.fillStyle = '#00bfff';
  ctx.arc(p2.x, p2.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = '#1b1e25';
  ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();

  // Actualiza panel de valores
  tcpX.textContent = currentTCP.x.toFixed(3);
  tcpY.textContent = currentTCP.y.toFixed(3);
  q1radEl.textContent = q1.toFixed(4);
  q1degEl.textContent = (q1 * 180 / Math.PI).toFixed(1) + '°';
  q2radEl.textContent = q2.toFixed(4);
  q2degEl.textContent = (q2 * 180 / Math.PI).toFixed(1) + '°';
  rmaxEl.textContent = (l1 + l2).toFixed(3);
}

// --- CINEMÁTICA INVERSA Y TRAYECTORIA ---
function invKinematics(x, y) {
  const r2 = x * x + y * y;
  const cos_q2 = (r2 - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  if (Math.abs(cos_q2) > 1) return null;
  const sin_q2 = Math.sqrt(1 - cos_q2 * cos_q2);
  const q2 = Math.atan2(sin_q2, cos_q2);
  const q1 = Math.atan2(y, x) - Math.atan2(l2 * Math.sin(q2), l1 + l2 * Math.cos(q2));
  return { q1, q2 };
}

function quinticCoeffs(p0, pf, ti, tf) {
  const T = tf - ti, a0 = p0, a1 = 0, a2 = 0;
  const a3 = (10 * (pf - p0)) / T ** 3, a4 = (-15 * (pf - p0)) / T ** 4, a5 = (6 * (pf - p0)) / T ** 5;
  return [a0, a1, a2, a3, a4, a5];
}

function evalPoly(c, t, ti) {
  const τ = t - ti;
  const [a0, a1, a2, a3, a4, a5] = c;
  return a0 + a1 * τ + a2 * τ ** 2 + a3 * τ ** 3 + a4 * τ ** 4 + a5 * τ ** 5;
}

function computeTrajectory(x0, y0, xf, yf) {
  const cx = quinticCoeffs(x0, xf, ti, tf);
  const cy = quinticCoeffs(y0, yf, ti, tf);
  const N = 200, traj = [];
  for (let i = 0; i <= N; i++) {
    const t = ti + (tf - ti) * (i / N);
    const x = evalPoly(cx, t, ti), y = evalPoly(cy, t, ti);
    const ik = invKinematics(x, y);
    if (ik === null) traj.push({ t, x, y, ok: false });
    else traj.push({ t, x, y, q1: ik.q1, q2: ik.q2, ok: true });
  }
  return traj;
}

// --- GRÁFICAS ---
function drawGraphAxes(ctx, traj, label) {
  const Wc = ctx.canvas.width, Hc = ctx.canvas.height;
  ctx.clearRect(0, 0, Wc, Hc);
  ctx.fillStyle = '#cccccc07';
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 10); ctx.lineTo(40, Hc - 10); ctx.lineTo(Wc - 10, Hc - 10); ctx.stroke();

  const okPts = traj.filter(s => s.ok);
  if (!okPts.length) {
    ctx.fillText(label + ' (sin datos válidos)', 10, 20);
    return;
  }

  const v = okPts.map(s => (label === 'q1' ? s.q1 : s.q2));
  const minV = Math.min(...v), maxV = Math.max(...v);
  const pad = (maxV - minV) * 0.1 + 0.01;
  const minVp = minV - pad, maxVp = maxV + pad;

  ctx.fillStyle = '#cfeaff';
  ctx.font = '12px monospace';
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const frac = i / ticks;
    const y = (Hc - 10) - frac * (Hc - 20);
    const val = minVp + frac * (maxVp - minVp);
    ctx.fillText(val.toFixed(2), 4, y + 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(Wc - 10, y); ctx.stroke();
  }

  ctx.beginPath();
  const marginL = 40, width = Wc - marginL - 10;
  okPts.forEach((s, i) => {
    const x = marginL + (i / okPts.length) * width;
    const val = (label === 'q1' ? s.q1 : s.q2);
    const y = (Hc - 10) - ((val - minVp) / (maxVp - minVp)) * (Hc - 20);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = (label === 'q1' ? '#00bfff' : '#ffaa00');
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ccc';
  ctx.fillText(label + ' (rad)', 10, 16);
}

function plotQs(traj) {
  drawGraphAxes(q1c, traj, 'q1');
  drawGraphAxes(q2c, traj, 'q2');
  const okPts = traj.filter(s => s.ok);
  if (okPts.length) {
    const last = okPts[okPts.length - 1];
    gq1rad.textContent = last.q1.toFixed(4);
    gq1deg.textContent = (last.q1 * 180 / Math.PI).toFixed(1) + '°';
    gq2rad.textContent = last.q2.toFixed(4);
    gq2deg.textContent = (last.q2 * 180 / Math.PI).toFixed(1) + '°';
  }
}

// --- ACTUALIZACIÓN EN TIEMPO REAL ---
function updateRealtime(targetElement) {
  const xdSlider = document.getElementById('xdSlider'), ydSlider = document.getElementById('ydSlider');

  if (targetElement.id === 'xd') xdSlider.value = targetElement.value;
  else if (targetElement.id === 'yd') ydSlider.value = targetElement.value;
  else if (targetElement.id === 'xdSlider') xdIn.value = targetElement.value;
  else if (targetElement.id === 'ydSlider') ydIn.value = targetElement.value;

  const xd = parseFloat(xdIn.value), yd = parseFloat(ydIn.value);
  const dist = Math.hypot(xd, yd);
  if (dist > (l1 + l2)) {
    alerta.textContent = '⚠️ Punto fuera del espacio de trabajo';
    alert('⚠️ Punto fuera del espacio de trabajo');
    return;
  } else alerta.textContent = '';

  const traj = computeTrajectory(currentTCP.x, currentTCP.y, xd, yd);
  const anyBad = traj.some(s => !s.ok);
  if (anyBad) {
    alerta.textContent = '⚠️ Parte de la trayectoria fuera del área de trabajo';
    alert('⚠️ Parte de la trayectoria fuera del área de trabajo');
  }

  sampled = traj.map(s => ({ x: s.x, y: s.y }));
  plotQs(traj);
  const lastValid = traj.slice().reverse().find(s => s.ok);
  if (lastValid) {
    currentTCP = { x: lastValid.x, y: lastValid.y };
    drawRobot(lastValid.q1, lastValid.q2, wctx);
  }
}

// --- EVENTOS ---
xdIn.addEventListener('input', (e) => updateRealtime(e.target));
ydIn.addEventListener('input', (e) => updateRealtime(e.target));
document.getElementById('xdSlider').addEventListener('input', (e) => updateRealtime(e.target));
document.getElementById('ydSlider').addEventListener('input', (e) => updateRealtime(e.target));

inicioBtn.addEventListener('click', () => {
  const ik = invKinematics(xi, yi);
  if (!ik) {
    alerta.textContent = 'Inicio fuera del workspace';
    alert('Inicio fuera del workspace');
    return;
  }
  alerta.textContent = '';
  sampled = [{ x: xi, y: yi }];
  currentTCP = { x: xi, y: yi };
  drawRobot(ik.q1, ik.q2, wctx);
  plotQs([{ t: 0, q1: ik.q1, q2: ik.q2, ok: true }]);
  xdIn.value = xi; ydIn.value = yi;
  document.getElementById('xdSlider').value = xi;
  document.getElementById('ydSlider').value = yi;
});

homeBtn.addEventListener('click', () => {
  const q1_fixed = Math.PI / 2;
  const x_elbow = l1 * Math.cos(q1_fixed);
  const y_elbow = l1 * Math.sin(q1_fixed);
  const dx = xi - x_elbow, dy = yi - y_elbow;
  const r = Math.hypot(dx, dy);
  if (r > l2 + 1e-6) {
    alerta.textContent = '⚠️ No alcanzable con q₁=90° (fuera del área de trabajo)';
    alert('⚠️ No alcanzable con q₁=90° (fuera del área de trabajo)');
    return;
  }

  const q2 = Math.atan2(dy, dx) - q1_fixed;
  alerta.textContent = '';
  sampled = [{ x: xi, y: yi }];
  currentTCP = { x: xi, y: yi };
  drawRobot(q1_fixed, q2, wctx);
  plotQs([{ t: 0, q1: q1_fixed, q2: q2, ok: true }]);
  xdIn.value = xi; ydIn.value = yi;
  document.getElementById('xdSlider').value = xi;
  document.getElementById('ydSlider').value = yi;
});

// --- INICIALIZACIÓN ---
(function init() {
  const ik = invKinematics(xi, yi);
  if (ik) {
    currentTCP = { x: xi, y: yi };
    drawRobot(ik.q1, ik.q2, wctx);
    plotQs([{ t: 0, q1: ik.q1, q2: ik.q2, ok: true }]);
  } else {
    drawGridAndWorkspace(wctx);
  }
})();
