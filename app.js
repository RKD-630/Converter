'use strict';

/* ── State ── */
const state = {
  pages:[], stream:null, currentImage:null,
  rotation:0, cropActive:false,
  crop:{ x:0, y:0, w:0, h:0 },   // in CANVAS pixels
  adj:{ brightness:0, contrast:0, darkness:0, sharpness:0 },
  textItems:[], detectInterval:null, flashOn:false,
};

/* ── DOM ── */
const $           = id => document.getElementById(id);
const splash      = $('splash');
const app         = $('app');
const screens     = { home:$('screenHome'), camera:$('screenCamera'), edit:$('screenEdit'), pages:$('screenPages') };
const cameraVideo = $('cameraVideo');
const editCanvas  = $('editCanvas');
const canvasWrapper=$('canvasWrapper');
const cropOverlay = $('cropOverlay');
const cropBox     = $('cropBox');
const textLayer   = $('textLayer');
const detectRing  = $('detectRing');
const detectLabel = $('detectLabel');
const modalPerm   = $('modalPermission');
const modalProgress=$('modalProgress');
const progressCircle=$('progressCircle');
const progressPct = $('progressPct');
const progressLabel=$('progressLabel');
const pagesGrid   = $('pagesGrid');
const pageBadge   = $('pageBadge');
const pageCount   = $('pageCount');
const pdfReadyBanner=$('pdfReadyBanner');

/* ── Splash ── */
setTimeout(()=>{
  splash.classList.add('fade-out');
  setTimeout(()=>{ splash.classList.add('hidden'); app.classList.remove('hidden'); },500);
},2200);

/* ── Screens ── */
function showScreen(name){
  Object.values(screens).forEach(s=>s.classList.remove('active'));
  screens[name].classList.add('active');
}

/* ── Toast ── */
function toast(msg,type=''){
  const el=document.createElement('div');
  el.className=`toast ${type}`; el.textContent=msg;
  $('toastContainer').appendChild(el);
  setTimeout(()=>el.remove(),2800);
}

/* ═══ HOME ═══ */
$('btnCamera').addEventListener('click',()=>modalPerm.classList.remove('hidden'));
$('btnGallery').addEventListener('click',()=>$('galleryInput').click());
$('galleryInput').addEventListener('change',e=>{
  const files=[...e.target.files]; if(!files.length)return;
  Promise.all(files.map(f=>new Promise(res=>{
    const r=new FileReader(); r.onload=ev=>res(ev.target.result); r.readAsDataURL(f);
  }))).then(results=>{
    toast(`${results.length} image(s) loaded`,'success');
    if(results.length===1){ loadIntoEditor(results[0]); showScreen('edit'); }
    else{
      results.forEach(d=>state.pages.push({dataURL:d}));
      updatePageBadge(); renderPagesGrid(); showScreen('pages');
    }
  });
  e.target.value='';
});

/* ═══ PERMISSION MODAL ═══ */
$('btnPermAllow').addEventListener('click',async()=>{
  modalPerm.classList.add('hidden'); await startCamera();
});
$('btnPermDeny').addEventListener('click',()=>{
  modalPerm.classList.add('hidden'); toast('Camera access denied','error');
});

/* ═══ CAMERA ═══ */
async function startCamera(){
  try{
    state.stream=await navigator.mediaDevices.getUserMedia(
      {video:{facingMode:'environment',width:{ideal:1920},height:{ideal:1080}}});
    cameraVideo.srcObject=state.stream;
    await cameraVideo.play();
    showScreen('camera'); startDocumentDetection();
  }catch(err){ toast('Camera: '+err.message,'error'); }
}

function stopCamera(){
  if(state.stream){state.stream.getTracks().forEach(t=>t.stop());state.stream=null;}
  clearInterval(state.detectInterval); detectRing.classList.remove('found');
}

function startDocumentDetection(){
  let tick=0;
  state.detectInterval=setInterval(()=>{
    tick++;
    if(tick>10){
      detectRing.classList.add('found');
      detectLabel.textContent='✓ Document detected – tap to capture';
    } else {
      detectLabel.textContent='Searching for document…';
    }
  },400);
}

