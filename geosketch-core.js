/* GeoSketch core – index.html සහ editor.html දෙකම මෙය භාවිතා කරයි (එකම folder එකේ තබන්න) */
const B='https://raw.githubusercontent.com/urceduhelp/geo-sketch-map-make/main/';
const MAPS=[
{k:'ol_lanka',name:'සාමාන්‍ය පෙළ ලංකා සිතියම',url:B+'2022(2021)OL%20Lanka-01.jpg'},
{k:'ol_eurasia',name:'සාමාන්‍ය පෙළ යුරේසියා සිතියම',url:B+'2022 OL Euracia02.jpg'},
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

/* රේඛාවක (polyline) x,y ට ආසන්නතම ලක්ෂ්‍යය: [px,py,දුර] */
function nearest(P,x,y){let b=[P[0][0],P[0][1],1e9];
 for(let i=1;i<P.length;i++){const a=P[i-1],c=P[i],dx=c[0]-a[0],dy=c[1]-a[1],l=dx*dx+dy*dy||1,
  t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l)),px=a[0]+t*dx,py=a[1]+t*dy,d=Math.hypot(x-px,y-py);
  if(d<b[2])b=[px,py,d];}
 return b;}

/* අයිතමයක් අයත් කොටු ලැයිස්තුව (dropdown සඳහා) */
function itemCells(L,it){
 const s=new Set(),add=(x,y)=>{if(x>=0&&y>=0&&x<=1&&y<=1)s.add(cellId(L,x,y));};
 if(it.t=='p'){add(it.x,it.y);return[...s];}
 const ox=it.t=='r'?(it.ox||0):0,oy=it.t=='r'?(it.oy||0):0,P=it.pts.map(p=>[p[0]+ox,p[1]+oy]);
 P.forEach((p,i)=>{add(p[0],p[1]);if(i){const q=P[i-1];for(let k=1;k<40;k++)add(q[0]+(p[0]-q[0])*k/40,q[1]+(p[1]-q[1])*k/40);}});
 if(it.t=='a'){for(let c=0;c<L.cols;c++)for(let r=0;r<L.rows;r++)if(inPoly(P,(c+.5)/L.cols,(r+.5)/L.rows))s.add(colName(c)+(r+1));}
 return[...s];
}

function graphemes(t){return window.Intl&&Intl.Segmenter?[...new Intl.Segmenter('si',{granularity:'grapheme'}).segment(t)].map(x=>x.segment):Array.from(t);}

/* ඊතලය: නමෙන් තිරස්ව x දක්වා, ඉන්පසු 90° හැරී සිරස්ව ඉලක්කයට (r = ඉලක්කයේ අරය) */
function drawArrow(g,fs,lx,ly,x,y,r,w){
 const hw=w/2+6,hh=fs/2+6,dx=x-lx,dy=y-ly,sx=dx>=0?1:-1,sy=dy>=0?1:-1;let P;
 if(Math.abs(dx)<=hw)P=[[x,ly+sy*hh],[x,y-sy*r]];
 else if(Math.abs(dy)<=hh)P=[[lx+sx*hw,y],[x-sx*r,y]];
 else P=[[lx+sx*hw,ly],[x,ly],[x,y-sy*r]];
 g.strokeStyle=g.fillStyle='#111';g.lineWidth=2;g.beginPath();P.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();
 const e=P[P.length-1],q=P[P.length-2],d=Math.hypot(e[0]-q[0],e[1]-q[1])||1,ux=(e[0]-q[0])/d,uy=(e[1]-q[1])/d,h=fs*.36,k=h*.42;
 g.beginPath();g.moveTo(e[0],e[1]);g.lineTo(e[0]-ux*h-uy*k,e[1]-uy*h+ux*k);g.lineTo(e[0]-ux*h+uy*k,e[1]-uy*h-ux*k);g.closePath();g.fill();
}

