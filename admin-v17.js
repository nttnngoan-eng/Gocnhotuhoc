
// ===== V20: Đăng bài trực tiếp qua Cloudflare Worker -> GitHub =====
const V20_PUBLISH_API_KEY = 'gntt_v20_publish_api_url';
const V20_PUBLISH_PASS_KEY = 'gntt_v20_publish_password';

function v20NormalizeApiUrl(value){
  return String(value || '').trim().replace(/\/+$/, '');
}

function v20Slugify(text){
  return String(text || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,120) || 'bai-hoc';
}

function v20EscJsString(value){
  return JSON.stringify(String(value ?? ''));
}

function v20ParseCatalog(text){
  const m = String(text || '').match(/window\.GNTT_CATALOG\s*=\s*([\s\S]*?);\s*$/);
  if(!m) return {books:[]};
  try { return JSON.parse(m[1]); } catch(e) { return {books:[]}; }
}

function v20CatalogJs(catalog){
  return 'window.GNTT_CATALOG = ' + JSON.stringify(catalog, null, 2) + ';\n';
}

function v20UpdateCatalog(catalog, meta){
  if(!catalog || !Array.isArray(catalog.books)) catalog = {books:[]};

  const bookId = v20Slugify(meta.bookTitle);
  let book = catalog.books.find(b => b.id === bookId || b.title === meta.bookTitle);
  if(!book){
    book = {
      id: bookId,
      title: meta.bookTitle || 'Chưa đặt tên sách',
      description: 'Tài liệu học và bài giảng được sắp xếp theo phẩm/chương.',
      chapters: []
    };
    catalog.books.push(book);
  }else{
    book.title = meta.bookTitle || book.title;
    book.id = book.id || bookId;
    if(!Array.isArray(book.chapters)) book.chapters = [];
  }

  let chapter = book.chapters.find(c => c.title === meta.chapterTitle);
  if(!chapter){
    chapter = {title: meta.chapterTitle || 'Chưa phân chương', lessons: []};
    book.chapters.push(chapter);
  }
  if(!Array.isArray(chapter.lessons)) chapter.lessons = [];

  const lessonHref = 'reader.html?v=20';
  let lesson = chapter.lessons.find(l => l.title === meta.lessonTitle);
  if(!lesson){
    // Current website still has one active Reader. Put latest/current lesson first if new.
    lesson = {};
    chapter.lessons.unshift(lesson);
  }
  lesson.title = meta.lessonTitle || 'Bài học';
  lesson.subtitle = meta.subtitle || '';
  lesson.href = lessonHref;

  return catalog;
}

async function v20FetchCatalog(){
  const res = await fetch('catalog.js?admin=' + Date.now(), {cache:'no-store'});
  if(!res.ok) return {books:[]};
  return v20ParseCatalog(await res.text());
}

function v20SetPublishState(text, kind=''){
  const el = document.getElementById('publishState');
  if(!el) return;
  el.textContent = text;
  el.className = 'publish-state' + (kind ? ' ' + kind : '');
}

async function v20ApiRequest(path, options={}){
  const apiInput = document.getElementById('publishApiUrl');
  const passInput = document.getElementById('publishPassword');
  const apiUrl = v20NormalizeApiUrl(apiInput?.value);
  const password = passInput?.value || '';
  if(!apiUrl) throw new Error('Chưa nhập địa chỉ API xuất bản');
  if(!password) throw new Error('Chưa nhập mật khẩu quản trị');

  localStorage.setItem(V20_PUBLISH_API_KEY, apiUrl);
  sessionStorage.setItem(V20_PUBLISH_PASS_KEY, password);

  const res = await fetch(apiUrl + path, {
    ...options,
    headers: {
      'Content-Type':'application/json',
      'X-Admin-Password':password,
      ...(options.headers || {})
    }
  });
  let data = {};
  try { data = await res.json(); } catch(e) {}
  if(!res.ok) throw new Error(data.error || ('Lỗi API ' + res.status));
  return data;
}