$('btnCapture').addEventListener('click',()=>{
  const video=cameraVideo;
  if(!video.videoWidth){toast('Camera not ready','error');return;}
  const c=document.createElement('canvas');
  c.width=video.videoWidth; c.height=video.videoHeight;
  c.getContext('2d').drawImage(video,0,0);
  stopCamera(); loadIntoEditor(c.toDataURL('image/jpeg',0.95)); showScreen('edit');
});

$('btnCamClose').addEventListener('click',()=>{stopCamera();showScreen('home');});
$('btnFlash').addEventListener('click',()=>{
  state.flashOn=!state.flashOn;
  const track=state.stream?.getVideoTracks()[0];
  if(track?.getCapabilities?.()?.torch)
    track.applyConstraints({advanced:[{torch:state.flashOn}]});
  toast(state.flashOn?'Flash ON':'Flash OFF');
});

/* ═══ EDITOR ═══ */
function loadIntoEditor(dataURL){
  state.currentImage=dataURL; state.rotation=0;
  state.adj={brightness:0,contrast:0,darkness:0,sharpness:0};
  state.cropActive=false; textLayer.innerHTML='';
  ['slBrightness','slContrast','slDarkness','slSharpness'].forEach(id=>$(id).value=0);
  ['valBrightness','valContrast','valDarkness','valSharpness'].forEach(id=>$(id).textContent='0');
  hideCropOverlay();
  renderEdit();
}

function renderEdit(){
  const img=new Image();
  img.onload=()=>{
    let iw=img.naturalWidth, ih=img.naturalHeight;
    if(state.rotation%180!==0)[iw,ih]=[ih,iw];
    const ww=canvasWrapper.clientWidth||360;
    const wh=canvasWrapper.clientHeight||400;
    const scale=Math.min(ww/iw, wh/ih, 1);
    editCanvas.width =Math.round(iw*scale);
    editCanvas.height=Math.round(ih*scale);
    const ctx=editCanvas.getContext('2d');
    ctx.clearRect(0,0,editCanvas.width,editCanvas.height);
    ctx.save();
    ctx.translate(editCanvas.width/2,editCanvas.height/2);
    ctx.rotate((state.rotation*Math.PI)/180);
    ctx.scale(scale,scale);
    ctx.drawImage(img,-img.naturalWidth/2,-img.naturalHeight/2);
    ctx.restore();
    applyFilters(ctx,editCanvas.width,editCanvas.height);
    // reposition crop overlay to match canvas exactly
    if(state.cropActive) positionAndShowOverlay();
  };
  img.src=state.currentImage;
}

/* ─── Filters ─── */
function applyFilters(ctx,w,h){
  const{brightness,contrast,darkness,sharpness}=state.adj;
  const id=ctx.getImageData(0,0,w,h); const d=id.data;
  const bf=brightness/100*255;
  const cf=(contrast/100+1)**2;
  const dk=darkness/100;
  for(let i=0;i<d.length;i+=4){
    let r=d[i],g=d[i+1],b=d[i+2];
    r+=bf; g+=bf; b+=bf;
    r=cf*(r-128)+128; g=cf*(g-128)+128; b=cf*(b-128)+128;
    r*=(1-dk); g*=(1-dk); b*=(1-dk);
    d[i]  =Math.max(0,Math.min(255,r));
    d[i+1]=Math.max(0,Math.min(255,g));
    d[i+2]=Math.max(0,Math.min(255,b));
  }
  if(sharpness>0)applySharpen(d,w,h,sharpness/10);
  ctx.putImageData(id,0,0);
}

function applySharpen(d,w,h,amt){
  const k=[0,-1,0,-1,5,-1,0,-1,0], c=new Uint8ClampedArray(d);
  for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++) for(let ch=0;ch<3;ch++){
    let v=0;
    for(let ky=-1;ky<=1;ky++) for(let kx=-1;kx<=1;kx++)
      v+=c[((y+ky)*w+(x+kx))*4+ch]*k[(ky+1)*3+(kx+1)];
    const i=(y*w+x)*4+ch;
    d[i]=Math.max(0,Math.min(255,d[i]+(v-d[i])*amt));
  }
}