/* ---------- ප්‍රදේශයක වර්ණය / රටාව: මායිම මෘදු ලෙස බොඳ වී යයි, සීමා රේඛාවක් (outline) නැත ----------
   වර්ණය / රටාව වෙනම තට්ටුවක ඇඳ, බොඳ කළ ප්‍රදේශ හැඩය "mask" එකක් ලෙස යොදයි. එක් වරක් ගණනය කර (cache) නැවත භාවිතා කරයි.
   බොඳ ප්‍රමාණය වෙනස් කිරීමට පහත  AREA_SOFT  අගය (1 = සාමාන්‍ය, 2 = තවත් බොඳ, 0.5 = අඩු බොඳ) වෙනස් කරන්න. */
const AREA_SOFT=1;
const AREA_CACHE=new WeakMap();
function areaLayer(L,it){
 const X=x=>L.ix+x*L.iw,Y=y=>L.iy+y*L.ih,col=it.c||'#ff9800',pt=it.pt||'s',
  xs=it.pts.map(p=>X(p[0])),ys=it.pts.map(p=>Y(p[1])),
  x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),
  bw=x1-x0,bh=y1-y0,bl=Math.max(8,Math.min(34,Math.min(bw,bh)*.08))*AREA_SOFT,m=Math.ceil(bl*2+4);
 const key=[col,pt,AREA_SOFT,L.W,L.ix,L.iy,L.iw,L.ih,it.pts.join(';')].join('|');
 const hit=AREA_CACHE.get(it);if(hit&&hit.key==key)return hit;
 const ow=Math.max(1,Math.ceil(bw+2*m)),oh=Math.max(1,Math.ceil(bh+2*m)),
  mk=()=>{const k=document.createElement('canvas');k.width=ow;k.height=oh;return k;},
  lay=mk(),a=lay.getContext('2d'),msk=mk(),b=msk.getContext('2d');
 /* 1) බොඳ වූ හැඩය (mask): හැඩය තිරයෙන් පිටත ඇඳ, එහි සෙවණැල්ල (shadow) පමණක් ඇතුළට ගෙන එයි */
 const OFF=ow+200;
 b.shadowColor='rgba(0,0,0,1)';b.shadowBlur=bl;b.shadowOffsetX=-OFF;b.shadowOffsetY=0;b.fillStyle='#000';
 b.beginPath();xs.forEach((x,i)=>{const px=x-x0+m+OFF,py=ys[i]-y0+m;i?b.lineTo(px,py):b.moveTo(px,py);});b.closePath();b.fill();
 /* 2) වර්ණය / රටාව ඇඳීම */
 a.translate(m-x0,m-y0);
 if(pt=='s'){a.fillStyle=col;a.fillRect(x0-m,y0-m,ow,oh);}
 else{/* pattern: h=තිරස් v=සිරස් d1=/ d2=\ g=කොටු x=ඇල කොටු o=තිත් */
  a.strokeStyle=a.fillStyle=col;a.lineWidth=3;
  const S=16,H=bh,W=bw,ln=(p,q,r,s)=>{a.beginPath();a.moveTo(p,q);a.lineTo(r,s);a.stroke();};
  if(pt=='h'||pt=='g')for(let y=y0;y<=y1;y+=S)ln(x0,y,x1,y);
  if(pt=='v'||pt=='g')for(let x=x0;x<=x1;x+=S)ln(x,y0,x,y1);
  if(pt=='d1'||pt=='x')for(let k=-H;k<=W;k+=S)ln(x0+k,y1,x0+k+H,y0);
  if(pt=='d2'||pt=='x')for(let k=-H;k<=W;k+=S)ln(x0+k,y0,x0+k+H,y1);
  if(pt=='o')for(let y=y0;y<=y1;y+=S)for(let x=x0;x<=x1;x+=S){a.beginPath();a.arc(x,y,3,0,7);a.fill();}
 }
 /* 3) බොඳ වූ හැඩයෙන් කපා ගැනීම */
 a.setTransform(1,0,0,1,0,0);a.globalCompositeOperation='destination-in';a.drawImage(msk,0,0);
 const r={key,cv:lay,x:x0-m,y:y0-m};AREA_CACHE.set(it,r);return r;
}

