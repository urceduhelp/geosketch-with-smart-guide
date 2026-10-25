/* GeoSketch core – index.html மற்றும் editor.html இரண்டும் இதைப் பயன்படுத்தும் (ஒரே folder-ல் வைக்கவும்) */
const B='https://raw.githubusercontent.com/urceduhelp/geo-sketch-map-make/main/';
const MAPS=[
{k:'ol_lanka',name:'சாதாரண தர இலங்கை வரைபடம்',url:B+'2022(2021)OL%20Lanka-01.jpg'},
{k:'ol_eurasia',name:'சாதாரண தர யூரேசிய வரைபடம்',url:B+'https://raw.githubusercontent.com/urceduhelp/geo-sketch-map-make/main/2022(2021)OL-Euracia02.jpg'},
{k:'ol_world',name:'முழு உலக வரைபடம்',url:B+'2022(2021)OL%20world-02.jpg'},
{k:'al_europe1',name:'உயர்தர ஐரோப்பிய வரைபடம் (கருங்கடல் வரை)',url:B+'AL_Europe_1.jpg'},
{k:'al_europe2',name:'உயர்தர ஐரோப்பிய வரைபடம் (காஸ்பியன் கடல் வரை)',url:B+'AL_Europe_2.jpg'},
{k:'al_lanka',name:'உயர்தர இலங்கை வரைபடம்',url:B+'AL_Lanka_India-01.jpg'},
{k:'al_india',name:'உயர்தர இந்திய வரைபடம்',url:B+'AL_Lanka_India-02.jpg'}
];
/* A4 @200dpi: 1654x2339 px. ஓரம் = 1 அங்குலம் = 200px. கட்டம் ≈ 0.5 அங்குலம் */
const MG=200,CELL=100,FONT="'Noto Sans Tamil','Latha','Nirmala UI',sans-serif";
const colName=i=>String.fromCharCode(65+i);
const fontReady=()=>document.fonts?Promise.all([document.fonts.load("24px 'Noto Sans Tamil'"),document.fonts.load("bold 24px 'Noto Sans Tamil'")]).catch(()=>{}):Promise.resolve();

function loadImg(u){return new Promise((ok,no)=>{const i=new Image();i.crossOrigin='anonymous';
 i.onload=()=>ok(i);i.onerror=()=>{const j=new Image();j.onload=()=>ok(j);j.onerror=no;j.src=u;};i.src=u;});}

function layout(img){
 const land=img.width>img.height,W=land?2339:1654,H=land?1654:2339;
 const s=Math.min((W-2*MG)/img.width,(H-2*MG)/img.height),iw=img.width*s,ih=img.height*s;
 const cols=Math.max(1,Math.round(iw/CELL)),rows=Math.max(1,Math.round(ih/CELL));
 return{land,W,H,iw,ih,ix:(W-iw)/2,iy:(H-ih)/2,cols,rows,cw:iw/cols,ch:ih/rows};
}
const cellId=(L,x,y)=>colName(Math.min(L.cols-1,Math.max(0,Math.floor(x*L.cols))))+(Math.min(L.rows-1,Math.max(0,Math.floor(y*L.rows)))+1);

function centroid(P){let a=0,cx=0,cy=0;for(let i=0;i<P.length;i++){const[p,q]=[P[i],P[(i+1)%P.length]],f=p[0]*q[1]-q[0]*p[1];a+=f;cx+=(p[0]+q[0])*f;cy+=(p[1]+q[1])*f;}
 if(Math.abs(a)<1e-9)return P[0];return[cx/(3*a),cy/(3*a)];}
function inPoly(P,x,y){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++)
 if((P[i][1]>y)!=(P[j][1]>y)&&x<(P[j][0]-P[i][0])*(y-P[i][1])/(P[j][1]-P[i][1])+P[i][0])c=!c;return c;}

/* கோட்டிற்கு (polyline) x,y இலிருந்து அருகிலுள்ள புள்ளி: [px,py,தூரம்] */
function nearest(P,x,y){let b=[P[0][0],P[0][1],1e9];
 for(let i=1;i<P.length;i++){const a=P[i-1],c=P[i],dx=c[0]-a[0],dy=c[1]-a[1],l=dx*dx+dy*dy||1,
  t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l)),px=a[0]+t*dx,py=a[1]+t*dy,d=Math.hypot(x-px,y-py);
  if(d<b[2])b=[px,py,d];}
 return b;}

