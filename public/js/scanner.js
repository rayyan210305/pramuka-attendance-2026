let html5QrCode = null;
let isProcessingScan = false;
let lastScannedCode = null;
let lastScannedTime = 0;
let currentCameraId = null;

const SVG_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const SVG_WARN = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
const SVG_X = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

document.addEventListener('DOMContentLoaded', () => {
  const originEl = document.getElementById('scannerOriginUrl');
  if (originEl) originEl.innerText = window.location.origin;

  initCameraScanner();

  // Manual Scan Form Submission
  const manualForm = document.getElementById('manualScanForm');
  if (manualForm) {
    manualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('manualBarcodeInput');
      if (input && input.value.trim() !== '') {
        processBarcode(input.value.trim());
        input.value = '';
      }
    });
  }

  // Active Activity Selection Change
  const activitySelect = document.getElementById('scannerActivitySelect');
  if (activitySelect) {
    activitySelect.addEventListener('change', async (e) => {
      const activityId = e.target.value;
      if (!activityId) return;

      try {
        const res = await fetch(`/api/activities/${activityId}/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
          showNotification('Kegiatan Aktif Diperbarui', data.message, 'success');
          setTimeout(() => location.reload(), 800);
        }
      } catch (err) {
        console.error('Error changing active activity:', err);
      }
    });
  }
});

function initCameraScanner(selectedCameraId = null) {
  const readerElement = document.getElementById('reader');
  if (!readerElement) return;

  if (typeof Html5Qrcode === 'undefined') {
    console.warn('Html5Qrcode library not loaded.');
    updateScannerStatus('MEMUAT LIBRARY KAMERA... / GUNAKAN INPUT MANUAL', 'warning');
    return;
  }

  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().then(() => {
      startCameraStream(selectedCameraId);
    }).catch(err => {
      console.error('Failed to stop previous scan:', err);
      startCameraStream(selectedCameraId);
    });
  } else {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode('reader');
    }
    startCameraStream(selectedCameraId);
  }
}

function startCameraStream(targetCameraId = null) {
  const config = {
    fps: 15,
    qrbox: { width: 260, height: 260 },
    aspectRatio: 1.333333
  };

  const guideBox = document.getElementById('cameraGuideBox');
  if (guideBox) guideBox.style.display = 'none';

  Html5Qrcode.getCameras().then(cameras => {
    populateCameraDropdown(cameras);

    if (cameras && cameras.length > 0) {
      let chosenCamId = targetCameraId;
      if (!chosenCamId) {
        const backCam = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('belakang'));
        chosenCamId = backCam ? backCam.id : cameras[0].id;
      }
      currentCameraId = chosenCamId;

      html5QrCode.start(
        chosenCamId,
        config,
        (decodedText, decodedResult) => {
          onBarcodeDetected(decodedText);
        },
        (errorMessage) => {
          // Frame scan pass
        }
      ).then(() => {
updateScannerStatus('● SIAP SCAN', 'success');
        if (guideBox) guideBox.style.display = 'none';
      }).catch(err => {
        console.error('Failed to start camera:', err);
        updateScannerStatus('KAMERA TERKUNCI / IZIN DITOLAK', 'danger');
        if (guideBox) guideBox.style.display = 'block';
      });
    } else {
      updateScannerStatus('TIDAK DITEMUKAN KAMERA', 'danger');
      if (guideBox) guideBox.style.display = 'block';
    }
  }).catch(err => {
    console.error('Error getting cameras:', err);
    updateScannerStatus('MEMBUTAHRUKAN IZIN KAMERA BROWSER', 'danger');
    if (guideBox) guideBox.style.display = 'block';
  });
}

function populateCameraDropdown(cameras) {
  const select = document.getElementById('cameraDeviceSelect');
  if (!select) return;

  select.innerHTML = '';
  if (cameras && cameras.length > 0) {
    cameras.forEach((cam, index) => {
      const opt = document.createElement('option');
      opt.value = cam.id;
      opt.innerText = cam.label || `Kamera ${index + 1}`;
      if (currentCameraId === cam.id) opt.selected = true;
      select.appendChild(opt);
    });
  } else {
    const opt = document.createElement('option');
    opt.value = '';
    opt.innerText = 'Kamera Tidak Ditemukan';
    select.appendChild(opt);
  }
}

function changeCameraDevice(cameraId) {
  if (!cameraId) return;
  initCameraScanner(cameraId);
}

function restartCameraScanner() {
  initCameraScanner(currentCameraId);
}

function updateScannerStatus(text, type = 'success') {
  const statusEl = document.getElementById('scannerStatusText');
  if (statusEl) {
    statusEl.innerText = text;
    if (type === 'danger') {
      statusEl.style.color = 'var(--color-danger)';
    } else if (type === 'warning') {
      statusEl.style.color = 'var(--color-warning)';
    } else {
      statusEl.style.color = 'var(--gold-accent)';
    }
  }
}

function onBarcodeDetected(code) {
  const now = Date.now();
  if (code === lastScannedCode && (now - lastScannedTime) < 2500) {
    return;
  }
  if (isProcessingScan) return;

  lastScannedCode = code;
  lastScannedTime = now;

  processBarcode(code);
}

async function processBarcode(barcodeId) {
  isProcessingScan = true;
  updateScannerStatus('⚡ MEMPROSES ABSENSI...', 'warning');

  const activitySelect = document.getElementById('scannerActivitySelect');
  const activityId = activitySelect ? activitySelect.value : null;

  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode_id: barcodeId, activity_id: activityId })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      if (window.soundFx) window.soundFx.playSuccess();
      showResultOverlay('success', 'ABSEN BERHASIL', data.participant, data.activity, data.formatted_time);
      updateDashboardWidget(data.stats);
      addRecentScanRow(data);
    } else if (data.status === 'ALREADY_ATTENDED') {
      if (window.soundFx) window.soundFx.playDuplicate();
      showResultOverlay('duplicate', 'SUDAH ABSEN', data.participant, data.activity, data.formatted_time || 'Sebelumnya');
    } else if (data.status === 'PARTICIPANT_NOT_FOUND') {
      if (window.soundFx) window.soundFx.playError();
      showResultOverlay('error', 'PESERTA TIDAK TERDAFTAR', { name: barcodeId, school: 'Nomor Barcode Tidak Dikenal', category: '-' }, null, 'Bukan Peserta Resmi');
    } else {
      if (window.soundFx) window.soundFx.playError();
      showResultOverlay('error', data.status || 'ERROR', { name: data.message || 'Gagal memproses', school: '', category: '' }, null, '');
    }

  } catch (err) {
    console.error('Scan Request Failed:', err);
    if (window.soundFx) window.soundFx.playError();
    showResultOverlay('error', 'ERROR SISTEM', { name: 'Koneksi Server Gagal', school: '', category: '' }, null, '');
  } finally {
    setTimeout(() => {
      hideResultOverlay();
      isProcessingScan = false;
      updateScannerStatus('● SIAP SCAN', 'success');
    }, 2200);
  }
}

function showResultOverlay(type, title, participant, activity, timeText) {
  const overlay = document.getElementById('resultOverlay');
  if (!overlay) return;

  overlay.className = `result-overlay result-${type} show`;

  const iconEl = overlay.querySelector('.result-icon');
  const titleEl = overlay.querySelector('.result-title');
  const nameEl = overlay.querySelector('.res-name');
  const schoolEl = overlay.querySelector('.res-school');
  const catEl = overlay.querySelector('.res-category');
  const activityEl = overlay.querySelector('.res-activity');
  const timeEl = overlay.querySelector('.res-time');

  if (type === 'success') {
    iconEl.innerHTML = SVG_CHECK;
    iconEl.style.fontSize = '0';
  } else if (type === 'duplicate') {
    iconEl.innerHTML = SVG_WARN;
    iconEl.style.fontSize = '0';
  } else {
    iconEl.innerHTML = SVG_X;
    iconEl.style.fontSize = '0';
  }

  if (titleEl) titleEl.innerText = title;
  if (nameEl) nameEl.innerText = participant ? participant.name : '-';
  if (schoolEl) schoolEl.innerText = participant ? participant.school : '-';
  if (catEl) catEl.innerText = participant ? participant.category : '-';
  if (activityEl) activityEl.innerText = activity ? activity.name : '-';
  if (timeEl) timeEl.innerText = timeText || '-';
}

function hideResultOverlay() {
  const overlay = document.getElementById('resultOverlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
}

function updateDashboardWidget(stats) {
  if (!stats) return;
  const attendedEl = document.getElementById('widgetAttended');
  const unattendedEl = document.getElementById('widgetUnattended');
  const percentEl = document.getElementById('widgetPercentage');

  if (attendedEl) attendedEl.innerText = stats.attended;
  if (unattendedEl) unattendedEl.innerText = stats.unattended;
  if (percentEl) percentEl.innerText = `${stats.percentage}%`;
}

function addRecentScanRow(data) {
  const tableBody = document.getElementById('recentScansTableBody');
  if (!tableBody) return;

  const newTr = document.createElement('tr');
  newTr.style.animation = 'fadeIn 0.4s ease';
  newTr.innerHTML = `
    <td><code style="color:var(--gold-accent);">${data.participant.barcode_id}</code></td>
    <td><strong>${data.participant.name}</strong></td>
    <td>${data.participant.school}</td>
    <td><span class="badge ${data.participant.category === 'PENEGAK' ? 'badge-penegak' : 'badge-penggalang'}">${data.participant.category}</span></td>
    <td>${data.activity.name}</td>
    <td>${data.formatted_time}</td>
    <td><span class="badge badge-active">HADIR</span></td>
  `;

  if (tableBody.firstChild) {
    tableBody.insertBefore(newTr, tableBody.firstChild);
  } else {
    tableBody.appendChild(newTr);
  }

  while (tableBody.children.length > 6) {
    tableBody.removeChild(tableBody.lastChild);
  }
}