function drawItem(g,L,it,fs,sp=.15,gp=.17,dr=.14){
 const X=x=>L.ix+x*L.iw,Y=y=>L.iy+y*L.ih;
 g.font=`${fs}px ${FONT}`;g.textBaseline='middle';g.lineJoin='round';
 const halo=(t,x,y,al)=>{g.textAlign=al;g.lineWidth=fs/3;g.strokeStyle='#fff';g.strokeText(t,x,y);g.fillStyle='#111';g.fillText(t,x,y);};
 if(it.t=='p'){
  const x=X(it.x),y=Y(it.y),r=it.nd?0:fs*dr;/* dr = තිතේ අරය (අකුරු ප්‍රමාණයෙන් කොටසක්) */
  if(it.lx!=null){
   const lx=X(it.lx),ly=Y(it.ly),w=g.measureText(it.n).width;
   drawArrow(g,fs,lx,ly,x,y,r,w);
   halo(it.n,lx,ly,'center');
  }else halo(it.n,x+r+6,y-fs*.45,'left');
  if(!it.nd){g.fillStyle='#d6212b';g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.stroke();}
 }else if(it.t=='a'){
  if(it.pts&&it.pts.length>=3){/* වර්ණය / රටාව: මායිම බොඳ වී යයි, සීමා රේඛාවක් නැත */
   const lay=areaLayer(L,it);
   g.save();g.globalAlpha=(it.pt||'s')=='s'?.45:1;g.drawImage(lay.cv,lay.x,lay.y);g.restore();}
  /* නම: Move කර ඇත්නම් (lx,ly) එතැන, නැත්නම් මැද */
  const c=it.lx!=null?[it.lx,it.ly]:centroid(it.pts);halo(it.n,X(c[0]),Y(c[1]),'center');
 }else if(it.t=='d'){/* අමුණ / ඇළ: ආසන්න සමාන්තර රේඛා ද්විත්වයක් (ඉර පමණි). නම වෙනම තබයි (lx,ly) */
  const P=it.pts.map(p=>[X(p[0]),Y(p[1])]),h=fs*gp;/* gp = රේඛා දෙක අතර අඩ පරතරය */
  const N=P.map((p,i)=>{const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;return[-dy/d*h,dx/d*h];});
  g.strokeStyle='#111';g.lineWidth=2.5;
  [1,-1].forEach(s=>{g.beginPath();P.forEach((p,i)=>{const x=p[0]+N[i][0]*s,y=p[1]+N[i][1]*s;i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();});
  if(it.lx!=null){
   const lx=X(it.lx),ly=Y(it.ly),w=g.measureText(it.n).width,q=nearest(P,lx,ly);
   if(q[2]>fs*1.3)drawArrow(g,fs,lx,ly,q[0],q[1],h,w);/* නම රේඛාවෙන් ඈතනම් ඊතලයක් */
   halo(it.n,lx,ly,'center');
  }
 }else if(it.t=='r'){
  /* ox,oy = Move කිරීමෙන් ලැබෙන විස්ථාපනය */
  let P=it.pts.map(p=>[X(p[0]+(it.ox||0)),Y(p[1]+(it.oy||0))]);if(P[0][0]>P[P.length-1][0])P.reverse();
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
 items.forEach((it,i)=>{if(!o.show||o.show(i))drawItem(g,L,it,o.fs||26,o.sp??.15,o.gp??.17,o.dr??.14);});
 g.fillStyle='#111';g.textAlign='center';g.textBaseline='middle';
 if(o.title){let f=54;g.font=`bold ${f}px ${FONT}`;const mw=L.W-2*MG*.6;
  const w=g.measureText(o.title).width;if(w>mw){f=Math.floor(f*mw/w);g.font=`bold ${f}px ${FONT}`;}
  g.fillText(o.title,L.W/2,L.iy/2);}
 if(o.footer){g.font=`24px ${FONT}`;g.fillText(o.footer,L.W/2,(L.iy+L.ih+L.H)/2);}
 return g;
}

/* ===== නම් / තිත් Move කිරීම (index සහ editor දෙකටම පොදු) =====
   (nx,ny) = සිතියම මත 0..1 ලක්ෂ්‍යය. show(i) = පෙනෙන අයිතම පමණක් (index).
   ලැබෙන්නේ: {i, keys:[කුමන දත්ත දෙක වෙනස් වේද], bx,by: ඒවායේ දැනට අගය} හෝ null */
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
   else continue;/* නමක් තබා නැති අමුණක් */
   if(Math.abs(mx-cx)<=w/2+8&&Math.abs(my-cy)<=fs/2+8)return{i,keys:['lx','ly'],bx:(cx-L.ix)/L.iw,by:(cy-L.iy)/L.ih};
  }
 }
 return null;
}
/* drag කරන අතරතුර අගයන් යෙදීම */
function dragTo(d,nx,ny){
 const r=n=>Math.round(n*1e4)/1e4,c=(k,v)=>k=='ox'||k=='oy'?Math.min(1,Math.max(-1,v)):Math.min(1,Math.max(0,v));
 d.it[d.keys[0]]=r(c(d.keys[0],nx+d.ox));d.it[d.keys[1]]=r(c(d.keys[1],ny+d.oy));
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

/* ===== Zoom in / out (index.html සහ editor.html දෙකටම) =====
   බොත්තම්: − + පළලට ගැලපෙන | Ctrl + Mouse wheel | scroll bars වලින් pan */
function setupZoom(cv,box,getL,vp){
 const st=document.createElement('style');
 st.textContent='.zbar{position:absolute;right:20px;top:10px;z-index:5;display:flex;gap:4px;align-items:center;background:#fffe;padding:4px 6px;border-radius:8px;box-shadow:0 1px 8px #0004}.zbar button{padding:3px 10px}.zbar span{min-width:46px;text-align:center;font-size:13px;color:#0d2b45}.zbar button.on{background:#0d2b45}.zbar.zmin>*:not([data-a=pan]):not([data-a=min]){display:none}canvas.zpan{touch-action:none!important;cursor:grab!important}@media(max-width:700px){.zbar{right:8px;top:6px;padding:3px 4px;gap:3px}.zbar button{padding:3px 8px;font-size:13px}.zbar span{min-width:36px;font-size:12px}}';
 document.head.appendChild(st);
 const bar=document.createElement('div');bar.className='zbar';
 bar.innerHTML='<button data-a="out" title="Zoom out">−</button><span>100%</span><button data-a="in" title="Zoom in">+</button><button data-a="w">පළලට</button><button data-a="fit">ගැලපෙන</button><button data-a="pan" title="එක ඇඟිල්ලෙන් සිතියම අදින්න (Scroll). නැවත ඔබා අක්‍රිය කරන්න">✥</button><button data-a="min" title="මෙම පෙට්ටිය කුඩා/විශාල කරන්න">⋯</button>';
 vp.appendChild(bar);
 cv.style.maxWidth=cv.style.maxHeight='none';cv.style.flex='none';cv.style.margin='auto';
 let z=1,pm=false,pn=null,swallow=false,api=null;
/* ---- සිතියම අදින (pan) ක්‍රමය: ✥ බොත්තම, හෝ Move මෙවලමේදී හිස් තැනක් අදින විට (Z.startPan) ---- */
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
 /* (x0,y0)-(x1,y1) = සිතියම මත 0..1 ඛණ්ඩාංක සහිත සෘජුකෝණාස්‍රය; එය තිරයට ගැළපෙන සේ zoom කර මැදට ගෙන එයි */
 function focusRect(x0,y0,x1,y1){
  const L=getL();if(!L)return;
  const rw=Math.max(1,(x1-x0)*L.iw),rh=Math.max(1,(y1-y0)*L.ih),f0=fit();
  z=Math.min(8,Math.max(.2,Math.min((box.clientWidth-12)/rw,(box.clientHeight-12)/rh)/f0));apply();
  const r=cv.getBoundingClientRect(),b=box.getBoundingClientRect(),
   tx=r.left+((L.ix+(x0+x1)/2*L.iw)/L.W)*r.width,ty=r.top+((L.iy+(y0+y1)/2*L.ih)/L.H)*r.height;
  box.scrollLeft+=tx-(b.left+box.clientWidth/2);box.scrollTop+=ty-(b.top+box.clientHeight/2);
 }
 api={apply,reset,startPan,focusRect};return api;
}


/* ===================== වර්ග (Categories) =====================
   අයිතමයක වර්ග: it.g = ['ගංගාව','වැව',...]  (එකකට වඩා තිබිය හැක; නැතිනම් it.g නැත)
   DEFCATS = මුල් වර්ග ලැයිස්තුව. අලුත් වර්ග editor/index හි Dropdown එකෙන්ම එක් කළ හැක. */
const DEFCATS=['ගංගාව','අතු ගංගාව','ඓතිහාසික ස්ථානය','ප්‍රාග් ඓතිහාසික ස්ථානය','පූර්ව ඓතිහාසික ස්ථානය','වරාය','රට','ප්‍රදේශය','නගරය','පැරණි පරිපාලන ඒකකය','නව පරිපාලන ඒකකය','රාජධානිය','උපපාලන මධ්‍යස්ථානය','වැව','ඇළ මාර්ගය','අමුණ'];
const catList=(...ex)=>{const s=new Set(DEFCATS);ex.forEach(a=>(a||[]).forEach(c=>c&&s.add(c)));return[...s];};
/* විභාග වර්ෂ: it.yr = ['2022','2019',...] (කිහිපයක් විය හැක; "2022(2021)" වැනි ලිවිය ද හැක). (it.y = සිතියමේ y ඛණ්ඩාංකය, එබැවින් yr භාවිතා කරයි) */
const DEFYEARS=(()=>{const a=[];for(let y=new Date().getFullYear()+1;y>=2005;y--)a.push(String(y));return a;})();
const yrKey=v=>{const m=String(v).match(/\d{4}/);return m?+m[0]:0;};
const yearList=(...ex)=>{const s=new Set(DEFYEARS);ex.forEach(a=>(a||[]).forEach(c=>c&&s.add(String(c))));return[...s].sort((a,b)=>yrKey(b)-yrKey(a)||a.localeCompare(b));};
const usedYears=items=>{const s=new Set();(items||[]).forEach(it=>(it.yr||[]).forEach(c=>s.add(String(c))));return[...s];};
const usedCats=items=>{const s=new Set();(items||[]).forEach(it=>(it.g||[]).forEach(c=>s.add(c)));return[...s];};
/* නම අනුව වර්ග අනුමාන කිරීම (වර්ගයක් නැති අයිතම සඳහා පමණි) */
function guessCats(it){const n=(it.n||'').trim(),g=[];
 if(it.t=='r'||/(ගඟ|ඔය|ආරු)$/.test(n))g.push('ගංගාව');
 if(/වැව/.test(n))g.push('වැව');
 if(/ඇළ/.test(n))g.push('ඇළ මාර්ගය');
 if(/අමුණ/.test(n))g.push('අමුණ');
 if(it.t=='d'&&!g.length)g.push('ඇළ මාර්ගය');
 return g;}

/* වර්ග තෝරන Widget: Dropdown + ➕ අලුත් වර්ගයක් + තෝරාගත් වර්ග (chips)
   o.list() → සියලු වර්ග නාම | o.onNew(name) → අලුත් වර්ගයක් සෑදූ විට | o.onChange(arr)
   ලැබෙන්නේ {get(), set(arr), refresh()} */
function catPicker(host,o){
 if(!document.getElementById('cpst')){const st=document.createElement('style');st.id='cpst';
  st.textContent='.cp-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px}.cp select{flex:1;min-width:150px;padding:5px 8px;border-radius:6px;border:1px solid #9bb;color:#0d2b45;background:#fff;font:inherit}.cp button{padding:4px 9px!important;font-size:12px!important}.cp-nw{display:none;gap:6px;margin-top:6px}.cp-nw input{flex:1;padding:5px 8px!important}.cp-ch{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.cp-c{background:#e8f5fd;border:1px solid #1aa7ec;color:#0d2b45;border-radius:12px;padding:1px 4px 1px 9px;font-size:12px;display:inline-flex;gap:4px;align-items:center}.cp-c b{cursor:pointer;color:#d6212b;padding:0 4px}.cp-e{font-size:12px;color:#789}';
  document.head.appendChild(st);}
 host.classList.add('cp');let sel=[];
 host.innerHTML='<div class="cp-row"><select></select><button type="button" class="alt">➕ අලුත් වර්ගයක්</button></div><div class="cp-nw"><input type="text" placeholder="අලුත් වර්ගයේ නම"><button type="button">එක් කරන්න</button></div><div class="cp-ch"></div>';
 const[row,nw,ch]=host.children,s=row.children[0],nb=row.children[1],ni=nw.children[0],nok=nw.children[1];
 if(o.newBtn)nb.textContent=o.newBtn;if(o.newPh)ni.placeholder=o.newPh;
 const fire=()=>o.onChange&&o.onChange(sel.slice());
 function render(){
  s.innerHTML='';s.add(new Option(o.ph||'— Dropdown එකෙන් වර්ගයක් තෝරන්න —',''));
  o.list().filter(c=>!sel.includes(c)).forEach(c=>s.add(new Option(c,c)));
  ch.innerHTML='';
  if(!sel.length){const e=document.createElement('span');e.className='cp-e';e.textContent=o.empty||'වර්ගයක් තෝරා නැත (අවශ්‍ය නැතිනම් එලෙසම තබන්න)';ch.appendChild(e);}
  sel.forEach(c=>{const x=document.createElement('span');x.className='cp-c';x.append(c);
   const b=document.createElement('b');b.textContent='×';b.title='ඉවත් කරන්න';b.onclick=()=>{sel=sel.filter(v=>v!=c);render();fire();};x.appendChild(b);ch.appendChild(x);});
 }
 s.onchange=()=>{if(s.value&&!sel.includes(s.value)){sel.push(s.value);render();fire();}};
 nb.onclick=()=>{const on=nw.style.display!='flex';nw.style.display=on?'flex':'none';if(on)ni.focus();};
 const addNew=()=>{const n=ni.value.trim();if(!n)return;if(!o.list().includes(n)&&o.onNew)o.onNew(n);
  if(!sel.includes(n))sel.push(n);ni.value='';nw.style.display='none';render();fire();};
 nok.onclick=addNew;ni.onkeydown=e=>{e.stopPropagation();if(e.key=='Enter'){e.preventDefault();addNew();}};
 render();
 return{get:()=>sel.slice(),set:a=>{sel=[...a];render();},refresh:render};
}


/* ===================== RANDOM MAP =====================
   openRandomMap(L, items, onDone) : popup එක විවෘත කරයි. onDone(set, info) → set = තෝරාගත් අයිතමවල index (Set)
   addRandomButton(parent, getL, getItems, onDone) : "🎲 Random Map" බොත්තම සාදා parent එකට එක් කරයි
   භාවිතය (index/editor හි):
     let rndSet=null;   // null = සියල්ල පෙන්වන්න
     render(...,{show:i=>(!rndSet||rndSet.has(i))&&(ඔබේ දැනට ඇති කොන්දේසිය)});
     addRandomButton(toolbar,()=>L,()=>items,set=>{rndSet=set;redraw();});
     සාමාන්‍ය සිතියමට ආපසු යාමට: rndSet=null; redraw(); */
const gOf=it=>(it.g&&it.g.length)?it.g:guessCats(it);

/* අයිතමයක නියෝජන ලක්ෂ්‍යය (0..1) - ලක්ෂ්‍ය: තිත, ප්‍රදේශ: කේන්ද්‍රය, රේඛා: දිගේ මැද */
function repPoint(it){
 if(it.t=='p')return[it.x,it.y];
 if(it.t=='a')return centroid(it.pts);
 const ox=it.t=='r'?(it.ox||0):0,oy=it.t=='r'?(it.oy||0):0,P=it.pts;
 let tot=0;for(let i=1;i<P.length;i++)tot+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);
 let h=tot/2;
 for(let i=1;i<P.length;i++){const l=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);
  if(h<=l||i==P.length-1){const f=l?Math.min(1,h/l):0;return[P[i-1][0]+(P[i][0]-P[i-1][0])*f+ox,P[i-1][1]+(P[i][1]-P[i-1][1])*f+oy];}
  h-=l;}
 return[P[0][0]+ox,P[0][1]+oy];
}