/* ஓர் உருப்படி அடங்கும் கட்டங்களின் பட்டியல் (dropdown-க்காக) */
function itemCells(L,it){
 const s=new Set(),add=(x,y)=>{if(x>=0&&y>=0&&x<=1&&y<=1)s.add(cellId(L,x,y));};
 if(it.t=='p'){add(it.x,it.y);return[...s];}
 const ox=it.t=='r'?(it.ox||0):0,oy=it.t=='r'?(it.oy||0):0,P=it.pts.map(p=>[p[0]+ox,p[1]+oy]);
 P.forEach((p,i)=>{add(p[0],p[1]);if(i){const q=P[i-1];for(let k=1;k<40;k++)add(q[0]+(p[0]-q[0])*k/40,q[1]+(p[1]-q[1])*k/40);}});
 if(it.t=='a'){for(let c=0;c<L.cols;c++)for(let r=0;r<L.rows;r++)if(inPoly(P,(c+.5)/L.cols,(r+.5)/L.rows))s.add(colName(c)+(r+1));}
 return[...s];
}

function graphemes(t){return window.Intl&&Intl.Segmenter?[...new Intl.Segmenter('ta',{granularity:'grapheme'}).segment(t)].map(x=>x.segment):Array.from(t);}

/* அம்பு: பெயரிலிருந்து x வரை கிடைமட்டமாக, பின் 90° திரும்பி செங்குத்தாக இலக்கு வரை (r = இலக்கின் ஆரம்) */
function drawArrow(g,fs,lx,ly,x,y,r,w){
 const hw=w/2+6,hh=fs/2+6,dx=x-lx,dy=y-ly,sx=dx>=0?1:-1,sy=dy>=0?1:-1;let P;
 if(Math.abs(dx)<=hw)P=[[x,ly+sy*hh],[x,y-sy*r]];
 else if(Math.abs(dy)<=hh)P=[[lx+sx*hw,y],[x-sx*r,y]];
 else P=[[lx+sx*hw,ly],[x,ly],[x,y-sy*r]];
 g.strokeStyle=g.fillStyle='#111';g.lineWidth=2;g.beginPath();P.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();
 const e=P[P.length-1],q=P[P.length-2],d=Math.hypot(e[0]-q[0],e[1]-q[1])||1,ux=(e[0]-q[0])/d,uy=(e[1]-q[1])/d,h=fs*.36,k=h*.42;
 g.beginPath();g.moveTo(e[0],e[1]);g.lineTo(e[0]-ux*h-uy*k,e[1]-uy*h+ux*k);g.lineTo(e[0]-ux*h+uy*k,e[1]-uy*h-ux*k);g.closePath();g.fill();
}

