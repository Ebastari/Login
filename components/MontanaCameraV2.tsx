
import React, { useEffect, useRef } from 'react';

// Use external types to avoid TS errors for the provided vanilla JS
declare var Dexie: any;
declare var L: any;
declare var Chart: any;
declare var piexif: any;
declare var JSZip: any;
declare var saveAs: any;

interface MontanaCameraV2Props {
  onClose: () => void;
}

export const MontanaCameraV2: React.FC<MontanaCameraV2Props> = ({ onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // --- VERBATIM LOGIC FROM USER PROVIDED SCRIPT ---
    const startV2Logic = () => {
      // ============ State ============
      const db = new Dexie("monitoringDB");
      db.version(2).stores({
        monitoring: '++idx, id, tanggal, lokasi, tinggi, *koordinat, jenis, tahun, pengawas, vendor, kesehatan, akurasi, n, foto, statusUpload'
      });

      let lastGPS = { koordinat: "", akurasi: 999, n: 0 };
      let goalTarget = 100;
      let map, markersLayer;
      let scatterChart, histChart, healthChart;
      let currentStream = null;
      let currentDeviceId = null;
      let captureCountForZip = 0;
      let isWatchingGPS = false;
      let videoDevices = []; 

      // ============ DOM ============
      const video = document.getElementById('video') as HTMLVideoElement;
      const canvas = document.getElementById('canvas') as HTMLCanvasElement;
      const btnCapture = document.getElementById('btnCapture');
      const btnGallery = document.getElementById('btnGallery');
      const btnFlipCamera = document.getElementById('btnFlipCamera');
      const btnSettings = document.getElementById('btnSettings') as HTMLButtonElement;
      const lastPhotoThumb = document.getElementById('lastPhotoThumb') as HTMLImageElement;
      const sheet = document.getElementById('sheet');
      const handle = document.getElementById('handle');
      const tinggiRange = document.getElementById('tinggiRange') as HTMLInputElement;
      const tinggiInput = document.getElementById('tinggi') as HTMLInputElement;
      const tinggiValueDisplay = document.getElementById('tinggiValueDisplay');
      const ovLokasi = document.getElementById('ovLokasi');
      const ovTinggi = document.getElementById('ovTinggi');
      const ovJenis = document.getElementById('ovJenis');
      const ovHealth = document.getElementById('ovHealth');
      const ovCount = document.getElementById('ovCount');
      const chipGPS = document.getElementById('chipGPS');
      const chipGPSText = document.getElementById('chipGPSText');
      const chipGoalText = document.getElementById('chipGoalText');
      const goalBarFill = document.getElementById('goalBarFill');
      const jenisInput = document.getElementById('jenis') as HTMLInputElement;
      const tahunInput = document.getElementById('tahun') as HTMLInputElement;
      const lokasiInput = document.getElementById('lokasi') as HTMLInputElement;
      const pengawasInput = document.getElementById('pengawas') as HTMLInputElement;
      const vendorInput = document.getElementById('vendor') as HTMLInputElement;
      const kesehatanInput = document.getElementById('kesehatan') as HTMLInputElement;
      const statusText = document.getElementById('status');
      const toast = document.getElementById('toast');
      const toastMsg = document.getElementById('toastMsg');
      const toastProg = document.getElementById('toastProg');
      const reviewFoto = document.getElementById('reviewFoto');
      const ccResultEl = document.getElementById('ccResult');

      let brand = "PT ENERGI BATUBARA LESTARI";

      // ============ Utils ============
      const pad = (n)=> n.toString().padStart(2,'0');
      const genId = ()=>{
        const d=new Date();
        return d.getFullYear()+""+pad(d.getMonth()+1)+pad(d.getDate())+"-"+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds());
      };
      function showToast(msg, progress=0){
        toastMsg.textContent = msg;
        toast.classList.add('show');
        toastProg.style.width = (progress*100)+'%';
        // @ts-ignore
        clearTimeout(window.__toastTO);
        // @ts-ignore
        window.__toastTO = setTimeout(()=> toast.classList.remove('show'), 1800);
      }
      function safeFilename(s){ return String(s||'').replace(/[^\w.-]/g,"_"); }
      function dataURLtoBlob(dataurl){
        const arr = dataurl.split(',');
        const mime = (arr[0].match(/:(.*?);/)||[])[1]||'image/jpeg';
        const bstr = atob(arr[1]); let n=bstr.length; const u8=new Uint8Array(n);
        while(n--){ u8[n]=bstr.charCodeAt(n); }
        return new Blob([u8], {type:mime});
      }
      function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      function parseLatLon(str){
        const p=(str||"").split(',').map(s=>s.trim());
        if(p.length<2) return null;
        const lat=parseFloat(p[0]); const lon=parseFloat(p[1]);
        if(isNaN(lat)||isNaN(lon)) return null;
        return {lat,lon};
      }
      function toDMS(coord){
        const abs=Math.abs(coord);
        const deg=Math.floor(abs);
        const min=Math.floor((abs-deg)*60);
        const sec=(abs-deg-min/60)*3600;
        return [[deg,1],[min,1],[Math.round(sec*100),100]];
      }
      function haversine(lat1, lon1, lat2, lon2) {
          const R = 6371e3; 
          const φ1 = lat1 * Math.PI/180;
          const φ2 = lat2 * Math.PI/180;
          const Δφ = (lat2-lat1) * Math.PI/180;
          const Δλ = (lon2-lon1) * Math.PI/180;
          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c; 
      }

      // ============ Camera ============
      async function listCameras(){
        if(!navigator.mediaDevices?.enumerateDevices) return;
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          videoDevices = devices.filter(d=>d.kind==="videoinput");
          const back = videoDevices.find(v=>/back|rear|environment/i.test(v.label)) || videoDevices[0];
          if(back) startCamera(back.deviceId);
          else showToast("Tidak ditemukan kamera.", 0);
        } catch(e) {
          showToast("Gagal enumerasi kamera: " + (e.message||e), 0);
        }
      }
      async function startCamera(deviceId){
        if(currentStream){ currentStream.getTracks().forEach(t=>t.stop()); }
        const constraints = { video: { deviceId: deviceId? { exact: deviceId } : undefined, facingMode:'environment' } };
        try{
          const s = await navigator.mediaDevices.getUserMedia(constraints);
          currentStream = s; 
          const videoTrack = s.getVideoTracks()[0];
          const settings = videoTrack.getSettings();
          currentDeviceId = settings.deviceId; 
          video.srcObject = s;
        }catch(e){
          showToast("Gagal akses kamera: "+(e.message||e),0);
        }
      }
      function flipCamera() {
        if (videoDevices.length < 2) {
          showToast("Hanya 1 kamera ditemukan", 0);
          return;
        }
        const currentIdx = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
        const nextIdx = (currentIdx + 1) % videoDevices.length;
        startCamera(videoDevices[nextIdx].deviceId);
      }

      // ============ GPS ============
      function updateGPSUI(text, accuracy) {
        if (accuracy <= 10) { chipGPSText.textContent = 'GPS: Aktif'; } 
        else if (accuracy < 999) { chipGPSText.textContent = `GPS: ±${accuracy.toFixed(0)}m`; } 
        else { chipGPSText.textContent = text; }
        chipGPS.classList.remove('gps-good', 'gps-medium', 'gps-bad');
        if (accuracy <= 5) { chipGPS.classList.add('gps-good'); } 
        else if (accuracy <= 10) { chipGPS.classList.add('gps-medium'); } 
        else { chipGPS.classList.add('gps-bad'); }
      }

      function getPreciseGPS() {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) { reject(new Error('Geolocation tidak didukung')); return; }
          if (isWatchingGPS) { reject(new Error('GPS sudah aktif mencari')); return; }
          isWatchingGPS = true;
          btnSettings.classList.add('gps-sampling');
          btnSettings.disabled = true;
          let samples = [];
          const MAX_SAMPLES = 18; const MIN_SAMPLES = 5; const TARGET_ACCURACY = 5; const TIMEOUT = 15000;
          let watchId = null;
          const timeoutHandle = setTimeout(() => { stopWatch(new Error(`Timeout 15 detik. Menggunakan ${samples.length} sampel.`)); }, TIMEOUT);
          const stopWatch = (error = null) => {
            if (!isWatchingGPS) return;
            navigator.geolocation.clearWatch(watchId);
            clearTimeout(timeoutHandle);
            isWatchingGPS = false;
            btnSettings.classList.remove('gps-sampling');
            btnSettings.disabled = false;
            btnSettings.innerHTML = '📍';
            if (samples.length === 0) {
              if (error) reject(error); else reject(new Error('Gagal mendapatkan sampel GPS.'));
              return;
            }
            let totalWeight = 0; let weightedLat = 0; let weightedLon = 0; let bestAccuracy = 999;
            for (const s of samples) {
              const w = 1.0 / (s.accuracy * s.accuracy); 
              weightedLat += s.latitude * w; weightedLon += s.longitude * w; totalWeight += w;
              if (s.accuracy < bestAccuracy) bestAccuracy = s.accuracy;
            }
            const finalLat = weightedLat / totalWeight; const finalLon = weightedLon / totalWeight; const finalAccuracy = bestAccuracy; 
            const result = { lat: finalLat, lon: finalLon, acc: +finalAccuracy.toFixed(1), n: samples.length };
            if (error) { showToast(error.message, 0.5); resolve(result); } else { resolve(result); }
          };
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              const { latitude, longitude, accuracy } = pos.coords;
              if (!accuracy || accuracy < 1) return;
              samples.push({ latitude, longitude, accuracy });
              btnSettings.innerHTML = `📡 ${samples.length}`;
              updateGPSUI(`GPS: ±${accuracy.toFixed(1)}m`, accuracy);
              if (accuracy <= TARGET_ACCURACY && samples.length >= MIN_SAMPLES) { stopWatch(); } 
              else if (samples.length >= MAX_SAMPLES) { stopWatch(); }
            },
            (err) => { stopWatch(new Error(`GPS Error: ${err.message}`)); },
            { enableHighAccuracy: true, maximumAge: 0 }
          );
        });
      }

      async function handleGPSButton() {
        if (isWatchingGPS) return;
        btnSettings.innerHTML = '📡'; btnSettings.disabled = true; updateGPSUI('GPS: Mencari...', 999);
        try {
          const gpsResult: any = await getPreciseGPS();
          const { lat, lon, acc, n } = gpsResult;
          lastGPS = { koordinat: `${lat.toFixed(6)},${lon.toFixed(6)}`, akurasi: acc, n: n };
          lokasiInput.value = lastGPS.koordinat; ovLokasi.textContent = lastGPS.koordinat;
          const gpsText = `GPS: ±${acc}m (n=${n})`; updateGPSUI(gpsText, acc); showToast(`✅ GPS presisi diperoleh ${gpsText}`, 1);
          addMapMarker(lat, lon, `Posisi saat ini (${gpsText})`);
        } catch (err) {
          console.error(err); showToast(`GPS Gagal: ${err.message}`, 0); updateGPSUI('GPS: Gagal', 999);
          btnSettings.innerHTML = '📍'; btnSettings.disabled = false;
        }
      }

      function startAutoGPSWatcher() {
        if (!navigator.geolocation) return;
        navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            if (!accuracy || accuracy > 50) return;
            lastGPS = { koordinat: `${latitude.toFixed(6)},${longitude.toFixed(6)}`, akurasi: accuracy.toFixed(1) as any, n: 1 };
            lokasiInput.value = lastGPS.koordinat; ovLokasi.textContent = lastGPS.koordinat; updateGPSUI(`GPS: ±${accuracy.toFixed(0)}m`, accuracy);
          },
          (err) => { console.warn("Auto GPS error:", err); updateGPSUI("GPS: Gagal", 999); },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
        );
      }

      function syncFromRange(){
        const v = parseInt(tinggiRange.value,10); tinggiInput.value = v as any; tinggiValueDisplay.textContent = v as any; ovTinggi.textContent = v as any;
      }
      function syncFromInput(){
        let v = parseInt(tinggiInput.value,10); if(isNaN(v)) v = 10; v = Math.max(10, Math.min(300, v));
        tinggiInput.value = v as any; tinggiRange.value = v as any; tinggiValueDisplay.textContent = v as any; ovTinggi.textContent = v as any;
      }
      tinggiRange.addEventListener('input', syncFromRange);
      tinggiInput.addEventListener('change', syncFromInput);
      syncFromInput();

      function initQuick(){
        const c = document.getElementById('quickContainer');
        c.querySelectorAll('.tag').forEach(tag=>{
          tag.addEventListener('click', ()=>{
            tag.classList.toggle('on');
            const sel = [...c.querySelectorAll('.tag.on')].map((t: any)=>t.dataset.value);
            jenisInput.value = sel.join(', ');
            ovJenis.textContent = jenisInput.value || '-';
          });
        });
        jenisInput.value = "Akasia"; ovJenis.textContent = "Akasia";
      }
      initQuick();

      function toggleSheet(){ sheet.classList.toggle('visible'); }

      function initMap(){
        map = L.map('map').setView([0,110], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:"© OpenStreetMap"}).addTo(map);
        markersLayer = L.layerGroup().addTo(map);
        refreshMarkers();
      }
      function addMapMarker(lat,lon, label, color="#22c55e"){
        if(!markersLayer) return;
        const m = L.circleMarker([lat,lon],{ radius:8, color:color, fillColor:color, fillOpacity:.8 });
        m.addTo(markersLayer).bindPopup(label||"");
      }
      async function refreshMarkers(){
        if(!markersLayer) return;
        markersLayer.clearLayers();
        await db.monitoring.each(d => {
          const p = parseLatLon(d.koordinat); if(!p) return;
          const color = d.kesehatan==="Sehat" ? "#22c55e" : (d.kesehatan==="Merana" ? "#f59e0b" : "#ef4444");
          const fotoUrl = URL.createObjectURL(d.foto);
          const html = `<b>${d.jenis||'-'}</b><br>ID: ${d.id}<br>Tinggi: ${d.tinggi}cm<br>Lok: ${d.lokasi}<br><img src="${fotoUrl}" style="width:140px;margin-top:6px;border-radius:6px"/>`;
          addMapMarker(p.lat,p.lon, html, color);
        });
      }

      function initCharts() {
        const ctxS = document.getElementById('chartScatter') as HTMLCanvasElement;
        const ctxH = document.getElementById('chartHist') as HTMLCanvasElement;
        const ctxHe = document.getElementById('chartHealth') as HTMLCanvasElement;
        scatterChart = new Chart(ctxS, {
          type: 'scatter',
          data: { datasets: [{ label: 'Tinggi vs Tahun Tanam', data: [], pointRadius: 6, borderWidth: 1, borderColor: '#ffffff', backgroundColor: (context) => {
            const d = context.raw || {};
            if (d.kesehatan === 'Sehat') return '#22c55e'; if (d.kesehatan === 'Merana') return '#f59e0b'; if (d.kesehatan === 'Mati') return '#ef4444';
            return '#3b82f6';
          }}] },
          options: { scales: { x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Tahun Tanam' }, min: 2023, max: 2027, ticks: { stepSize: 1, format: { maximumFractionDigits: 0 } } }, y: { title: { display: true, text: 'Tinggi (cm)' } } } }
        });
        histChart = new Chart(ctxH, {
          type: 'bar',
          data: { labels: [], datasets: [{ label: 'Jumlah Tanaman', data: [], backgroundColor: '#3b82f6' }] },
          options: { scales: { x: { title: { display: true, text: 'Rentang Tinggi (cm)' } }, y: { beginAtZero: true, title: { display: true, text: 'Jumlah' } } } }
        });
        healthChart = new Chart(ctxHe, {
          type: 'bar',
          data: { labels: ['Sehat', 'Merana', 'Mati'], datasets: [{ label: 'Jumlah Tanaman', data: [0, 0, 0], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'] }] },
          options: { scales: { y: { beginAtZero: true, title: { display: true, text: 'Jumlah' } } } }
        });
        refreshCharts();
      }
      async function refreshCharts() {
        const allData = await db.monitoring.toArray();
        const pts = allData.filter(d => d.tahun && d.tinggi).map(d => ({ x: +d.tahun, y: +d.tinggi, kesehatan: d.kesehatan }));
        if (scatterChart) { scatterChart.data.datasets[0].data = pts; scatterChart.update(); }
        const heights = allData.map(d => +d.tinggi).filter(Boolean);
        const bins = [0, 50, 100, 150, 200, 250, 300]; const counts = new Array(bins.length - 1).fill(0);
        heights.forEach(h => { for (let i = 0; i < bins.length - 1; i++) { if (h > bins[i] && h <= bins[i + 1]) { counts[i]++; break; } } });
        const labels = bins.slice(0, -1).map((b, i) => `${bins[i] + 1}-${bins[i + 1]}`);
        if (histChart) { histChart.data.labels = labels; histChart.data.datasets[0].data = counts; histChart.update(); }
        const healthCounts = { Sehat: 0, Merana: 0, Mati: 0 };
        allData.forEach(d => { if (healthCounts[d.kesehatan] !== undefined) healthCounts[d.kesehatan]++; });
        if (healthChart) { healthChart.data.datasets[0].data = [ healthCounts.Sehat, healthCounts.Merana, healthCounts.Mati ]; healthChart.update(); }
      }

      function analyzeHSV(imgData){
        const {data:arr,width,height} = imgData;
        let r=0,g=0,b=0,c=0;
        for(let y=0;y<height;y+=4){
          for(let x=0;x<width;x+=4){
            const i=(y*width+x)*4; r+=arr[i]; g+=arr[i+1]; b+=arr[i+2]; c++;
          }
        }
        r=Math.round(r/c); g=Math.round(g/c); b=Math.round(b/c);
        const mx=Math.max(r,g,b)/255, diff=mx-Math.min(r,g,b)/255;
        let h=0; let s = mx===0?0:diff/mx; let v=mx;
        if(diff!=0){
          const rr=r/255, gg=g/255, bb=b/255;
          if(mx===rr){ h=60*(((gg-bb)/diff)%6); } else if(mx===gg){ h=60*(((bb-rr)/diff)+2); } else { h=60*(((rr-gg)/diff)+4); }
        }
        if(h<0) h+=360;
        let label="Sehat";
        if(v<0.25 || (h>0 && h<25)) label="Mati (Level 1)"; else if((h>=25 && h<=65) && v>0.25) label="Merana (Level 2)"; else label = "Baik (Level 4)";
        return {h:Math.round(h), s:+s.toFixed(2), v:+v.toFixed(2), label};
      }

      function insertExif(dataUrl, meta){
        if(typeof piexif === 'undefined'){ console.warn('piexif not loaded'); return dataUrl; }
        try{
          const ts = meta.timestamp;
          const exifTime = ts.getFullYear()+":"+pad(ts.getMonth()+1)+":"+pad(ts.getDate())+" "+pad(ts.getHours())+":"+pad(ts.getMinutes())+":"+pad(ts.getSeconds());
          const gps = {}; const ll = parseLatLon(meta.koordinat||"");
          if(ll){
            gps[piexif.GPSIFD.GPSLatitudeRef] = ll.lat<0? "S":"N"; gps[piexif.GPSIFD.GPSLatitude] = toDMS(ll.lat);
            gps[piexif.GPSIFD.GPSLongitudeRef] = ll.lon<0? "W":"E"; gps[piexif.GPSIFD.GPSLongitude] = toDMS(ll.lon);
            gps[piexif.GPSIFD.GPSMapDatum] = "WGS-84";
            if(meta.akurasi){ const dop = Math.max(0, Math.min(10000, Math.round(parseFloat(meta.akurasi)*100))); gps[piexif.GPSIFD.GPSDOP] = [dop,100]; }
          }
          const comment = `ID:${meta.id}; Tinggi:${meta.tinggi}cm; Jenis:${meta.jenis}; Lokasi:${meta.koordinat}; Pengawas:${meta.pengawas||''}`;
          const exifObj = {
            "0th": { [piexif.ImageIFD.Make]: brand, [piexif.ImageIFD.Model]: "Web Camera", [piexif.ImageIFD.Software]: "v10_Mockup", [piexif.ImageIFD.DateTime]: exifTime, [piexif.ImageIFD.Orientation]: 1 },
            "Exif": { [piexif.ExifIFD.DateTimeOriginal]: exifTime, [piexif.ExifIFD.DateTimeDigitized]: exifTime, [piexif.ExifIFD.UserComment]: piexif.helper.encodeText(comment) },
            "GPS": gps
          };
          const exifStr = piexif.dump(exifObj); return piexif.insert(exifStr, dataUrl);
        }catch(e){ console.warn("EXIF insert failed:", e); return dataUrl; }
      }

      async function capture(){
        if(!video.videoWidth){ showToast("Video belum siap",0); return; }
        let tahun = parseInt(tahunInput.value, 10); const tahunSekarang = new Date().getFullYear(); const minTahun = 2023; const maxTahun = 2027;
        if (isNaN(tahun)) { tahun = Math.max(minTahun, Math.min(maxTahun, tahunSekarang)); showToast(`Tahun tanam diset ke tahun sekarang: ${tahun}`, 0.8); } 
        else if (tahun < minTahun) { tahun = minTahun; showToast(`Tahun tanam diset ke minimum: ${tahun}`, 0.8); } 
        else if (tahun > maxTahun) { tahun = maxTahun; showToast(`Tahun tanam diset ke maksimum: ${tahun}`, 0.8); }
        tahunInput.value = tahun as any;
        if (lastGPS.akurasi > 10) { showToast(`Akurasi kurang bagus (${lastGPS.akurasi}m). Tetap disimpan.`, 0.5); }
        const id = genId(); const tinggi = parseInt(tinggiInput.value||tinggiRange.value,10) || 10;
        if(tinggi<=0){ showToast("Tinggi tidak valid",0); return; }
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d'); ctx.drawImage(video,0,0,canvas.width,canvas.height);
        const sample = ctx.getImageData(0,0,canvas.width,canvas.height); const hsv = analyzeHSV(sample);
        kesehatanInput.value = kesehatanInput.value || hsv.label; ovHealth.textContent = hsv.label;
        const margin=20, lh=Math.max(18, Math.round(canvas.height*0.022));
        ctx.font = `bold ${lh}px sans-serif`; ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.lineWidth = Math.max(3, Math.round(lh*0.15));
        const tanggal = new Date().toLocaleString('id-ID');
        const lines = [ `Lokasi: ${lokasiInput.value||lastGPS.koordinat||'-'}`, `Tinggi: ${tinggi} cm`, `Jenis: ${jenisInput.value||'-'}`, `Koordinat: ${lastGPS.koordinat||'-'}`, `Akurasi: ±${lastGPS.akurasi||'-'} m (n=${lastGPS.n})`, `Tanggal: ${tanggal}` ];
        lines.forEach((t,i)=>{ const y = canvas.height - margin - (lines.length-1-i)*(lh+8); ctx.strokeText(t, margin, y); ctx.fillText(t, margin, y); });
        const w = ctx.measureText(brand).width; ctx.strokeText(brand, canvas.width - margin - w, margin+lh); ctx.fillText(brand, canvas.width - margin - w, margin+lh);
        let dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const thumbUrl = canvas.toDataURL('image/jpeg', 0.1); lastPhotoThumb.src = thumbUrl;
        dataUrl = insertExif(dataUrl, { id, tinggi, jenis: jenisInput.value, koordinat: lastGPS.koordinat, akurasi: lastGPS.akurasi, pengawas: pengawasInput.value, timestamp: new Date() });
        const fotoBlob = dataURLtoBlob(dataUrl);
        try{ const a = document.createElement('a'); a.href = URL.createObjectURL(fotoBlob); a.download = `foto_${safeFilename(id)}.jpg`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 1000); }catch(e){ console.warn("Auto download gagal:", e); }
        const entry = { id, tanggal, lokasi: lokasiInput.value||lastGPS.koordinat||"", pekerjaan: "", tahun: tahun, jenis: jenisInput.value||"", tim: "", tinggi, kesehatan: kesehatanInput.value||hsv.label, koordinat: lastGPS.koordinat||"", akurasi: lastGPS.akurasi, n: lastGPS.n, x: parseLatLon(lastGPS.koordinat||"")?.lon || "", y: parseLatLon(lastGPS.koordinat||"")?.lat || "", pengawas: pengawasInput.value||"", vendor: vendorInput.value||"", foto: fotoBlob, statusUpload: 'pending' };
        await db.monitoring.add(entry); await updateUICounters(); await Promise.all([ refreshMarkers(), refreshCharts(), renderReview(), updateCapacityAnalysis() ]);
        if(navigator.vibrate) navigator.vibrate(30); showToast("Foto tersimpan (offline)",1);
        captureCountForZip++; if(captureCountForZip % 10 === 0){ autoZipNow(); }
      }

      async function updateUICounters() {
        const count = await db.monitoring.count(); ovCount.textContent = count as any;
        const pct = Math.min(100, (count / goalTarget) * 100);
        chipGoalText.textContent = `Target ${goalTarget} • ${count} selesai`;
        (goalBarFill as HTMLElement).style.width = pct + '%';
        if (pct >= 100) { (goalBarFill as HTMLElement).style.backgroundColor = 'var(--warn)'; } else { (goalBarFill as HTMLElement).style.backgroundColor = 'var(--accent)'; }
      }

      async function renderReview(){
        reviewFoto.innerHTML = '';
        const reviewData = await db.monitoring.orderBy('idx').reverse().limit(8).toArray();
        reviewData.forEach(d=>{
          const img=document.createElement('img'); const url = URL.createObjectURL(d.foto); img.src = url;
          img.style.width='100%'; img.style.height='90px'; img.style.objectFit='cover'; img.style.borderRadius='8px';
          reviewFoto.appendChild(img);
        });
        if (reviewData.length > 0) { const lastImg = reviewFoto.querySelector('img') as HTMLImageElement; if (lastImg) { lastPhotoThumb.src = lastImg.src; } }
      }


      async function buildCSV(){
        let csv = "ID,Tanggal,Lokasi,Tinggi,Koordinat,X,Y,Jenis,Tahun,Pengawas,Vendor,Kesehatan,Akurasi,GPS_Sampel,StatusUpload\n"; 
        const allData = await db.monitoring.toArray();
        allData.forEach(d=>{ csv += `"${d.id}","${d.tanggal}","${d.lokasi}",${d.tinggi},"${d.koordinat}",${d.x},${d.y},"${d.jenis}","${d.tahun}","${d.pengawas||''}","${d.vendor||''}","${d.kesehatan}","${d.akurasi}","${d.n || 1}","${d.statusUpload}"\n`; });
        return csv;
      }
      async function exportCSV(){
        const dataCount = await db.monitoring.count(); if(!dataCount){ showToast("Tidak ada data",0); return; }
        const csv = await buildCSV(); saveAs(new Blob([csv], {type:'text/csv;charset=utf-8;'}), 'monitoring.csv'); showToast("CSV diunduh",1);
      }
      async function exportZIP(filename='monitoring_images.zip'){
        const dataCount = await db.monitoring.count(); if(!dataCount){ showToast("Tidak ada data",0); return; }
        const zip = new JSZip(); const csv = await buildCSV(); const allData = await db.monitoring.toArray();
        allData.forEach((d,i)=>{ if(d.foto){ zip.file(`images/foto_${i+1}_${safeFilename(d.id)}.jpg`, d.foto); } });
        zip.file("data.csv", csv); const blob = await zip.generateAsync({type:'blob'}); saveAs(blob, filename); showToast("ZIP diunduh",1);
      }
      async function autoZipNow(){ const dataCount = await db.monitoring.count(); await exportZIP(`monitoring_batch_${Math.ceil(dataCount/10)}.zip`); }

      async function analyzeEcology(areaHa = 1.0, idealDensity = 625, idealSpacing = 4, spacingTolerance = 0.25) {
        const all = await db.monitoring.toArray(); const valid = all.filter(d => parseLatLon(d.koordinat) && d.kesehatan);
        if (valid.length === 0) { return { error: "Belum ada data untuk dianalisis." }; }
        const sehat = valid.filter(d => d.kesehatan.startsWith("Baik")); const merana = valid.filter(d => d.kesehatan.startsWith("Merana")); const mati = valid.filter(d => d.kesehatan.startsWith("Mati"));
        const N_sehat = sehat.length; const N_merana = merana.length; const N_mati = mati.length; const N_total = valid.length; const R_sehat_pct = (N_sehat / N_total) * 100;
        let CC = (N_sehat / areaHa) * (R_sehat_pct / 100); let CCI_pct = (CC / idealDensity) * 100; CCI_pct = Math.max(0, Math.min(100, CCI_pct));
        const SAMPLE_MAX = 100; const sample = valid.slice(); if (sample.length > SAMPLE_MAX) { for (let i = sample.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [sample[i], sample[j]] = [sample[j], sample[i]]; } sample.length = SAMPLE_MAX; }
        const distArr = [];
        for (let i = 0; i < sample.length - 1; i++) {
          for (let j = i + 1; j < sample.length; j++) {
            const a = parseLatLon(sample[i].koordinat); const b = parseLatLon(sample[j].koordinat); if (!a || !b) continue;
            const d = haversine(a.lat, a.lon, b.lat, b.lon); if (d <= 0 || d > 20000) continue; distArr.push(d);
          }
        }
        let meanDist = 0, sigma = 0, conformity_pct = 0;
        if (distArr.length > 0) { const sum = distArr.reduce((a, b) => a + b, 0); meanDist = sum / distArr.length; const variance = distArr.reduce((a, v) => a + Math.pow(v - meanDist, 2), 0) / distArr.length; sigma = Math.sqrt(variance); const minSpace = idealSpacing * (1 - spacingTolerance); const maxSpace = idealSpacing * (1 + spacingTolerance); const within = distArr.filter(d => d >= minSpace && d <= maxSpace); conformity_pct = (within.length / distArr.length) * 100; }
        const accs = valid.map(v => v.akurasi).filter(a => a && a < 100).sort((a, b) => a - b);
        const medianAcc = accs.length ? (accs.length % 2 === 0 ? (accs[accs.length/2-1] + accs[accs.length/2])/2 : accs[Math.floor(accs.length/2)]) : 0;
        const issues = []; if (medianAcc > 10) issues.push("Akurasi GPS rendah (>10m)"); if (conformity_pct < 50) issues.push("Sebaran tanaman tidak seragam"); if (R_sehat_pct < 60) issues.push("Banyak tanaman tidak sehat"); if (CCI_pct < 40) issues.push("Kapasitas ekologi rendah");
        return { N_total, N_sehat, N_merana, N_mati, R_sehat_pct, CC, CCI_pct, meanDist, sigma, conformity_pct, medianAcc, issues, sampleSize: sample.length };
      }

      async function updateCapacityAnalysis() {
        if (!ccResultEl) return; ccResultEl.innerHTML = `<span class="muted">Menganalisis data...</span>`;
        try {
          const r: any = await analyzeEcology(1.0, 625, 4, 0.25);
          if (r.error) { ccResultEl.innerHTML = `<span class="muted">${r.error}</span>`; return; }
          let barColor = 'var(--danger)'; let grade = 'Buruk';
          if (r.CCI_pct >= 80) { barColor = 'var(--accent)'; grade = 'Optimal'; } else if (r.CCI_pct >= 60) { barColor = 'var(--warn)'; grade = 'Baik'; } else if (r.CCI_pct >= 40) { barColor = '#3b82f6'; grade = 'Cukup'; }
          const issueHTML = r.issues && r.issues.length ? `<div class="row" style="color:var(--danger);">⚠️ ${r.issues.join('; ')}</div>` : `<div class="row" style="color:var(--accent);">✅ Tidak ada anomali signifikan</div>`;
          ccResultEl.innerHTML = `
            <div class="row">🌱 ${r.N_sehat} sehat • ⚠️ ${r.N_merana} merana • ❌ ${r.N_mati} mati</div>
            <div class="row">💚 Rasio Sehat: ${r.R_sehat_pct.toFixed(1)}%</div>
            <div class="progress-bar-container" title="Efisiensi: ${r.CCI_pct.toFixed(1)}%">
              <div class="progress-bar" style="width: ${r.CCI_pct.toFixed(1)}%; background-color: ${barColor};"></div>
            </div>
            <div class="row">📈 Kapasitas: <b>${r.CC.toFixed(0)}</b> pohon/ha</div>
            <div class="row">🔢 Efisiensi: ${r.CCI_pct.toFixed(1)}% (${grade})</div>
            <div class="hr"></div>
            <div class="row">📏 Jarak (n=${r.sampleSize} sampel): ${r.meanDist.toFixed(1)} m (σ ${r.sigma.toFixed(1)})</div>
            <div class="row">✅ Kesesuaian: ${r.conformity_pct.toFixed(1)}% (antara ${ (4*(1-0.25)).toFixed(1) } - ${ (4*(1+0.25)).toFixed(1) } m)</div>
            <div class="row">📡 Median Akurasi: ${r.medianAcc.toFixed(1)} m</div>
            ${issueHTML}
          `;
        } catch (e) { console.error("Gagal menganalisis ekologi:", e); ccResultEl.innerHTML = `<span class="muted" style="color: var(--danger);">Error: ${e.message}</span>`; }
      }

      function checkCompatibility() {
        let issues = []; if (!navigator.mediaDevices?.getUserMedia) { issues.push("Fitur kamera tidak didukung/diblokir."); } if (!navigator.geolocation) { issues.push("Fitur GPS tidak didukung/diblokir."); }
        if (typeof(Dexie) === 'undefined') { issues.push("Database Dexie gagal dimuat (perlu internet)."); }
        if (typeof(L) === 'undefined') { issues.push("Peta Leaflet gagal dimuat (perlu internet)."); }
        if (typeof(Chart) === 'undefined') { issues.push("Grafik Chart.js gagal dimuat (perlu internet)."); }
        if (!window.isSecureContext) {
            if (location.protocol === 'file:') { issues.push("Aplikasi tidak bisa dibuka dari 'file:///'. Harap gunakan server lokal (localhost)."); } 
            else if (location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') { issues.push("Kamera & GPS memerlukan koneksi aman (HTTPS) atau 'localhost'. Membuka via 'http://' (selain localhost) tidak diizinkan."); }
        }
        if (issues.length > 0) { const errorMsg = "Peringatan Kompatibilitas:\n- " + issues.join("\n- "); alert(errorMsg + "\n\nMohon buka aplikasi ini melalui server HTTPS atau 'localhost' untuk menggunakan kamera dan GPS."); }
      }

      // ============ Events ============
      btnSettings.addEventListener('click', handleGPSButton);
      btnGallery.addEventListener('click', toggleSheet);
      btnFlipCamera.addEventListener('click', flipCamera);
      btnCapture.addEventListener('click', capture);
      document.addEventListener('keydown', (e)=>{ if(e.key==="Enter") capture(); });
      document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
      document.getElementById('btnExportZIP').addEventListener('click', ()=>exportZIP());
      document.getElementById('dlCSV').addEventListener('click', (e)=>{e.preventDefault(); exportCSV();});
      document.getElementById('dlZIP').addEventListener('click', (e)=>{e.preventDefault(); exportZIP();});
      handle.addEventListener('click', toggleSheet);

      // ============ Init ============
      (async function init(){
        checkCompatibility(); startAutoGPSWatcher();
        try{
          await listCameras(); initMap(); initCharts(); await updateUICounters(); await updateCapacityAnalysis();
          await renderReview();
        }catch(e){ console.error(e); }
      })();
    };

    startV2Logic();

    return () => {
      // Cleanup logic if necessary (though logic is verbatim)
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black animate-fadeIn overflow-hidden">
      {/* Scope the V2 Styles */}
      <style>{`
        .v2-app-scope {
          --bg:#0b0f1a; --surface:#111827; --muted:#6b7280; --text:#e5e7eb;
          --accent:#22c55e; --danger:#ef4444; --warn:#f59e0b;
          --green-bg: rgba(1, 43, 23, 0.75); 
          --green-border: rgba(34, 197, 94, 0.4);
          height:100%; width:100%; margin:0; background:#000; color:var(--text); font-family:Inter,system-ui,sans-serif; position:relative;
        }
        .v2-app-scope .app{position:fixed;inset:0;display:flex;flex-direction:column}
        .v2-app-scope .camera-wrap{position:relative;flex:1;background:#000;display:flex;align-items:center;justify-content:center}
        .v2-app-scope video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
        .v2-app-scope canvas#canvas{display:none}
        .v2-app-scope .map-pin { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%); font-size: 48px; z-index: 10; color: #ef4444; text-shadow: 0 2px 4px rgba(0,0,0,0.5); pointer-events: none; }
        .v2-app-scope .toolbar{position:absolute;bottom:18px;left:0;right:0;display:flex;justify-content:center;gap:12px;z-index:20;align-items:center}
        .v2-app-scope .fab{width:70px;height:70px;border-radius:50%;border:6px solid rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;}
        .v2-app-scope .fab::after{content:"";width:100%;height:100%;background:#fff;border-radius:50%;transition:.1s transform;display:block;}
        .v2-app-scope .fab:active::after{transform:scale(.9)}
        .v2-app-scope .btn{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);backdrop-filter:blur(6px);color:#fff;border-radius:14px;padding:10px 14px;cursor:pointer}
        .v2-app-scope .btn.round{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px; transition: background-color 0.3s, color 0.3s;}
        .v2-app-scope #btnLastPhoto { padding: 0; width: 52px; height: 52px; border-radius: 50%; overflow: hidden; border: 2px solid #fff; background: #333; }
        .v2-app-scope #lastPhotoThumb { width: 100%; height: 100%; object-fit: cover; }
        .v2-app-scope .header { position: absolute; top: 12px; left: 0; right: 0; text-align: center; font-size: 14px; font-weight: 600; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); z-index: 21; pointer-events: none; }
        .v2-app-scope .topbar{position:absolute;top: 40px;left:12px;right:12px;display:flex;justify-content:space-between;gap:8px;z-index:20;flex-wrap:wrap}
        .v2-app-scope .chip{background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:8px 12px;font-size:13px;margin-top:4px; transition: background-color 0.3s;}
        .v2-app-scope #chipGPS { display: flex; align-items: center; gap: 6px; }
        .v2-app-scope #chipGPS .dot { width: 10px; height: 10px; border-radius: 50%; background-color: var(--muted); transition: background-color 0.3s; }
        .v2-app-scope #chipGPS.gps-good .dot { background-color: var(--accent); }
        .v2-app-scope #chipGPS.gps-medium .dot { background-color: var(--warn); }
        .v2-app-scope #chipGPS.gps-bad .dot { background-color: var(--danger); }
        .v2-app-scope .chip#chipGoal { min-width: 130px; padding: 6px 12px; }
        .v2-app-scope #chipGoalText { font-size: 12px; }
        .v2-app-scope .goal-bar { width: 100%; height: 5px; background: rgba(255,255,255,0.2); border-radius: 99px; margin-top: 4px; overflow: hidden; position:relative; }
        .v2-app-scope #goalBarFill { display: block; height: 100%; width: 0%; background: var(--accent); border-radius: 99px; transition: width 0.5s; position:absolute; left:0; top:0; }
        .v2-app-scope .overlay{ position:absolute; left:10px; right:10px; bottom: 280px; z-index:15; background: var(--green-bg); border: 1px solid var(--green-border); backdrop-filter:blur(6px); padding:10px 14px; border-radius:12px; min-width:220px; cursor: default; }
        .v2-app-scope .overlay h4{margin:0 0 8px 0;font-size:15px; font-weight: 600; color: #fff;}
        .v2-app-scope .overlay .row{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,monospace;font-size:13px;line-height:1.6; color: #e0e0e0;}
        .v2-app-scope .overlay .row .label { color: #a0a0a0; }
        .v2-app-scope .overlay .row .value { color: #fff; font-weight: 500; }
        .v2-app-scope .height-wrap{position:absolute;left:0;right:0;bottom: 150px;display:flex;justify-content:center;z-index:14}
        .v2-app-scope .height-panel{width:min(520px,92%);background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:10px 14px}
        .v2-app-scope #tinggiRange{width:100%}
        .v2-app-scope .value{font-weight:700}
        .v2-app-scope .quick{ position:absolute; left:0; right:0; bottom: 220px; display:flex; gap:10px; justify-content:center; z-index:13; pointer-events:none; padding: 0 10px; overflow-x: auto; justify-content: flex-start; }
        .v2-app-scope .quick::-webkit-scrollbar { display: none; }
        .v2-app-scope .quick { -ms-overflow-style: none; scrollbar-width: none; }
        .v2-app-scope .quick .tag{ pointer-events:auto; padding:8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.12); user-select:none; cursor:pointer; font-size: 14px; flex-shrink: 0; color: #fff; }
        .v2-app-scope .tag.on{ background:var(--accent); color:#052e12; border-color:var(--accent); font-weight:700; }
        .v2-app-scope .sheet{position:fixed;left:0;right:0;bottom:0;height:80vh;background:var(--surface);border-top-left-radius:18px;border-top-right-radius:18px;box-shadow:0 -8px 32px rgba(0,0,0,.45);transform:translateY(100%);transition:.35s transform;z-index:30;display:flex;flex-direction:column}
        .v2-app-scope .sheet.visible{transform:translateY(0)}
        .v2-app-scope .handle{padding:8px;text-align:center;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer}
        .v2-app-scope .handle .bar{width:50px;height:5px;margin:0 auto;border-radius:3px;background:#374151}
        .v2-app-scope .sheet-content{flex:1;overflow:auto;padding:14px;display:grid;grid-template-columns:1fr;gap:14px}
        .v2-app-scope .card{background:#0f172a;border:1px solid #1f2937;border-radius:14px;padding:12px}
        .v2-app-scope .card h3{margin:0 0 8px 0;font-size:16px; color: #fff;}
        .v2-app-scope .grid-2{display:grid;grid-template-columns:1fr;gap:12px}
        @media(min-width:860px){.v2-app-scope .grid-2{grid-template-columns:1.2fr 1fr}}
        .v2-app-scope #map{width:100%;height:320px;border-radius:12px}
        .v2-app-scope .toast{position:fixed;right:14px;bottom:14px;background:#111827;color:#e5e7eb;border:1px solid #374151;border-radius:10px;padding:10px 12px;z-index:60;opacity:0;transform:translateY(8px);transition:.2s opacity,.2s transform}
        .v2-app-scope .toast.show{opacity:1;transform:translateY(0)}
        .v2-app-scope .progress{height:4px;background:#1f2937;border-radius:999px;overflow:hidden;margin-top:6px; position:relative;}
        .v2-app-scope .progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#22c55e,#3b82f6); position:absolute; left:0; top:0; }
        .v2-app-scope .hr{height:1px;background:#1f2937;margin:8px 0}
        .v2-app-scope .muted{color:#94a3b8}
        .v2-app-scope input[type="number"],.v2-app-scope input[type="text"]{width:100%;background:#0b1220;border:1px solid #1f2937;border-radius:10px;padding:10px;color:#e5e7eb;box-sizing: border-box;}
        .v2-app-scope label{font-size:12px;color:#9ca3af}
        .v2-app-scope .row-flex{display:grid;grid-template-columns:1fr;gap:10px}
        @media(min-width:500px){.v2-app-scope .row-flex{grid-template-columns:1fr 1fr}}
        .v2-app-scope .download-links a{display:block;padding:10px 12px;border:1px solid #1f2937;border-radius:10px;text-decoration:none;color:#e5e7eb;background:#0b1220;text-align:center}
        .v2-app-scope .gps-good { background-color: var(--accent) !important; color: #000 !important; }
        .v2-app-scope .gps-medium { background-color: var(--warn) !important; color: #000 !important; }
        .v2-app-scope .gps-bad { background-color: var(--danger) !important; color: #fff !important; }
        .v2-app-scope .btn.round.gps-sampling { font-size: 14px; font-weight: bold; color: #000; background-color: var(--warn); }
        .v2-app-scope #ccResult .row { font-family: ui-monospace, monospace; line-height: 1.6; font-size: 13px; }
        .v2-app-scope .progress-bar-container {width: 100%;height: 10px;background-color: #1f2937;border-radius: 5px;overflow: hidden;margin: 8px 0; position:relative;}
        .v2-app-scope .progress-bar {height: 100%;border-radius: 5px;transition: width 0.5s ease-out, background-color 0.5s; position:absolute; left:0; top:0;}
        .v2-app-scope #btnBackToMain { position:absolute; top:12px; left:12px; z-index:100; width:40px; height:40px; border-radius:50%; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); color:#fff; display:flex; items-center; justify-content:center; }
        @keyframes scan { 0% { top: 10%; opacity: 0.8; } 50% { top: 90%; opacity: 1; } 100% { top: 10%; opacity: 0.8; } }
      `}</style>

      <div className="v2-app-scope">
        <button id="btnBackToMain" onClick={onClose} title="Back to Dashboard">
          <i className="fas fa-chevron-left"></i>
        </button>

        <div className="app">
          <div className="camera-wrap">
            <video id="video" autoPlay playsInline></video>
            <canvas id="canvas"></canvas>
            
            <div className="map-pin">📍</div>
            
            <div className="header">PT Energi Batubara Lestari</div>

            <div className="topbar">
              <div className="chip" id="chipGPS" title="Akurasi GPS terakhir">
                <span className="dot"></span>
                <span id="chipGPSText">GPS: -</span>
              </div>
              <div className="chip" id="chipGoal" title="Target harian">
                <div id="chipGoalText">Target 100 • 0 selesai</div>
                <div className="goal-bar"><i id="goalBarFill"></i></div>
              </div>
            </div>

            <div className="overlay" id="overlayInfo">
              <h4>Data Tanaman</h4>
              <div className="row"><span className="label">Lokatik:</span> <span id="ovLokasi" className="value">-</span></div>
              <div className="row"><span className="label">Tinggi:</span> <span id="ovTinggi" className="value">10</span> cm</div>
              <div className="row"><span className="label">Jenis:</span> <span id="ovJenis" className="value">Akasia</span></div>
              <div className="row"><span className="label">Kesehatan:</span> <span id="ovHealth" className="value">-</span></div>
              <div className="row"><span className="label">Foto Lokal:</span> <span id="ovCount" className="value">0</span></div>
            </div>

            <div className="height-wrap">
              <div className="height-panel">
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px'}}>
                  <div><b style={{color:'#fff'}}>Tingih Tanaman</b> <span className="muted">(cm)</span></div>
                  <div className="value" id="tinggiValueDisplay" style={{color:'#fff'}}>10</div>
                </div>
                <input type="range" id="tinggiRange" min="10" max="300" step="1" defaultValue="10" aria-label="Tinggi (cm)" title="Geser untuk mengubah tinggi (10–300 cm)" />
              </div>
            </div>

            <div className="quick" id="quickContainer">
              <div className="tag on" data-value="Akasia">Akasia</div>
              <div className="tag" data-value="Sengon">Sengon</div>
              <div className="tag" data-value="Nangka">Nangka</div>
              <div className="tag" data-value="Mahoni">Mahoni</div>
              <div className="tag" data-value="Nangka">Nangka</div>
            </div>

            <div className="toolbar">
              <button className="btn round" id="btnLastPhoto" title="Foto Terakhir">
                <img id="lastPhotoThumb" src="" alt="Thumbnail foto terakhir" />
              </button>
              <button className="btn round" id="btnGallery" title="Buka Galeri & Analitik">☰</button>
              <div className="fab" id="btnCapture" title="Ambil Foto"></div>
              <button className="btn round" id="btnFlipCamera" title="Balik Kamera">🔄</button>
              <button className="btn round" id="btnSettings" title="Ambil Ulang GPS Presisi">📍</button>
            </div>
          </div>

          <div className="sheet" id="sheet">
            <div className="handle" id="handle"><div className="bar"></div></div>
            <div className="sheet-content">
              <div className="grid-2">
                <div className="card">
                  <h3>Data Monitoring</h3>
                  <div className="row-flex">
                    <div>
                      <label>Tinggi (cm)</label>
                      <input id="tinggi" type="number" min="10" max="300" step="1" defaultValue="10" placeholder="cth: 120" />
                    </div>
                    <div>
                      <label>Jenis Tanaman</label>
                      <input id="jenis" type="text" placeholder="Akasia/Sengon/..." />
                    </div>
                  </div>
                  <div className="row-flex" style={{marginTop:'10px'}}>
                    <div>
                      <label>Tahun Tanam</label>
                      <input id="tahun" type="number" min="2023" max="2027" placeholder="202X" />
                    </div>
                    <div>
                      <label>Lokasi (lat,lon)</label>
                      <input id="lokasi" type="text" placeholder="-2.12345, 113.12345" />
                    </div>
                  </div>
                  <div className="row-flex" style={{marginTop:'10px'}}>
                    <div>
                      <label>Pengawas</label>
                      <input id="pengawas" type="text" placeholder="Nama pengawas" />
                    </div>
                    <div>
                      <label>Vendor</label>
                      <input id="vendor" type="text" placeholder="Nama vendor" />
                    </div>
                  </div>
                  <div className="row-flex" style={{marginTop:'10px'}}>
                    <div>
                      <label>Kesehatan</label>
                      <input id="kesehatan" type="text" placeholder="Sehat/Merana/Mati" />
                    </div>
                  </div>
                  <div style={{display:'flex', gap:'10px', alignItems:'center', marginTop:'12px'}}>
                    <button className="btn" id="btnExportCSV">Export CSV</button>
                    <button className="btn" id="btnExportZIP">Export ZIP</button>
                  </div>
                  <div className="hr"></div>
                  <div className="muted" id="status">Status: siap</div>
                </div>

                <div className="card">
                  <h3>Peta Interaktif (Leaflet)</h3>
                  <div id="map"></div>
                </div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <h3>Scatter: Tinggi vs Tahun</h3>
                  <canvas id="chartScatter" height="220"></canvas>
                </div>
                <div className="card">
                  <h3>Distribusi Tinggi (Histogram)</h3>
                  <canvas id="chartHist" height="220"></canvas>
                </div>
              </div>

              <div className="card">
                <h3>Health Index (HSV)</h3>
                <canvas id="chartHealth" height="220"></canvas>
              </div>

              <div className="card">
                <h3>Analisis Ekologi Cerdas</h3>
                <div id="ccResult" className="muted">Memuat...</div>
              </div>

              <div className="card">
                <h3>Preview 8 Foto Terakhir</h3>
                <div id="reviewFoto" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:'8px'}}></div>
              </div>

              <div className="card">
                <h3>Unduhan Cepat</h3>
                <div className="download-links">
                  <a href="#" id="dlCSV">Download CSV</a>
                  <a href="#" id="dlZIP">Download ZIP (semua foto)</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="toast" id="toast">
          <div id="toastMsg">Siap.</div>
          <div className="progress"><i id="toastProg"></i></div>
        </div>
      </div>
    </div>
  );
};
