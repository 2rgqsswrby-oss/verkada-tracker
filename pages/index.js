import { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';

const TOTAL = 211;
const MODELS = ['CM42','CF83-E','CD63','CD63-E','CD43-E','CB52-E','CP52-E','CY53-E'];
const FLOORS = ['Exterior','1','2','3','4','5','6','7','8','9','10','11','12','14','15','16','17','18','19','Roof'];

const isComplete = (c) => c.name && c.floor && c.model && c.ip && c.switchName && c.switchPort && c.photoInstallUrl && c.screenshotViewUrl;

const statusOf = (c) => {
  if (isComplete(c)) return 'DONE';
  const n = ['name','floor','model','ip','switchName','switchPort'].filter(f => c[f]).length + (c.photoInstallUrl?1:0) + (c.screenshotViewUrl?1:0);
  return n === 0 ? 'PENDING' : 'IN PROG';
};

const S = {
  input: { background:'#1a1a1f', border:'1px solid #2a2a35', color:'#e0e0e0', padding:'8px 12px', borderRadius:4, fontSize:12, fontFamily:"'Share Tech Mono',monospace", outline:'none', width:'100%', boxSizing:'border-box' },
  sel: { background:'#1a1a1f', border:'1px solid #2a2a35', color:'#e0e0e0', padding:'7px 10px', borderRadius:4, fontSize:12, fontFamily:"'Share Tech Mono',monospace", cursor:'pointer' },
  btn: (bg, col, dis) => ({ background:dis?'#1a1a1f':bg, color:dis?'#444':col, border:'none', padding:'7px 14px', borderRadius:4, cursor:dis?'not-allowed':'pointer', fontWeight:700, fontSize:12, fontFamily:"'Share Tech Mono',monospace", opacity:dis?0.6:1 }),
};

function PhotoUpload({ cameraId, photoType, currentUrl, label, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [preview, setPreview] = useState(currentUrl || null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  useEffect(() => { setPreview(currentUrl || null); }, [currentUrl]);

  // Compress + resize image on canvas before upload.
  // Mobile camera shots can be 8-15MB; this brings them under 500KB
  // which safely clears Vercel's 4.5MB request body limit.
  const compressImage = (file) => new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1600; // max dimension px
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else                { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      // Always output JPEG for photos — smaller than PNG for camera shots
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset input immediately ONLY after capturing the file reference — safe on all browsers
    const inputEl = e.target;

    setUploading(true);
    setError('');
    setProgress('Compressing…');

    try {
      const { base64, mimeType } = await compressImage(file);
      setProgress('Uploading…');

      const res = await fetch('/api/cameras/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoData: base64, mimeType, photoType, id: cameraId }),
      });

      // Clear input only after fetch completes to avoid mobile file ref issues
      inputEl.value = '';

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      if (!data.url) throw new Error('No URL returned from server');

      setPreview(data.url);
      onUploaded(data.url);
    } catch (err) {
      setError(err.message || 'Upload failed — please try again');
      inputEl.value = '';
    } finally {
      setUploading(false);
      setProgress('');
    }
  };

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:10, color:'#555', marginBottom:6 }}>{label}</div>
      {preview ? (
        <div style={{ position:'relative' }}>
          <img src={preview} alt={label} style={{ width:'100%', borderRadius:6, border:'1px solid #2a2a35', maxHeight:160, objectFit:'cover', display:'block' }} />
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, opacity:0, transition:'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity=1}
            onMouseLeave={e => e.currentTarget.style.opacity=0}>
            <button onClick={() => inputRef.current.click()} style={{ background:'rgba(0,0,0,0.75)', border:'1px solid #fff', color:'#fff', padding:'6px 14px', borderRadius:4, cursor:'pointer', fontSize:12, fontFamily:"'Share Tech Mono',monospace", fontWeight:700 }}>REPLACE</button>
          </div>
          <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ color:'#00ff88', fontSize:11 }}>✓</span>
            <span style={{ fontSize:10, color:'#555' }}>Photo uploaded</span>
          </div>
        </div>
      ) : (
        <div onClick={() => !uploading && inputRef.current.click()}
          style={{ border:`1px dashed ${error ? '#ff5252' : '#2a2a35'}`, borderRadius:6, padding:'20px 12px', textAlign:'center', cursor:uploading?'default':'pointer', background:'#0f0f12' }}>
          {uploading ? (
            <div style={{ color:'#00ff88', fontSize:11 }}>
              <div style={{ marginBottom:6 }}>⏳</div>
              {progress}
            </div>
          ) : error ? (
            <>
              <div style={{ fontSize:18, marginBottom:6 }}>⚠️</div>
              <div style={{ fontSize:11, color:'#ff5252', marginBottom:4 }}>{error}</div>
              <div style={{ fontSize:10, color:'#555' }}>Tap to try again</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:20, marginBottom:6 }}>📷</div>
              <div style={{ fontSize:11, color:'#555' }}>Tap to upload or take photo</div>
              <div style={{ fontSize:10, color:'#333', marginTop:3 }}>Auto-compressed for fast upload</div>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
    </div>
  );
}