function drawItem(g,L,it,fs,sp=.15,gp=.17,dr=.14){
 const X=x=>L.ix+x*L.iw,Y=y=>L.iy+y*L.ih;
 g.font=`${fs}px ${FONT}`;g.textBaseline='middle';g.lineJoin='round';
 const halo=(t,x,y,al)=>{g.textAlign=al;g.lineWidth=fs/3;g.strokeStyle='#fff';g.strokeText(t,x,y);g.fillStyle='#111';g.fillText(t,x,y);};
 if(it.t=='p'){
  const x=X(it.x),y=Y(it.y),r=it.nd?0:fs*dr;/* dr = புள்ளியின் ஆரம் (எழுத்து அளவின் பகுதி) */
  if(it.lx!=null){
   const lx=X(it.lx),ly=Y(it.ly),w=g.measureText(it.n).width;
   drawArrow(g,fs,lx,ly,x,y,r,w);
   halo(it.n,lx,ly,'center');
  }else halo(it.n,x+r+6,y-fs*.45,'left');
  if(!it.nd){g.fillStyle='#d6212b';g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.stroke();}
 }else if(it.t=='a'){
  const col=it.c||'#ff9800',pt=it.pt||'s',pp=()=>{g.beginPath();it.pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.closePath();};
  pp();
  if(pt=='s'){g.globalAlpha=.45;g.fillStyle=col;g.fill();g.globalAlpha=1;}
  else{/* வடிவமைப்பு: h=கிடைமட்டம் v=செங்குத்து d1=/ d2=\ g=கட்டம் x=குறுக்குக் கட்டம் o=புள்ளிகள் */
   g.save();g.clip();g.strokeStyle=g.fillStyle=col;g.lineWidth=3;
   const xs=it.pts.map(p=>X(p[0])),ys=it.pts.map(p=>Y(p[1])),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),S=16,H=y1-y0,W=x1-x0;
   const ln=(a,b,c,d)=>{g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke();};
   if(pt=='h'||pt=='g')for(let y=y0;y<=y1;y+=S)ln(x0,y,x1,y);
   if(pt=='v'||pt=='g')for(let x=x0;x<=x1;x+=S)ln(x,y0,x,y1);
   if(pt=='d1'||pt=='x')for(let k=-H;k<=W;k+=S)ln(x0+k,y1,x0+k+H,y0);
   if(pt=='d2'||pt=='x')for(let k=-H;k<=W;k+=S)ln(x0+k,y0,x0+k+H,y1);
   if(pt=='o')for(let y=y0;y<=y1;y+=S)for(let x=x0;x<=x1;x+=S){g.beginPath();g.arc(x,y,3,0,7);g.fill();}
   g.restore();}
  pp();g.strokeStyle=col;g.lineWidth=3;g.stroke();
  /* பெயர்: நகர்த்தியிருந்தால் (lx,ly) அங்கே, இல்லையெனில் நடுவில் */
  const c=it.lx!=null?[it.lx,it.ly]:centroid(it.pts);halo(it.n,X(c[0]),Y(c[1]),'center');
 }else if(it.t=='d'){/* அணை / கால்வாய்: அருகருகே இணை இரு கோடுகள் (கோடுகள் மட்டும்). பெயர் தனியாக (lx,ly) */
  const P=it.pts.map(p=>[X(p[0]),Y(p[1])]),h=fs*gp;/* gp = இரு கோடுகளுக்கு இடையிலான பாதி இடைவெளி */
  const N=P.map((p,i)=>{const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;return[-dy/d*h,dx/d*h];});
  g.strokeStyle='#111';g.lineWidth=2.5;
  [1,-1].forEach(s=>{g.beginPath();P.forEach((p,i)=>{const x=p[0]+N[i][0]*s,y=p[1]+N[i][1]*s;i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();});
  if(it.lx!=null){
   const lx=X(it.lx),ly=Y(it.ly),w=g.measureText(it.n).width,q=nearest(P,lx,ly);
   if(q[2]>fs*1.3)drawArrow(g,fs,lx,ly,q[0],q[1],h,w);/* பெயர் கோட்டிலிருந்து தொலைவில் இருந்தால் அம்பு */
   halo(it.n,lx,ly,'center');
  }
 }else if(it.t=='r'){
  /* ox,oy = நகர்த்துவதால் ஏற்படும் இடப்பெயர்ச்சி */
  let P=it.pts.map(p=>[X(p[0]+(it.ox||0)),Y(p[1]+(it.oy||0))]);if(P[0][0]>P[P.length-1][0])P.reverse();
  const Ld=[0];for(let i=1;i<P.length;i++)Ld[i]=Ld[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);
  const tot=Ld[Ld.length-1];
  /* பாதையை விடப் பெயர் நீளமாக இருந்தால் கடைசி கோட்டின் வழியே நீட்டிக்கொள்ளும் (எழுத்துகள் ஓரிடத்தில் குவியாது) */
  const at=s=>{let i=1;if(s>=tot)i=P.length-1;else if(s>0)while(Ld[i]<s)i++;
   const f=(s-Ld[i-1])/((Ld[i]-Ld[i-1])||1);return[P[i-1][0]+(P[i][0]-P[i-1][0])*f,P[i-1][1]+(P[i][1]-P[i-1][1])*f];};
  const ch=[];graphemes(it.n).forEach(x=>{const l=ch[ch.length-1];if(l&&(/\u200D$/.test(l)||x[0]=='\u200D'))ch[ch.length-1]=l+x;else ch.push(x);});
  const pre=[0];for(let i=1;i<=ch.length;i++)pre[i]=g.measureText(ch.slice(0,i).join('')).width;
  const gap=fs*sp,tw=pre[ch.length]+gap*(ch.length-1);
  g.textAlign='center';
  ch.forEach((c,i)=>{const adv=pre[i+1]-pre[i],m=(tot-tw)/2+pre[i]+gap*i+adv/2,p=at(m),a=at(m-5),b=at(m+5),ang=Math.atan2(b[1]-a[1],b[0]-a[0]);
   g.save();g.translate(p[0],p[1]);g.rotate(ang);g.lineWidth=fs/3;g.strokeStyle='#fff';g.strokeText(c,0,-fs*.6);g.fillStyle='#0a3d91';g.fillText(c,0,-fs*.6);g.restore();});
 }
}

/* o: {fs, grid, show(i)} */
function render(cv,img,L,items,o={}){
 cv.width=L.W;cv.height=L.H;const g=cv.getContext('2d');
 g.fillStyle='#fff';g.fillRect(0,0,L.W,L.H);g.drawImage(img,L.ix,L.iy,L.iw,L.ih);
 if(o.grid!==false){
  g.strokeStyle='#1aa7ec';g.lineWidth=2;g.fillStyle='#111';g.font=`bold 30px ${FONT}`;g.textAlign='center';g.textBaseline='middle';
  for(let c=0;c<=L.cols;c++){const x=L.ix+c*L.cw;g.beginPath();g.moveTo(x,L.iy);g.lineTo(x,L.iy+L.ih);g.stroke();if(c<L.cols)g.fillText(colName(c),x+L.cw/2,L.iy-28);}
  for(let r=0;r<=L.rows;r++){const y=L.iy+r*L.ch;g.beginPath();g.moveTo(L.ix,y);g.lineTo(L.ix+L.iw,y);g.stroke();if(r<L.rows)g.fillText(r+1,L.ix-30,y+L.ch/2);}
 }
 items.forEach((it,i)=>{if(!o.show||o.show(i))drawItem(g,L,it,o.fs||26,o.sp??.15,o.gp??.17,o.dr??.14);});
 g.fillStyle='#111';g.textAlign='center';g.textBaseline='middle';
 if(o.title){let f=54;g.font=`bold ${f}px ${FONT}`;const mw=L.W-2*MG*.6;
  const w=g.measureText(o.title).width;if(w>mw){f=Math.floor(f*mw/w);g.font=`bold ${f}px ${FONT}`;}
  g.fillText(o.title,L.W/2,L.iy/2);}
 if(o.footer){g.font=`24px ${FONT}`;g.fillText(o.footer,L.W/2,(L.iy+L.ih+L.H)/2);}
 return g;
}

/* ===== பெயர்கள் / புள்ளிகளை நகர்த்துதல் (index மற்றும் editor இரண்டுக்கும் பொது) =====
   (nx,ny) = வரைபடத்தின் மீது 0..1 புள்ளி. show(i) = தெரியும் உருப்படிகள் மட்டும் (index).
   திரும்பக் கிடைப்பது: {i, keys:[மாறும் இரு தரவு விசைகள்], bx,by: அவற்றின் தற்போதைய மதிப்பு} அல்லது null */
function hitItem(g,L,items,show,nx,ny,fs,dr){
 const X=x=>L.ix+x*L.iw,Y=y=>L.iy+y*L.ih,mx=X(nx),my=Y(ny);
 g.font=`${fs}px ${FONT}`;
 for(let i=items.length-1;i>=0;i--){
  if(show&&!show(i))continue;const it=items[i],w=g.measureText(it.n).width;
  if(it.t=='p'){
   const x=X(it.x),y=Y(it.y),r=it.nd?0:fs*dr;
   if(Math.hypot(mx-x,my-y)<=Math.max(10,r+6))return{i,keys:['x','y'],bx:it.x,by:it.y};
   let cx,cy;
   if(it.lx!=null){cx=X(it.lx);cy=Y(it.ly);}else{cx=x+r+6+w/2;cy=y-fs*.45;}
   if(Math.abs(mx-cx)<=w/2+8&&Math.abs(my-cy)<=fs/2+8)return{i,keys:['lx','ly'],bx:(cx-L.ix)/L.iw,by:(cy-L.iy)/L.ih};
  }else if(it.t=='r'){
   const P=it.pts.map(p=>[X(p[0]+(it.ox||0)),Y(p[1]+(it.oy||0))]);
   if(P.length>1&&nearest(P,mx,my-fs*.6)[2]<=Math.max(16,fs*.8))return{i,keys:['ox','oy'],bx:it.ox||0,by:it.oy||0};
  }else{/* a, d */
   let cx,cy;
   if(it.lx!=null){cx=X(it.lx);cy=Y(it.ly);}
   else if(it.t=='a'){const c=centroid(it.pts);cx=X(c[0]);cy=Y(c[1]);}
   else continue;/* பெயர் வைக்கப்படாத அணை */
   if(Math.abs(mx-cx)<=w/2+8&&Math.abs(my-cy)<=fs/2+8)return{i,keys:['lx','ly'],bx:(cx-L.ix)/L.iw,by:(cy-L.iy)/L.ih};
  }
 }
 return null;
}
/* இழுக்கும்போது மதிப்புகளைப் பயன்படுத்துதல் */
function dragTo(d,nx,ny){
 const r=n=>Math.round(n*1e4)/1e4,c=(k,v)=>k=='ox'||k=='oy'?Math.min(1,Math.max(-1,v)):Math.min(1,Math.max(0,v));
 d.it[d.keys[0]]=r(c(d.keys[0],nx+d.ox));d.it[d.keys[1]]=r(c(d.keys[1],ny+d.oy));
}

/* canvas → கோப்புகள் */
function pointer(cv,L,e){const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*L.W/r.width,y=(e.clientY-r.top)*L.H/r.height;return[(x-L.ix)/L.iw,(y-L.iy)/L.ih];}
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
function exportJPG(cv,name){cv.toBlob(b=>dl(b,name+'.jpg'),'image/jpeg',.95);}
function exportPDF(cv,name,land){
 const jpg=Uint8Array.from(atob(cv.toDataURL('image/jpeg',.95).split(',')[1]),c=>c.charCodeAt(0));
 const pw=land?841.89:595.28,ph=land?595.28:841.89,enc=new TextEncoder(),parts=[],offs=[];let len=0;
 const add=d=>{if(typeof d=='string')d=enc.encode(d);parts.push(d);len+=d.length;};
 const obj=(i,s)=>{offs[i]=len;add(i+' 0 obj\n'+s+'\nendobj\n');};
 add('%PDF-1.4\n');
 obj(1,'<</Type/Catalog/Pages 2 0 R>>');obj(2,'<</Type/Pages/Kids[3 0 R]/Count 1>>');
 obj(3,`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${pw} ${ph}]/Resources<</XObject<</I 4 0 R>>>>/Contents 5 0 R>>`);
 offs[4]=len;add(`4 0 obj\n<</Type/XObject/Subtype/Image/Width ${cv.width}/Height ${cv.height}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpg.length}>>\nstream\n`);add(jpg);add('\nendstream\nendobj\n');
 const c=`q ${pw} 0 0 ${ph} 0 0 cm /I Do Q`;obj(5,`<</Length ${c.length}>>\nstream\n${c}\nendstream`);
 const x=len;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(String(offs[i]).padStart(10,'0')+' 00000 n \n');
 add(`trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${x}\n%%EOF`);
 dl(new Blob(parts,{type:'application/pdf'}),name+'.pdf');
}

/* ===================== ADMIN கடவுச்சொல் =====================
   கடவுச்சொல்லை நேரடியாக இங்கே எழுதாதீர்கள்; அதன் "hash" மட்டும் இங்கே வைக்கவும்.
   Hash பெறும் முறை: index.html → நிர்வாகம் → (கடவுச்சொல் இன்னும் அமைக்கப்படவில்லை) பகுதி.
   கிடைக்கும் நீண்ட எழுத்துத் தொடரை கீழே '' இடையே ஒட்டவும். */
const ADMIN_HASH='c8ba01aaed02efcd39c630d08275284a64a99361bc9d1aad153ea8df844d04ff';
/* ========================================================= */
async function sha(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('geosketch:'+t));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
const isAdmin=()=>!!ADMIN_HASH&&sessionStorage.getItem('gs_admin')===ADMIN_HASH;

/* அடிக்குறிப்பு: உருவாக்கியது: GeoSketch | Eduhelp.lk. தேதி (இன்றைய தேதி dd.mm.yyyy ஆக தானாக) */
function footerText(){const d=new Date(),p=n=>String(n).padStart(2,'0');return`உருவாக்கியது: GeoSketch | Eduhelp.lk. ${p(d.getDate())}.${p(d.getMonth()+1)}.${d.getFullYear()}`;}

/* ===== பெரிதாக்கு / சிறிதாக்கு (index.html மற்றும் editor.html இரண்டுக்கும்) =====
   பொத்தான்கள்: − + அகலத்திற்கு | Ctrl + சுட்டி உருளை | scroll bars மூலம் pan */
function setupZoom(cv,box,getL,vp){
 const st=document.createElement('style');
 st.textContent='.zbar{position:absolute;right:20px;top:10px;z-index:5;display:flex;gap:4px;align-items:center;background:#fffe;padding:4px 6px;border-radius:8px;box-shadow:0 1px 8px #0004}.zbar button{padding:3px 10px}.zbar span{min-width:46px;text-align:center;font-size:13px;color:#0d2b45}.zbar button.on{background:#0d2b45}.zbar.zmin>*:not([data-a=pan]):not([data-a=min]){display:none}canvas.zpan{touch-action:none!important;cursor:grab!important}@media(max-width:700px){.zbar{right:8px;top:6px;padding:3px 4px;gap:3px}.zbar button{padding:3px 8px;font-size:13px}.zbar span{min-width:36px;font-size:12px}}';
 document.head.appendChild(st);
 const bar=document.createElement('div');bar.className='zbar';
 bar.innerHTML='<button data-a="out" title="சிறிதாக்கு">−</button><span>100%</span><button data-a="in" title="பெரிதாக்கு">+</button><button data-a="w">அகலத்திற்கு</button><button data-a="fit">பொருந்தும்படி</button><button data-a="pan" title="ஒரு விரலால் வரைபடத்தை இழுக்கவும் (Scroll). மீண்டும் அழுத்தி செயலிழக்கச் செய்யவும்">✥</button><button data-a="min" title="இந்தப் பெட்டியைச் சிறிதாக்கு/பெரிதாக்கு">⋯</button>';
 vp.appendChild(bar);
 cv.style.maxWidth=cv.style.maxHeight='none';cv.style.flex='none';cv.style.margin='auto';
 let z=1,pm=false,pn=null,swallow=false,api=null;
/* ---- வரைபடத்தை இழுக்கும் (pan) முறை: ✥ பொத்தான், அல்லது நகர்த்தும் கருவியில் வெற்று இடத்தை இழுக்கும்போது (Z.startPan) ---- */
 function startPan(e){pn={x:e.clientX,y:e.clientY,sl:box.scrollLeft,st:box.scrollTop,id:e.pointerId,mv:false};try{cv.setPointerCapture(e.pointerId);}catch(_){}}
 addEventListener('pointermove',e=>{if(!pn||e.pointerId!=pn.id)return;const dx=e.clientX-pn.x,dy=e.clientY-pn.y;
  if(Math.abs(dx)+Math.abs(dy)>4)pn.mv=true;box.scrollLeft=pn.sl-dx;box.scrollTop=pn.st-dy;});
 const endPan=e=>{if(pn&&e.pointerId==pn.id){swallow=pn.mv;pn=null;setTimeout(()=>swallow=false,60);}};
 addEventListener('pointerup',endPan);addEventListener('pointercancel',endPan);
 cv.addEventListener('pointerdown',e=>{if(!pm)return;startPan(e);e.stopImmediatePropagation();e.preventDefault();},true);
 cv.addEventListener('click',e=>{if(pm||swallow){e.stopImmediatePropagation();e.preventDefault();}},true);
 const fit=()=>{const L=getL();return Math.max(.05,Math.min((box.clientWidth-6)/L.W,(box.clientHeight-6)/L.H));};
 function apply(){const L=getL();if(!L)return;const f=fit()*z;cv.style.width=L.W*f+'px';cv.style.height=L.H*f+'px';bar.children[1].textContent=Math.round(z*100)+'%';if(api&&api.onzoom)api.onzoom();}
 function set(nz,cx,cy){
  if(!getL())return;nz=Math.min(8,Math.max(.2,nz));
  const b=box.getBoundingClientRect();if(cx==null){cx=box.clientWidth/2;cy=box.clientHeight/2;}
  const r=cv.getBoundingClientRect(),fx=(b.left+cx-r.left)/r.width,fy=(b.top+cy-r.top)/r.height;
  z=nz;apply();
  const r2=cv.getBoundingClientRect();
  box.scrollLeft+=r2.left+fx*r2.width-(b.left+cx);box.scrollTop+=r2.top+fy*r2.height-(b.top+cy);
 }
 function reset(){z=1;apply();box.scrollLeft=box.scrollTop=0;}
 bar.onclick=e=>{const a=e.target.dataset.a;if(!a)return;
  if(a=='pan'){pm=!pm;cv.classList.toggle('zpan',pm);e.target.classList.toggle('on',pm);return;}
  if(a=='min'){bar.classList.toggle('zmin');return;}
  if(a=='in')set(z*1.25);else if(a=='out')set(z/1.25);else if(a=='fit')reset();
  else if(a=='w'){z=1;set(((box.clientWidth-24)/getL().W)/fit());box.scrollTop=0;}};
 box.addEventListener('wheel',e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();
  const b=box.getBoundingClientRect();set(z*(e.deltaY<0?1.12:1/1.12),e.clientX-b.left,e.clientY-b.top);},{passive:false});
 addEventListener('resize',apply);
 api={apply,reset,startPan};return api;
}


