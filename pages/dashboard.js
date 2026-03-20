import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';

const TOTAL = 211;
const FLOORS_ORDER = ['Exterior','1','2','3','4','5','6','7','8','9','10','11','12','14','15','16','17','18','19','Roof'];

const isComplete = (c) => c.name && c.floor && c.model && c.ip && c.switchName && c.switchPort && c.photoInstallUrl && c.screenshotViewUrl;

const statusOf = (c) => {
  if (isComplete(c)) return 'done';
  const n = ['name','floor','model','ip','switchName','switchPort'].filter(f=>c[f]).length+(c.photoInstallUrl?1:0)+(c.screenshotViewUrl?1:0);
  return n===0?'pending':'in-progress';
};

function CameraModal({ camera, onClose }) {
  if (!camera) return null;
  const [lightbox, setLightbox] = useState(null);

  return (
    <>
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out', padding:20 }}>
          <img src={lightbox} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:8 }} alt="Full size"/>
          <button onClick={()=>setLightbox(null)} style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', width:40, height:40, borderRadius:'50%', cursor:'pointer', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
      )}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:680, maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

          {/* Modal header */}
          <div style={{ background:'#0d1b4b', borderRadius:'20px 20px 0 0', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:'#fff', fontFamily:'Barlow,sans-serif' }}>{camera.name || 'Unnamed Camera'}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2, fontFamily:'Barlow,sans-serif' }}>
                {camera.floor ? (camera.floor==='Exterior'?'Exterior':`Floor ${camera.floor}`) : ''}{camera.floor&&camera.model?' · ':''}{camera.model}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20, background:isComplete(camera)?'#00e676':'#ffd600', color:'#000', fontFamily:'Barlow,sans-serif' }}>
                {isComplete(camera)?'✓ Complete':'In Progress'}
              </span>
              <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', width:34, height:34, borderRadius:'50%', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ padding:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
              {[
                ['IP Address', camera.ip],
                ['Serial Number', camera.serialNumber],
                ['Camera Model', camera.model],
                ['Switch', camera.switchName],
                ['Switch Port', camera.switchPort],
                ['Floor', camera.floor==='Exterior'?'Exterior':camera.floor?`Floor ${camera.floor}`:'—'],
              ].map(([label,value])=>(
                <div key={label} style={{ background:'#f8f9fa', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#90a4ae', textTransform:'uppercase', letterSpacing:0.6, marginBottom:4, fontFamily:'Barlow,sans-serif' }}>{label}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#37474f', fontFamily:'Barlow,sans-serif' }}>{value||'—'}</div>
                </div>
              ))}
              {camera.notes && (
                <div style={{ background:'#fffde7', borderRadius:10, padding:'12px 14px', gridColumn:'1/-1' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#f9a825', textTransform:'uppercase', letterSpacing:0.6, marginBottom:4, fontFamily:'Barlow,sans-serif' }}>Notes</div>
                  <div style={{ fontSize:13, color:'#5d4037', fontFamily:'Barlow,sans-serif' }}>{camera.notes}</div>
                </div>
              )}
            </div>

            {/* Photos */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[
                { label:'📷 Install Photo', url: camera.photoInstallUrl },
                { label:'🖥️ Camera View', url: camera.screenshotViewUrl },
              ].map(({ label, url }) => (
                <div key={label}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#90a4ae', textTransform:'uppercase', letterSpacing:0.6, marginBottom:8, fontFamily:'Barlow,sans-serif' }}>{label}</div>
                  {url ? (
                    <div onClick={()=>setLightbox(url)} style={{ cursor:'zoom-in', borderRadius:10, overflow:'hidden', border:'1px solid #e0e0e0', position:'relative' }}>
                      <img src={url} alt={label} style={{ width:'100%', height:180, objectFit:'cover', display:'block' }}/>
                      <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.5)', color:'#fff', padding:'3px 8px', borderRadius:4, fontSize:10, fontFamily:'Barlow,sans-serif', fontWeight:600 }}>Click to enlarge</div>
                    </div>
                  ) : (
                    <div style={{ background:'#f5f5f5', borderRadius:10, height:180, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'1px dashed #e0e0e0', color:'#bdbdbd', gap:6 }}>
                      <span style={{ fontSize:28 }}>⏳</span>
                      <span style={{ fontSize:12, fontFamily:'Barlow,sans-serif' }}>Photo pending</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const [cameras, setCameras] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [expandedFloor, setExpandedFloor] = useState(null);
  const [expandedModel, setExpandedModel] = useState(null);
  const [listView, setListView] = useState(false);
  const [projectName, setProjectName] = useState('Camera Upgrade Project');
  const [totalCameras, setTotalCameras] = useState(TOTAL);

  const load = () => {
    fetch('/api/cameras')
      .then(r=>r.json())
      .then(d=>{ if(Array.isArray(d)){setCameras(d);setLastUpdated(new Date());setError(false);} else setError(true); setLoaded(true); })
      .catch(()=>{setError(true);setLoaded(true);});
  };

  useEffect(() => {
    // Load settings once on mount
    fetch('/api/settings').then(r=>r.json()).then(s=>{
      if (s.projectName)  setProjectName(s.projectName);
      if (s.totalCameras) setTotalCameras(s.totalCameras);
    }).catch(()=>{});
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const done = cameras.filter(isComplete).length;
    const pct = Math.round((done/totalCameras)*100);
    const byFloor = {};
    cameras.forEach(c => {
      if (!c.floor) return;
      if (!byFloor[c.floor]) byFloor[c.floor]={total:0,done:0};
      byFloor[c.floor].total++;
      if (isComplete(c)) byFloor[c.floor].done++;
    });
    const byModel={};
    cameras.forEach(c=>{if(c.model) byModel[c.model]=(byModel[c.model]||0)+1;});
    const inProgress = cameras.filter(c=>statusOf(c)==='in-progress').length;
    const notStarted = Math.max(0, totalCameras-cameras.length) + cameras.filter(c=>statusOf(c)==='pending').length;
    return {done,pct,byFloor,byModel,inProgress,notStarted};
  }, [cameras, totalCameras]);

  const floorsSorted = useMemo(()=>
    Object.entries(stats.byFloor).sort((a,b)=>{
      const ai=FLOORS_ORDER.indexOf(a[0]),bi=FLOORS_ORDER.indexOf(b[0]);
      return (ai===-1?999:ai)-(bi===-1?999:bi);
    }), [stats.byFloor]);

  const selectedCamera = selectedCameraId ? cameras.find(c => c.id === selectedCameraId) || null : null;
  const accent = stats.pct===100?'#00c853':stats.pct>=50?'#00b4ff':'#ffab00';

  return (
    <>
      <Head>
        <title>{projectName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap" rel="stylesheet"/>
        <style>{`* { margin:0;padding:0;box-sizing:border-box; } body { background:#f0f2f5; font-family:Barlow,sans-serif; }`}</style>
      </Head>

      <CameraModal camera={selectedCamera} onClose={()=>setSelectedCameraId(null)}/>

      {/* Header */}
      <div style={{ background:'#0d1b4b', padding:'22px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div>
          <img src="https://cdn.verkada.com/image/upload/brand/verkada-logo-only-white.svg" alt="Verkada" style={{ height:30, display:'block', marginBottom:4 }} />
            <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>{projectName}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Verkada Security System Deployment · Live Progress</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, justifyContent:'flex-end' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:error?'#ff5252':'#00e676' }}/>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{error?'Connection error':'Live · refreshes every 10s'}</span>
            </div>
            {lastUpdated && <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:2 }}>Updated {lastUpdated.toLocaleTimeString()}</div>}
          </div>
          <button onClick={load} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.6)', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600 }}>↻ Refresh</button>
          <a href="/api/pdf" download style={{ background:'#00e676', color:'#000', padding:'6px 16px', borderRadius:6, fontSize:12, fontWeight:700, fontFamily:'Barlow,sans-serif', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}>⬇ Download PDF</a>
          <button onClick={()=>{ document.cookie='dashboard_auth=; Max-Age=0; Path=/'; window.location='/login?role=dashboard'; }} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.4)', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600 }}>Log Out</button>
        </div>
      </div>

      {/* Hero progress */}
      <div style={{ background:'#0d1b4b', padding:'0 32px 26px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:14, marginBottom:10 }}>
          <span style={{ fontSize:72, fontWeight:900, color:accent, lineHeight:1, fontFamily:'Barlow Condensed,sans-serif' }}>{loaded?stats.pct+'%':'—'}</span>
          <div style={{ paddingBottom:10 }}>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>overall completion</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>{stats.done} of {totalCameras} cameras fully documented</div>
          </div>
        </div>
        <div style={{ height:10, background:'rgba(255,255,255,0.08)', borderRadius:10, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:10, background:`linear-gradient(90deg,${accent},${accent}99)`, width:loaded?`${stats.pct}%`:'0%', transition:'width 1s ease', boxShadow:`0 0 20px ${accent}55` }}/>
        </div>
      </div>

      <div style={{ padding:'24px 32px' }}>
        {/* Stat cards row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          {[
            {label:'Cameras Done',value:stats.done,sub:`of ${totalCameras} total`,color:'#00c853'},
            {label:'In Progress',value:stats.inProgress,sub:'partially documented',color:'#ffab00'},
          ].map(({label,value,sub,color})=>(
            <div key={label} style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#90a4ae', textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>{label}</div>
              <div style={{ fontSize:48, fontWeight:900, color, lineHeight:1, fontFamily:'Barlow Condensed,sans-serif' }}>{value}</div>
              <div style={{ fontSize:12, color:'#b0bec5', marginTop:5 }}>{sub}</div>
              <div style={{ marginTop:12, height:4, background:'#f0f2f5', borderRadius:2 }}>
                <div style={{ height:'100%', background:color, borderRadius:2, width:`${Math.round(value/totalCameras*100)}%`, transition:'width 0.8s' }}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20, marginBottom:20 }}>
          {/* Floor breakdown */}
          <div style={{ background:'#fff', borderRadius:14, padding:22, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#90a4ae', textTransform:'uppercase', letterSpacing:0.8, marginBottom:16 }}>Progress by Floor — click to expand</div>
            {floorsSorted.length===0 ? <div style={{ color:'#cfd8dc', fontSize:14, textAlign:'center', padding:28 }}>No floor data yet</div>
            : floorsSorted.map(([floor,{total,done}])=>{
              const p=Math.round(done/total*100);
              const isOpen = expandedFloor === floor;
              const floorCams = [...cameras.filter(c=>c.floor===floor)].sort((a,b)=>(a.name||'').localeCompare(b.name||''));
              return (
                <div key={floor} style={{ marginBottom: isOpen ? 18 : 13 }}>
                  <div
                    onClick={() => setExpandedFloor(isOpen ? null : floor)}
                    style={{ cursor:'pointer', padding:'6px 8px', margin:'-6px -8px', borderRadius:8, transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#f5f7fa'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <span style={{ fontSize:12, color:'#90a4ae', transition:'transform 0.2s', display:'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                        <span style={{ fontSize:13, fontWeight:700, color:'#37474f' }}>{floor==='Exterior'?'Exterior':`Floor ${floor}`}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:12, color:'#90a4ae', fontWeight:600 }}>{done}/{total}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:p===100?'#e8f5e9':p>0?'#fff8e1':'#fafafa', color:p===100?'#2e7d32':p>0?'#f57f17':'#b0bec5' }}>{p}%</span>
                      </div>
                    </div>
                    <div style={{ height:7, background:'#f0f2f5', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:4, background:p===100?'#00c853':p>0?'#00b4ff':'#e0e0e0', width:`${p}%`, transition:'width 0.8s' }}/>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #f0f2f5' }}>
                      {floorCams.length === 0
                        ? <div style={{ color:'#cfd8dc', fontSize:13, textAlign:'center', padding:12 }}>No cameras logged for this floor yet</div>
                        : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8 }}>
                          {floorCams.map(cam => {
                            const st = statusOf(cam);
                            return (
                              <div key={cam.id} onClick={e=>{e.stopPropagation();setSelectedCameraId(cam.id);}}
                                style={{ border:`1px solid ${st==='done'?'#c8e6c9':st==='in-progress'?'#fff9c4':'#f0f2f5'}`, borderRadius:10, padding:'10px 12px', cursor:'pointer', background:st==='done'?'#f1f8e9':st==='in-progress'?'#fffde7':'#fafafa' }}
                                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 14px rgba(0,0,0,0.09)';}}
                                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
                                  <div style={{ fontSize:12, fontWeight:700, color:'#37474f', lineHeight:1.3 }}>{cam.name||'Unnamed'}</div>
                                  <span style={{ fontSize:9, fontWeight:700, padding:'2px 5px', borderRadius:8, background:st==='done'?'#00c853':st==='in-progress'?'#ffab00':'#e0e0e0', color:st==='done'||st==='in-progress'?'#000':'#90a4ae', flexShrink:0, marginLeft:5 }}>
                                    {st==='done'?'✓':st==='in-progress'?'…':'—'}
                                  </span>
                                </div>
                                <div style={{ fontSize:11, color:'#90a4ae' }}>{cam.model||'No model'}</div>
                                {cam.serialNumber && <div style={{ fontSize:10, color:'#b0bec5', fontFamily:'monospace', marginTop:2 }}>{cam.serialNumber}</div>}
                                <div style={{ display:'flex', gap:5, marginTop:7 }}>
                                  <span style={{ fontSize:10, padding:'2px 5px', borderRadius:4, background:cam.photoInstallUrl?'#e8f5e9':'#fafafa', color:cam.photoInstallUrl?'#2e7d32':'#bdbdbd', fontWeight:600 }}>📷{cam.photoInstallUrl?'✓':'—'}</span>
                                  <span style={{ fontSize:10, padding:'2px 5px', borderRadius:4, background:cam.screenshotViewUrl?'#e8f5e9':'#fafafa', color:cam.screenshotViewUrl?'#2e7d32':'#bdbdbd', fontWeight:600 }}>🖥{cam.screenshotViewUrl?'✓':'—'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Models */}
          <div style={{ background:'#fff', borderRadius:14, padding:22, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#90a4ae', textTransform:'uppercase', letterSpacing:0.8 }}>Camera Models — click to expand</div>
              <div style={{ fontSize:11, color:'#b0bec5', fontWeight:600 }}>{cameras.length} total</div>
            </div>
            {Object.keys(stats.byModel).length===0 ? <div style={{ color:'#cfd8dc', fontSize:14 }}>No model data yet</div>
            : Object.entries(stats.byModel).sort((a,b)=>b[1]-a[1]).map(([model,count])=>{
              const isOpen = expandedModel === model;
              const modelCams = [...cameras.filter(c=>c.model===model)].sort((a,b)=>{
                const ai=FLOORS_ORDER.indexOf(a.floor||''),bi=FLOORS_ORDER.indexOf(b.floor||'');
                return (ai===-1?999:ai)-(bi===-1?999:bi);
              });
              return (
                <div key={model} style={{ marginBottom: isOpen ? 16 : 10 }}>
                  <div
                    onClick={() => setExpandedModel(isOpen ? null : model)}
                    style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', padding:'5px 7px', margin:'-5px -7px', borderRadius:7, transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#f5f7fa'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, color:'#90a4ae', transition:'transform 0.2s', display:'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'#3949ab', flexShrink:0 }}/>
                      <span style={{ fontSize:14, fontWeight:700, color:'#283593' }}>{model}</span>
                    </div>
                    <span style={{ fontSize:13, color:'#90a4ae', fontWeight:600 }}>{count} unit{count!==1?'s':''}</span>
                  </div>
                  {isOpen && (
                    <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid #f0f2f5' }}>
                      {modelCams.length===0
                        ? <div style={{ color:'#cfd8dc', fontSize:13, padding:8 }}>No cameras for this model</div>
                        : <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {modelCams.map(cam => {
                            const st = statusOf(cam);
                            return (
                              <div key={cam.id} onClick={()=>setSelectedCameraId(cam.id)}
                                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', borderRadius:8, border:`1px solid ${st==='done'?'#c8e6c9':st==='in-progress'?'#fff9c4':'#f0f2f5'}`, background:st==='done'?'#f1f8e9':st==='in-progress'?'#fffde7':'#fafafa', cursor:'pointer' }}
                                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.08)';}}
                                onMouseLeave={e=>{e.currentTarget.style.boxShadow='';}}>
                                <div>
                                  <div style={{ fontSize:12, fontWeight:700, color:'#37474f' }}>{cam.name||'Unnamed'}</div>
                                  <div style={{ fontSize:11, color:'#90a4ae' }}>{cam.floor ? (cam.floor==='Exterior'?'Exterior':`Floor ${cam.floor}`) : 'No floor'}</div>
                                </div>
                                <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:8, background:st==='done'?'#00c853':st==='in-progress'?'#ffab00':'#e0e0e0', color:st==='done'||st==='in-progress'?'#000':'#90a4ae' }}>
                                  {st==='done'?'✓':st==='in-progress'?'…':'—'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <div style={{ padding:'16px 32px', borderTop:'1px solid #e0e4e8', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:12, color:'#b0bec5' }}>Data updated in real time by the installation team.</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <img src="https://cdn.verkada.com/image/upload/brand/verkada-logo-only-white.svg" alt="Verkada" style={{ height:18 }} />
        </div>
      </div>
    </>
  );
}
