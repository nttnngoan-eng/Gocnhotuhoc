
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
        <a href="index.html?v=18f1">Trang chủ</a>
        <a href="library.html?v=18f1">Thư viện</a>
        <a href="reader.html?v=18f1">Tiếp tục đọc</a>
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
  if (!/http-equiv=["']Cache-Control["']/i.test(html)) {
    html = html.replace(/<meta charset=["']utf-8["']\s*\/?>/i,
      '<meta charset="utf-8">\n' +
      '  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n' +
      '  <meta http-equiv="Pragma" content="no-cache">\n' +
      '  <meta http-equiv="Expires" content="0">');
  }
  html = html.replace(/style\.css(?:\?[^"'<> ]*)?/g, 'style.css?v=18');
  html = html.replace(/app\.js(?:\?[^"'<> ]*)?/g, 'app.js?v=18');
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

  document.getElementById('exportReader').addEventListener('click', () => {
    if(!readerSource){
      setStatus('Chưa tải được reader.html');
      return;
    }

    const doc = new DOMParser().parseFromString(readerSource,'text/html');
    const article = doc.querySelector('.reader-content');
    const paper = doc.querySelector('.reader-paper');
    if(!article || !paper){
      setStatus('Không tìm thấy cấu trúc bài');
      return;
    }

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

    // Also update browser tab title.
    if(doc.querySelector('title')){
      doc.querySelector('title').textContent = (titleInput.value.trim() || 'Bài đọc') + ' | Góc nhỏ tu học';
    }

    // Metadata useful for later multi-lesson admin.
    article.dataset.bookTitle = bookInput.value.trim();
    article.dataset.chapterTitle = chapterInput.value.trim();
    article.dataset.lessonTitle = titleInput.value.trim();

    const output = '<!doctype html>\n' + doc.documentElement.outerHTML;
    const blob = new Blob([output], {type:'text/html;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reader.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    setStatus('Đã xuất reader.html với thông tin bài mới');
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