/* ===================== வகைகள் (Categories) =====================
   உருப்படியின் வகைகள்: it.g = ['ஆறு','குளம்',...]  (ஒன்றுக்கு மேற்பட்டவை இருக்கலாம்; இல்லையெனில் it.g இல்லை)
   DEFCATS = தொடக்க வகைப் பட்டியல். புதிய வகைகளை editor/index-ல் Dropdown மூலமே சேர்க்கலாம். */
const DEFCATS=['ஆறு','துணை ஆறு','வரலாற்றுத் தலம்','ஆதி வரலாற்றுத் தலம்','வரலாற்றுக்கு முந்தைய தலம்','துறைமுகம்','நாடு','பகுதி','நகரம்','பழைய நிர்வாக அலகு','புதிய நிர்வாக அலகு','இராச்சியம்','உப நிர்வாக மையம்','குளம்','கால்வாய்','அணை'];
const catList=(...ex)=>{const s=new Set(DEFCATS);ex.forEach(a=>(a||[]).forEach(c=>c&&s.add(c)));return[...s];};
/* தேர்வு ஆண்டுகள்: it.yr = ['2022','2019',...] (பல இருக்கலாம்; "2022(2021)" என்றும் எழுதலாம்). (it.y = வரைபடத்தின் y ஆயத்தொலை, எனவே yr பயன்படுத்தப்படுகிறது) */
const DEFYEARS=(()=>{const a=[];for(let y=new Date().getFullYear()+1;y>=2005;y--)a.push(String(y));return a;})();
const yrKey=v=>{const m=String(v).match(/\d{4}/);return m?+m[0]:0;};
const yearList=(...ex)=>{const s=new Set(DEFYEARS);ex.forEach(a=>(a||[]).forEach(c=>c&&s.add(String(c))));return[...s].sort((a,b)=>yrKey(b)-yrKey(a)||a.localeCompare(b));};
const usedYears=items=>{const s=new Set();(items||[]).forEach(it=>(it.yr||[]).forEach(c=>s.add(String(c))));return[...s];};
const usedCats=items=>{const s=new Set();(items||[]).forEach(it=>(it.g||[]).forEach(c=>s.add(c)));return[...s];};
/* பெயரின்படி வகைகளை ஊகித்தல் (வகை இல்லாத உருப்படிகளுக்கு மட்டும்) */
function guessCats(it){const n=(it.n||'').trim(),g=[];
 if(it.t=='r'||/(ஆறு|கங்கை|ஓயா|ஆரு)$/.test(n))g.push('ஆறு');
 if(/குளம்|வாவி|ஏரி/.test(n))g.push('குளம்');
 if(/கால்வாய்/.test(n))g.push('கால்வாய்');
 if(/அணை/.test(n))g.push('அணை');
 if(it.t=='d'&&!g.length)g.push('கால்வாய்');
 return g;}

