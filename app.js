
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

function normalizeImportedReaderTypography(){
  const content=document.querySelector('.reader-content');
  if(!content) return;
  content.querySelectorAll('*').forEach(el=>{
    if(el.style){
      el.style.removeProperty('font-family');
      el.style.removeProperty('font-size');
      el.style.removeProperty('font');
      if(!el.getAttribute('style')?.trim()) el.removeAttribute('style');
    }
    if(el.tagName==='FONT'){
      el.removeAttribute('face');
      el.removeAttribute('size');
    }
  });
}

function applyReaderSettings(){
  const st=loadSettings(), root=document.body, content=document.querySelector('.reader-content');
  if(!content)return;
  root.classList.remove('theme-paper','theme-white','theme-sepia','theme-dark');
  root.classList.add('theme-'+st.theme);

  const chosenFont=fontMap[st.font]||fontMap.palatino;
  const chosenSize=Math.max(15,Math.min(32,Number(st.size)||20));

  content.style.setProperty('--reader-user-font',chosenFont);
  content.style.setProperty('--reader-user-size',chosenSize+'px');
  content.style.setProperty('font-family',chosenFont,'important');
  content.style.setProperty('font-size',chosenSize+'px','important');

  document.querySelectorAll('[data-font]').forEach(b=>b.classList.toggle('active',b.dataset.font===st.font));
  document.querySelectorAll('[data-theme]').forEach(b=>b.classList.toggle('active',b.dataset.theme===st.theme));
}

document.addEventListener('DOMContentLoaded',()=>{
  normalizeImportedReaderTypography();
  applyReaderSettings();

  const panel=document.getElementById('settingsPanel');
  const open=document.getElementById('openSettings');
  if(open&&panel) open.addEventListener('click',()=>panel.classList.toggle('open'));

  document.querySelectorAll('[data-font]').forEach(b=>b.addEventListener('click',()=>{
    const s=loadSettings(); s.font=b.dataset.font; saveSettings(s); applyReaderSettings();
  }));
  document.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{
    const s=loadSettings(); s.theme=b.dataset.theme; saveSettings(s); applyReaderSettings();
  }));
  document.getElementById('smaller')?.addEventListener('click',()=>{
    const s=loadSettings(); s.size=Math.max(15,(Number(s.size)||20)-1); saveSettings(s); applyReaderSettings();
  });
  document.getElementById('larger')?.addEventListener('click',()=>{
    const s=loadSettings(); s.size=Math.min(32,(Number(s.size)||20)+1); saveSettings(s); applyReaderSettings();
  });

  const search=document.getElementById('lessonSearch');
  if(search){
    search.addEventListener('input',()=>{
      const q=search.value.toLowerCase();
      document.querySelectorAll('.lesson').forEach(x=>{
        x.style.display=x.innerText.toLowerCase().includes(q)?'flex':'none';
      });
    });
  }
});

