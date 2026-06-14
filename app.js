const config = window.RODA_CONFIG || {};
const canvas = document.querySelector("#wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.querySelector("#spinButton");
const form = document.querySelector("#customerForm");
const statusText = document.querySelector("#status");
const dialog = document.querySelector("#resultDialog");
const resultTitle = document.querySelector("#resultTitle");
const resultMessage = document.querySelector("#resultMessage");

let prizes = [];
let currentRotation = 0;
let spinning = false;

function apiConfigured() {
  return config.apiUrl && !config.apiUrl.includes("PASTE_");
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#b91c1c" : "";
}

function drawWheel() {
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 12;
  ctx.clearRect(0, 0, size, size);

  if (!prizes.length) return;
  const slice = (Math.PI * 2) / prizes.length;

  prizes.forEach((prize, index) => {
    const start = index * slice - Math.PI / 2;
    const end = start + slice;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = prize.color || `hsl(${index * 360 / prizes.length} 70% 45%)`;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 25px sans-serif";
    ctx.shadowColor = "rgba(0,0,0,.35)";
    ctx.shadowBlur = 3;
    const text = prize.name.length > 20 ? `${prize.name.slice(0, 18)}...` : prize.name;
    ctx.fillText(text, radius - 30, 8);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(center, center, radius * .18, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 10;
  ctx.stroke();
}

async function apiRequest(payload) {
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect: "follow",
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Permintaan gagal.");
  return data;
}

async function loadPrizes() {
  if (!apiConfigured()) {
    setStatus("API belum dikonfigurasi. Buka config.js dan tempel URL Apps Script.", true);
    return;
  }

  try {
    const response = await fetch(`${config.apiUrl}?action=config`, { redirect: "follow" });
    const data = await response.json();
    if (!data.ok || !Array.isArray(data.prizes) || !data.prizes.length) {
      throw new Error(data.error || "Daftar hadiah kosong.");
    }
    prizes = data.prizes;
    drawWheel();
    spinButton.disabled = false;
    setStatus("Roda siap diputar.");
  } catch (error) {
    setStatus(`Tidak dapat memuat hadiah: ${error.message}`, true);
  }
}

async function spin() {
  if (spinning || !form.reportValidity()) return;
  spinning = true;
  spinButton.disabled = true;
  setStatus("Menentukan hadiah...");

  const name = document.querySelector("#name").value.trim();
  const contact = document.querySelector("#contact").value.trim();
  const ticket = document.querySelector("#ticket").value.trim().toUpperCase();

  try {
    const data = await apiRequest({
      action: "spin",
      name,
      contact,
      ticket,
      clientId: getClientId(),
    });

    const index = prizes.findIndex((prize) => prize.id === data.prize.id);
    if (index < 0) throw new Error("Hadiah tidak cocok dengan konfigurasi roda.");

    const sliceDegrees = 360 / prizes.length;
    const target = 360 - (index * sliceDegrees + sliceDegrees / 2);
    const normalized = ((currentRotation % 360) + 360) % 360;
    currentRotation += 360 * 7 + target - normalized;
    canvas.style.transform = `rotate(${currentRotation}deg)`;
    setStatus("Roda sedang berputar...");

    window.setTimeout(() => {
      resultTitle.textContent = data.prize.name;
      resultMessage.textContent = data.message || "Tunjukkan hasil ini kepada petugas.";
      dialog.showModal();
      setStatus("Putaran selesai.");
      spinning = false;
    }, 5700);
  } catch (error) {
    setStatus(error.message, true);
    spinning = false;
    spinButton.disabled = false;
  }
}

function getClientId() {
  let id = localStorage.getItem("rodaClientId");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    localStorage.setItem("rodaClientId", id);
  }
  return id;
}

spinButton.addEventListener("click", spin);
document.querySelector("#closeDialog").addEventListener("click", () => dialog.close());
loadPrizes();