/* வகை தேர்ந்தெடுக்கும் Widget: Dropdown + ➕ புதிய வகை + தேர்ந்தெடுத்த வகைகள் (chips)
   o.list() → அனைத்து வகைப் பெயர்கள் | o.onNew(name) → புதிய வகை உருவாக்கப்பட்டால் | o.onChange(arr)
   திரும்பக் கிடைப்பது {get(), set(arr), refresh()} */
function catPicker(host,o){
 if(!document.getElementById('cpst')){const st=document.createElement('style');st.id='cpst';
  st.textContent='.cp-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px}.cp select{flex:1;min-width:150px;padding:5px 8px;border-radius:6px;border:1px solid #9bb;color:#0d2b45;background:#fff;font:inherit}.cp button{padding:4px 9px!important;font-size:12px!important}.cp-nw{display:none;gap:6px;margin-top:6px}.cp-nw input{flex:1;padding:5px 8px!important}.cp-ch{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.cp-c{background:#e8f5fd;border:1px solid #1aa7ec;color:#0d2b45;border-radius:12px;padding:1px 4px 1px 9px;font-size:12px;display:inline-flex;gap:4px;align-items:center}.cp-c b{cursor:pointer;color:#d6212b;padding:0 4px}.cp-e{font-size:12px;color:#789}';
  document.head.appendChild(st);}
 host.classList.add('cp');let sel=[];
 host.innerHTML='<div class="cp-row"><select></select><button type="button" class="alt">➕ புதிய வகை</button></div><div class="cp-nw"><input type="text" placeholder="புதிய வகையின் பெயர்"><button type="button">சேர்க்கவும்</button></div><div class="cp-ch"></div>';
 const[row,nw,ch]=host.children,s=row.children[0],nb=row.children[1],ni=nw.children[0],nok=nw.children[1];
 if(o.newBtn)nb.textContent=o.newBtn;if(o.newPh)ni.placeholder=o.newPh;
 const fire=()=>o.onChange&&o.onChange(sel.slice());
 function render(){
  s.innerHTML='';s.add(new Option(o.ph||'— கீழிறங்கும் மெனுவிலிருந்து ஒரு வகையைத் தேர்ந்தெடுக்கவும் —',''));
  o.list().filter(c=>!sel.includes(c)).forEach(c=>s.add(new Option(c,c)));
  ch.innerHTML='';
  if(!sel.length){const e=document.createElement('span');e.className='cp-e';e.textContent=o.empty||'வகை தேர்ந்தெடுக்கப்படவில்லை (தேவையில்லை என்றால் அப்படியே விடவும்)';ch.appendChild(e);}
  sel.forEach(c=>{const x=document.createElement('span');x.className='cp-c';x.append(c);
   const b=document.createElement('b');b.textContent='×';b.title='அகற்று';b.onclick=()=>{sel=sel.filter(v=>v!=c);render();fire();};x.appendChild(b);ch.appendChild(x);});
 }
 s.onchange=()=>{if(s.value&&!sel.includes(s.value)){sel.push(s.value);render();fire();}};
 nb.onclick=()=>{const on=nw.style.display!='flex';nw.style.display=on?'flex':'none';if(on)ni.focus();};
 const addNew=()=>{const n=ni.value.trim();if(!n)return;if(!o.list().includes(n)&&o.onNew)o.onNew(n);
  if(!sel.includes(n))sel.push(n);ni.value='';nw.style.display='none';render();fire();};
 nok.onclick=addNew;ni.onkeydown=e=>{e.stopPropagation();if(e.key=='Enter'){e.preventDefault();addNew();}};
 render();
 return{get:()=>sel.slice(),set:a=>{sel=[...a];render();},refresh:render};
}
