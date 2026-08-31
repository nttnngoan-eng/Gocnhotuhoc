
const STORE='phap_hoc_reader_settings';
function loadSettings(){
  try{return JSON.parse(localStorage.getItem(STORE))||{font:'palatino',size:20,theme:'paper'};}
  catch(e){return {font:'palatino',size:20,theme:'paper'};}
}
function saveSettings(s){localStorage.setItem(STORE,JSON.stringify(s));}
const fontMap={
  palatino:'"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif',
  merriweather:'Merriweather, Georgia, serif',
  be:'"Be Vietnam Pro", Arial, sans-serif',
  calibri:'Calibri, Carlito, Arial, sans-serif',
  arial:'Arial, Helvetica, sans-serif'
};
function applyReaderSettings(){
  const s=loadSettings(), root=document.body, content=document.querySelector('.reader-content');
  if(!content)return;
  root.classList.remove('theme-paper','theme-white','theme-sepia','theme-dark');
  root.classList.add('theme-'+s.theme);
  content.style.fontFamily=fontMap[s.font]||fontMap.palatino;
  content.style.fontSize=s.size+'px';
  document.querySelectorAll('[data-font]').forEach(b=>b.classList.toggle('active',b.dataset.font===s.font));
  document.querySelectorAll('[data-theme]').forEach(b=>b.classList.toggle('active',b.dataset.theme===s.theme));
}
document.addEventListener('DOMContentLoaded',()=>{
  applyReaderSettings();
  const panel=document.getElementById('settingsPanel');
  const open=document.getElementById('openSettings');
  if(open&&panel)open.addEventListener('click',()=>panel.classList.toggle('open'));
  document.querySelectorAll('[data-font]').forEach(b=>b.addEventListener('click',()=>{const s=loadSettings();s.font=b.dataset.font;saveSettings(s);applyReaderSettings();}));
  document.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{const s=loadSettings();s.theme=b.dataset.theme;saveSettings(s);applyReaderSettings();}));
  document.getElementById('smaller')?.addEventListener('click',()=>{const s=loadSettings();s.size=Math.max(15,s.size-1);saveSettings(s);applyReaderSettings();});
  document.getElementById('larger')?.addEventListener('click',()=>{const s=loadSettings();s.size=Math.min(32,s.size+1);saveSettings(s);applyReaderSettings();});

  const search=document.getElementById('lessonSearch');
  if(search){
    search.addEventListener('input',()=>{
      const q=search.value.toLowerCase();
      document.querySelectorAll('.lesson').forEach(x=>x.style.display=x.innerText.toLowerCase().includes(q)?'flex':'none');
    });
  }
});


