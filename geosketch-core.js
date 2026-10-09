/* GeoSketch core – geosketch.html සහ editor.html දෙකම මෙය භාවිතා කරයි (එකම folder එකේ තබන්න) */
const B='https://raw.githubusercontent.com/urceduhelp/geo-sketch-map-make/main/';
const MAPS=[
{k:'ol_lanka',name:'සාමාන්‍ය පෙළ ලංකා සිතියම',url:B+'2022(2021)OL%20Lanka-01.jpg'},
{k:'ol_eurasia',name:'සාමාන්‍ය පෙළ යුරේසියා සිතියම',url:B+'2022(2021)OL%20Lanka-02.jpg'},
{k:'ol_world',name:'සම්පූර්ණ ලෝක සිතියම',url:B+'2022(2021)OL%20world-02.jpg'},
{k:'al_europe1',name:'උසස් පෙළ යුරෝපා සිතියම (කළු මුහුද දක්වා)',url:B+'AL_Europe_1.jpg'},
{k:'al_europe2',name:'උසස් පෙළ යුරෝපා සිතියම (කැස්පියන් මුහුද දක්වා)',url:B+'AL_Europe_2.jpg'},
{k:'al_lanka',name:'උසස් පෙළ ලංකා සිතියම',url:B+'AL_Lanka_India-01.jpg'},
{k:'al_india',name:'උසස් පෙළ ඉන්දියා සිතියම',url:B+'AL_Lanka_India-02.jpg'}
];
/* A4 @200dpi: 1654x2339 px. Margin = 1 inch = 200px. Grid cell ≈ 0.5 inch */
const MG=200,CELL=100,FONT="'Noto Sans Sinhala','Iskoola Pota',sans-serif";
const colName=i=>String.fromCharCode(65+i);
const fontReady=()=>document.fonts?document.fonts.load("24px 'Noto Sans Sinhala'").catch(()=>{}):Promise.resolve();

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

/* අයිතමයක් අයත් කොටු ලැයිස්තුව (dropdown සඳහා) */
function itemCells(L,it){
 const s=new Set(),add=(x,y)=>{if(x>=0&&y>=0&&x<=1&&y<=1)s.add(cellId(L,x,y));};
 if(it.t=='p'){add(it.x,it.y);return[...s];}
 const P=it.pts;
 P.forEach((p,i)=>{add(p[0],p[1]);if(i){const q=P[i-1];for(let k=1;k<40;k++)add(q[0]+(p[0]-q[0])*k/40,q[1]+(p[1]-q[1])*k/40);}});
 if(it.t=='a'){for(let c=0;c<L.cols;c++)for(let r=0;r<L.rows;r++)if(inPoly(P,(c+.5)/L.cols,(r+.5)/L.rows))s.add(colName(c)+(r+1));}
 return[...s];
}

function graphemes(t){return window.Intl&&Intl.Segmenter?[...new Intl.Segmenter('si',{granularity:'grapheme'}).segment(t)].map(x=>x.segment):Array.from(t);}