// ===== V19F1: Reader footer chỉ hiển thị tên bài =====
function applyReaderTitleOnlyFooter(html){
  const lessonTitle =
    document.getElementById('lessonTitle')?.value?.trim() ||
    'Bài học';

  const safe = String(lessonTitle).replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));

  const mark = `<div class="reader-end-footer">
  <footer class="reader-title-footer" aria-label="Tên bài học">
    <span data-reader-footer-title>${safe}</span>
  </footer>
</div>`;

  // Remove any old full reader footer.
  html = html.replace(
    /<div class=["']reader-end-footer["'][\s\S]*?<\/footer>\s*<\/div>/i,
    mark
  );

  if (!html.includes('data-reader-footer-title')) {
    html = html.replace(/<\/article>/i, mark + '\\n</article>');
  }
  return html;
}


// ===== V18F Footer Admin =====
function escFooterHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}

function getFooterForm(){
  return {
    title: document.getElementById('footerTitle')?.value?.trim() || 'Góc nhỏ tu học',
    text: document.getElementById('footerText')?.value?.trim() || '',
    copy: document.getElementById('footerCopyright')?.value?.trim() || ''
  };
}

function footerMarkup(data){
  return `
<div class="reader-end-footer">
  <footer class="site-footer" data-footer>
    <div class="site-footer-inner">
      <div class="site-footer-title" data-footer-title>${escFooterHtml(data.title)}</div>
      <div class="site-footer-text" data-footer-text>${escFooterHtml(data.text)}</div>
      <nav class="site-footer-links" aria-label="Liên kết cuối trang">
        <a href="index.html?v=19">Trang chủ</a>
        <a href="library.html?v=19">Thư viện</a>
        <a href="reader.html?v=19">Tiếp tục đọc</a>
      </nav>
      <div class="site-footer-copy" data-footer-copy>${escFooterHtml(data.copy)}</div>
    </div>
  </footer>
</div>`;
}

