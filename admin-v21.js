
const DATA = window.GNTT_DATA || {version:"21.1",books:[]};
DATA.version="22";
const DRAFT_KEY='gntt_v21_draft';
const API_KEY='gntt_v21_publish_api_url';
const PASS_KEY='gntt_v21_publish_password';

const $=id=>document.getElementById(id);
const bookSelect=$('bookSelect'), chapterSelect=$('chapterSelect'), lessonSelect=$('lessonSelect');
const bookTitle=$('bookTitle'), chapterTitle=$('chapterTitle'), lessonTitle=$('lessonTitle');
const youtubeUrl=$('youtubeUrl'), lessonSubtitle=$('lessonSubtitle'), editor=$('editor');
const statusEl=$('status'), preview=$('editorTitlePreview');

let selected={bookId:null,chapterId:null,lessonId:null};
let mode='edit';

function setStatus(t){ if(statusEl) statusEl.textContent=t; }
function setPublishState(t,k=''){ const e=$('publishState'); if(e){e.textContent=t;e.className='publish-state'+(k?' '+k:'');}}
function slug(s){
  return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100)||'muc-moi';
}
function lessonNumber(s){ const m=String(s||'').match(/\bBÀI\s*0*(\d+)\b/i); return m?String(Number(m[1])):''; }
function deepClone(x){ return JSON.parse(JSON.stringify(x)); }
function currentBook(){ return DATA.books.find(b=>b.id===selected.bookId)||null; }
function currentChapter(){ const b=currentBook(); return b?.chapters?.find(c=>c.id===selected.chapterId)||null; }
function currentLesson(){ const c=currentChapter(); return c?.lessons?.find(l=>l.id===selected.lessonId)||null; }