document.addEventListener('DOMContentLoaded',()=>{
  const article=document.querySelector('.reader-content');
  if(!article) return;

  const ARTICLE_ID=window.GNTT_CURRENT_LESSON_ID || document.querySelector('.reader-content')?.dataset.lessonId || 'reader-default';
  const progressKey='phap_hoc_progress_'+ARTICLE_ID;
  const highlightKey='gocnho_highlights_v3_'+ARTICLE_ID;

  // Remove old demo toolbar if it still exists in reader.html?v=18.
  document.querySelectorAll('#highlightToolbar').forEach(el=>el.remove());

  // ===== Reading progress =====
  const bar=document.getElementById('readingProgressBar');
  const percentText=document.getElementById('readingPercent');
  const modal=document.getElementById('resumeModal');

  function progressPercent(){
    const articleTop=article.getBoundingClientRect().top+window.scrollY;
    const articleHeight=article.offsetHeight;
    const viewportBottom=window.scrollY+window.innerHeight;
    const raw=((viewportBottom-articleTop)/articleHeight)*100;
    return Math.max(0,Math.min(100,Math.round(raw)));
  }

  function updateProgress(){
    const pct=progressPercent();
    if(bar) bar.style.width=pct+'%';
    if(percentText) percentText.textContent=pct+'%';
    return pct;
  }

  function saveProgress(){
    localStorage.setItem(progressKey,JSON.stringify({
      y:window.scrollY,
      percent:updateProgress(),
      savedAt:Date.now()
    }));
  }

  let progressTimer=null;
  window.addEventListener('scroll',()=>{
    updateProgress();
    clearTimeout(progressTimer);
    progressTimer=setTimeout(saveProgress,250);
  },{passive:true});
  window.addEventListener('beforeunload',saveProgress);
  updateProgress();

  setTimeout(()=>{
    let saved=null;
    try{saved=JSON.parse(localStorage.getItem(progressKey));}catch(e){}
    if(saved&&saved.y>120&&saved.percent>1&&modal){
      const text=document.getElementById('resumeText');
      if(text) text.textContent='Lần trước bạn đã đọc khoảng '+saved.percent+'% bài này.';
      modal.classList.add('show');

      const yes=document.getElementById('resumeYes');
      const no=document.getElementById('resumeNo');

      if(yes) yes.onclick=()=>{
        modal.classList.remove('show');
        window.scrollTo({top:saved.y,behavior:'smooth'});
      };
      if(no) no.onclick=()=>{
        modal.classList.remove('show');
        localStorage.removeItem(progressKey);
        window.scrollTo({top:0,behavior:'smooth'});
      };
    }
  },600);

  document.getElementById('clearProgress')?.addEventListener('click',()=>{
    localStorage.removeItem(progressKey);
    window.scrollTo({top:0,behavior:'smooth'});
  });

  // ===== Plain web links =====
  const urlRe=/(https?:\/\/[^\s<]+)/g;
  const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
  const urlNodes=[];
  let wn;
  while((wn=walker.nextNode())){
    if(wn.parentElement && !wn.parentElement.closest('a,script,style,mark,.goc-user-highlight')){
      urlRe.lastIndex=0;
      if(urlRe.test(wn.nodeValue)) urlNodes.push(wn);
    }
  }

  urlNodes.forEach(node=>{
    const text=node.nodeValue;
    const frag=document.createDocumentFragment();
    let last=0;
    text.replace(urlRe,(url,_,offset)=>{
      frag.appendChild(document.createTextNode(text.slice(last,offset)));
      const a=document.createElement('a');
      a.href=url;
      a.target='_blank';
      a.rel='noopener noreferrer';
      a.textContent=url;
      frag.appendChild(a);
      last=offset+url.length;
      return url;
    });
    frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag,node);
  });

  // ===== YouTube auto embed =====
  function parseYouTube(url){
    try{
      const u=new URL(url,window.location.href);
      let id='';
      if(u.hostname.includes('youtu.be')){
        id=u.pathname.split('/').filter(Boolean)[0]||'';
      }else if(u.hostname.includes('youtube.com')){
        if(u.pathname==='/watch') id=u.searchParams.get('v')||'';
        else if(u.pathname.startsWith('/shorts/')) id=u.pathname.split('/')[2]||'';
        else if(u.pathname.startsWith('/embed/')) id=u.pathname.split('/')[2]||'';
      }
      if(!id) return null;

      let start=0;
      const t=u.searchParams.get('t')||u.searchParams.get('start')||'';
      if(t){
        if(/^\d+$/.test(t)) start=parseInt(t,10);
        else{
          const h=(t.match(/(\d+)h/)||[])[1];
          const m=(t.match(/(\d+)m/)||[])[1];
          const s=(t.match(/(\d+)s/)||[])[1];
          start=(parseInt(h||0)*3600)+(parseInt(m||0)*60)+parseInt(s||0);
        }
      }
      return {id,start};
    }catch(e){return null;}
  }

  [...article.querySelectorAll('a[href]')].forEach(a=>{
    const info=parseYouTube(a.href);
    if(!info||a.dataset.youtubeEmbedded==='1') return;
    a.dataset.youtubeEmbedded='1';

    const card=document.createElement('div');
    card.className='youtube-inline-card';

    const wrap=document.createElement('div');
    wrap.className='youtube-embed-wrap';

    const iframe=document.createElement('iframe');
    iframe.src='https://www.youtube.com/embed/'+info.id+(info.start?'?start='+info.start:'');
    iframe.title='Video YouTube';
    iframe.loading='lazy';
    iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen=true;

    const ext=document.createElement('a');
    ext.className='youtube-external';
    ext.href=a.href;
    ext.target='_blank';
    ext.rel='noopener noreferrer';
    ext.textContent='Xem trên YouTube ↗';

    wrap.appendChild(iframe);
    card.appendChild(wrap);
    card.appendChild(ext);

    const p=a.closest('p');
    if(p) p.insertAdjacentElement('afterend',card);
    else a.insertAdjacentElement('afterend',card);
  });

  // ===== Highlight V3: no layout shift =====
  // It highlights only text-node fragments, never moves paragraphs/block elements.
  const menu=document.createElement('div');
  menu.className='goc-highlight-menu-v3';
  menu.innerHTML=`
    <button type="button" class="hl-square yellow" data-color="yellow" aria-label="Highlight vàng"></button>
    <button type="button" class="hl-square green" data-color="green" aria-label="Highlight xanh"></button>
    <button type="button" class="hl-square pink" data-color="pink" aria-label="Highlight hồng"></button>
    <button type="button" class="hl-square remove" data-remove="1" aria-label="Bỏ highlight"></button>
  `;

  Object.assign(menu.style,{
    position:'fixed',
    zIndex:'99999',
    display:'none',
    alignItems:'center',
    gap:'7px',
    padding:'7px 8px',
    background:'#fffdf8',
    border:'1px solid rgba(90,70,40,.18)',
    borderRadius:'11px',
    boxShadow:'0 8px 28px rgba(0,0,0,.18)'
  });

  menu.querySelectorAll('.hl-square').forEach(btn=>{
    Object.assign(btn.style,{
      width:'25px',height:'25px',padding:'0',
      borderRadius:'5px',cursor:'pointer',
      boxSizing:'border-box'
    });
  });
  Object.assign(menu.querySelector('.yellow').style,{background:'#ffe99a',border:'1px solid #e1ca69'});
  Object.assign(menu.querySelector('.green').style,{background:'#ccefcf',border:'1px solid #8bc994'});
  Object.assign(menu.querySelector('.pink').style,{background:'#ffd2df',border:'1px solid #dc91aa'});
  Object.assign(menu.querySelector('.remove').style,{background:'#fff',border:'2px solid #aaa'});

  document.body.appendChild(menu);

  let savedRange=null;
  let activeHighlightId=null;

  function getSaved(){
    try{return JSON.parse(localStorage.getItem(highlightKey)||'[]');}
    catch(e){return [];}
  }
  function setSaved(items){
    localStorage.setItem(highlightKey,JSON.stringify(items));
  }

  function allTextNodes(){
    const out=[];
    const w=document.createTreeWalker(article,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        const p=node.parentElement;
        if(!p) return NodeFilter.FILTER_REJECT;
        if(p.closest('script,style')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while((n=w.nextNode())) out.push(n);
    return out;
  }

  function boundaryToOffset(container,offset){
    const nodes=allTextNodes();
    let total=0;

    for(const node of nodes){
      if(node===container) return total+Math.min(offset,node.nodeValue.length);
      if(container.nodeType===Node.ELEMENT_NODE && container.contains(node)){
        // For unusual element-boundary selections, use a Range fallback.
        try{
          const r=document.createRange();
          r.setStart(article,0);
          r.setEnd(container,offset);
          return r.toString().length;
        }catch(e){}
      }
      total+=node.nodeValue.length;
    }

    try{
      const r=document.createRange();
      r.setStart(article,0);
      r.setEnd(container,offset);
      return r.toString().length;
    }catch(e){return total;}
  }

  function rangeOffsets(range){
    let start=boundaryToOffset(range.startContainer,range.startOffset);
    let end=boundaryToOffset(range.endContainer,range.endOffset);
    if(end<start){const t=start;start=end;end=t;}
    return {start,end};
  }

  function colorValue(color){
    if(color==='green') return '#ccefcf';
    if(color==='pink') return '#ffd2df';
    return '#ffe99a';
  }

  function applyHighlight(item){
    const nodes=allTextNodes();
    let cursor=0;
    const targets=[];

    nodes.forEach(node=>{
      if(node.parentElement?.closest('.goc-user-highlight')) {
        cursor+=node.nodeValue.length;
        return;
      }
      const len=node.nodeValue.length;
      const nodeStart=cursor;
      const nodeEnd=cursor+len;
      const s=Math.max(item.start,nodeStart);
      const e=Math.min(item.end,nodeEnd);

      if(e>s){
        targets.push({
          node,
          start:s-nodeStart,
          end:e-nodeStart
        });
      }
      cursor=nodeEnd;
    });

    // Work backwards so splitting one text node never invalidates later offsets.
    targets.reverse().forEach(t=>{
      const node=t.node;
      if(!node.parentNode) return;

      const full=node.nodeValue;
      const before=full.slice(0,t.start);
      const middle=full.slice(t.start,t.end);
      const after=full.slice(t.end);

      const frag=document.createDocumentFragment();
      if(before) frag.appendChild(document.createTextNode(before));

      const span=document.createElement('span');
      span.className='goc-user-highlight';
      span.dataset.hid=item.id;
      span.dataset.color=item.color;
      span.textContent=middle;
      span.style.backgroundColor=colorValue(item.color);
      span.style.borderRadius='2px';
      span.style.padding='0';
      span.style.margin='0';
      span.style.boxDecorationBreak='clone';
      span.style.webkitBoxDecorationBreak='clone';
      frag.appendChild(span);

      if(after) frag.appendChild(document.createTextNode(after));
      node.parentNode.replaceChild(frag,node);
    });
  }

  function unwrapHighlightElements(id){
    article.querySelectorAll('.goc-user-highlight[data-hid="'+CSS.escape(id)+'"]').forEach(span=>{
      const parent=span.parentNode;
      if(!parent) return;
      while(span.firstChild) parent.insertBefore(span.firstChild,span);
      span.remove();
      parent.normalize();
    });
  }

  function restoreHighlights(){
    const items=getSaved().slice().sort((a,b)=>a.start-b.start);
    items.forEach(applyHighlight);
  }

  function hideMenu(){
    menu.style.display='none';
    menu.style.transform='';
    menu.style.bottom='';
    savedRange=null;
    activeHighlightId=null;
  }

  function placeMenu(rect){
    menu.style.display='flex';
    requestAnimationFrame(()=>{
      const mw=menu.offsetWidth, mh=menu.offsetHeight;
      let left=rect.left+rect.width/2-mw/2;
      left=Math.max(8,Math.min(window.innerWidth-mw-8,left));
      let top=rect.top-mh-9;
      if(top<8) top=rect.bottom+9;
      menu.style.left=left+'px';
      menu.style.top=top+'px';
    });
  }

  function saveSelectionOnly(){
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount||sel.isCollapsed||!sel.toString().trim()) return;
    const range=sel.getRangeAt(0);
    if(!article.contains(range.commonAncestorContainer)) return;
    savedRange=range.cloneRange();
    activeHighlightId=null;
  }

  // V23.3: chỉ lưu vùng bôi đen, KHÔNG tự bật bảng màu cạnh chữ.
  // Như vậy menu iPhone (Sao chép / Hỏi ChatGPT...) không che bảng màu của website.
  document.addEventListener('mouseup',()=>setTimeout(saveSelectionOnly,15));
  document.addEventListener('touchend',()=>setTimeout(saveSelectionOnly,180));
  document.addEventListener('selectionchange',()=>setTimeout(saveSelectionOnly,30));

  function placeMenuBottom(){
    menu.style.display='flex';
    menu.style.left='50%';
    menu.style.top='auto';
    menu.style.bottom='max(18px, env(safe-area-inset-bottom))';
    menu.style.transform='translateX(-50%)';
  }

  const highlightPenBtn=document.getElementById('highlightPenBtn');
  highlightPenBtn?.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    saveSelectionOnly();
    if(!savedRange){
      alert('Hãy bôi đen đoạn chữ cần đánh dấu trước.');
      return;
    }
    placeMenuBottom();
  });

  menu.addEventListener('mousedown',e=>e.preventDefault());

  menu.querySelectorAll('[data-color]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(!savedRange) return;

      const offsets=rangeOffsets(savedRange);
      if(offsets.end<=offsets.start) return;

      const item={
        id:'h'+Date.now()+Math.random().toString(36).slice(2,6),
        start:offsets.start,
        end:offsets.end,
        color:btn.dataset.color
      };

      const items=getSaved();
      items.push(item);
      setSaved(items);
      applyHighlight(item);

      window.getSelection()?.removeAllRanges();
      hideMenu();
    });
  });

  function removeById(id){
    if(!id) return;
    unwrapHighlightElements(id);
    setSaved(getSaved().filter(x=>x.id!==id));
  }

  menu.querySelector('[data-remove]').addEventListener('click',()=>{
    if(activeHighlightId){
      removeById(activeHighlightId);
      hideMenu();
      return;
    }

    if(savedRange){
      const offsets=rangeOffsets(savedRange);
      const items=getSaved();
      const overlapping=items.filter(x=>x.start<offsets.end && x.end>offsets.start);
      overlapping.forEach(x=>unwrapHighlightElements(x.id));
      setSaved(items.filter(x=>!(x.start<offsets.end && x.end>offsets.start)));
      window.getSelection()?.removeAllRanges();
    }
    hideMenu();
  });

  article.addEventListener('click',e=>{
    const span=e.target.closest('.goc-user-highlight');
    if(!span) return;
    activeHighlightId=span.dataset.hid;
    savedRange=null;
    placeMenuBottom();
  });

  document.addEventListener('mousedown',e=>{
    if(menu.contains(e.target)) return;
    if(e.target.closest?.('#highlightPenBtn')) return;
    if(e.target.closest?.('.goc-user-highlight')) return;
    if(!article.contains(e.target)) hideMenu();
  });

  restoreHighlights();

  // ===== Saved highlight drawer =====
  const drawer=document.getElementById('highlightsDrawer');
  const list=document.getElementById('highlightList');

  function renderHighlightList(){
    if(!list) return;
    const items=getSaved();
    list.innerHTML='';
    if(!items.length){
      list.innerHTML='<p style="opacity:.65;font-family:Arial,sans-serif;font-size:13px">Chưa có đoạn nào được đánh dấu.</p>';
      return;
    }

    items.forEach(item=>{
      const spans=[...article.querySelectorAll('.goc-user-highlight[data-hid="'+CSS.escape(item.id)+'"]')];
      const text=spans.map(s=>s.textContent).join('');
      const el=document.createElement('div');
      el.className='saved-highlight '+item.color;
      el.innerHTML='<div></div><small>Nhấn để tìm đoạn này trong bài</small>';
      el.querySelector('div').textContent=text;
      el.onclick=()=>{
        const target=article.querySelector('.goc-user-highlight[data-hid="'+CSS.escape(item.id)+'"]');
        if(target){
          drawer?.classList.remove('open');
          target.scrollIntoView({behavior:'smooth',block:'center'});
        }
      };
      list.appendChild(el);
    });
  }

  document.getElementById('showHighlights')?.addEventListener('click',()=>{
    renderHighlightList();
    drawer?.classList.add('open');
  });
  document.getElementById('closeHighlights')?.addEventListener('click',()=>{
    drawer?.classList.remove('open');
  });
});

