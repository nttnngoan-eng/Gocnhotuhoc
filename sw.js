const CACHE='gntt-v23-8-shell';
const SHELL=['./','./index.html','./library.html','./reader.html','./style.css','./app.js','./book-icons.js','./pwa.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin!==location.origin) return;

  const core=/\/(index\.html|library\.html|reader\.html|style\.css|app\.js|book-icons\.js|pwa\.js|data\.js|catalog\.js|manifest\.webmanifest)$/.test(u.pathname)
    || u.pathname.endsWith('/Gocnhotuhoc/');

  if(core){
    // NETWORK FIRST: web luôn nhận file mới sau khi GitHub Pages deploy.
    e.respondWith(
      fetch(r,{cache:'no-store'}).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(r,copy));
        return res;
      }).catch(()=>caches.match(r,{ignoreSearch:true}).then(x=>x||caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(r).then(x=>x||fetch(r).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(r,copy));
      return res;
    }))
  );
});