/* තේරීමේ ඇල්ගොරිතමය */
function randomPick(items,L,cats,n){
 if(!cats.length)return{err:'අවම වශයෙන් වර්ගයක් තෝරන්න.'};
 if(n<cats.length)return{err:`තෝරාගත් වර්ග ගණන ${cats.length} කි. ස්ථාන ගණන (${n}) වර්ග ගණනට වඩා අඩුය. සියලු වර්ග ආවරණය කිරීමට අවම වශයෙන් ස්ථාන ${cats.length} ක් අවශ්‍යයි.`};
 const pool={};cats.forEach(c=>pool[c]=[]);
 const meta=items.map((it,i)=>{
  const p=repPoint(it),g=gOf(it).filter(c=>cats.includes(c));
  g.forEach(c=>pool[c].push(i));
  return{p,g,cc:Math.min(L.cols-1,Math.max(0,Math.floor(p[0]*L.cols))),rr:Math.min(L.rows-1,Math.max(0,Math.floor(p[1]*L.rows)))};});
 const empty=cats.filter(c=>!pool[c].length);
 if(empty.length)return{err:'මෙම වර්ග වල ස්ථාන නැත: '+empty.join(', ')};
 const total=new Set(cats.flatMap(c=>pool[c])).size;
 let capped=false;if(n>total){n=total;capped=true;}
 const chosen=[],has=new Set();let relaxed=0;
 const cnt=c=>chosen.filter(i=>meta[i].g.includes(c)).length;
 /* එකම වර්ගයේ ස්ථාන එකම කොටුවේ හෝ ආසන්න (8 දිශාවේ) කොටුවල නොවිය යුතුය */
 const ok=i=>chosen.every(j=>!meta[i].g.some(c=>meta[j].g.includes(c))||Math.max(Math.abs(meta[i].cc-meta[j].cc),Math.abs(meta[i].rr-meta[j].rr))>=2);
 const spread=i=>chosen.length?Math.min(...chosen.map(j=>Math.hypot((meta[i].p[0]-meta[j].p[0])*L.iw,(meta[i].p[1]-meta[j].p[1])*L.ih))):1e9;
 /* සිතියම පුරා විසිරීම: දැනට ඇති ස්ථාන වලින් වඩාත්ම ඈත අපේක්ෂකයා (random බරක් සහිතව) */
 function pick(cands){
  cands=cands.filter(i=>!has.has(i));if(!cands.length)return false;
  let g=cands.filter(ok);if(!g.length){g=cands;relaxed++;}
  let best=-1,bs=-1;
  g.forEach(i=>{const s=Math.min(spread(i),L.iw)*(.65+.7*Math.random());if(s>bs){bs=s;best=i;}});
  chosen.push(best);has.add(best);return true;
 }
 /* 1) සියලු වර්ග ආවරණය (අඩුම ස්ථාන ඇති වර්ග මුලින්) */
 [...cats].sort((a,b)=>pool[a].length-pool[b].length).forEach(c=>{if(!cnt(c))pick(pool[c]);});
 /* 2) කෝටා: වැඩි ස්ථාන ඇති වර්ගයට වැඩි ගණනක් (D'Hondt ක්‍රමය) */
 const quota={};cats.forEach(c=>quota[c]=1);
 for(let r=n-cats.length;r>0;r--){
  let b=null,bv=-1;cats.forEach(c=>{if(quota[c]<pool[c].length){const v=pool[c].length/(quota[c]+1);if(v>bv){bv=v;b=c;}}});
  if(!b)break;quota[b]++;}
 /* 3) කෝටා පිරවීම (වර්ග මාරුවෙන් මාරුවට, එවිට විසිරීම හොඳයි) */
 while(chosen.length<n){
  let prog=false;
  [...cats].sort(()=>Math.random()-.5).forEach(c=>{
   if(chosen.length<n&&cnt(c)<quota[c]&&pick(pool[c]))prog=true;});
  if(!prog)break;}
 while(chosen.length<n&&pick([...new Set(cats.flatMap(c=>pool[c]))]));
 return{idx:new Set(chosen),relaxed,capped,n:chosen.length};
}