/* ===== V13: Lật trang - một engine duy nhất ===== */
document.addEventListener('DOMContentLoaded', () => {
  const article = document.querySelector('.reader-content');
  const paper = document.querySelector('.reader-paper');
  const toggle = document.getElementById('togglePageMode');
  const controls = document.getElementById('pageTurnControls');
  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  const label = document.getElementById('pageNumber');

  if (!article || !paper || !toggle || !controls || !prev || !next || !label) return;

  const MODE_KEY = 'gocnho_reader_view_mode';
  const PAGE_KEY = 'gocnho_page_position_' + (window.GNTT_CURRENT_LESSON_ID || document.querySelector('.reader-content')?.dataset.lessonId || 'reader-default');

  const category = paper.querySelector(':scope > .reader-category');
  const title = paper.querySelector(':scope > h1');
  const subtitle = paper.querySelector(':scope > .subtitle');

  let pageMode = false;
  let currentPage = 0;
  let totalPages = 1;
  let resizeTimer = 0;
  let touchX = 0;
  let touchY = 0;
  let isAnimating = false;

  function moveTitleIntoBook(){
    if (category && category.parentNode === paper) article.insertBefore(category, article.firstChild);
    if (title && title.parentNode === paper) article.insertBefore(title, category ? category.nextSibling : article.firstChild);
    if (subtitle && subtitle.parentNode === paper) article.insertBefore(subtitle, title ? title.nextSibling : article.firstChild);
  }

  function moveTitleOutOfBook(){
    if (category && category.parentNode === article) paper.insertBefore(category, article);
    if (title && title.parentNode === article) paper.insertBefore(title, article);
    if (subtitle && subtitle.parentNode === article) paper.insertBefore(subtitle, article);
  }

  function pageGap(){
    return parseFloat(getComputedStyle(article).columnGap) || 0;
  }

  function pageWidth(){
    return article.clientWidth;
  }

  function pageStep(){
    return pageWidth() + pageGap();
  }

  function setExactColumnWidth(){
    const w = Math.max(1, Math.floor(article.clientWidth));
    article.style.setProperty('--book-page-width', w + 'px');
  }

  function countPages(){
    setExactColumnWidth();
    // Force layout after updating the column width.
    void article.offsetWidth;

    const step = pageStep();
    const sw = article.scrollWidth;
    totalPages = Math.max(1, Math.round((sw + pageGap()) / step));
    currentPage = Math.max(0, Math.min(totalPages - 1, currentPage));
    updateUI();
  }

  function updateUI(){
    label.textContent = `Trang ${currentPage + 1} / ${totalPages}`;
    prev.disabled = currentPage <= 0;
    next.disabled = currentPage >= totalPages - 1;

    const pct = Math.round(((currentPage + 1) / totalPages) * 100);
    const bar = document.getElementById('readingProgressBar');
    const percent = document.getElementById('readingPercent');
    if (bar) bar.style.width = pct + '%';
    if (percent) percent.textContent = pct + '%';

    try{
      localStorage.setItem(PAGE_KEY, JSON.stringify({page:currentPage, savedAt:Date.now()}));
    }catch(e){}
  }

  function goToPage(index, smooth = true){
    if (!pageMode || isAnimating) return;
    currentPage = Math.max(0, Math.min(totalPages - 1, index));
    const left = Math.round(currentPage * pageStep());

    isAnimating = smooth;
    article.scrollTo({
      left,
      top:0,
      behavior:smooth ? 'smooth' : 'auto'
    });

    if (smooth){
      setTimeout(() => {
        // iOS/Safari can stop on a fractional offset; force the exact page.
        article.scrollLeft = left;
        isAnimating = false;
      }, 340);
    }
    updateUI();
  }

  function restorePage(){
    try{
      const saved = JSON.parse(localStorage.getItem(PAGE_KEY) || 'null');
      if (saved && Number.isFinite(saved.page)) currentPage = Math.max(0, saved.page);
    }catch(e){}
  }

  function enablePageMode(restore = true){
    pageMode = true;
    document.body.classList.add('page-mode');
    toggle.setAttribute('aria-pressed','true');
    toggle.textContent = '↕ Cuộn dọc';
    controls.hidden = false;
    moveTitleIntoBook();
    try{localStorage.setItem(MODE_KEY,'page')}catch(e){}
    if (restore) restorePage();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        countPages();
        goToPage(currentPage, false);
      });
    });
  }

  function disablePageMode(){
    pageMode = false;
    article.scrollLeft = 0;
    document.body.classList.remove('page-mode');
    toggle.setAttribute('aria-pressed','false');
    toggle.textContent = '📖 Lật trang';
    controls.hidden = true;
    moveTitleOutOfBook();
    try{localStorage.setItem(MODE_KEY,'scroll')}catch(e){}
    window.dispatchEvent(new Event('scroll'));
  }

  toggle.addEventListener('click', () => {
    if (pageMode) disablePageMode();
    else enablePageMode(true);
  });

  prev.addEventListener('click', () => goToPage(currentPage - 1));
  next.addEventListener('click', () => goToPage(currentPage + 1));

  // Keyboard support on laptop
  article.tabIndex = 0;
  article.addEventListener('keydown', e => {
    if (!pageMode) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown'){
      e.preventDefault();
      goToPage(currentPage + 1);
    }else if (e.key === 'ArrowLeft' || e.key === 'PageUp'){
      e.preventDefault();
      goToPage(currentPage - 1);
    }
  });

  // Reliable swipe on phones; does not depend on browser horizontal scrolling.
  article.addEventListener('touchstart', e => {
    if (!pageMode || e.touches.length !== 1) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, {passive:true});

  article.addEventListener('touchend', e => {
    if (!pageMode || !e.changedTouches.length) return;

    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim()) return;

    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;

    if (Math.abs(dx) >= 38 && Math.abs(dx) > Math.abs(dy) * 1.15){
      if (dx < 0) goToPage(currentPage + 1);
      else goToPage(currentPage - 1);
    }
  }, {passive:true});

  // Recalculate after font/size changes
  function repaginate(){
    if (!pageMode) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      countPages();
      goToPage(currentPage, false);
    }, 140);
  }

  window.addEventListener('resize', repaginate);
  document.getElementById('smaller')?.addEventListener('click', repaginate);
  document.getElementById('larger')?.addEventListener('click', repaginate);
  document.querySelectorAll('[data-font]').forEach(b => b.addEventListener('click', repaginate));

  document.getElementById('clearProgress')?.addEventListener('click', () => {
    try{localStorage.removeItem(PAGE_KEY)}catch(e){}
    if (pageMode) goToPage(0, false);
  });

  // Start Bài 40 smaller on mobile if the old 20px default is still saved.
  if (window.matchMedia('(max-width:700px)').matches){
    try{
      const s = loadSettings();
      if (!s.size || s.size === 20){
        s.size = 17;
        saveSettings(s);
        applyReaderSettings();
      }
    }catch(e){}
  }

  let savedMode = 'scroll';
  try{savedMode = localStorage.getItem(MODE_KEY) || 'scroll'}catch(e){}
  if (savedMode === 'page') enablePageMode(true);
});



