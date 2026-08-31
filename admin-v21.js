
const DATA = window.GNTT_DATA || {version:"21.1",books:[]};
DATA.version="22.4";
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
  $('openReaderLink').href=l?`reader.html?id=${encodeURIComponent(l.id)}&v=22.4`:'reader.html?v=22.4';
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
  $('pdfSplitMode').value='toc';
  $('pdfPagesPerLesson').value='10';
  $('pdfFile').value='';
  $('pdfPreview').hidden=true;
  $('pdfPreview').innerHTML='';
  $('tocEditor').hidden=true;
  $('tocRows').innerHTML='';
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
  $('openReaderLink').href=`reader.html?id=${encodeURIComponent(l.id)}&v=22.4`;
  return l;
}

function buildDataJs(){ return 'window.GNTT_DATA = '+JSON.stringify(DATA,null,2)+';\n'; }
function buildCatalogJs(){
  const cat={books:DATA.books.map(b=>({
    id:b.id,title:b.title,description:b.description||'',type:b.type||'lesson',pdfUrl:b.pdfUrl||'',author:b.author||'',
    chapters:(b.chapters||[]).map(c=>({
      id:c.id,title:c.title,
      lessons:(c.lessons||[]).map(l=>({
        id:l.id,title:l.title,subtitle:l.subtitle||'',href:`reader.html?id=${l.id}&v=22.4`
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



// ===== V22.1: PDF -> Reader, ưu tiên ngắt theo Mục lục =====
if(window.pdfjsLib){
  window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function vniToUnicode(text){
  let r=String(text||'');
  const pairs=[
    ['AÁ','Ấ'],['aá','ấ'],['AÀ','Ầ'],['aà','ầ'],['AÅ','Ẩ'],['aå','ẩ'],['AÃ','Ẫ'],['aã','ẫ'],['AÄ','Ậ'],['aä','ậ'],
    ['AÉ','Ắ'],['aé','ắ'],['AÈ','Ằ'],['aè','ằ'],['AÚ','Ẳ'],['aú','ẳ'],['AÜ','Ẵ'],['aü','ẵ'],['AË','Ặ'],['aë','ặ'],
    ['EÁ','Ế'],['eá','ế'],['EÀ','Ề'],['eà','ề'],['EÅ','Ể'],['eå','ể'],['EÃ','Ễ'],['eã','ễ'],['EÄ','Ệ'],['eä','ệ'],
    ['OÁ','Ố'],['oá','ố'],['OÀ','Ồ'],['oà','ồ'],['OÅ','Ổ'],['oå','ổ'],['OÃ','Ỗ'],['oã','ỗ'],['OÄ','Ộ'],['oä','ộ'],
    ['ÔÙ','Ớ'],['ôù','ớ'],['ÔØ','Ờ'],['ôø','ờ'],['ÔÛ','Ở'],['ôû','ở'],['ÔÕ','Ỡ'],['ôõ','ỡ'],['ÔÏ','Ợ'],['ôï','ợ'],
    ['ÖÙ','Ứ'],['öù','ứ'],['ÖØ','Ừ'],['öø','ừ'],['ÖÛ','Ử'],['öû','ử'],['ÖÕ','Ữ'],['öõ','ữ'],['ÖÏ','Ự'],['öï','ự'],
    ['AØ','À'],['AÙ','Á'],['AÂ','Â'],['AÕ','Ã'],['AÊ','Ă'],['Ñ','Đ'],['Ö','Ư'],
    ['aø','à'],['aù','á'],['aâ','â'],['aõ','ã'],['aê','ă'],['ñ','đ'],['ö','ư'],
    ['EØ','È'],['EÙ','É'],['EÂ','Ê'],['eø','è'],['eù','é'],['eâ','ê'],
    ['OØ','Ò'],['OÙ','Ó'],['OÂ','Ô'],['OÕ','Õ'],['oø','ò'],['où','ó'],['oâ','ô'],['oõ','õ'],
    ['UØ','Ù'],['UÙ','Ú'],['uø','ù'],['uù','ú'],['YÙ','Ý'],['yù','ý'],
    ['AÏ','Ạ'],['aï','ạ'],['AÛ','Ả'],['aû','ả'],['EÏ','Ẹ'],['eï','ẹ'],['EÛ','Ẻ'],['eû','ẻ'],['EÕ','Ẽ'],['eõ','ẽ'],
    ['OÏ','Ọ'],['oï','ọ'],['OÛ','Ỏ'],['oû','ỏ'],['UÏ','Ụ'],['uï','ụ'],['UÛ','Ủ'],['uû','ủ'],
    ['YØ','Ỳ'],['yø','ỳ'],['YÛ','Ỷ'],['yû','ỷ'],['YÕ','Ỹ'],['yõ','ỹ'],['UÕ','Ũ'],['uõ','ũ']
  ];
  for(const [a,b] of pairs) r=r.split(a).join(b);
  return r;
}
function hasVietnameseUnicode(text){
  return /[ăâđêôơưĂÂĐÊÔƠƯ]|[àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵÀÁẢÃẠẰẮẲẴẶẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤỪỨỬỮỰỲÝỶỸỴ]/.test(String(text||''));
}

// V22.4: chỉ nhận VNI khi dòng có ký tự "mã cũ" mạnh.
// Không dùng các ký tự Unicode hợp lệ như À/Á để nhận diện,
// nên "TOÀN", "ĐỊNH"... sẽ không bị chuyển nhầm.
function looksLikeLegacyVniLine(text){
  const t=String(text||'');
  if(!t.trim()) return false;
  return /[ÑñÖöÆæØøÛûÏïÅåÄäËëÜü]/.test(t);
}
function looksLikeLegacyVni(text){
  return String(text||'').split(/\r?\n/).some(looksLikeLegacyVniLine);
}
function convertMixedVniText(text){
  let converted=0;
  const lines=String(text||'').split(/\r?\n/).map(line=>{
    if(looksLikeLegacyVniLine(line)){
      converted++;
      return vniToUnicode(line);
    }
    return line;
  });
  return {text:lines.join('\n'),converted};
}
function escapePdfText(v){return String(v||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function normalizeTocTitle(v){
  return String(v||'')
    .replace(/^[*∗•·\-–—]+\s*/,'')
    .replace(/\.{2,}.*$/,'')
    .replace(/\s+/g,' ').trim();
}
function tocLevelFromTitle(raw){
  const t=String(raw||'').trim();

  // Cấp lớn: I., II., III., IV. / A) 1- ... / B) 1- ... / 2- TỨ THÁNH ĐẾ / tiêu đề lớn.
  if(/^(I|II|III|IV|V|VI|VII|VIII|IX|X)[\s.\-–—)]/i.test(t)) return 1;
  if(/^[A-ZÀ-Ỹ]\)\s*\d+\s*[-–—]/i.test(t)) return 1;
  if(/^\d+\s*[-–—]\s*[A-ZÀ-Ỹ0-9 ]{4,}$/i.test(t)) return 1;

  // Một số đầu mục lớn thường gặp trong sách Phật học.
  if(/^(TIỂU SỬ|LỜI GIỚI THIỆU|DẪN NHẬP|LỜI KHAI THỊ|LỄ PHẬT|KINH TỨ NIỆM XỨ|ĐỊNH NGHĨA|HẢI TRIỀU ÂM TOÀN TẬP)$/i.test(t)) return 1;

  // Cấp con: mục ngắn, không có ký hiệu đánh số lớn.
  return 2;
}

function refineTocLevels(entries){
  const arr=entries.map(x=>({...x}));

  for(const e of arr){
    const t=e.title.trim();
    if(/^[A-ZÀ-Ỹ]\)\s*\d+\s*[-–—]/i.test(t) || /^\d+\s*[-–—]\s*[A-ZÀ-Ỹ0-9 ]{4,}$/i.test(t)){
      e.level=1;
    }
  }

  let currentMajorIndex=-1;
  for(let i=0;i<arr.length;i++){
    const e=arr[i];
    if(e.level===1){
      currentMajorIndex=i;
      continue;
    }
    if(currentMajorIndex>=0){
      e.level=2;
    }
  }

  const childNames=[
    'Ái dục','Sân hận','Thùy miên','Trạo hối','Nghi',
    'Niệm','Trạch pháp','Tinh tấn','Hỷ','Khinh an','Định','Xả',
    'Khổ','Khổ Tập','Khổ Diệt','Khổ Diệt Đạo'
  ];
  for(const e of arr){
    if(childNames.some(n=>e.title.localeCompare(n,'vi',{sensitivity:'base'})===0)){
      e.level=2;
    }
  }

  const introPatterns=/^(TIỂU SỬ|LỜI GIỚI THIỆU|DẪN NHẬP|LỜI KHAI THỊ|LỄ PHẬT|KINH TỨ NIỆM XỨ|ĐỊNH NGHĨA|HẢI TRIỀU ÂM TOÀN TẬP)$/i;
  for(const e of arr){
    if(introPatterns.test(e.title.trim())) e.level=1;
  }
  return arr;
}
function detectTocEntries(pages){
  const found=[];
  const max=Math.min(25,pages.length);
  let inToc=false, tocSeen=false, quiet=0;
  for(let pi=0;pi<max;pi++){
    const lines=String(pages[pi]||'').split('\n').map(x=>x.trim()).filter(Boolean);
    if(lines.some(x=>/M[ỤU]C\s+L[ỤU]C/i.test(x))){
      inToc=true; tocSeen=true; quiet=0; continue;
    }
    if(!inToc) continue;
    let pageHits=0;
    for(let i=0;i<lines.length;i++){
      let line=lines[i];
      let m=line.match(/^(.*?)(?:\.{2,}|\s{2,})\s*(\d{1,4})\s*$/);
      if(!m) m=line.match(/^(.{3,120}?)\s+(\d{1,4})\s*$/);
      if(!m && i+1<lines.length && /^\d{1,4}$/.test(lines[i+1])){
        m=[null,line,lines[i+1]]; i++;
      }
      if(!m) continue;
      const page=Number(m[2]);
      const raw=m[1].trim();
      const title=normalizeTocTitle(raw);
      if(!title || page<1 || page>2000 || title.length<2) continue;
      if(/^(TỨ NIỆM XỨ|Giảng nghĩa)$/i.test(title)) continue;
      found.push({title,page,level:tocLevelFromTitle(raw),enabled:true});
      pageHits++;
    }
    quiet = pageHits ? 0 : quiet+1;
    if(tocSeen && quiet>=2 && found.length>=3) break;
  }
  const seen=new Set();
  const unique=found.filter(x=>{
    const key=x.title.toLowerCase()+'|'+x.page;
    if(seen.has(key)) return false;
    seen.add(key); return true;
  });
  return refineTocLevels(unique);
}
function detectPageOffset(entries,pages){
  // Tìm vài tiêu đề mục lục trong phần thân sách để ước lượng: PDF index - số trang in.
  const candidates=entries.filter(x=>x.title.length>=4).slice(0,12);
  const diffs=[];
  for(const e of candidates){
    const needle=e.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
    if(!needle) continue;
    for(let i=0;i<Math.min(pages.length,Math.max(40,e.page+15));i++){
      const hay=String(pages[i]||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ');
      if(hay.includes(needle)){
        const displayedPdfPage=i+1;
        // bỏ qua chính trang mục lục: chỉ chấp nhận gần số trang đã ghi
        const d=displayedPdfPage-e.page;
        if(Math.abs(d)<=12){ diffs.push(d); break; }
      }
    }
  }
  if(!diffs.length) return 0;
  diffs.sort((a,b)=>a-b);
  return diffs[Math.floor(diffs.length/2)];
}
function pageTextToHtml(text){
  const lines=String(text||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
  const paras=[]; let buf=[];
  const flush=()=>{if(buf.length){paras.push(buf.join(' ').replace(/\s+/g,' ').trim());buf=[];}};
  for(const line of lines){
    if(/^\d{1,4}$/.test(line)) continue;
    const heading = line.length<100 && (
      /^[IVXLC]+[\s.\-–—)]/i.test(line) ||
      /^[A-ZÀ-Ỹ]\)\s*\d+/i.test(line) ||
      /^[A-ZÀ-Ỹ0-9][A-ZÀ-Ỹ0-9 .,:;()–—-]{5,}$/.test(line)
    );
    if(heading){flush();paras.push('__H__'+line);}
    else{buf.push(line);if(/[.!?…””)]$/.test(line)) flush();}
  }
  flush();
  return paras.map(x=>x.startsWith('__H__')?`<h2>${escapePdfText(x.slice(5))}</h2>`:`<p>${escapePdfText(x)}</p>`).join('\n');
}
async function extractPdfForReader(file,fixVni){
  if(!window.pdfjsLib) throw new Error('Không tải được bộ đọc PDF. Hãy kiểm tra Internet rồi tải lại trang Admin.');
  const bytes=new Uint8Array(await file.arrayBuffer());
  const pdf=await window.pdfjsLib.getDocument({data:bytes}).promise;
  const pages=[]; let legacyDetected=false;
  for(let i=1;i<=pdf.numPages;i++){
    $('pdfStatus').textContent=`Đang đọc PDF: trang ${i}/${pdf.numPages}…`;
    const page=await pdf.getPage(i), tc=await page.getTextContent();
    let lines=[], current='';
    for(const item of tc.items){
      const t=String(item.str||'').trim();
      if(t) current+=(current?' ':'')+t;
      if(item.hasEOL&&current){lines.push(current);current='';}
    }
    if(current) lines.push(current);
    let text=lines.join('\n');
    // Store raw extraction first. Conversion decision is made after reading the whole PDF.
    pages.push(text);
  }
  // V22.4: PDF có thể trộn Unicode + VNI. Chuyển riêng từng dòng có VNI.
  let finalPages=pages;
  let convertedLines=0;
  legacyDetected=looksLikeLegacyVni(pages.slice(0,60).join('\n'));
  if(fixVni){
    finalPages=pages.map(pageText=>{
      const r=convertMixedVniText(pageText);
      convertedLines+=r.converted;
      return r.text;
    });
  }
  const toc=detectTocEntries(finalPages);
  const offset=detectPageOffset(toc,finalPages);
  return {
    numPages:pdf.numPages,pages:finalPages,legacyDetected,toc,pageOffset:offset,
    alreadyUnicode:hasVietnameseUnicode(pages.slice(0,40).join('\n')),
    convertedLines
  };
}
function addTocRow(item={title:'Mục mới',page:1,level:1,enabled:true}){
  const tr=document.createElement('tr');
  tr.innerHTML=`
    <td><input class="toc-use" type="checkbox" ${item.enabled!==false?'checked':''}></td>
    <td><select class="toc-level"><option value="1" ${Number(item.level)===1?'selected':''}>Chương</option><option value="2" ${Number(item.level)===2?'selected':''}>Mục</option></select></td>
    <td><input class="toc-title" type="text" value="${escapeHtml(item.title||'')}"></td>
    <td><input class="toc-page" type="number" min="1" value="${Number(item.page)||1}"></td>
    <td><button type="button" class="toc-del" title="Xóa">✕</button></td>`;
  tr.querySelector('.toc-del').addEventListener('click',()=>tr.remove());
  $('tocRows').appendChild(tr);
}
function renderTocEditor(entries){
  $('tocRows').innerHTML='';
  entries.forEach(addTocRow);
  $('tocEditor').hidden=false;
}
function getEditedToc(){
  return [...$('tocRows').querySelectorAll('tr')].map(tr=>({
    enabled:tr.querySelector('.toc-use').checked,
    level:Number(tr.querySelector('.toc-level').value)||1,
    title:tr.querySelector('.toc-title').value.trim(),
    page:Number(tr.querySelector('.toc-page').value)||1
  })).filter(x=>x.enabled&&x.title).sort((a,b)=>a.page-b.page);
}
$('addTocRow').addEventListener('click',()=>addTocRow({title:'',page:1,level:1,enabled:true}));

$('pdfFile').addEventListener('change',()=>{
  const f=$('pdfFile').files?.[0];
  window.__gnttPdfImport=null;
  $('publishPdf').disabled=true;
  $('pdfPreview').hidden=true;
  $('tocEditor').hidden=true;
  $('tocRows').innerHTML='';
  $('pdfStatus').textContent=f?`Đã chọn: ${f.name} · ${(f.size/1024/1024).toFixed(1)} MB. Bấm “Đọc PDF & nhận Mục lục”.`:'Chưa chọn file PDF.';
});

$('analyzePdf').addEventListener('click',async()=>{
  try{
    const file=$('pdfFile').files?.[0];
    if(!file) throw new Error('Chưa chọn file PDF');
    $('analyzePdf').disabled=true; $('publishPdf').disabled=true;
    const result=await extractPdfForReader(file,$('pdfFixVni').checked);
    window.__gnttPdfImport=result;
    const preview=result.pages.slice(0,8).join('\n\n').slice(0,6500);
    $('pdfPreview').hidden=false;
    $('pdfPreview').innerHTML=`<strong>Xem trước chữ đã trích (${result.numPages} trang)</strong><pre>${escapeHtml(preview)}</pre>`;
    if(result.toc.length){
      renderTocEditor(result.toc);
      const textMode=$('pdfFixVni').checked
        ? (result.convertedLines>0
            ? `PDF trộn Unicode/VNI → đã sửa ${result.convertedLines} dòng VNI; dòng Unicode giữ nguyên.`
            : 'Không thấy dòng VNI cần sửa → giữ nguyên chữ PDF.')
        : (result.legacyDetected
            ? 'Có dấu hiệu VNI cũ nhưng chức năng sửa VNI đang tắt.'
            : 'Giữ nguyên chữ PDF.');
      $('pdfStatus').textContent=`${textMode} Đã nhận ${result.toc.length} mục và tự phân cấp Chương/Mục. Độ lệch trang ước tính: ${result.pageOffset>=0?'+':''}${result.pageOffset}. Hãy kiểm tra chữ và Mục lục trước khi đăng.`;
    }else{
      $('tocEditor').hidden=true;
      $('pdfStatus').textContent=`Không nhận được Mục lục tự động. Bạn có thể chọn “Theo số trang” hoặc thêm mục thủ công.`;
    }
    $('publishPdf').disabled=false;
  }catch(e){$('pdfStatus').textContent=e.message||String(e);}
  finally{$('analyzePdf').disabled=false;}
});

function buildReaderBookFromToc({title,author,description,id,imp,toc}){
  const offset=Number(imp.pageOffset)||0;
  const clean=toc.map((x,i)=>({...x,_i:i,pdfStart:Math.max(1,Math.min(imp.numPages,x.page+offset))}));
  const chapters=[]; let current=null;
  for(let i=0;i<clean.length;i++){
    const e=clean[i], next=clean[i+1];
    const start=e.pdfStart, end=Math.max(start,Math.min(imp.numPages,(next?next.pdfStart-1:imp.numPages)));
    const contentHtml=pageTextToHtml(imp.pages.slice(start-1,end).join('\n\n'));
    if(e.level===1 || !current){
      current={
        id:uniqueId(slug(e.title)||('chuong-'+(chapters.length+1)),chapters.map(c=>c.id)),
        title:e.title, lessons:[]
      };
      chapters.push(current);
      // Chương cũng là nội dung đọc riêng.
      current.lessons.push({
        id:`${id}-${current.id}-mo-dau`,
        title:e.title,
        subtitle:[author,description,`Trang ${e.page}${end>=start?'–'+(end-offset):''}`].filter(Boolean).join(' · '),
        youtube:'',contentHtml
      });
    }else{
      const lid=uniqueId(slug(e.title)||('muc-'+(current.lessons.length+1)),current.lessons.map(l=>l.id));
      current.lessons.push({
        id:`${id}-${current.id}-${lid}`,
        title:e.title,
        subtitle:[author,description,`Trang ${e.page}${end>=start?'–'+(end-offset):''}`].filter(Boolean).join(' · '),
        youtube:'',contentHtml
      });
    }
  }
  return {id,title,author,description:description||author||'Sách đọc trực tuyến',type:'reader',sourceType:'pdf',chapters};
}

$('publishPdf').addEventListener('click',async()=>{
  let book=null;
  try{
    const imp=window.__gnttPdfImport;
    if(!imp) throw new Error('Hãy bấm “Đọc PDF & nhận Mục lục” trước.');
    const title=$('pdfTitle').value.trim(), author=$('pdfAuthor').value.trim(), description=$('pdfDescription').value.trim();
    if(!title) throw new Error('Chưa nhập tên sách');
    const id=uniqueId(slug(title),DATA.books.map(b=>b.id));
    const mode=$('pdfSplitMode').value;
    let toc=getEditedToc();

    if(mode==='toc'){
      if(!toc.length) throw new Error('Chưa có mục nào để ngắt theo Mục lục. Hãy thêm/sửa mục hoặc chọn cách chia theo số trang.');
      book=buildReaderBookFromToc({title,author,description,id,imp,toc});
    }else{
      const per=Math.max(1,Math.min(50,Number($('pdfPagesPerLesson').value)||10));
      const chapterId='noi-dung-sach', lessons=[];
      for(let start=0,part=1;start<imp.pages.length;start+=per,part++){
        const end=Math.min(start+per,imp.pages.length);
        lessons.push({
          id:`${id}-${chapterId}-phan-${part}`,
          title:`PHẦN ${part} · TRANG ${start+1}–${end}`,
          subtitle:[author,description].filter(Boolean).join(' · '),
          youtube:'',contentHtml:pageTextToHtml(imp.pages.slice(start,end).join('\n\n'))
        });
      }
      book={id,title,author,description:description||author||'Sách đọc trực tuyến',type:'reader',sourceType:'pdf',chapters:[{id:chapterId,title:'NỘI DUNG SÁCH',lessons}]};
    }

    if(!book.chapters.length) throw new Error('Không tạo được Chương/Phần nào từ PDF.');
    DATA.books.push(book);
    setPublishState('Đang đăng…','busy');
    $('pdfStatus').textContent=`Đang đăng ${book.chapters.length} chương/phần Reader lên GitHub…`;
    try{
      await apiRequest('/publish-v21',{method:'POST',body:JSON.stringify({
        dataJs:buildDataJs(),catalogJs:buildCatalogJs(),message:'Nhập PDF theo Mục lục: '+title
      })});
    }catch(e){DATA.books=DATA.books.filter(b=>b!==book);throw e;}

    const firstChapter=book.chapters[0], firstLesson=firstChapter?.lessons?.[0];
    selected={bookId:id,chapterId:firstChapter?.id||null,lessonId:firstLesson?.id||null};
    refreshSelectors(); loadSelected();
    $('pdfPanel').hidden=true;
    setPublishState('Đã đăng thành công','ok');
    setStatus(`Đã tạo ${book.chapters.length} chương/phần theo Mục lục. Mỗi mục đọc bằng Reader giống Bài 40.`);
    alert(`Đăng sách thành công!\n\nĐã tạo ${book.chapters.length} chương/phần theo Mục lục.\nTất cả đều đọc bằng Reader giống Bài 40.`);
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