function applyFooterToReaderHtml(html){
  const data = getFooterForm();
  const mark = footerMarkup(data);

  // Replace existing footer if one exists.
  const footerRe = /<div class=["']reader-end-footer["'][\s\S]*?<\/footer>\s*<\/div>/i;
  if (footerRe.test(html)) {
    html = html.replace(footerRe, mark);
  } else if (/<\/article>/i.test(html)) {
    html = html.replace(/<\/article>/i, mark + '\n</article>');
  } else {
    html = html.replace(/<\/body>/i, mark + '\n</body>');
  }
  return html;
}

function readFooterFromLoadedReader(doc){
  try{
    const title = doc.querySelector('[data-footer-title]')?.textContent?.trim();
    const text = doc.querySelector('[data-footer-text]')?.textContent?.trim();
    const copy = doc.querySelector('[data-footer-copy]')?.textContent?.trim();
    if(title && document.getElementById('footerTitle')) document.getElementById('footerTitle').value = title;
    if(text != null && document.getElementById('footerText')) document.getElementById('footerText').value = text;
    if(copy != null && document.getElementById('footerCopyright')) document.getElementById('footerCopyright').value = copy;
  }catch(e){}
}


// V18 anti-cache patch: ensure exported reader.html asks browser for fresh content/assets.
function applyV18AntiCache(html) {
  if (!html) return html;
  html = applyFooterToReaderHtml(html);
  html = applyReaderTitleOnlyFooter(html);
  if (!/http-equiv=["']Cache-Control["']/i.test(html)) {
    html = html.replace(/<meta charset=["']utf-8["']\s*\/?>/i,
      '<meta charset="utf-8">\n' +
      '  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n' +
      '  <meta http-equiv="Pragma" content="no-cache">\n' +
      '  <meta http-equiv="Expires" content="0">');
  }
  html = html.replace(/style\.css(?:\?[^"'<> ]*)?/g, 'style.css?v=20');
  html = html.replace(/app\.js(?:\?[^"'<> ]*)?/g, 'app.js?v=20');
  if (!html.includes('GNTT_VERSION_18')) {
    html = html.replace('<head>', '<head>\\n  <!-- GNTT_VERSION_18 anti-cache -->');
  }
  return html;
}


(() => {
  const editor = document.getElementById('editor');
  const status = document.getElementById('status');
  const titleInput = document.getElementById('lessonTitle');
  const bookInput = document.getElementById('bookTitle');
  const chapterInput = document.getElementById('chapterTitle');
  const youtubeInput = document.getElementById('youtubeUrl');
  const subtitleInput = document.getElementById('lessonSubtitle');
  const titlePreview = document.getElementById('editorTitlePreview');

  const DRAFT_KEY = 'gocnho_admin_draft_bai40_v2';
  let readerSource = '';
  let dirty = false;

  function setStatus(text){ status.textContent = text; }
  function focusEditor(){ editor.focus({preventScroll:true}); }

  function firstYouTubeHref(root){
    const links = [...root.querySelectorAll('a[href]')];
    const found = links.find(a => /youtu\.be|youtube\.com/i.test(a.href));
    return found ? found.href : '';
  }

  function updatePreview(){
    const t = titleInput.value.trim() || 'Chưa đặt tên bài';
    titlePreview.textContent = t;
  }

  async function loadCurrent(){
    setStatus('Đang tải bài hiện tại…');
    try{
      const res = await fetch('reader.html?admin=' + Date.now(), {cache:'no-store'});
      if(!res.ok) throw new Error('Không tải được reader.html');
      readerSource = await res.text();

      const doc = new DOMParser().parseFromString(readerSource,'text/html');
      const article = doc.querySelector('.reader-content');
      if(!article) throw new Error('Không tìm thấy .reader-content');

      editor.innerHTML = article.innerHTML;

      const paper = doc.querySelector('.reader-paper');
      const currentCategory = paper?.querySelector(':scope > .reader-category')?.textContent?.trim() || 'PHẬT PHÁP CĂN BẢN';
      const currentTitle = paper?.querySelector(':scope > h1')?.textContent?.trim() || 'BÀI 40 - BỐN VÔ LƯỢNG TÂM (P.1)';
      const currentSubtitle = paper?.querySelector(':scope > .subtitle')?.textContent?.trim() || 'Bài đọc trực tuyến · Có thể tùy chỉnh theo sở thích';

      titleInput.value = currentTitle;
      bookInput.value = article.dataset.bookTitle || '';
      chapterInput.value = article.dataset.chapterTitle || currentCategory || '';
      subtitleInput.value = currentSubtitle;

      youtubeInput.value = firstYouTubeHref(article);
      updatePreview();

      dirty = false;
      setStatus('Đã tải bài hiện tại');
    }catch(err){
      setStatus('Lỗi tải bài');
      editor.innerHTML = '<p>Không thể tải reader.html. Hãy mở trang quản trị từ website GitHub Pages, không mở file admin.html trực tiếp bằng file://.</p>';
    }
  }

  document.querySelectorAll('[data-cmd]').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => {
      focusEditor();
      document.execCommand(btn.dataset.cmd, false, null);
      dirty = true;
      setStatus('Có thay đổi chưa lưu');
    });
  });

  document.querySelectorAll('[data-block]').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => {
      focusEditor();
      document.execCommand('formatBlock', false, btn.dataset.block);
      dirty = true;
      setStatus('Có thay đổi chưa lưu');
    });
  });

  document.querySelectorAll('[data-color]').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => {
      focusEditor();
      document.execCommand('foreColor', false, btn.dataset.color);
      dirty = true;
      setStatus('Có thay đổi chưa lưu');
    });
  });

  document.getElementById('clearFormat').addEventListener('mousedown', e => e.preventDefault());
  document.getElementById('clearFormat').addEventListener('click', () => {
    focusEditor();
    document.execCommand('removeFormat', false, null);
    dirty = true;
    setStatus('Có thay đổi chưa lưu');
  });

  [bookInput, chapterInput, titleInput, youtubeInput, subtitleInput].forEach(inp => {
    inp.addEventListener('input', () => {
      dirty = true;
      updatePreview();
      setStatus('Có thay đổi chưa lưu');
    });
  });

  editor.addEventListener('input', () => {
    dirty = true;
    setStatus('Có thay đổi chưa lưu');
  });

  function collectDraft(){
    return {
      html: editor.innerHTML,
      book: bookInput.value,
      chapter: chapterInput.value,
      title: titleInput.value,
      youtube: youtubeInput.value,
      subtitle: subtitleInput.value,
      savedAt: Date.now()
    };
  }

  document.getElementById('saveDraft').addEventListener('click', () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft()));
    dirty = false;
    setStatus('Đã lưu bản nháp trên trình duyệt');
  });

  document.getElementById('restoreDraft').addEventListener('click', () => {
    try{
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if(!d){
        setStatus('Chưa có bản nháp');
        return;
      }
      if(d.html) editor.innerHTML = d.html;
      if(typeof d.book === 'string') bookInput.value = d.book;
      if(typeof d.chapter === 'string') chapterInput.value = d.chapter;
      if(typeof d.title === 'string') titleInput.value = d.title;
      if(typeof d.youtube === 'string') youtubeInput.value = d.youtube;
      if(typeof d.subtitle === 'string') subtitleInput.value = d.subtitle;
      updatePreview();
      dirty = true;
      setStatus('Đã khôi phục bản nháp');
    }catch(e){
      setStatus('Bản nháp bị lỗi');
    }
  });

  document.getElementById('loadCurrent').addEventListener('click', () => {
    if(dirty && !confirm('Bạn đang có thay đổi chưa lưu. Tải lại sẽ mất các thay đổi này. Tiếp tục?')) return;
    loadCurrent();
  });

  function cleanEditorHTML(){
    const clone = editor.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    clone.querySelectorAll('[style=""]').forEach(el => el.removeAttribute('style'));
    clone.querySelectorAll('font[color]').forEach(font => {
      const span = document.createElement('span');
      span.style.color = font.getAttribute('color');
      while(font.firstChild) span.appendChild(font.firstChild);
      font.replaceWith(span);
    });
    return clone.innerHTML.trim();
  }

  function normalizeYoutube(article){
    const desired = youtubeInput.value.trim();

    const ytLinks = [...article.querySelectorAll('a[href]')]
      .filter(a => /youtu\.be|youtube\.com/i.test(a.href));

    if(desired){
      if(ytLinks.length){
        ytLinks[0].href = desired;
        ytLinks[0].textContent = desired;
      }else{
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = desired;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = desired;
        p.appendChild(a);
        article.insertBefore(p, article.firstChild);
      }

      // remove duplicate YouTube links beyond the first
      [...article.querySelectorAll('a[href]')]
        .filter(a => /youtu\.be|youtube\.com/i.test(a.href))
        .slice(1)
        .forEach(a => {
          const p = a.closest('p');
          if(p && p.textContent.trim() === a.textContent.trim()) p.remove();
          else a.remove();
        });
    }else{
      ytLinks.forEach(a => {
        const p = a.closest('p');
        if(p && p.textContent.trim() === a.textContent.trim()) p.remove();
        else a.remove();
      });
    }
  }


  function buildReaderOutput(){
    if(!readerSource) throw new Error('Chưa tải được reader.html');

    const doc = new DOMParser().parseFromString(readerSource,'text/html');
    const article = doc.querySelector('.reader-content');
    const paper = doc.querySelector('.reader-paper');
    if(!article || !paper) throw new Error('Không tìm thấy cấu trúc bài');

    article.innerHTML = cleanEditorHTML();
    normalizeYoutube(article);

    const categoryEl = paper.querySelector(':scope > .reader-category');
    const titleEl = paper.querySelector(':scope > h1');
    const subtitleEl = paper.querySelector(':scope > .subtitle');

    const bookName = bookInput.value.trim();
    const chapterName = chapterInput.value.trim();
    if(categoryEl){
      categoryEl.textContent = [bookName, chapterName].filter(Boolean).join(' · ') || 'PHẬT PHÁP CĂN BẢN';
    }
    if(titleEl) titleEl.textContent = titleInput.value.trim() || 'Chưa đặt tên bài';
    if(subtitleEl) subtitleEl.textContent = subtitleInput.value.trim();

    if(doc.querySelector('title')){
      doc.querySelector('title').textContent = (titleInput.value.trim() || 'Bài đọc') + ' | Góc nhỏ tu học';
    }

    article.dataset.bookTitle = bookInput.value.trim();
    article.dataset.chapterTitle = chapterInput.value.trim();
    article.dataset.lessonTitle = titleInput.value.trim();

    let output = '<!doctype html>\n' + doc.documentElement.outerHTML;
    output = applyV18AntiCache(output);
    return output;
  }

  document.getElementById('exportReader').addEventListener('click', () => {
    try{
      const output = buildReaderOutput();
      const blob = new Blob([output], {type:'text/html;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reader.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('Đã xuất reader.html dự phòng');
    }catch(err){
      setStatus(err.message || 'Không xuất được reader.html');
    }
  });

  // V20: publish directly to GitHub through the protected Worker.
  document.getElementById('publishNow')?.addEventListener('click', async () => {
    try{
      v20SetPublishState('Đang đăng…', 'busy');
      setStatus('Đang đăng bài lên website…');

      const readerHtml = buildReaderOutput();
      const catalog = await v20FetchCatalog();
      const meta = {
        bookTitle: bookInput.value.trim(),
        chapterTitle: chapterInput.value.trim(),
        lessonTitle: titleInput.value.trim(),
        subtitle: subtitleInput.value.trim()
      };
      const updatedCatalog = v20UpdateCatalog(catalog, meta);
      const catalogJs = v20CatalogJs(updatedCatalog);

      const result = await v20ApiRequest('/publish', {
        method:'POST',
        body:JSON.stringify({
          readerHtml,
          catalogJs,
          message:'Cập nhật bài: ' + (meta.lessonTitle || 'Bài học')
        })
      });

      dirty = false;
      v20SetPublishState('Đã đăng thành công', 'ok');
      setStatus('Đã đăng bài. GitHub Pages sẽ cập nhật sau ít phút.');
      alert('Đăng bài thành công!\\n\\nGitHub đã nhận bản cập nhật. Trang Reader/Home/Thư viện thường cập nhật sau khoảng 1–3 phút.');
    }catch(err){
      console.error(err);
      v20SetPublishState('Đăng thất bại', 'error');
      setStatus(err.message || 'Đăng bài thất bại');
      alert('Chưa đăng được bài:\\n' + (err.message || err));
    }
  });

  document.getElementById('testPublishConnection')?.addEventListener('click', async () => {
    try{
      v20SetPublishState('Đang kiểm tra…', 'busy');
      const data = await v20ApiRequest('/health', {method:'GET', headers:{}});
      v20SetPublishState('Kết nối tốt', 'ok');
      setStatus('Kết nối API xuất bản thành công');
    }catch(err){
      v20SetPublishState('Không kết nối', 'error');
      setStatus(err.message || 'Không kết nối được API');
    }
  });

  window.addEventListener('beforeunload', e => {
    if(!dirty) return;
    e.preventDefault();
    e.returnValue = '';
  });

  loadCurrent();
})();

document.addEventListener('DOMContentLoaded', () => {
  ['footerTitle','footerText','footerCopyright'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      try { localStorage.setItem('gntt_footer_' + id, el.value); } catch(e){}
    });
    if (el) {
      try {
        const saved = localStorage.getItem('gntt_footer_' + id);
        if (saved !== null) el.value = saved;
      } catch(e){}
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const api = document.getElementById('publishApiUrl');
  const pass = document.getElementById('publishPassword');
  if(api){
    try { api.value = localStorage.getItem(V20_PUBLISH_API_KEY) || ''; } catch(e){}
  }
  if(pass){
    try { pass.value = sessionStorage.getItem(V20_PUBLISH_PASS_KEY) || ''; } catch(e){}
  }
});