// ===== V2: Progress + Resume + Highlight =====
document.addEventListener('DOMContentLoaded', function () {
  const article = document.querySelector('.reader-content');
  if (!article) return;

  const articleId = 'bai40-bon-vo-luong-tam-p1';
  const progressKey = 'phap_hoc_progress_' + articleId;
  const highlightKey = 'phap_hoc_highlights_' + articleId;

  const bar = document.getElementById('readingProgressBar');
  const percentText = document.getElementById('readingPercent');
  const modal = document.getElementById('resumeModal');
  const toolbar = document.getElementById('highlightToolbar');

  function progressData() {
    const articleTop = article.getBoundingClientRect().top + window.scrollY;
    const articleHeight = article.offsetHeight;
    const viewportBottom = window.scrollY + window.innerHeight;
    const raw = ((viewportBottom - articleTop) / articleHeight) * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  function updateProgress() {
    const pct = progressData();
    if (bar) bar.style.width = pct + '%';
    if (percentText) percentText.textContent = pct + '%';
    return pct;
  }

  function saveProgress() {
    localStorage.setItem(progressKey, JSON.stringify({
      y: window.scrollY,
      percent: updateProgress(),
      savedAt: Date.now()
    }));
  }

  // Restore prompt
  setTimeout(function () {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(progressKey)); } catch (e) {}
    if (saved && saved.y > 120 && saved.percent > 1) {
      const text = document.getElementById('resumeText');
      if (text) text.textContent = 'Lần trước bạn đã đọc khoảng ' + saved.percent + '% bài này.';
      modal.classList.add('show');
      document.getElementById('resumeYes').onclick = function () {
        modal.classList.remove('show');
        window.scrollTo({ top: saved.y, behavior: 'smooth' });
      };
      document.getElementById('resumeNo').onclick = function () {
        modal.classList.remove('show');
        localStorage.removeItem(progressKey);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }
  }, 700);

  let timer = null;
  window.addEventListener('scroll', function () {
    updateProgress();
    clearTimeout(timer);
    timer = setTimeout(saveProgress, 300);
  }, { passive: true });
  window.addEventListener('beforeunload', saveProgress);
  updateProgress();

  // Highlight helpers
  function saveHighlights() {
    const data = [];
    article.querySelectorAll('mark.user-highlight').forEach(function (mark) {
      const color = ['yellow', 'green', 'pink'].find(c => mark.classList.contains(c)) || 'yellow';
      data.push({ text: mark.textContent, color: color });
    });
    localStorage.setItem(highlightKey, JSON.stringify(data));
  }

  function markFirstOccurrence(text, color, shouldSave) {
    if (!text) return false;
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement && node.parentElement.closest('mark.user-highlight')) continue;
      const value = node.nodeValue;
      const idx = value.indexOf(text);
      if (idx !== -1) {
        const before = document.createTextNode(value.slice(0, idx));
        const mark = document.createElement('mark');
        mark.className = 'user-highlight ' + color;
        mark.textContent = text;
        const after = document.createTextNode(value.slice(idx + text.length));
        const parent = node.parentNode;
        parent.replaceChild(after, node);
        parent.insertBefore(mark, after);
        parent.insertBefore(before, mark);
        if (shouldSave) saveHighlights();
        return true;
      }
    }
    return false;
  }

  function restoreHighlights() {
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(highlightKey)) || []; } catch (e) {}
    saved.forEach(item => markFirstOccurrence(item.text, item.color, false));
  }

  restoreHighlights();

  // Show toolbar only after user has selected text
  document.getElementById('highlightBtn').addEventListener('click', function () {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (!text) {
      alert('Hãy bôi chọn đoạn văn bạn tâm đắc trước, sau đó bấm nút 🖍 Highlight.');
      return;
    }
    toolbar.classList.add('show');
  });

  document.querySelectorAll('[data-highlight]').forEach(function (button) {
    button.addEventListener('click', function () {
      const selection = window.getSelection();
      const color = button.dataset.highlight;
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);

      try {
        const mark = document.createElement('mark');
        mark.className = 'user-highlight ' + color;
        range.surroundContents(mark);
        saveHighlights();
      } catch (e) {
        markFirstOccurrence(selectedText, color, true);
      }

      selection.removeAllRanges();
      toolbar.classList.remove('show');
    });
  });

  // Remove highlight: tap/click existing highlighted text first
  article.addEventListener('click', function (event) {
    if (event.target.matches('mark.user-highlight')) {
      const range = document.createRange();
      range.selectNodeContents(event.target);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      toolbar.classList.add('show');
    }
  });

  document.getElementById('removeHighlight').addEventListener('click', function () {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    let node = selection.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const mark = node.closest ? node.closest('mark.user-highlight') : null;
    if (mark) {
      const parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      mark.remove();
      parent.normalize();
      saveHighlights();
    }
    selection.removeAllRanges();
    toolbar.classList.remove('show');
  });
});

// ===== V3: automatic floating highlight toolbar + live URLs =====
document.addEventListener('DOMContentLoaded', function(){
  const article = document.querySelector('.reader-content');
  const toolbar = document.getElementById('highlightToolbar');
  if(!article || !toolbar) return;

  // Existing top button is intentionally removed in V3.
  const oldBtn = document.getElementById('highlightBtn');
  if(oldBtn) oldBtn.style.display='none';

  function positionToolbar(){
    const sel = window.getSelection();
    if(!sel || sel.rangeCount===0 || sel.isCollapsed || !sel.toString().trim()){
      toolbar.classList.remove('show'); return;
    }
    const range = sel.getRangeAt(0);
    if(!article.contains(range.commonAncestorContainer)){
      toolbar.classList.remove('show'); return;
    }
    const rect = range.getBoundingClientRect();
    toolbar.classList.add('show');
    requestAnimationFrame(function(){
      const tw=toolbar.offsetWidth, th=toolbar.offsetHeight;
      let left = rect.left + rect.width/2 - tw/2;
      left = Math.max(8, Math.min(window.innerWidth-tw-8,left));
      let top = rect.top - th - 9;
      if(top < 8) top = rect.bottom + 9;
      toolbar.style.left = left+'px';
      toolbar.style.top = top+'px';
    });
  }

  document.addEventListener('mouseup', ()=>setTimeout(positionToolbar,20));
  document.addEventListener('touchend', ()=>setTimeout(positionToolbar,120));
  article.addEventListener('keyup', ()=>setTimeout(positionToolbar,20));

  // Make plain-text URLs clickable without changing already-linked content.
  const urlRe = /(https?:\/\/[^\s<]+)/g;
  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
  const nodes=[]; let n;
  while(n=walker.nextNode()){
    if(n.parentElement && !n.parentElement.closest('a,script,style,mark') && urlRe.test(n.nodeValue)){
      nodes.push(n);
    }
    urlRe.lastIndex=0;
  }
  nodes.forEach(function(node){
    const frag=document.createDocumentFragment();
    let last=0;
    node.nodeValue.replace(urlRe,function(url,_,offset){
      frag.appendChild(document.createTextNode(node.nodeValue.slice(last,offset)));
      const a=document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent=url;
      frag.appendChild(a); last=offset+url.length;
      return url;
    });
    frag.appendChild(document.createTextNode(node.nodeValue.slice(last)));
    node.parentNode.replaceChild(frag,node);
  });
});