/* ─── Sliders ─── */
function bindSlider(id,key,valId){
  $(id).addEventListener('input',e=>{
    state.adj[key]=+e.target.value; $(valId).textContent=e.target.value; renderEdit();
  });
}
bindSlider('slBrightness','brightness','valBrightness');
bindSlider('slContrast','contrast','valContrast');
bindSlider('slDarkness','darkness','valDarkness');
bindSlider('slSharpness','sharpness','valSharpness');

/* ─── Presets ─── */
window.applyPreset=function(name){
  const map={
    original:{brightness:0,contrast:0,darkness:0,sharpness:0},
    magic:   {brightness:15,contrast:30,darkness:0,sharpness:3},
    grayscale:{brightness:0,contrast:20,darkness:0,sharpness:2},
    bw:      {brightness:-10,contrast:80,darkness:20,sharpness:5},
    enhance: {brightness:10,contrast:15,darkness:0,sharpness:4},
  };
  state.adj={...map[name]};
  ['Brightness','Contrast','Darkness','Sharpness'].forEach(k=>{
    $('sl'+k).value=state.adj[k.toLowerCase()];
    $('val'+k).textContent=state.adj[k.toLowerCase()];
  });
  if(name==='grayscale'||name==='bw'){
    const ctx=editCanvas.getContext('2d');
    const id=ctx.getImageData(0,0,editCanvas.width,editCanvas.height);
    for(let i=0;i<id.data.length;i+=4){
      const avg=0.299*id.data[i]+0.587*id.data[i+1]+0.114*id.data[i+2];
      id.data[i]=id.data[i+1]=id.data[i+2]=avg;
    }
    ctx.putImageData(id,0,0);
    if(state.adj.brightness||state.adj.contrast||state.adj.darkness||state.adj.sharpness)
      applyFilters(ctx,editCanvas.width,editCanvas.height);
    return;
  }
  renderEdit();
};

/* ─── Tabs ─── */
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tool-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    $('panel'+btn.dataset.tab[0].toUpperCase()+btn.dataset.tab.slice(1)).classList.add('active');
  });
});

/* ─── Rotate ─── */
$('btnRotate').addEventListener('click',()=>{ state.rotation=(state.rotation+90)%360; renderEdit(); });

/* ═══════════════════════════════════════════════
   CROP  –  completely rewritten coordinate system
   All crop coords (state.crop) are in CANVAS PIXEL space.
   The overlay is positioned to exactly cover the canvas.
═══════════════════════════════════════════════ */

/**
 * Returns canvas bounding rect RELATIVE to canvasWrapper.
 */
function canvasRectInWrapper(){
  const wr=canvasWrapper.getBoundingClientRect();
  const cr=editCanvas.getBoundingClientRect();
  return {
    left : cr.left - wr.left,
    top  : cr.top  - wr.top,
    width: cr.width,
    height:cr.height,
  };
}

/**
 * Position the cropOverlay div so it sits exactly on top of the canvas.
 */
function positionAndShowOverlay(){
  const r=canvasRectInWrapper();
  cropOverlay.style.left  =r.left+'px';
  cropOverlay.style.top   =r.top +'px';
  cropOverlay.style.width =r.width+'px';
  cropOverlay.style.height=r.height+'px';
  cropOverlay.classList.remove('hidden');
  refreshCropUI();
}

function hideCropOverlay(){
  cropOverlay.classList.add('hidden');
  state.cropActive=false;
}

/**
 * Convert canvas-pixel crop coords → display pixels (inside overlay).
 * The overlay is the same size as the displayed canvas, so scale = displayW / canvasW.
 */
function canvasToDpy(val, axis){
  if(axis==='x'||axis==='w') return val * (cropOverlay.clientWidth  / editCanvas.width);
  return                            val * (cropOverlay.clientHeight / editCanvas.height);
}

/**
 * Update CSS of cropBox and 4 dark masks based on state.crop (canvas pixels).
 */