export default function Tracker() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [toast, setToast] = useState(null);
  const [csvModal, setCsvModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkCount, setBulkCount] = useState('5');
  const [bulkFloor, setBulkFloor] = useState('');
  const [bulkSwitch, setBulkSwitch] = useState('');
  const [bulkAdding, setBulkAdding] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [modelEditModal, setModelEditModal] = useState(false);
  const [bulkModel, setBulkModel] = useState('');
  const [applyingModel, setApplyingModel] = useState(false);
  const [bulkSwitch2, setBulkSwitch2] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    fetch('/api/cameras').then(r => r.json()).then(d => { setCameras(Array.isArray(d)?d:[]); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const addCamera = async () => {
    const res = await fetch('/api/cameras', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({}) });
    const cam = await res.json();
    setCameras(p => [...p, cam]);
    setEditing(cam.id);
  };

  const bulkAddCameras = async () => {
    const count = parseInt(bulkCount, 10);
    if (!count || count < 1 || count > 100) return;
    setBulkAdding(true);
    const created = [];
    for (let i = 0; i < count; i++) {
      const res = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor: bulkFloor, switchName: bulkSwitch }),
      });
      const cam = await res.json();
      created.push(cam);
    }
    setCameras(p => [...p, ...created]);
    setBulkAdding(false);
    setBulkModal(false);
    setBulkFloor('');
    setBulkSwitch('');
    setBulkCount('5');
    showToast(`${count} cameras added`);
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(prev => prev.size === visible.length ? new Set() : new Set(visible.map(c => c.id)));
  };

  const applyBulkEdit = async () => {
    if ((!bulkModel && !bulkSwitch2) || selected.size === 0) return;
    setApplyingModel(true);
    const ids = [...selected];
    await Promise.all(ids.map(id => {
      const cam = cameras.find(c => c.id === id);
      if (!cam) return Promise.resolve();
      const updated = {
        ...cam,
        ...(bulkModel   ? { model:      bulkModel   } : {}),
        ...(bulkSwitch2 ? { switchName: bulkSwitch2 } : {}),
      };
      setCameras(prev => prev.map(c => c.id === id ? updated : c));
      return fetch(`/api/cameras/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(updated) });
    }));
    const parts = [];
    if (bulkModel)   parts.push('model');
    if (bulkSwitch2) parts.push('switch');
    setApplyingModel(false);
    setModelEditModal(false);
    setSelected(new Set());
    setBulkModel('');
    setBulkSwitch2('');
    showToast(`${parts.join(' & ')} updated on ${ids.length} camera${ids.length !== 1 ? 's' : ''}`);
  };

  const deleteSelected = async () => {
    setDeletingSelected(true);
    const ids = [...selected];
    await Promise.all(ids.map(id => fetch(`/api/cameras/${id}`, { method:'DELETE' })));
    setCameras(prev => prev.filter(c => !selected.has(c.id)));
    if (ids.includes(editing)) setEditing(null);
    setSelected(new Set());
    setDeleteConfirmModal(false);
    setDeletingSelected(false);
    showToast(`${ids.length} camera${ids.length !== 1 ? 's' : ''} deleted`);
  };

  // updateLocalOnly: update React state only, used after photo uploads (DB already updated by upload API)
  const updateLocalOnly = (id, fields) => {
    setCameras(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  };

  const updateCamera = async (id, fields) => {
    const updated = cameras.map(c => c.id === id ? { ...c, ...fields } : c);
    setCameras(updated);
    const cam = updated.find(c => c.id === id);
    await fetch(`/api/cameras/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(cam) });
  };

  const deleteCamera = async (id) => {
    setCameras(p => p.filter(c => c.id !== id));
    if (editing === id) setEditing(null);
    await fetch(`/api/cameras/${id}`, { method:'DELETE' });
    showToast('Camera removed');
  };

  const exportCSV = () => {
    const H = ['Camera Name','Floor','Model','Serial Number','IP Address','Switch Name','Switch Port','Install Photo','Screenshot','Notes','Status'];
    const esc = v => '"' + (v||'').replace(/"/g,'""') + '"';
    const rows = cameras.map(c => [
      esc(c.name), esc(c.floor), esc(c.model), esc(c.serialNumber), esc(c.ip), esc(c.switchName), esc(c.switchPort),
      esc(c.photoInstallUrl ? 'Yes' : 'No'), esc(c.screenshotViewUrl ? 'Yes' : 'No'), esc(c.notes),
      esc(isComplete(c) ? 'Complete' : statusOf(c)==='IN PROG' ? 'In Progress' : 'Pending'),
    ].join(','));
    setCsvModal([H.map(h=>'"'+h+'"').join(','), ...rows].join('\n'));
    setCopied(false);
  };

  const copyCSV = async () => {
    try { await navigator.clipboard.writeText(csvModal); setCopied(true); setTimeout(()=>setCopied(false),2000); }
    catch { showToast('Select all text and copy manually'); }
  };

  const visible = useMemo(() => {
    let list = cameras;
    if (search) { const q=search.toLowerCase(); list=list.filter(c=>c.name.toLowerCase().includes(q)||c.ip.toLowerCase().includes(q)||c.switchName.toLowerCase().includes(q)||c.model.toLowerCase().includes(q)); }
    if (filterFloor !== 'all') list = list.filter(c => c.floor === filterFloor);
    if (filterStatus === 'done') list = list.filter(isComplete);
    if (filterStatus === 'pending') list = list.filter(c => statusOf(c)==='PENDING');
    if (filterStatus === 'in-progress') list = list.filter(c => statusOf(c)==='IN PROG');
    const floorIdx = f => FLOORS.indexOf(f) === -1 ? 999 : FLOORS.indexOf(f);
    return [...list].sort((a,b) => {
      if (sortBy==='floor')  return floorIdx(a.floor||'')-floorIdx(b.floor||'');
      if (sortBy==='status') return statusOf(a).localeCompare(statusOf(b));
      if (sortBy==='model')  return (a.model||'').localeCompare(b.model||'');
      if (sortBy==='ip')     return (a.ip||'').localeCompare(b.ip||'', undefined, {numeric:true});
      if (sortBy==='switch') return (a.switchName||'').localeCompare(b.switchName||'');
      if (sortBy==='port')   return (a.switchPort||'').localeCompare(b.switchPort||'', undefined, {numeric:true});
      return (a.name||'').localeCompare(b.name||'');
    });
  }, [cameras, search, filterFloor, filterStatus, sortBy]);

  const done = cameras.filter(isComplete).length;
  const pct = Math.round((done / TOTAL) * 100);
  const editCam = editing ? cameras.find(c => c.id === editing) : null;

  return (
    <>
      <Head>
        <title>Verkada Deployment Tracker</title>
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow:wght@700;900&display=swap" rel="stylesheet"/>
      </Head>

      {/* Bulk Add Modal */}
      {bulkModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#111116', border:'1px solid #2a2a35', borderRadius:8, width:'100%', maxWidth:400, padding:28 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:4 }}>BULK ADD CAMERAS</div>
            <div style={{ fontSize:11, color:'#555', marginBottom:20 }}>Creates multiple blank camera entries at once. You can fill in the remaining details after.</div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:10, color:'#555', marginBottom:4 }}>NUMBER OF CAMERAS</label>
              <input
                type="number" min="1" max="100"
                value={bulkCount}
                onChange={e => setBulkCount(e.target.value)}
                style={{ ...S.input, fontSize:18, fontWeight:700, textAlign:'center', padding:'10px' }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:10, color:'#555', marginBottom:4 }}>FLOOR (optional)</label>
              <select value={bulkFloor} onChange={e => setBulkFloor(e.target.value)} style={{ ...S.input }}>
                <option value="">— leave blank —</option>
                {FLOORS.map(f => <option key={f} value={f}>{f === 'Exterior' ? 'Exterior' : `Floor ${f}`}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:10, color:'#555', marginBottom:4 }}>SWITCH NAME (optional)</label>
              <input
                type="text"
                value={bulkSwitch}
                onChange={e => setBulkSwitch(e.target.value)}
                placeholder="e.g. IDF-3A"
                style={S.input}
              />
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={bulkAddCameras}
                disabled={bulkAdding || !bulkCount || parseInt(bulkCount) < 1}
                style={{ ...S.btn('#00ff88', '#000', bulkAdding || !bulkCount || parseInt(bulkCount) < 1), flex:1, padding:'10px', fontSize:13 }}
              >
                {bulkAdding ? `ADDING ${bulkCount} CAMERAS...` : `+ ADD ${bulkCount || '?'} CAMERAS`}
              </button>
              <button onClick={() => { setBulkModal(false); setBulkFloor(''); setBulkSwitch(''); setBulkCount('5'); }} style={S.btn('#1e1e24', '#aaa', false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Model Edit Modal */}
      {modelEditModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#111116', border:'1px solid #2a2a35', borderRadius:8, width:'100%', maxWidth:400, padding:28 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:4 }}>BULK EDIT — {selected.size} CAMERA{selected.size !== 1 ? 'S' : ''}</div>
            <div style={{ fontSize:11, color:'#555', marginBottom:20 }}>Fill in any fields to update. Leave blank to keep existing values.</div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:10, color:'#555', marginBottom:4 }}>CAMERA MODEL</label>
              <select value={bulkModel} onChange={e => setBulkModel(e.target.value)} style={{ ...S.input }} autoFocus>
                <option value="">— no change —</option>
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:10, color:'#555', marginBottom:4 }}>SWITCH NAME</label>
              <input
                type="text"
                value={bulkSwitch2}
                onChange={e => setBulkSwitch2(e.target.value)}
                placeholder="e.g. IDF-3A  (leave blank for no change)"
                style={S.input}
              />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={applyBulkEdit}
                disabled={applyingModel || (!bulkModel && !bulkSwitch2)}
                style={{ ...S.btn('#00ff88', '#000', applyingModel || (!bulkModel && !bulkSwitch2)), flex:1, padding:'10px', fontSize:13 }}
              >
                {applyingModel ? 'APPLYING...' : `APPLY TO ${selected.size} CAMERA${selected.size !== 1 ? 'S' : ''}`}
              </button>
              <button onClick={() => { setModelEditModal(false); setBulkModel(''); setBulkSwitch2(''); }} style={S.btn('#1e1e24', '#aaa', false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#111116', border:'1px solid #3a1a1a', borderRadius:8, width:'100%', maxWidth:400, padding:28 }}>
            <div style={{ fontSize:22, marginBottom:12, textAlign:'center' }}>⚠️</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#ff5252', marginBottom:8, textAlign:'center' }}>DELETE {selected.size} CAMERA{selected.size !== 1 ? 'S' : ''}?</div>
            <div style={{ fontSize:12, color:'#888', marginBottom:24, textAlign:'center', lineHeight:1.6 }}>
              This will permanently delete {selected.size} camera record{selected.size !== 1 ? 's' : ''} and cannot be undone.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={deleteSelected}
                disabled={deletingSelected}
                style={{ ...S.btn('#ff3d3d', '#fff', deletingSelected), flex:1, padding:'10px', fontSize:13 }}
              >
                {deletingSelected ? 'DELETING...' : `YES, DELETE ${selected.size} CAMERA${selected.size !== 1 ? 'S' : ''}`}
              </button>
              <button onClick={() => setDeleteConfirmModal(false)} disabled={deletingSelected} style={S.btn('#1e1e24', '#aaa', deletingSelected)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Modal */}
      {csvModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#111116', border:'1px solid #2a2a35', borderRadius:8, width:'100%', maxWidth:700, maxHeight:'80vh', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #2a2a35', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ color:'#fff', fontWeight:700, fontSize:14 }}>CSV EXPORT — {cameras.length} cameras</div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={copyCSV} style={S.btn(copied?'#003a1a':'#00ff88', copied?'#00ff88':'#000', false)}>{copied?'✓ COPIED!':'COPY TO CLIPBOARD'}</button>
                <button onClick={()=>setCsvModal(null)} style={S.btn('#1e1e24','#aaa',false)}>CLOSE</button>
              </div>
            </div>
            <textarea readOnly value={csvModal} onClick={e=>e.target.select()} style={{ flex:1, margin:16, background:'#0a0a0c', border:'1px solid #1e1e24', color:'#888', fontFamily:"'Share Tech Mono',monospace", fontSize:11, padding:12, borderRadius:4, resize:'none', minHeight:280 }} />
            <div style={{ padding:'10px 20px', borderTop:'1px solid #1e1e24', fontSize:11, color:'#444' }}>Copy → paste into Excel or Google Sheets.</div>
          </div>
        </div>
      )}

      {toast && <div style={{ position:'fixed', top:20, right:20, zIndex:9998, background:'#00ff88', color:'#000', padding:'10px 20px', borderRadius:4, fontFamily:"'Share Tech Mono',monospace", fontWeight:700 }}>{toast}</div>}

      <div style={{ background:'#0d0d0f', minHeight:'100vh', color:'#e0e0e0', fontFamily:"'Share Tech Mono',monospace" }}>
        {/* Header */}
        <div style={{ background:'#0a0a0c', borderBottom:'2px solid #1e1e24', padding:'14px 22px', display:'flex', alignItems:'center', gap:14 }}>
          <div>
          <img src="https://cdn.verkada.com/image/upload/brand/verkada-logo-only-white.svg" alt="Verkada" style={{ height:28, display:'block', marginBottom:4 }} />
            <div style={{ fontSize:18, fontWeight:900, fontFamily:'Barlow,sans-serif', color:'#fff' }}>VERKADA DEPLOYMENT TRACKER</div>
            <div style={{ fontSize:10, color:'#555' }}>{cameras.length} / {TOTAL} cameras logged</div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:26, fontWeight:900, fontFamily:'Barlow,sans-serif', color:'#00ff88', lineHeight:1 }}>{pct}%</div>
              <div style={{ fontSize:10, color:'#555' }}>COMPLETE</div>
            </div>
            <div style={{ position:'relative', width:52, height:52 }}>
              <svg viewBox="0 0 52 52" style={{ transform:'rotate(-90deg)', width:52, height:52 }}>
                <circle cx="26" cy="26" r="20" fill="none" stroke="#1e1e24" strokeWidth="5"/>
                <circle cx="26" cy="26" r="20" fill="none" stroke="#00ff88" strokeWidth="5"
                  strokeDasharray={String(2*Math.PI*20)} strokeDashoffset={String(2*Math.PI*20*(1-pct/100))}
                  style={{ transition:'stroke-dashoffset 0.5s' }}/>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700 }}>{done}/{TOTAL}</div>
            </div>
            <button onClick={() => { document.cookie='tracker_auth=; Max-Age=0; Path=/'; window.location='/login?role=tracker'; }} style={S.btn('#1e1e24','#555',false)}>LOG OUT</button>
          </div>
        </div>
        <div style={{ height:3, background:'#1e1e24' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#00ff88,#00b4ff)', width:`${pct}%`, transition:'width 0.5s' }}/>
        </div>

        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#555' }}>LOADING...</div>
        ) : (
          <div style={{ display:'flex', height:'calc(100vh - 105px)' }}>
            {/* Table */}
            <div style={{ flex:1, overflow:'auto', borderRight:'1px solid #1e1e24' }}>
              <div style={{ padding:'10px 14px', borderBottom:'1px solid #1e1e24', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', background:'#0a0a0c', position:'sticky', top:0, zIndex:10 }}>
                <input placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{ ...S.input, width:180 }}/>
                <select value={filterFloor} onChange={e=>setFilterFloor(e.target.value)} style={S.sel}>
                  <option value="all">All Floors</option>
                  {FLOORS.map(f=><option key={f} value={f}>Floor {f}</option>)}
                </select>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={S.sel}>
                  <option value="all">All Status</option>
                  <option value="done">Done</option>
                  <option value="in-progress">In Progress</option>
                  <option value="pending">Pending</option>
                </select>
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={S.sel}>
                  <option value="name">Sort: Name</option>
                  <option value="floor">Sort: Floor</option>
                  <option value="status">Sort: Status</option>
                  <option value="model">Sort: Model</option>
                  <option value="ip">Sort: IP</option>
                  <option value="switch">Sort: Switch</option>
                  <option value="port">Sort: Port</option>
                </select>
                <span style={{ marginLeft:'auto', fontSize:11, color:'#555' }}>{visible.length} shown</span>
                {selected.size > 0 ? (
                  <>
                    <span style={{ fontSize:11, color:'#00ff88', fontWeight:700 }}>{selected.size} selected</span>
                    <button onClick={() => setModelEditModal(true)} style={S.btn('#00b4ff','#000',false)}>✏ BULK EDIT</button>
                    <button onClick={() => setDeleteConfirmModal(true)} style={S.btn('#3a0a0a','#ff5252',false)}>🗑 DELETE</button>
                    <button onClick={() => setSelected(new Set())} style={S.btn('#1e1e24','#aaa',false)}>✕ CLEAR</button>
                  </>
                ) : (
                  <>
                    <button onClick={addCamera} style={S.btn('#00ff88','#000',false)}>+ ADD CAMERA</button>
                    <button onClick={() => setBulkModal(true)} style={S.btn('#003a1a','#00ff88',false)}>+ BULK ADD</button>
                    <button onClick={exportCSV} style={S.btn('#0d2a1a','#00ff88',false)}>⬇ EXPORT CSV</button>
                  </>
                )}
              </div>

              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#111116', borderBottom:'1px solid #2a2a35' }}>
                    <th style={{ padding:'7px 10px', width:32 }}>
                      <input type="checkbox"
                        checked={visible.length > 0 && selected.size === visible.length}
                        ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < visible.length; }}
                        onChange={toggleSelectAll}
                        style={{ cursor:'pointer', accentColor:'#00ff88', width:14, height:14 }}
                      />
                    </th>
                    {['Status','Camera Name','Floor','Model','Serial #','IP Address','Switch','Port','Install Photo','Cam View','Notes',''].map(h=>(
                      <th key={h} style={{ padding:'7px 10px', textAlign:'left', color:'#555', fontSize:10, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr><td colSpan={13} style={{ padding:40, textAlign:'center', color:'#333' }}>
                      {cameras.length === 0 ? 'No cameras yet — click + ADD CAMERA to get started' : 'No cameras match filters'}
                    </td></tr>
                  )}
                  {visible.map((cam, i) => {
                    const st = statusOf(cam);
                    const bg = st==='DONE'?'#00ff88':st==='PENDING'?'#3a3a3a':'#ffd600';
                    const tc = st==='PENDING'?'#aaa':'#000';
                    return (
                      <tr key={cam.id} onClick={()=>setEditing(editing===cam.id?null:cam.id)}
                        style={{ background:selected.has(cam.id)?'#0d1f0d':editing===cam.id?'#141420':i%2===0?'#0d0d0f':'#0f0f12', borderBottom:'1px solid #1a1a1f', cursor:'pointer', borderLeft:selected.has(cam.id)?'3px solid #00b4ff':editing===cam.id?'3px solid #00ff88':'3px solid transparent' }}>
                        <td style={{ padding:'7px 10px', width:32 }} onClick={e=>e.stopPropagation()}>
                          <input type="checkbox" checked={selected.has(cam.id)} onChange={e=>toggleSelect(cam.id,e)}
                            style={{ cursor:'pointer', accentColor:'#00b4ff', width:14, height:14 }} />
                        </td>
                        <td style={{ padding:'7px 10px' }}><span style={{ display:'inline-block', padding:'2px 8px', borderRadius:3, fontSize:10, fontWeight:700, background:bg, color:tc }}>{st}</span></td>
                        <td style={{ padding:'7px 10px', color:cam.name?'#fff':'#333' }}>{cam.name||'—'}</td>
                        <td style={{ padding:'7px 10px', color:'#aaa' }}>{cam.floor?`FL ${cam.floor}`:'—'}</td>
                        <td style={{ padding:'7px 10px', color:'#00b4ff' }}>{cam.model||'—'}</td>
                        <td style={{ padding:'7px 10px', color:'#aaa', fontFamily:"'Share Tech Mono',monospace" }}>{cam.serialNumber||'—'}</td>
                        <td style={{ padding:'7px 10px', color:'#888' }}>{cam.ip||'—'}</td>
                        <td style={{ padding:'7px 10px', color:'#aaa' }}>{cam.switchName||'—'}</td>
                        <td style={{ padding:'7px 10px', color:'#aaa' }}>{cam.switchPort||'—'}</td>
                        <td style={{ padding:'7px 10px', textAlign:'center' }}>{cam.photoInstallUrl ? <img src={cam.photoInstallUrl} style={{ width:36, height:28, objectFit:'cover', borderRadius:3, border:'1px solid #2a2a35' }} alt=""/> : '⬜'}</td>
                        <td style={{ padding:'7px 10px', textAlign:'center' }}>{cam.screenshotViewUrl ? <img src={cam.screenshotViewUrl} style={{ width:36, height:28, objectFit:'cover', borderRadius:3, border:'1px solid #2a2a35' }} alt=""/> : '⬜'}</td>
                        <td style={{ padding:'7px 10px', color:'#555', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cam.notes||''}</td>
                        <td style={{ padding:'7px 10px' }}>
                          <button onClick={e=>{e.stopPropagation();deleteCamera(cam.id);}} style={{ background:'none', border:'1px solid #2a2a35', color:'#ff3d3d', padding:'2px 7px', borderRadius:3, cursor:'pointer', fontSize:11, fontFamily:"'Share Tech Mono',monospace" }}>DEL</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Edit Panel */}
            {editCam && (
              <div style={{ width:340, overflow:'auto', background:'#0a0a0c', padding:20, flexShrink:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#fff' }}>EDIT CAMERA</div>
                  <button onClick={()=>setEditing(null)} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:18 }}>✕</button>
                </div>

                {[['CAMERA NAME','name','e.g. Lobby-01'],['SERIAL NUMBER','serialNumber','e.g. Q12345678'],['IP ADDRESS','ip','192.168.1.XXX'],['SWITCH NAME','switchName','e.g. IDF-3A'],['SWITCH PORT','switchPort','e.g. Gi1/0/12']].map(([label,key,ph])=>(
                  <div key={key} style={{ marginBottom:12 }}>
                    <label style={{ display:'block', fontSize:10, color:'#555', marginBottom:4 }}>{label}</label>
                    <input value={editCam[key]||''} placeholder={ph} onChange={e=>updateCamera(editCam.id,{[key]:e.target.value})} style={S.input}/>
                  </div>
                ))}

                <div style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:10, color:'#555', marginBottom:4 }}>FLOOR</label>
                  <select value={editCam.floor||''} onChange={e=>updateCamera(editCam.id,{floor:e.target.value})} style={{ ...S.input }}>
                    <option value="">Select floor...</option>
                    {FLOORS.map(f=><option key={f} value={f}>Floor {f}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:10, color:'#555', marginBottom:4 }}>CAMERA MODEL</label>
                  <select value={editCam.model||''} onChange={e=>updateCamera(editCam.id,{model:e.target.value})} style={{ ...S.input }}>
                    <option value="">Select model...</option>
                    {MODELS.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div style={{ borderTop:'1px solid #1e1e24', paddingTop:16, marginBottom:16 }}>
                  <div style={{ fontSize:10, color:'#555', marginBottom:12, letterSpacing:0.5 }}>DOCUMENTATION PHOTOS</div>
                  <PhotoUpload
                    cameraId={editCam.id} photoType="install"
                    currentUrl={editCam.photoInstallUrl} label="📷 INSTALL PHOTO"
                    onUploaded={url => updateLocalOnly(editCam.id, { photoInstallUrl: url })}
                  />
                  <PhotoUpload
                    cameraId={editCam.id} photoType="view"
                    currentUrl={editCam.screenshotViewUrl} label="🖥️ CAMERA VIEW SCREENSHOT"
                    onUploaded={url => updateLocalOnly(editCam.id, { screenshotViewUrl: url })}
                  />
                </div>

                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:10, color:'#555', marginBottom:4 }}>NOTES</label>
                  <textarea value={editCam.notes||''} onChange={e=>updateCamera(editCam.id,{notes:e.target.value})} rows={3} placeholder="Any notes or issues..." style={{ ...S.input, resize:'vertical' }}/>
                </div>

                <div style={{ padding:12, background:'#111116', borderRadius:4, border:'1px solid #1e1e24' }}>
                  <div style={{ fontSize:10, color:'#555', marginBottom:8 }}>COMPLETION</div>
                  {[['Name',!!editCam.name],['Floor',!!editCam.floor],['Model',!!editCam.model],['IP',!!editCam.ip],['Switch',!!editCam.switchName],['Port',!!editCam.switchPort],['Serial #',!!editCam.serialNumber],['Install Photo',!!editCam.photoInstallUrl],['View Screenshot',!!editCam.screenshotViewUrl]].map(([l,v])=>(
                    <div key={l} style={{ display:'flex', gap:8, marginBottom:4 }}>
                      <span style={{ color:v?'#00ff88':'#333' }}>{v?'●':'○'}</span>
                      <span style={{ fontSize:11, color:v?'#aaa':'#444' }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
