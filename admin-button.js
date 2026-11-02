/* GeoSketch - Admin බොත්තම (Supabase පිවිසුම → editor.html)
   භාවිතය: viewer පිටුවේ </body> ට හරියටම කලින් මෙම පේළිය එක් කරන්න:
   <script src="admin-button.js"></script>
*/
(function(){
 var TX={
  si:{b:'🔒 Admin',t:'Admin පිවිසුම',e:'ඊමේල්',p:'මුරපදය',g:'පිවිසෙන්න',err:'පිවිසීම අසාර්ථකයි: ඊමේල් හෝ මුරපදය වැරදියි'},
  ta:{b:'🔒 Admin',t:'Admin உள்நுழைவு',e:'மின்னஞ்சல்',p:'கடவுச்சொல்',g:'உள்நுழை',err:'உள்நுழைவு தோல்வி: மின்னஞ்சல் அல்லது கடவுச்சொல் தவறு'},
  en:{b:'🔒 Admin',t:'Admin login',e:'Email',p:'Password',g:'Sign in',err:'Sign-in failed: wrong email or password'}
 };
 var tx=function(){return TX[document.documentElement.lang]||TX.si;};
 var client=null;
 function sb(){
  if(!client)client=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,
   {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  return client;
 }

 /* බොත්තම */
 var btn=document.createElement('button');
 btn.id='adb';btn.type='button';
 btn.style.cssText='background:#555;color:#fff;border:0;font-weight:700;padding:6px 10px;border-radius:6px;cursor:pointer';
 var how=document.getElementById('hwo');
 if(how&&how.parentNode)how.parentNode.insertBefore(btn,how.nextSibling);
 else document.querySelector('header').appendChild(btn);

 /* පිවිසුම් කවුළුව */
 var w=document.createElement('div');
 w.style.cssText='position:fixed;inset:0;z-index:80;display:none;background:#0d2b45cc;align-items:flex-start;justify-content:center;padding:8vh 10px;overflow:auto';
 w.innerHTML='<div style="background:#fff;color:#0d2b45;border-radius:12px;max-width:380px;width:100%;box-shadow:0 10px 40px #0007">'+
  '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#1aa7ec;color:#fff;border-radius:10px 10px 0 0;font-weight:700;font-size:17px">'+
  '<span id="adT"></span><button id="adX" type="button" style="background:#ffffff33;color:#fff;border:0;border-radius:6px;font-size:18px;padding:2px 10px;cursor:pointer">✕</button></div>'+
  '<div style="padding:16px">'+
  '<label id="adE" style="display:block;font-size:13px;margin:0 0 4px"></label>'+
  '<input id="adM" type="email" autocomplete="username" style="width:100%;height:38px;padding:0 10px;border:1px solid #9bb;border-radius:8px;margin-bottom:12px;box-sizing:border-box">'+
  '<label id="adP" style="display:block;font-size:13px;margin:0 0 4px"></label>'+
  '<input id="adW" type="password" autocomplete="current-password" style="width:100%;height:38px;padding:0 10px;border:1px solid #9bb;border-radius:8px;margin-bottom:12px;box-sizing:border-box">'+
  '<div id="adR" style="color:#d6212b;font-size:13px;min-height:18px;margin-bottom:8px"></div>'+
  '<button id="adG" type="button" style="width:100%;padding:10px;background:#1aa7ec;color:#fff;border:0;border-radius:6px;font-weight:700;cursor:pointer"></button>'+
  '</div></div>';
 document.body.appendChild(w);
 var $=function(i){return document.getElementById(i);};

 function labels(){
  var t=tx();btn.textContent=t.b;$('adT').textContent=t.t;$('adE').textContent=t.e;$('adP').textContent=t.p;$('adG').textContent=t.g;
 }
 labels();
 /* භාෂාව මාරු වූ විට නැවත නම් යොදයි */
 new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

 function close(){w.style.display='none';}
 btn.onclick=async function(e){
  e.stopPropagation();
  try{
   var r=await sb().auth.getSession();
   if(r.data&&r.data.session){try{sessionStorage.setItem('gs_admin',ADMIN_HASH);}catch(_){}location.href='editor.html';return;}
  }catch(_){}
  labels();$('adR').textContent='';w.style.display='flex';$('adM').focus();
 };
 async function login(){
  $('adR').textContent='...';
  try{
   var r=await sb().auth.signInWithPassword({email:$('adM').value.trim(),password:$('adW').value});
   if(r.error||!r.data.session)throw (r.error||new Error('no session'));
   try{sessionStorage.setItem('gs_admin',ADMIN_HASH);}catch(_){}
   location.href='editor.html';
  }catch(err){$('adR').textContent=tx().err;}
 }
 $('adG').onclick=login;
 $('adW').onkeydown=function(e){if(e.key=='Enter'){e.preventDefault();login();}};
 $('adX').onclick=close;
 w.onclick=function(e){if(e.target===w)close();};
 document.addEventListener('keydown',function(e){if(e.key=='Escape')close();});
})();
