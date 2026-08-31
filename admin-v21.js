
const DATA = window.GNTT_DATA || {version:21,books:[]};
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
  $('openReaderLink').href=l?`reader.html?id=${encodeURIComponent(l.id)}&v=21`:'reader.html?v=21';
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
  $('openReaderLink').href=`reader.html?id=${encodeURIComponent(l.id)}&v=21`;
  return l;
}

function buildDataJs(){ return 'window.GNTT_DATA = '+JSON.stringify(DATA,null,2)+';\n'; }
function buildCatalogJs(){
  const cat={books:DATA.books.map(b=>({
    id:b.id,title:b.title,description:b.description||'',
    chapters:(b.chapters||[]).map(c=>({
      id:c.id,title:c.title,
      lessons:(c.lessons||[]).map(l=>({
        id:l.id,title:l.title,subtitle:l.subtitle||'',href:`reader.html?id=${l.id}&v=21`
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
  try{setPublishState('Đang kiểm tra…','busy');await apiRequest('/health',{method:'GET'});setPublishState('Kết nối tốt','ok');setStatus('Kết nối Cloudflare thành công');}
  catch(e){setPublishState('Không kết nối','error');setStatus(e.message);}
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

document.addEventListener('DOMContentLoaded',()=>{
  $('publishApiUrl').value=localStorage.getItem(API_KEY)||'https://gocnhotuhoc-publisher.nttn-ngoan.workers.dev';
  $('publishPassword').value=sessionStorage.getItem(PASS_KEY)||'';
  refreshSelectors(); loadSelected();
});