function refreshCropUI(){
  const ox=canvasToDpy(state.crop.x,'x');
  const oy=canvasToDpy(state.crop.y,'y');
  const ow=canvasToDpy(state.crop.w,'w');
  const oh=canvasToDpy(state.crop.h,'h');
  const W=cropOverlay.clientWidth, H=cropOverlay.clientHeight;

  cropBox.style.cssText=`left:${ox}px;top:${oy}px;width:${ow}px;height:${oh}px`;

  const masks=cropOverlay.querySelectorAll('.crop-mask');
  masks[0].style.cssText=`top:0;left:0;right:0;height:${oy}px`;                           // top
  masks[1].style.cssText=`top:${oy+oh}px;left:0;right:0;bottom:0`;                        // bottom
  masks[2].style.cssText=`top:${oy}px;left:0;width:${ox}px;height:${oh}px`;              // left
  masks[3].style.cssText=`top:${oy}px;left:${ox+ow}px;right:0;height:${oh}px`;           // right
}

/* Clamp crop so it stays within canvas */
function clampCrop(){
  const cw=editCanvas.width, ch=editCanvas.height;
  state.crop.w=Math.max(20,Math.min(state.crop.w, cw-state.crop.x));
  state.crop.h=Math.max(20,Math.min(state.crop.h, ch-state.crop.y));
  state.crop.x=Math.max(0, Math.min(state.crop.x, cw-state.crop.w));
  state.crop.y=Math.max(0, Math.min(state.crop.y, ch-state.crop.h));
}

/* ─── Manual Crop toggle ─── */
$('btnCropToggle').addEventListener('click',()=>{
  if(state.cropActive){
    hideCropOverlay();
    $('btnCropToggle').innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 2 6 8 2 8"/><polyline points="18 22 18 16 22 16"/><path d="M2 8h14a2 2 0 0 1 2 2v10"/><path d="M22 16H8a2 2 0 0 1-2-2V2"/></svg> Manual Crop';
    return;
  }
  state.cropActive=true;
  const cw=editCanvas.width, ch=editCanvas.height;
  state.crop={ x:Math.round(cw*.1), y:Math.round(ch*.1), w:Math.round(cw*.8), h:Math.round(ch*.8) };
  positionAndShowOverlay();
  $('btnCropToggle').textContent='Cancel Crop';
  toast('Drag the box or handles to crop');
});

/* ─── Auto Detect ─── */
$('btnAutoCrop').addEventListener('click',()=>{
  state.cropActive=true;
  const cw=editCanvas.width, ch=editCanvas.height;
  state.crop={ x:Math.round(cw*.04), y:Math.round(ch*.04), w:Math.round(cw*.92), h:Math.round(ch*.92) };
  positionAndShowOverlay();
  toast('Auto crop applied – adjust handles','success');
});

/* ─── Apply Crop ─── */
$('btnApplyCrop').addEventListener('click',()=>{
  if(!state.cropActive){ toast('Enable crop first'); return; }
  const{x,y,w,h}=state.crop;
  const ctx=editCanvas.getContext('2d');
  const id=ctx.getImageData(x,y,w,h);
  const tmp=document.createElement('canvas');
  tmp.width=w; tmp.height=h;
  tmp.getContext('2d').putImageData(id,0,0);
  state.currentImage=tmp.toDataURL('image/jpeg',0.95);
  hideCropOverlay();
  $('btnCropToggle').innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 2 6 8 2 8"/><polyline points="18 22 18 16 22 16"/><path d="M2 8h14a2 2 0 0 1 2 2v10"/><path d="M22 16H8a2 2 0 0 1-2-2V2"/></svg> Manual Crop';
  renderEdit();
  toast('Crop applied!','success');
});

/* ─── Crop drag & resize ─── */
let drag=null;

/* Scale: display pixels → canvas pixels */
function dspyToCanvas(dpx, axis){
  if(axis==='x'||axis==='w') return dpx * editCanvas.width  / cropOverlay.clientWidth;
  return                           dpx * editCanvas.height / cropOverlay.clientHeight;
}