function drawItem(g,L,it,fs,sp=.15,gp=.17){
 const X=x=>L.ix+x*L.iw,Y=y=>L.iy+y*L.ih;
 g.font=`${fs}px ${FONT}`;g.textBaseline='middle';g.lineJoin='round';
 const halo=(t,x,y,al)=>{g.textAlign=al;g.lineWidth=fs/3;g.strokeStyle='#fff';g.strokeText(t,x,y);g.fillStyle='#111';g.fillText(t,x,y);};
 if(it.t=='p'){
  const x=X(it.x),y=Y(it.y),r=it.nd?0:fs*.14;
  if(it.lx!=null){
   /* ඊතලය: තිරස්/සිරස් පමණි – නමෙන් තිරස්ව තිතේ x දක්වා, ඉන්පසු 90° හැරී සිරස්ව තිතට */
   const lx=X(it.lx),ly=Y(it.ly),w=g.measureText(it.n).width,hw=w/2+6,hh=fs/2+6,dx=x-lx,dy=y-ly;
   const sx=dx>=0?1:-1,sy=dy>=0?1:-1;let P;
   if(Math.abs(dx)<=hw)P=[[x,ly+sy*hh],[x,y-sy*r]];
   else if(Math.abs(dy)<=hh)P=[[lx+sx*hw,y],[x-sx*r,y]];
   else P=[[lx+sx*hw,ly],[x,ly],[x,y-sy*r]];
   g.strokeStyle=g.fillStyle='#111';g.lineWidth=2;g.beginPath();P.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();
   const e=P[P.length-1],q=P[P.length-2],d=Math.hypot(e[0]-q[0],e[1]-q[1])||1,ux=(e[0]-q[0])/d,uy=(e[1]-q[1])/d,h=fs*.36,k=h*.42;
   g.beginPath();g.moveTo(e[0],e[1]);g.lineTo(e[0]-ux*h-uy*k,e[1]-uy*h+ux*k);g.lineTo(e[0]-ux*h+uy*k,e[1]-uy*h-ux*k);g.closePath();g.fill();
   halo(it.n,lx,ly,'center');
  }else halo(it.n,x+r+6,y-fs*.45,'left');
  if(!it.nd){g.fillStyle='#d6212b';g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.stroke();}
 }else if(it.t=='a'){
  const col=it.c||'#ff9800',pt=it.pt||'s',pp=()=>{g.beginPath();it.pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.closePath();};
  pp();
  if(pt=='s'){g.globalAlpha=.45;g.fillStyle=col;g.fill();g.globalAlpha=1;}
  else{/* pattern: h=තිරස් v=සිරස් d1=/ d2=\ g=කොටු x=ඇල කොටු o=තිත් */
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
  const c=centroid(it.pts);halo(it.n,X(c[0]),Y(c[1]),'center');
 }else if(it.t=='d'){/* අමුණ / ඇළ: ආසන්න සමාන්තර රේඛා ද්විත්වයක් */
  const P=it.pts.map(p=>[X(p[0]),Y(p[1])]),h=fs*gp;/* gp = රේඛා දෙක අතර අඩ පරතරය (අකුරු ප්‍රමාණයෙන් කොටසක්) */
  const N=P.map((p,i)=>{const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;return[-dy/d*h,dx/d*h];});
  g.strokeStyle='#111';g.lineWidth=2.5;
  [1,-1].forEach(s=>{g.beginPath();P.forEach((p,i)=>{const x=p[0]+N[i][0]*s,y=p[1]+N[i][1]*s;i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();});
  if(!it.hl){const m=P[P.length>>1];halo(it.n,(P[0][0]+P[P.length-1][0])/2,m[1]-fs*1.2,'center');}
 }else if(it.t=='r'){
  let P=it.pts.map(p=>[X(p[0]),Y(p[1])]);if(P[0][0]>P[P.length-1][0])P.reverse();
  const Ld=[0];for(let i=1;i<P.length;i++)Ld[i]=Ld[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);
  const tot=Ld[Ld.length-1];
  /* මාර්ගයට වඩා නම දිග නම් අග රේඛාව දිගේ දිගු කර ගනී (අකුරු එක තැනකට ගොඩ නොවේ) */
  const at=s=>{let i=1;if(s>=tot)i=P.length-1;else if(s>0)while(Ld[i]<s)i++;
   const f=(s-Ld[i-1])/((Ld[i]-Ld[i-1])||1);return[P[i-1][0]+(P[i][0]-P[i-1][0])*f,P[i-1][1]+(P[i][1]-P[i-1][1])*f];};
  const ch=[];graphemes(it.n).forEach(x=>{const l=ch[ch.length-1];if(l&&(/[\u0DCA]\u200D$|\u200D$/.test(l)||x[0]=='\u200D'))ch[ch.length-1]=l+x;else ch.push(x);});
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
 items.forEach((it,i)=>{if(!o.show||o.show(i))drawItem(g,L,it,o.fs||26,o.sp??.15,o.gp??.17);});
 g.fillStyle='#111';g.textAlign='center';g.textBaseline='middle';
 if(o.title){let f=54;g.font=`bold ${f}px ${FONT}`;const mw=L.W-2*MG*.6;
  const w=g.measureText(o.title).width;if(w>mw){f=Math.floor(f*mw/w);g.font=`bold ${f}px ${FONT}`;}
  g.fillText(o.title,L.W/2,L.iy/2);}
 if(o.footer){g.font=`24px ${FONT}`;g.fillText(o.footer,L.W/2,(L.iy+L.ih+L.H)/2);}
 return g;
}

/* canvas → ගොනු */
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

/* ===================== ADMIN PASSWORD =====================
   මුරපදය කෙලින්ම මෙහි නොලියයි; එහි "hash" එක පමණක් මෙහි තබයි.
   Hash එක ලබාගන්නා ආකාරය: index.html → Admin → (මුරපදය තවම සකසා නැත) කොටසින්.
   ලැබෙන දිගු අකුරු පෙළ පහත '' අතරට paste කරන්න. */
const ADMIN_HASH='c8ba01aaed02efcd39c630d08275284a64a99361bc9d1aad153ea8df844d04ff';
/* ========================================================= */
async function sha(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('geosketch:'+t));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
const isAdmin=()=>!!ADMIN_HASH&&sessionStorage.getItem('gs_admin')===ADMIN_HASH;

/* Footer: Created by GeoSketch | Eduhelp.lk. දිනය (අද දිනය dd.mm.yyyy ලෙස ස්වයංක්‍රීයව) */
function footerText(){const d=new Date(),p=n=>String(n).padStart(2,'0');return`Created by GeoSketch | Eduhelp.lk. ${p(d.getDate())}.${p(d.getMonth()+1)}.${d.getFullYear()}`;}