/* ===== V19: Đầu sách / Thư viện ===== */
(function(){
  const catalog = window.GNTT_CATALOG || {books:[]};
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
  const norm = (s) => String(s ?? '').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  function countLessons(book){
    return (book.chapters || []).reduce((n,ch) => n + (ch.lessons || []).length, 0);
  }

  function renderHome(filter=''){
    const grid = document.getElementById('bookGrid');
    if(!grid) return;
    const q = norm(filter);
    const books = catalog.books.filter(book => norm(book.title + ' ' + (book.description||'')).includes(q));
    grid.innerHTML = books.map(book => {
      const chapterCount = (book.chapters || []).length;
      const lessonCount = countLessons(book);
      const href = `library.html?v=23.4&book=${encodeURIComponent(book.id)}`;
      return `<a class="book-card" href="${href}">
        <div class="book-icon">📚</div>
        <div class="book-card-body">
          <h3>${esc(book.title)}</h3>
          <p>${esc(book.description || '')}</p>
          <div class="book-stats">${chapterCount} phẩm/chương · ${lessonCount} bài</div>
        </div>
        <span class="book-arrow">→</span>
      </a>`;
    }).join('');
    const empty = document.getElementById('bookEmpty');
    if(empty) empty.hidden = books.length !== 0;
  }

  function renderLibrary(filter=''){
    const root = document.getElementById('libraryBooks');
    if(!root) return;
    const params = new URLSearchParams(location.search);
    const selectedBook = params.get('book');
    const q = norm(filter);
    let visibleCount = 0;

    root.innerHTML = catalog.books.map(book => {
      if(selectedBook && selectedBook !== book.id) return '';
      const matchedChapters = (book.chapters || []).map(ch => {
        const lessons = (ch.lessons || []).filter(lesson => {
          const hay = norm(book.title + ' ' + ch.title + ' ' + lesson.title + ' ' + (lesson.subtitle||''));
          return !q || hay.includes(q);
        });
        if(!lessons.length && q) return '';
        visibleCount += lessons.length || 1;
        return `<section class="chapter-block">
          <h3 class="chapter-title">${esc(ch.title)}</h3>
          <div class="chapter-lessons">
            ${lessons.map((lesson,idx) => `
              <a class="lesson lesson-v19 toc-level-${Number(lesson.tocLevel)||2}" href="${esc(lesson.href)}">
                <div class="meta">
                  <span class="badge">${idx+1}</span>
                  <div>
                    <h4>${esc(lesson.title)}</h4>
                    <p>${esc(lesson.subtitle || '')}</p>
                  </div>
                </div>
                <span>Đọc →</span>
              </a>`).join('')}
          </div>
        </section>`;
      }).join('');

      if(!matchedChapters.trim()) return '';
      return `<article class="library-book" data-book-id="${esc(book.id)}">
        <div class="library-book-head">
          <div class="book-icon">📚</div>
          <div>
            <div class="eyebrow">Đầu sách</div>
            <h2>${esc(book.title)}</h2>
            <p>${esc(book.description || '')}</p>
          </div>
        </div>
        ${matchedChapters}
      </article>`;
    }).join('');

    const empty = document.getElementById('libraryEmpty');
    if(empty) empty.hidden = !!root.innerHTML.trim();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const homeInput = document.getElementById('homeBookSearch');
    const homeBtn = document.getElementById('homeBookSearchBtn');
    if(homeInput){
      renderHome('');
      homeInput.addEventListener('input', () => renderHome(homeInput.value));
      homeInput.addEventListener('keydown', e => { if(e.key === 'Enter') renderHome(homeInput.value); });
      homeBtn?.addEventListener('click', () => renderHome(homeInput.value));
    }

    const libInput = document.getElementById('librarySearch');
    if(document.getElementById('libraryBooks')){
      renderLibrary('');
      libInput?.addEventListener('input', () => renderLibrary(libInput.value));
    }
  
  const settingsPanel=document.getElementById('settingsPanel');
  const settingsOk=document.getElementById('settingsOk');
  settingsOk?.addEventListener('click',()=>{
    settingsPanel?.classList.remove('open');
    settingsPanel?.setAttribute('aria-hidden','true');
  });

});
})();