cropBox.addEventListener('pointerdown',e=>{
  if(e.target.classList.contains('crop-handle'))return;
  e.stopPropagation();
  cropBox.setPointerCapture(e.pointerId);
  drag={ type:'move', px:e.clientX, py:e.clientY,
         ox:state.crop.x, oy:state.crop.y };
});
cropBox.addEventListener('pointermove',e=>{
  if(!drag||drag.type!=='move')return;
  const dx=dspyToCanvas(e.clientX-drag.px,'x');
  const dy=dspyToCanvas(e.clientY-drag.py,'y');
  state.crop.x=drag.ox+dx;
  state.crop.y=drag.oy+dy;
  clampCrop(); refreshCropUI();
});
cropBox.addEventListener('pointerup',()=>drag=null);
cropBox.addEventListener('pointercancel',()=>drag=null);

document.querySelectorAll('.crop-handle').forEach(h=>{
  h.addEventListener('pointerdown',e=>{
    e.stopPropagation();
    h.setPointerCapture(e.pointerId);
    drag={ type:'resize', dir:h.dataset.dir,
           px:e.clientX, py:e.clientY, ...state.crop };
  });
  h.addEventListener('pointermove',e=>{
    if(!drag||drag.type!=='resize')return;
    const dx=dspyToCanvas(e.clientX-drag.px,'x');
    const dy=dspyToCanvas(e.clientY-drag.py,'y');
    let{x,y,w,h:hh,dir}=drag;
    if(drag.dir.includes('e')) w =Math.max(20, drag.w+dx);
    if(drag.dir.includes('s')) hh=Math.max(20, drag.h+dy);
    if(drag.dir.includes('w')){ x=drag.x+dx; w=Math.max(20,drag.w-dx); }
    if(drag.dir.includes('n')){ y=drag.y+dy; hh=Math.max(20,drag.h-dy); }
    state.crop={x,y,w,h:hh};
    clampCrop(); refreshCropUI();
  });
  h.addEventListener('pointerup',()=>drag=null);
  h.addEventListener('pointercancel',()=>drag=null);
});

/* ═══ TEXT TOOL ═══ */
$('btnAddText').addEventListener('click',()=>{
  const txt=$('textInput').value.trim();
  if(!txt){ toast('Enter text first'); return; }
  const color=$('colorText').value;
  const bg=$('chkTransparent').checked?'transparent':$('colorTextBg').value;
  addTextItem(txt,color,bg,$('fontSize').value,$('fontFamily').value);
  $('textInput').value='';
  toast('Text placed – drag to move, double-tap to delete');
});

function addTextItem(txt,color,bg,size,font){
  const el=document.createElement('div');
  el.className='draggable-text'; el.textContent=txt;
  Object.assign(el.style,{
    position:'absolute', left:'10%', top:'10%',
    color, background:bg, fontSize:size+'px', fontFamily:font,
    padding:bg==='transparent'?'0':'4px 10px',
    borderRadius:'6px', cursor:'move', userSelect:'none',
    pointerEvents:'all', maxWidth:'80%', wordBreak:'break-word',
    border:'1px dashed rgba(255,255,255,.5)', zIndex:10,
  });
  textLayer.style.pointerEvents='all';
  textLayer.appendChild(el);
  makeDraggable(el);
  el.addEventListener('dblclick',()=>el.remove());
}

function makeDraggable(el){
  let sx=0,sy=0,ox=0,oy=0;
  el.addEventListener('pointerdown',e=>{
    e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    sx=e.clientX; sy=e.clientY;
    const r=el.getBoundingClientRect();
    const wr=textLayer.getBoundingClientRect();
    ox=r.left-wr.left; oy=r.top-wr.top;
  });
  el.addEventListener('pointermove',e=>{
    el.style.left=(ox+(e.clientX-sx))+'px';
    el.style.top =(oy+(e.clientY-sy))+'px';
  });
}