/* Popup */
function openRandomMap(L,items,onDone){
 const cnt={};items.forEach(it=>gOf(it).forEach(c=>cnt[c]=(cnt[c]||0)+1));
 const cl=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]);
 if(!cl.length){alert('දත්ත ගබඩාවේ වර්ග සහිත ස්ථාන නැත.');return;}
 const bg=document.createElement('div');
 bg.style.cssText='position:fixed;inset:0;background:#0007;z-index:9999;display:flex;align-items:center;justify-content:center;padding:10px';
 const bx=document.createElement('div');
 bx.style.cssText='background:#fff;border-radius:12px;padding:16px;max-width:460px;width:100%;max-height:90vh;overflow:auto;color:#0d2b45;font-family:'+FONT+';box-shadow:0 4px 24px #0006';
 bx.innerHTML='<h3 style="margin:0 0 10px">🎲 Random Map</h3>'
 +'<label>ඇතුළත් කළ යුතු ස්ථාන ගණන: <input type="number" min="1" value="20" id="rm_n" style="width:80px;padding:4px"></label>'
 +'<div style="margin:12px 0 4px"><b>ආවරණය විය යුතු වර්ග:</b> <button type="button" id="rm_all">සියල්ල</button> <button type="button" id="rm_none">කිසිවක් නැත</button></div>'
 +'<div id="rm_l" style="display:flex;flex-direction:column;gap:3px;max-height:40vh;overflow:auto;border:1px solid #9bb;border-radius:6px;padding:6px"></div>'
 +'<div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button type="button" id="rm_x">අවලංගු</button><button type="button" id="rm_ok">සිතියම සාදන්න</button></div>';
 bg.appendChild(bx);document.body.appendChild(bg);
 const lst=bx.querySelector('#rm_l');
 cl.forEach(c=>{const l=document.createElement('label');l.innerHTML='<input type="checkbox" value="" checked> ';
  l.firstChild.value=c;l.append(`${c} (${cnt[c]})`);lst.appendChild(l);});
 const boxes=()=>[...lst.querySelectorAll('input')];
 bx.querySelector('#rm_all').onclick=()=>boxes().forEach(b=>b.checked=true);
 bx.querySelector('#rm_none').onclick=()=>boxes().forEach(b=>b.checked=false);
 bx.querySelector('#rm_x').onclick=()=>bg.remove();
 bx.querySelector('#rm_ok').onclick=()=>{
  const n=parseInt(bx.querySelector('#rm_n').value,10),cats=boxes().filter(b=>b.checked).map(b=>b.value);
  if(!(n>0)){alert('ස්ථාන ගණන නිවැරදිව ඇතුළත් කරන්න.');return;}
  const r=randomPick(items,L,cats,n);
  if(r.err){alert('⚠ '+r.err);return;}
  bg.remove();
  let msg='';
  if(r.capped)msg+=`තෝරාගත් වර්ග වල ඇත්තේ ස්ථාන ${r.n} ක් පමණි, එබැවින් ඒ සියල්ල ගත්තෙමි. `;
  if(r.relaxed)msg+=`සමහර ස්ථාන ආසන්න වීමට ඉඩ ඇත (${r.relaxed}) - ඉඩ මදි නිසා.`;
  if(msg)alert(msg);
  onDone(r.idx,r);
 };
}
function addRandomButton(parent,getL,getItems,onDone){
 const b=document.createElement('button');b.type='button';b.textContent='🎲 Random Map';
 b.onclick=()=>{const L=getL();if(!L){alert('මුලින් සිතියමක් තෝරන්න.');return;}openRandomMap(L,getItems(),onDone);};
 parent.appendChild(b);return b;
}