document.addEventListener('DOMContentLoaded', function(){
  const article = document.querySelector('.reader-content');
  if(!article) return;

  function parseYouTube(url){
    try{
      const u = new URL(url, window.location.href);
      let id = '';
      if(u.hostname.includes('youtu.be')){
        id = u.pathname.split('/').filter(Boolean)[0] || '';
      } else if(u.hostname.includes('youtube.com')){
        if(u.pathname === '/watch') id = u.searchParams.get('v') || '';
        else if(u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2] || '';
        else if(u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2] || '';
      }
      if(!id) return null;

      let start = 0;
      const t = u.searchParams.get('t') || u.searchParams.get('start') || '';
      if(t){
        if(/^\d+$/.test(t)) start = parseInt(t,10);
        else {
          const h = (t.match(/(\d+)h/)||[])[1];
          const m = (t.match(/(\d+)m/)||[])[1];
          const s = (t.match(/(\d+)s/)||[])[1];
          start = (parseInt(h||0)*3600)+(parseInt(m||0)*60)+parseInt(s||0);
        }
      }
      return {id, start};
    }catch(e){ return null; }
  }

  const links = [...article.querySelectorAll('a[href]')];
  links.forEach(function(a){
    const info = parseYouTube(a.href);
    if(!info) return;
    if(a.dataset.youtubeEmbedded === '1') return;
    a.dataset.youtubeEmbedded = '1';

    const card = document.createElement('div');
    card.className = 'youtube-inline-card';

    const wrap = document.createElement('div');
    wrap.className = 'youtube-embed-wrap';

    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/' + info.id + (info.start ? '?start=' + info.start : '');
    iframe.title = 'Video YouTube';
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;

    const ext = document.createElement('a');
    ext.className = 'youtube-external';
    ext.href = a.href;
    ext.target = '_blank';
    ext.rel = 'noopener noreferrer';
    ext.textContent = 'Xem trên YouTube ↗';

    wrap.appendChild(iframe);
    card.appendChild(wrap);
    card.appendChild(ext);

    const p = a.closest('p');
    if(p) p.insertAdjacentElement('afterend', card);
    else a.insertAdjacentElement('afterend', card);
  });
});

// ===== Official V1 extras =====
document.addEventListener('DOMContentLoaded', function(){
  const article=document.querySelector('.reader-content');
  if(!article) return;

  const articleId='bai40-bon-vo-luong-tam-p1';
  const progressKey='phap_hoc_progress_'+articleId;
  const highlightKey='phap_hoc_highlights_'+articleId;

  const drawer=document.getElementById('highlightsDrawer');
  const list=document.getElementById('highlightList');

  function readSavedHighlights(){
    try{return JSON.parse(localStorage.getItem(highlightKey))||[]}catch(e){return[]}
  }

  function renderHighlightList(){
    const items=readSavedHighlights();
    list.innerHTML='';
    if(!items.length){
      list.innerHTML='<p style="opacity:.65;font-family:var(--ui-font);font-size:13px">Chưa có đoạn nào được đánh dấu.</p>';
      return;
    }
    items.forEach((item,i)=>{
      const el=document.createElement('div');
      el.className='saved-highlight '+(item.color||'yellow');
      el.innerHTML='<div></div><small>Nhấn để tìm đoạn này trong bài</small>';
      el.querySelector('div').textContent=item.text;
      el.onclick=()=>{
        const marks=[...article.querySelectorAll('mark.user-highlight')];
        const target=marks.find(m=>m.textContent===item.text);
        if(target){
          drawer.classList.remove('open');
          target.scrollIntoView({behavior:'smooth',block:'center'});
          target.animate([{outline:'0 solid transparent'},{outline:'4px solid rgba(138,106,63,.25)'},{outline:'0 solid transparent'}],{duration:1100});
        }
      };
      list.appendChild(el);
    });
  }

  document.getElementById('showHighlights')?.addEventListener('click',()=>{
    renderHighlightList(); drawer.classList.add('open');
  });
  document.getElementById('closeHighlights')?.addEventListener('click',()=>drawer.classList.remove('open'));
  document.getElementById('clearProgress')?.addEventListener('click',()=>{
    localStorage.removeItem(progressKey);
    window.scrollTo({top:0,behavior:'smooth'});
  });

  // Refresh drawer after highlight actions.
  document.querySelectorAll('[data-highlight]').forEach(btn=>{
    btn.addEventListener('click',()=>setTimeout(renderHighlightList,100));
  });
  document.getElementById('removeHighlight')?.addEventListener('click',()=>setTimeout(renderHighlightList,100));
});