/* ═══ DONE – add page ═══ */
$('btnAddToDoc').addEventListener('click',()=>{
  // flatten text items onto canvas
  const ctx=editCanvas.getContext('2d');
  const wr=editCanvas.getBoundingClientRect();
  const sx=editCanvas.width/wr.width, sy=editCanvas.height/wr.height;
  [...textLayer.children].forEach(el=>{
    const er=el.getBoundingClientRect();
    const x=(er.left-wr.left)*sx, y=(er.top-wr.top)*sy;
    const fs=parseFloat(el.style.fontSize)*sx;
    ctx.font=`${fs}px ${el.style.fontFamily}`;
    if(el.style.background&&el.style.background!=='transparent'){
      ctx.fillStyle=el.style.background;
      ctx.fillRect(x,y-fs,el.offsetWidth*sx,el.offsetHeight*sy);
    }
    ctx.fillStyle=el.style.color;
    ctx.fillText(el.textContent,x,y);
  });
  state.pages.push({dataURL:editCanvas.toDataURL('image/jpeg',0.92)});
  updatePageBadge(); renderPagesGrid();
  pdfReadyBanner.classList.remove('hidden');
  toast('Page added!','success');
  showScreen('home');
});

$('btnEditBack').addEventListener('click',()=>{ hideCropOverlay(); showScreen('home'); });

/* ═══ PAGES ═══ */
function updatePageBadge(){
  pageBadge.textContent=state.pages.length;
  pageCount.textContent=state.pages.length;
}

function renderPagesGrid(){
  pagesGrid.innerHTML='';
  state.pages.forEach((pg,i)=>{
    const card=document.createElement('div');
    card.className='page-card';
    card.innerHTML=`<img src="${pg.dataURL}" alt="Page ${i+1}"/><span class="page-num">Page ${i+1}</span><button class="del-page" title="Delete">✕</button>`;
    card.querySelector('.del-page').addEventListener('click',()=>{
      state.pages.splice(i,1);
      updatePageBadge(); renderPagesGrid();
      if(!state.pages.length)pdfReadyBanner.classList.add('hidden');
    });
    pagesGrid.appendChild(card);
  });
}

$('btnPages').addEventListener('click',()=>{ renderPagesGrid(); showScreen('pages'); });
$('btnPagesBack').addEventListener('click',()=>showScreen('home'));
$('btnAddMorePages').addEventListener('click',()=>showScreen('home'));

/* ═══ PDF ═══ */
$('btnDownloadPDF').addEventListener('click',generatePDF);

async function generatePDF(){
  if(!state.pages.length){ toast('No pages to export','error'); return; }
  modalProgress.classList.remove('hidden');
  await tick();
  try{
    const{jsPDF}=window.jspdf;
    const total=state.pages.length;
    let pdf;
    for(let i=0;i<total;i++){
      updateProgress(Math.round(((i+0.5)/total)*100),`Processing page ${i+1} of ${total}…`);
      await tick();
      const img=await loadImg(state.pages[i].dataURL);
      const land=img.width>img.height;
      if(i===0) pdf=new jsPDF({orientation:land?'l':'p',unit:'px',format:[img.width,img.height]});
      else pdf.addPage([img.width,img.height],land?'l':'p');
      pdf.addImage(state.pages[i].dataURL,'JPEG',0,0,img.width,img.height);
    }
    updateProgress(100,'Saving…'); await tick();
    pdf.save('DocScan_Pro.pdf');
    modalProgress.classList.add('hidden');
    toast('PDF downloaded!','success');
    setTimeout(()=>{ state.pages=[]; updatePageBadge(); renderPagesGrid();
      pdfReadyBanner.classList.add('hidden'); showScreen('home');
      toast('Ready for next scan!','success'); },1000);
  }catch(err){
    modalProgress.classList.add('hidden');
    toast('PDF error: '+err.message,'error');
  }
}

function updateProgress(pct,label){
  const circ=2*Math.PI*26;
  progressCircle.style.strokeDashoffset=circ-(circ*pct/100);
  progressPct.textContent=pct+'%';
  progressLabel.textContent=label;
}
function loadImg(src){ return new Promise((r,j)=>{ const i=new Image(); i.onload=()=>r(i); i.onerror=j; i.src=src; }); }
function tick(){ return new Promise(r=>setTimeout(r,30)); }
