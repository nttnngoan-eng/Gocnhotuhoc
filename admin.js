
(() => {
  const editor = document.getElementById('editor');
  const status = document.getElementById('status');
  const DRAFT_KEY = 'gocnho_admin_draft_bai40_v1';
  let readerSource = '';
  let originalArticleHTML = '';
  let dirty = false;

  function setStatus(text){
    status.textContent = text;
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

      originalArticleHTML = article.innerHTML;
      editor.innerHTML = originalArticleHTML;
      dirty = false;
      setStatus('Đã tải bài hiện tại');
    }catch(err){
      setStatus('Lỗi tải bài');
      editor.innerHTML = '<p>Không thể tải reader.html. Hãy mở trang quản trị từ website GitHub Pages, không mở file admin.html trực tiếp bằng file://.</p>';
    }
  }

  function focusEditor(){
    editor.focus({preventScroll:true});
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
      const block = btn.dataset.block;
      document.execCommand('formatBlock', false, block === 'p' ? 'p' : block);
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

  editor.addEventListener('input', () => {
    dirty = true;
    setStatus('Có thay đổi chưa lưu');
  });

  document.getElementById('saveDraft').addEventListener('click', () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      html: editor.innerHTML,
      savedAt: Date.now()
    }));
    dirty = false;
    setStatus('Đã lưu bản nháp trên trình duyệt');
  });

  document.getElementById('restoreDraft').addEventListener('click', () => {
    try{
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if(!d || !d.html){
        setStatus('Chưa có bản nháp');
        return;
      }
      editor.innerHTML = d.html;
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

    // Remove browser-only editing artifacts.
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    clone.querySelectorAll('[style=""]').forEach(el => el.removeAttribute('style'));

    // Convert deprecated FONT tags created by execCommand into spans.
    clone.querySelectorAll('font[color]').forEach(font => {
      const span = document.createElement('span');
      span.style.color = font.getAttribute('color');
      while(font.firstChild) span.appendChild(font.firstChild);
      font.replaceWith(span);
    });

    return clone.innerHTML.trim();
  }

  document.getElementById('exportReader').addEventListener('click', () => {
    if(!readerSource){
      setStatus('Chưa tải được reader.html');
      return;
    }

    const doc = new DOMParser().parseFromString(readerSource,'text/html');
    const article = doc.querySelector('.reader-content');
    if(!article){
      setStatus('Không tìm thấy nội dung bài');
      return;
    }

    article.innerHTML = cleanEditorHTML();

    // Preserve the original doctype and serialize the complete page.
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

    setStatus('Đã xuất reader.html');
  });

  window.addEventListener('beforeunload', e => {
    if(!dirty) return;
    e.preventDefault();
    e.returnValue = '';
  });

  loadCurrent();
})();