/* ===== V23.4 HARD FIX: luôn tạo và hiển thị nút bút trên web/PWA ===== */
(()=>{
  function ensureHighlightPen(){
    if(!document.querySelector('.reader-content')) return;
    let btn=document.getElementById('highlightPenBtn');
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.id='highlightPenBtn';
      btn.className='highlight-pen-btn';
      btn.textContent='✏️';
      btn.title='Đánh dấu';
      btn.setAttribute('aria-label','Đánh dấu đoạn đã chọn');
      document.body.appendChild(btn);
    }
    // Inline style để không phụ thuộc cache CSS.
    Object.assign(btn.style,{
      position:'fixed',
      right:'16px',
      bottom:'88px',
      zIndex:'2147483646',
      width:'50px',
      height:'50px',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      borderRadius:'50%',
      border:'1px solid rgba(90,70,45,.28)',
      background:'#fffaf0',
      color:'#4a3c2d',
      fontSize:'24px',
      lineHeight:'1',
      boxShadow:'0 6px 20px rgba(0,0,0,.18)',
      cursor:'pointer',
      visibility:'visible',
      opacity:'1'
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',ensureHighlightPen,{once:true});
  }else{
    ensureHighlightPen();
  }
  window.addEventListener('pageshow',ensureHighlightPen);
  setTimeout(ensureHighlightPen,500);
})();