function uniqueId(base, existing){
  let id=base, n=2;
  while(existing.includes(id)){ id=base+'-'+n++; }
  return id;
}
function refreshSelectors(){
  bookSelect.innerHTML=(DATA.books||[]).map(b=>`<option value="${b.id}">${escapeHtml(b.title)}</option>`).join('');
  if(selected.bookId && DATA.books.some(b=>b.id===selected.bookId)) bookSelect.value=selected.bookId;
  else selected.bookId=DATA.books[0]?.id||null;

  const b=currentBook();
  chapterSelect.innerHTML=(b?.chapters||[]).map(c=>`<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('');
  if(selected.chapterId && b?.chapters?.some(c=>c.id===selected.chapterId)) chapterSelect.value=selected.chapterId;
  else selected.chapterId=b?.chapters?.[0]?.id||null;

  const c=currentChapter();
  lessonSelect.innerHTML=(c?.lessons||[]).map(l=>`<option value="${l.id}">${escapeHtml(l.title)}</option>`).join('');
  if(selected.lessonId && c?.lessons?.some(l=>l.id===selected.lessonId)) lessonSelect.value=selected.lessonId;
  else selected.lessonId=c?.lessons?.[0]?.id||null;
}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function loadSelected(){
  mode='edit';
  refreshSelectors();
  const b=currentBook(), c=currentChapter(), l=currentLesson();
  bookTitle.value=b?.title||'';
  chapterTitle.value=c?.title||'';
  lessonTitle.value=l?.title||'';
  youtubeUrl.value=l?.youtube||'';
  lessonSubtitle.value=l?.subtitle||'';
  editor.innerHTML=l?.contentHtml||'';
  preview.textContent=l?.title||'Chọn hoặc tạo bài học';
  $('openReaderLink').href=l?`reader.html?id=${encodeURIComponent(l.id)}&v=22`:'reader.html?v=22';
  setStatus(l?'Đã tải bài':'Chưa có bài');
}

bookSelect.addEventListener('change',()=>{
  selected.bookId=bookSelect.value; selected.chapterId=null; selected.lessonId=null; loadSelected();
});
chapterSelect.addEventListener('change',()=>{
  selected.chapterId=chapterSelect.value; selected.lessonId=null; loadSelected();
});
lessonSelect.addEventListener('change',()=>{
  selected.lessonId=lessonSelect.value; loadSelected();
});

$('newBook').addEventListener('click',()=>{
  mode='new-book'; selected={bookId:null,chapterId:null,lessonId:null};
  bookTitle.value=''; chapterTitle.value=''; lessonTitle.value=''; youtubeUrl.value=''; lessonSubtitle.value=''; editor.innerHTML='';
  preview.textContent='Đầu sách mới · nhập bài đầu tiên'; setStatus('Đang tạo đầu sách mới');
  bookTitle.focus();
});
$('newPdfBook').addEventListener('click',()=>{
  $('pdfPanel').hidden=false;
  $('pdfTitle').value='';
  $('pdfAuthor').value='';
  $('pdfDescription').value='';
  $('pdfChapter').value='NỘI DUNG SÁCH';
  $('pdfPagesPerLesson').value='10';
  $('pdfFile').value='';
  $('pdfPreview').hidden=true;
  $('pdfPreview').innerHTML='';
  $('publishPdf').disabled=true;
  window.__gnttPdfImport=null;
  $('pdfStatus').textContent='Chưa chọn file PDF.';
  $('pdfTitle').focus();
});
$('cancelPdf').addEventListener('click',()=>{$('pdfPanel').hidden=true;});
$('pdfFile').addEventListener('change',()=>{
  const f=$('pdfFile').files?.[0];
  $('pdfStatus').textContent=f ? `Đã chọn: ${f.name} · ${(f.size/1024/1024).toFixed(1)} MB` : 'Chưa chọn file PDF.';
});

$('newChapter').addEventListener('click',()=>{
  const b=currentBook(); if(!b){alert('Hãy chọn hoặc tạo đầu sách trước.');return;}
  mode='new-chapter'; selected.chapterId=null; selected.lessonId=null;
  bookTitle.value=b.title; chapterTitle.value=''; lessonTitle.value=''; youtubeUrl.value=''; lessonSubtitle.value=''; editor.innerHTML='';
  preview.textContent='Phẩm / Chương mới · nhập bài đầu tiên'; setStatus('Đang tạo chương mới'); chapterTitle.focus();
});
$('newLesson').addEventListener('click',()=>{
  const b=currentBook(), c=currentChapter(); if(!b||!c){alert('Hãy chọn đầu sách và phẩm/chương trước.');return;}
  mode='new-lesson'; selected.lessonId=null;
  bookTitle.value=b.title; chapterTitle.value=c.title; lessonTitle.value=''; youtubeUrl.value=''; lessonSubtitle.value=''; editor.innerHTML='';
  preview.textContent='Bài mới'; setStatus('Đang tạo bài mới'); lessonTitle.focus();
});

function cleanEditorHTML(){
  const clone=editor.cloneNode(true);
  clone.querySelectorAll('script,iframe').forEach(x=>x.remove());
  return clone.innerHTML.trim();
}
function upsertFromForm(){
  const bTitle=bookTitle.value.trim(), cTitle=chapterTitle.value.trim(), lTitle=lessonTitle.value.trim();
  if(!bTitle) throw new Error('Chưa nhập Tên sách');
  if(!cTitle) throw new Error('Chưa nhập Phẩm / Chương');
  if(!lTitle) throw new Error('Chưa nhập Tên bài');

  let b=currentBook();
  if(mode==='new-book' || !b){
    const ids=DATA.books.map(x=>x.id);
    b={id:uniqueId(slug(bTitle),ids),title:bTitle,description:'Tài liệu học và bài giảng được sắp xếp theo phẩm/chương.',chapters:[]};
    DATA.books.push(b); selected.bookId=b.id;
  } else b.title=bTitle;

  let c=(b.chapters||[]).find(x=>x.id===selected.chapterId);
  if(mode==='new-book'||mode==='new-chapter'||!c){
    const ids=(b.chapters||[]).map(x=>x.id);
    c={id:uniqueId(slug(cTitle),ids),title:cTitle,lessons:[]};
    b.chapters=b.chapters||[]; b.chapters.push(c); selected.chapterId=c.id;
  } else c.title=cTitle;

  let l=(c.lessons||[]).find(x=>x.id===selected.lessonId);
  const num=lessonNumber(lTitle);

  // Prevent duplicate same numbered lesson inside the same chapter.
  if(!l && num){
    l=(c.lessons||[]).find(x=>lessonNumber(x.title)===num)||null;
  }

  if(!l){
    const base=num ? `${b.id}-${c.id}-bai-${num}` : `${b.id}-${c.id}-${slug(lTitle)}`;
    const allIds=[];
    DATA.books.forEach(bb=>(bb.chapters||[]).forEach(cc=>(cc.lessons||[]).forEach(ll=>allIds.push(ll.id))));
    l={id:uniqueId(base,allIds)};
    c.lessons=c.lessons||[]; c.lessons.push(l);
  }

  l.title=lTitle;
  l.subtitle=lessonSubtitle.value.trim();
  l.youtube=youtubeUrl.value.trim();
  l.contentHtml=cleanEditorHTML();
  selected.lessonId=l.id;

  // Deduplicate same lesson ID/number in same chapter.
  c.lessons=c.lessons.filter((x,i,arr)=>{
    if(x===l) return true;
    if(x.id===l.id) return false;
    return !(num && lessonNumber(x.title)===num);
  });

  mode='edit';
  refreshSelectors();
  lessonSelect.value=l.id;
  preview.textContent=l.title;
  $('openReaderLink').href=`reader.html?id=${encodeURIComponent(l.id)}&v=22`;
  return l;
}

function buildDataJs(){ return 'window.GNTT_DATA = '+JSON.stringify(DATA,null,2)+';\n'; }
function buildCatalogJs(){
  const cat={books:DATA.books.map(b=>({
    id:b.id,title:b.title,description:b.description||'',type:b.type||'lesson',pdfUrl:b.pdfUrl||'',author:b.author||'',
    chapters:(b.chapters||[]).map(c=>({
      id:c.id,title:c.title,
      lessons:(c.lessons||[]).map(l=>({
        id:l.id,title:l.title,subtitle:l.subtitle||'',href:`reader.html?id=${l.id}&v=22`
      }))
    }))
  }))};
  return 'window.GNTT_CATALOG = '+JSON.stringify(cat,null,2)+';\n';
}

function apiUrl(){ return String($('publishApiUrl').value||'').trim().replace(/\/+$/,''); }
async function apiRequest(path, options={}){
  const url=apiUrl(), pass=$('publishPassword').value||'';
  if(!url) throw new Error('Chưa nhập địa chỉ API xuất bản');
  if(!pass) throw new Error('Chưa nhập mật khẩu quản trị');
  localStorage.setItem(API_KEY,url); sessionStorage.setItem(PASS_KEY,pass);
  const res=await fetch(url+path,{...options,headers:{'Content-Type':'application/json','X-Admin-Password':pass,...(options.headers||{})}});
  let data={}; try{data=await res.json()}catch(e){}
  if(!res.ok) throw new Error(data.error||('Lỗi API '+res.status));
  return data;
}

$('testPublishConnection').addEventListener('click',async()=>{
  try{
    setPublishState('Đang kiểm tra…','busy');
    const h=await apiRequest('/health',{method:'GET'});
    const service=String(h.service||'');
    if(!service.includes('gocnhotuhoc-publisher')){
      throw new Error('API không đúng dịch vụ xuất bản Góc nhỏ tu học');
    }
    setPublishState('Kết nối tốt','ok');
    setStatus('Kết nối Cloudflare thành công');
  }catch(e){
    setPublishState('Không kết nối','error');
    setStatus(e.message);
  }
});

$('publishNow').addEventListener('click',async()=>{
  try{
    const lesson=upsertFromForm();
    setPublishState('Đang đăng…','busy');setStatus('Đang cập nhật GitHub…');
    await apiRequest('/publish-v21',{
      method:'POST',
      body:JSON.stringify({dataJs:buildDataJs(),catalogJs:buildCatalogJs(),message:'Cập nhật: '+lesson.title})
    });
    setPublishState('Đã đăng thành công','ok');
    setStatus('Đã đăng. GitHub Pages sẽ cập nhật sau ít phút.');
    alert('Đăng bài thành công!\\n\\nBài cũ vẫn được giữ nguyên. GitHub Pages thường cập nhật sau 1–3 phút.');
  }catch(e){
    setPublishState('Đăng thất bại','error');setStatus(e.message||'Đăng thất bại');alert('Chưa đăng được:\\n'+(e.message||e));
  }
});

$('reloadData').addEventListener('click',()=>location.reload());
$('saveDraft').addEventListener('click',()=>{
  const d={book:bookTitle.value,chapter:chapterTitle.value,title:lessonTitle.value,youtube:youtubeUrl.value,subtitle:lessonSubtitle.value,html:editor.innerHTML};
  localStorage.setItem(DRAFT_KEY,JSON.stringify(d));setStatus('Đã lưu bản nháp');
});
$('restoreDraft').addEventListener('click',()=>{
  try{
    const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null'); if(!d){alert('Chưa có bản nháp.');return;}
    bookTitle.value=d.book||'';chapterTitle.value=d.chapter||'';lessonTitle.value=d.title||'';youtubeUrl.value=d.youtube||'';lessonSubtitle.value=d.subtitle||'';editor.innerHTML=d.html||'';
    mode='new-lesson';selected.lessonId=null;preview.textContent=lessonTitle.value||'Bản nháp';setStatus('Đã khôi phục bản nháp');
  }catch(e){alert('Không đọc được bản nháp.');}
});
$('exportData').addEventListener('click',()=>{
  try{upsertFromForm();}catch(e){}
  const blob=new Blob([buildDataJs()],{type:'text/javascript;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='data.js';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
});

[lessonTitle,bookTitle,chapterTitle].forEach(x=>x.addEventListener('input',()=>preview.textContent=lessonTitle.value||'Bài học'));

// Formatting toolbar
document.querySelectorAll('[data-cmd]').forEach(btn=>btn.addEventListener('click',()=>{editor.focus();document.execCommand(btn.dataset.cmd,false,null);}));
document.querySelectorAll('[data-block]').forEach(btn=>btn.addEventListener('click',()=>{
  editor.focus(); const tag=btn.dataset.block;
  if(tag==='blockquote') document.execCommand('formatBlock',false,'blockquote');
  else document.execCommand('formatBlock',false,tag);
}));
document.querySelectorAll('[data-color]').forEach(btn=>btn.addEventListener('click',()=>{editor.focus();document.execCommand('foreColor',false,btn.dataset.color);}));
$('clearFormat').addEventListener('click',()=>{editor.focus();document.execCommand('removeFormat',false,null);});



// ===== V22: PDF chỉ là nguồn -> chuyển thành các bài Reader =====
if(window.pdfjsLib){
  window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function vniToUnicode(text){
  let r=String(text||'');
  const pairs1=[
    ['AÁ','Ấ'],['aá','ấ'],['AÀ','Ầ'],['aà','ầ'],['AÅ','Ẩ'],['aå','ẩ'],['AÃ','Ẫ'],['aã','ẫ'],['AÄ','Ậ'],['aä','ậ'],
    ['AÉ','Ắ'],['aé','ắ'],['AÈ','Ằ'],['aè','ằ'],['AÚ','Ẳ'],['aú','ẳ'],['AÜ','Ẵ'],['aü','ẵ'],['AË','Ặ'],['aë','ặ'],
    ['EÁ','Ế'],['eá','ế'],['EÀ','Ề'],['eà','ề'],['EÅ','Ể'],['eå','ể'],['EÃ','Ễ'],['eã','ễ'],['EÄ','Ệ'],['eä','ệ'],
    ['OÁ','Ố'],['oá','ố'],['OÀ','Ồ'],['oà','ồ'],['OÅ','Ổ'],['oå','ổ'],['OÃ','Ỗ'],['oã','ỗ'],['OÄ','Ộ'],['oä','ộ'],
    ['ÔÙ','Ớ'],['ôù','ớ'],['ÔØ','Ờ'],['ôø','ờ'],['ÔÛ','Ở'],['ôû','ở'],['ÔÕ','Ỡ'],['ôõ','ỡ'],['ÔÏ','Ợ'],['ôï','ợ'],
    ['ÖÙ','Ứ'],['öù','ứ'],['ÖØ','Ừ'],['öø','ừ'],['ÖÛ','Ử'],['öû','ử'],['ÖÕ','Ữ'],['öõ','ữ'],['ÖÏ','Ự'],['öï','ự']
  ];
  const pairs2=[
    ['AØ','À'],['AÙ','Á'],['AÂ','Â'],['AÕ','Ã'],['EØ','È'],['EÙ','É'],['EÂ','Ê'],['OØ','Ò'],['OÙ','Ó'],['OÂ','Ô'],['OÕ','Õ'],['UØ','Ù'],['UÙ','Ú'],['YÙ','Ý'],
    ['aø','à'],['aù','á'],['aâ','â'],['aõ','ã'],['eø','è'],['eù','é'],['eâ','ê'],['oø','ò'],['où','ó'],['oâ','ô'],['oõ','õ'],['uø','ù'],['uù','ú'],['yù','ý'],
    ['AÊ','Ă'],['aê','ă'],['Ñ','Đ'],['ñ','đ'],['Ö','Ư'],['ö','ư'],
    ['AÏ','Ạ'],['aï','ạ'],['AÛ','Ả'],['aû','ả'],['EÏ','Ẹ'],['eï','ẹ'],['EÛ','Ẻ'],['eû','ẻ'],['EÕ','Ẽ'],['eõ','ẽ'],
    ['OÏ','Ọ'],['oï','ọ'],['OÛ','Ỏ'],['oû','ỏ'],['UÏ','Ụ'],['uï','ụ'],['UÛ','Ủ'],['uû','ủ'],['YØ','Ỳ'],['yø','ỳ'],['YÛ','Ỷ'],['yû','ỷ'],['YÕ','Ỹ'],['yõ','ỹ'],
    ['Ì','Ì'],['Í','Í'],['ì','ì'],['í','í'],['Ó','Ĩ'],['ó','ĩ'],['Ò','Ị'],['ò','ị'],['UÕ','Ũ'],['uõ','ũ'],['Î','Ỵ'],['î','ỵ']
  ];
  for(const [a,b] of pairs1) r=r.split(a).join(b);
  for(const [a,b] of pairs2) r=r.split(a).join(b);
  return r;
}

function looksLikeLegacyVni(text){
  const sample=String(text||'').slice(0,20000);
  const hits=(sample.match(/[öñæïûøùúüëäåõÖÑÆÏÛØÙÚÜËÄÅÕ]/g)||[]).length;
  return hits>=4;
}

function escapePdfText(s){
  return String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

function pageTextToHtml(text){
  const lines=String(text||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
  const paras=[];
  let buf=[];
  const flush=()=>{if(buf.length){paras.push(buf.join(' ').replace(/\s+/g,' ').trim());buf=[];}};
  for(const line of lines){
    if(/^\d{1,4}$/.test(line)){ continue; } // page number alone
    if(line.length<70 && (/^[A-ZÀ-Ỹ0-9IVXLC][A-ZÀ-Ỹ0-9IVXLC .,:;()–—-]+$/.test(line) || /^(Tiểu Sử|Lời Giới Thiệu|Dẫn Nhập|Lời Khai Thị|Lễ Phật|KINH |QUÁN |Quán )/i.test(line))){
      flush();
      paras.push('__H__'+line);
    }else{
      buf.push(line);
      if(/[.!?…””)]$/.test(line)) flush();
    }
  }
  flush();
  return paras.map(x=>x.startsWith('__H__')?`<h2>${escapePdfText(x.slice(5))}</h2>`:`<p>${escapePdfText(x)}</p>`).join('\n');
}

async function extractPdfForReader(file, fixVni){
  if(!window.pdfjsLib) throw new Error('Không tải được bộ đọc PDF. Hãy kiểm tra Internet rồi tải lại trang Admin.');
  const bytes=new Uint8Array(await file.arrayBuffer());
  const pdf=await window.pdfjsLib.getDocument({data:bytes}).promise;
  const pages=[];
  let legacyDetected=false;
  for(let i=1;i<=pdf.numPages;i++){
    $('pdfStatus').textContent=`Đang đọc PDF: trang ${i}/${pdf.numPages}…`;
    const page=await pdf.getPage(i);
    const tc=await page.getTextContent();
    let lines=[], current='';
    for(const item of tc.items){
      const t=String(item.str||'').trim();
      if(t) current += (current?' ':'')+t;
      if(item.hasEOL && current){ lines.push(current); current=''; }
    }
    if(current) lines.push(current);
    let text=lines.join('\n');
    if(looksLikeLegacyVni(text)) legacyDetected=true;
    if(fixVni && looksLikeLegacyVni(text)) text=vniToUnicode(text);
    pages.push(text);
  }
  return {numPages:pdf.numPages,pages,legacyDetected};
}

$('pdfFile').addEventListener('change',()=>{
  const f=$('pdfFile').files?.[0];
  window.__gnttPdfImport=null;
  $('publishPdf').disabled=true;
  $('pdfPreview').hidden=true;
  $('pdfStatus').textContent=f?`Đã chọn: ${f.name} · ${(f.size/1024/1024).toFixed(1)} MB. Bấm “Đọc & xem trước PDF”.`:'Chưa chọn file PDF.';
});

$('analyzePdf').addEventListener('click',async()=>{
  try{
    const file=$('pdfFile').files?.[0];
    if(!file) throw new Error('Chưa chọn file PDF');
    $('analyzePdf').disabled=true;
    $('publishPdf').disabled=true;
    const result=await extractPdfForReader(file,$('pdfFixVni').checked);
    window.__gnttPdfImport=result;
    const preview=(result.pages.slice(0,2).join('\n\n')).slice(0,4500);
    $('pdfPreview').hidden=false;
    $('pdfPreview').innerHTML=`<strong>Xem trước nội dung đã trích (${result.numPages} trang)</strong><pre>${escapeHtml(preview)}</pre>`;
    $('pdfStatus').textContent=`Đã đọc ${result.numPages} trang.${result.legacyDetected?' Phát hiện font/mã tiếng Việt cũ và đã thử chuyển sang Unicode.':''} Hãy xem phần xem trước trước khi đăng.`;
    $('publishPdf').disabled=false;
  }catch(e){
    $('pdfStatus').textContent=e.message||String(e);
  }finally{
    $('analyzePdf').disabled=false;
  }
});

$('publishPdf').addEventListener('click',async()=>{
  let book=null;
  try{
    const imp=window.__gnttPdfImport;
    if(!imp) throw new Error('Hãy bấm “Đọc & xem trước PDF” trước.');
    const title=$('pdfTitle').value.trim();
    const author=$('pdfAuthor').value.trim();
    const description=$('pdfDescription').value.trim();
    const chapterTitle=$('pdfChapter').value.trim()||'NỘI DUNG SÁCH';
    const per=Math.max(1,Math.min(50,Number($('pdfPagesPerLesson').value)||10));
    if(!title) throw new Error('Chưa nhập tên sách');

    const id=uniqueId(slug(title),DATA.books.map(b=>b.id));
    const chapterId=slug(chapterTitle);
    const lessons=[];
    for(let start=0, part=1;start<imp.pages.length;start+=per,part++){
      const end=Math.min(start+per,imp.pages.length);
      const text=imp.pages.slice(start,end).join('\n\n');
      const contentHtml=pageTextToHtml(text);
      lessons.push({
        id:`${id}-${chapterId}-phan-${part}`,
        title:`PHẦN ${part} · TRANG ${start+1}–${end}`,
        subtitle:[author,description].filter(Boolean).join(' · '),
        youtube:'',
        contentHtml
      });
    }
    book={
      id,title,author,
      description:description||author||'Sách đọc trực tuyến',
      type:'reader',
      sourceType:'pdf',
      chapters:[{id:chapterId,title:chapterTitle,lessons}]
    };
    DATA.books.push(book);

    setPublishState('Đang đăng…','busy');
    $('pdfStatus').textContent=`Đang đăng ${lessons.length} phần Reader lên GitHub…`;
    try{
      await apiRequest('/publish-v21',{
        method:'POST',
        body:JSON.stringify({
          dataJs:buildDataJs(),
          catalogJs:buildCatalogJs(),
          message:'Nhập PDF thành Reader: '+title
        })
      });
    }catch(e){
      DATA.books=DATA.books.filter(b=>b!==book);
      throw e;
    }

    selected={bookId:id,chapterId,lessonId:lessons[0]?.id||null};
    refreshSelectors();
    loadSelected();
    $('pdfPanel').hidden=true;
    setPublishState('Đã đăng thành công','ok');
    setStatus(`Đã tạo ${lessons.length} phần Reader từ PDF. GitHub Pages sẽ cập nhật sau ít phút.`);
    alert(`Đăng sách thành công!\n\nĐã tạo ${lessons.length} phần. Tất cả đều đọc bằng Reader giống Bài 40.`);
  }catch(e){
    if(book) DATA.books=DATA.books.filter(b=>b!==book);
    setPublishState('Đăng thất bại','error');
    $('pdfStatus').textContent=e.message||String(e);
    alert('Chưa đăng được sách:\n'+(e.message||e));
  }
});

document.addEventListener('DOMContentLoaded',()=>{
  $('publishApiUrl').value=localStorage.getItem(API_KEY)||'https://gocnhotuhoc-publisher.nttn-ngoan.workers.dev';
  $('publishPassword').value=sessionStorage.getItem(PASS_KEY)||'';
  refreshSelectors(); loadSelected();
});
