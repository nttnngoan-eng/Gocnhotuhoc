
const DATA = window.GNTT_DATA || {version:"21.1",books:[]};
DATA.version="24.2.5";
DATA.siteSettings = DATA.siteSettings || {homeIcon:"theme-openbook",homeIconStyle:"brown"};
DATA.siteSettings.homeIconStyle = DATA.siteSettings.homeIconStyle || 'brown';
DATA.siteSettings.accentTheme=DATA.siteSettings.accentTheme||"lightbrown";
DATA.siteSettings.coverImage=DATA.siteSettings.coverImage||"";
DATA.siteSettings.coverFit=['cover','contain','auto'].includes(DATA.siteSettings.coverFit)?DATA.siteSettings.coverFit:'cover';
const DRAFT_KEY='gntt_v21_draft';
const API_KEY='gntt_v21_publish_api_url';
const PASS_KEY='gntt_v21_publish_password';

const $=id=>document.getElementById(id);
const bookSelect=$('bookSelect'), chapterSelect=$('chapterSelect'), lessonSelect=$('lessonSelect');
const bookTitle=$('bookTitle'), bookCreditRole=$('bookCreditRole'), bookCreditName=$('bookCreditName'), chapterTitle=$('chapterTitle'), lessonTitle=$('lessonTitle');
const youtubeUrl=$('youtubeUrl'), lessonSubtitle=$('lessonSubtitle'), lessonVisibility=$('lessonVisibility'), editor=$('editor');
const bookIcon=$('bookIcon'), bookIconStyle=$('bookIconStyle'), bookIconPicker=$('bookIconPicker'), bookIconPreview=$('bookIconPreview');
const siteIcon=$('siteIcon'), siteIconStyle=$('siteIconStyle'), siteIconPicker=$('siteIconPicker'), siteIconPreview=$('siteIconPreview');
const siteAccentTheme=$('siteAccentTheme'), siteCoverFile=$('siteCoverFile'), siteCoverPreview=$('siteCoverPreview');
const bookCoverFile=null, bookCoverPreview=null;
let pendingBookCover='';
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
  lessonSelect.innerHTML=(c?.lessons||[]).map(l=>`<option value="${l.id}">${l.visibility==='private'?'🔒':'🌐'} ${escapeHtml(l.title)}</option>`).join('');
  if(selected.lessonId && c?.lessons?.some(l=>l.id===selected.lessonId)) lessonSelect.value=selected.lessonId;
  else selected.lessonId=c?.lessons?.[0]?.id||null;
}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function setBookIcon(id){
  const lib=window.GNTT_BOOK_ICONS;
  const valid=lib?.get(id)?.id || lib?.defaultId || 'theme-openbook';
  if(bookIcon) bookIcon.value=valid;
  if(bookIconPreview) bookIconPreview.innerHTML=lib?.render(valid,bookIconStyle?.value||'brown')||'';
  if(bookIconPicker){
    bookIconPicker.querySelectorAll('[data-book-icon]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.bookIcon===valid));
  }
}
function renderBookIconPicker(){
  const lib=window.GNTT_BOOK_ICONS;
  if(!bookIconPicker||!lib) return;
  let lastGroup='';
  let html='';
  for(const item of lib.icons){
    if(item.group!==lastGroup){
      if(lastGroup) html+='</div></div>';
      html+=`<div class="book-icon-group"><strong>${escapeHtml(item.group)}</strong><div class="book-icon-options">`;
      lastGroup=item.group;
    }
    html+=`<button type="button" class="book-icon-choice" data-book-icon="${escapeHtml(item.id)}" title="${escapeHtml(item.label)}"><span>${lib.render(item.id,bookIconStyle?.value||'brown')}</span><small>${escapeHtml(item.label)}</small></button>`;
  }
  if(lastGroup) html+='</div></div>';
  bookIconPicker.innerHTML=html;
  bookIconPicker.addEventListener('click',e=>{
    const btn=e.target.closest('[data-book-icon]');
    if(btn) setBookIcon(btn.dataset.bookIcon);
  });
}
renderBookIconPicker();
function setBookIconStyle(style){
  style=['brown','pink','green'].includes(style)?style:(style==='mono'?'brown':(style==='color'?'pink':'brown'));
  if(bookIconStyle) bookIconStyle.value=style;
  document.querySelectorAll('[data-icon-style]').forEach(b=>b.classList.toggle('selected',b.dataset.iconStyle===style));
  renderBookIconPicker(); setBookIcon(bookIcon?.value||'theme-openbook');
}
document.querySelectorAll('[data-icon-style]').forEach(b=>b.addEventListener('click',()=>setBookIconStyle(b.dataset.iconStyle)));
function setSiteIcon(id){
  const lib=window.GNTT_BOOK_ICONS;
  const valid=lib?.get(id)?.id || lib?.defaultId || 'theme-openbook';
  DATA.siteSettings = DATA.siteSettings || {};
  DATA.siteSettings.homeIcon=valid;
  if(siteIcon) siteIcon.value=valid;
  if(siteIconPreview) siteIconPreview.innerHTML=lib?.render(valid,siteIconStyle?.value||'brown')||'';
  if(siteIconPicker) siteIconPicker.querySelectorAll('[data-site-icon]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.siteIcon===valid));
}
function renderSiteIconPicker(){
  const lib=window.GNTT_BOOK_ICONS; if(!siteIconPicker||!lib) return;
  let lastGroup='',html='';
  for(const item of lib.icons){
    if(item.group!==lastGroup){ if(lastGroup) html+='</div></div>'; html+=`<div class="book-icon-group"><strong>${escapeHtml(item.group)}</strong><div class="book-icon-options">`; lastGroup=item.group; }
    html+=`<button type="button" class="book-icon-choice" data-site-icon="${escapeHtml(item.id)}" title="${escapeHtml(item.label)}"><span>${lib.render(item.id,siteIconStyle?.value||'brown')}</span><small>${escapeHtml(item.label)}</small></button>`;
  }
  if(lastGroup) html+='</div></div>'; siteIconPicker.innerHTML=html;
  siteIconPicker.addEventListener('click',e=>{const btn=e.target.closest('[data-site-icon]'); if(btn) setSiteIcon(btn.dataset.siteIcon);});
  setSiteIcon(DATA.siteSettings?.homeIcon||'theme-openbook');
}
renderSiteIconPicker();
function setSiteIconStyle(style){
  style=['brown','pink','green'].includes(style)?style:'brown';
  if(siteIconStyle) siteIconStyle.value=style;
  DATA.siteSettings=DATA.siteSettings||{}; DATA.siteSettings.homeIconStyle=style;
  document.querySelectorAll('[data-site-icon-style]').forEach(b=>b.classList.toggle('selected',b.dataset.siteIconStyle===style));
  renderSiteIconPicker(); setSiteIcon(siteIcon?.value||DATA.siteSettings?.homeIcon||'theme-openbook'); DATA.siteSettings.homeIconStyle=siteIconStyle?.value||'brown';
}
document.querySelectorAll('[data-site-icon-style]').forEach(b=>b.addEventListener('click',()=>setSiteIconStyle(b.dataset.siteIconStyle)));
setSiteIconStyle(DATA.siteSettings?.homeIconStyle||'brown');

async function imageFileToDataUrl(file,maxW=1400,maxH=700,quality=.82){
  if(!file) return '';
  const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(file)});
  const scale=Math.min(1,maxW/img.width,maxH/img.height), c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(img.width*scale)); c.height=Math.max(1,Math.round(img.height*scale));
  c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  return c.toDataURL('image/jpeg',quality);
}
function showCover(el,url,kind='site'){ if(!el)return; el.innerHTML=url?`<img src="${url}" alt="Xem trước ảnh">`:`<span>Chưa có ảnh ${kind==='site'?'cover':'bìa'}</span>`; }
function setAccentTheme(v){v=['pink','green','brown','lightbrown'].includes(v)?v:'lightbrown'; DATA.siteSettings.accentTheme=v; if(siteAccentTheme)siteAccentTheme.value=v; document.querySelectorAll('[data-accent-theme]').forEach(b=>b.classList.toggle('selected',b.dataset.accentTheme===v));}
setAccentTheme(DATA.siteSettings.accentTheme); showCover(siteCoverPreview,DATA.siteSettings.coverImage,'site');
const siteCoverFit=$('siteCoverFit'); if(siteCoverFit){siteCoverFit.value=['cover','contain','auto'].includes(DATA.siteSettings.coverFit)?DATA.siteSettings.coverFit:'cover'; siteCoverFit.addEventListener('change',()=>{DATA.siteSettings.coverFit=siteCoverFit.value||'cover';});}
siteCoverFile?.addEventListener('change',async()=>{if(siteCoverFile.files[0]){DATA.siteSettings.coverImage=await imageFileToDataUrl(siteCoverFile.files[0]);showCover(siteCoverPreview,DATA.siteSettings.coverImage,'site')}});
document.querySelectorAll('[data-accent-theme]').forEach(b=>b.addEventListener('click',()=>setAccentTheme(b.dataset.accentTheme)));
$('removeSiteCover')?.addEventListener('click',()=>{DATA.siteSettings.coverImage='';siteCoverFile.value='';showCover(siteCoverPreview,'','site')});

function loadSelected(){
  mode='edit';
  refreshSelectors();
  const b=currentBook(), c=currentChapter(), l=currentLesson();
  bookTitle.value=b?.title||'';
  if(bookCreditRole) bookCreditRole.value=b?.creditRole||((b?.author||'')?'author':'none');
  if(bookCreditName) bookCreditName.value=b?.creditName||b?.author||'';
  setBookIconStyle(b?.iconStyle||'brown'); setBookIcon(b?.icon || window.GNTT_BOOK_ICONS?.defaultId || 'theme-openbook');
  pendingBookCover=b?.coverImage||'';
  chapterTitle.value=c?.title||'';
  lessonTitle.value=l?.title||'';
  youtubeUrl.value=l?.youtube||'';
  lessonSubtitle.value=l?.subtitle||'';
  lessonVisibility.value=(l?.visibility==='private'?'private':'public');
  editor.innerHTML=l?.contentHtml||'';
  preview.textContent=l?.title||'Chọn hoặc tạo bài học';
  $('openReaderLink').href=l?`reader.html?id=${encodeURIComponent(l.id)}&v=24.2.5`:'reader.html?v=24.2.5';
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
  bookTitle.value=''; if(bookCreditRole)bookCreditRole.value='author'; if(bookCreditName)bookCreditName.value=''; chapterTitle.value=''; lessonTitle.value=''; youtubeUrl.value=''; lessonSubtitle.value=''; lessonVisibility.value='private'; editor.innerHTML='';
  setBookIconStyle('brown'); setBookIcon('lotus-01'); pendingBookCover='';
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
  bookTitle.value=b.title; if(bookCreditRole)bookCreditRole.value=b.creditRole||((b.author||'')?'author':'none'); if(bookCreditName)bookCreditName.value=b.creditName||b.author||''; chapterTitle.value=''; lessonTitle.value=''; youtubeUrl.value=''; lessonSubtitle.value=''; lessonVisibility.value='private'; editor.innerHTML='';
  setBookIconStyle(b.iconStyle||'brown'); setBookIcon(b.icon || window.GNTT_BOOK_ICONS?.defaultId || 'theme-openbook');
  preview.textContent='Phẩm / Chương mới · nhập bài đầu tiên'; setStatus('Đang tạo chương mới'); chapterTitle.focus();
});
$('newLesson').addEventListener('click',()=>{
  const b=currentBook(), c=currentChapter(); if(!b||!c){alert('Hãy chọn đầu sách và phẩm/chương trước.');return;}
  mode='new-lesson'; selected.lessonId=null;
  bookTitle.value=b.title; if(bookCreditRole)bookCreditRole.value=b.creditRole||((b.author||'')?'author':'none'); if(bookCreditName)bookCreditName.value=b.creditName||b.author||''; chapterTitle.value=c.title; lessonTitle.value=''; youtubeUrl.value=''; lessonSubtitle.value=''; lessonVisibility.value='private'; editor.innerHTML='';
  setBookIconStyle(b.iconStyle||'brown'); setBookIcon(b.icon || window.GNTT_BOOK_ICONS?.defaultId || 'theme-openbook');
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
    b={id:uniqueId(slug(bTitle),ids),title:bTitle,creditRole:(bookCreditRole?.value||'author'),creditName:(bookCreditName?.value||'').trim(),icon:(bookIcon?.value||'theme-openbook'),iconStyle:(bookIconStyle?.value||'brown'),coverImage:'',description:'Tài liệu học và bài giảng được sắp xếp theo phẩm/chương.',chapters:[]};
    DATA.books.push(b); selected.bookId=b.id;
  } else { b.title=bTitle; b.creditRole=(bookCreditRole?.value||b.creditRole||'author'); b.creditName=(bookCreditName?.value||'').trim(); b.icon=(bookIcon?.value||b.icon||'theme-openbook'); b.iconStyle=(bookIconStyle?.value||b.iconStyle||'brown'); }

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
  l.visibility=(lessonVisibility.value==='private'?'private':'public');
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
  $('openReaderLink').href=`reader.html?id=${encodeURIComponent(l.id)}&v=24.2.5`;
  return l;
}

function buildDataJs(){ return 'window.GNTT_DATA = '+JSON.stringify(DATA,null,2)+';\n'; }
function buildCatalogJs(){
  const books=(DATA.books||[]).map(b=>{
    const chapters=(b.chapters||[]).map(c=>{
      const lessons=(c.lessons||[])
        .filter(l=>l.visibility!=='private')
        .map(l=>({
          id:l.id,
          title:l.title,
          subtitle:l.subtitle||'',
          tocLevel:Number(l.tocLevel)||2,
          href:`reader.html?id=${l.id}&v=24.2.5`
        }));
      return {id:c.id,title:c.title,lessons};
    }).filter(c=>c.lessons.length);

    return {
      id:b.id,
      title:b.title,
      icon:b.icon||'theme-openbook',
      iconStyle:b.iconStyle||'brown',
      coverImage:b.coverImage||'',
      description:b.description||'',
      type:b.type||'lesson',
      pdfUrl:b.pdfUrl||'',
      author:b.author||'',
      creditRole:b.creditRole||((b.author||'')?'author':'none'),
      creditName:b.creditName||b.author||'',
      chapters
    };
  }).filter(b=>b.chapters.length);

  const cat={siteSettings:{homeIcon:DATA.siteSettings?.homeIcon||'theme-openbook',homeIconStyle:DATA.siteSettings?.homeIconStyle||'brown',accentTheme:DATA.siteSettings?.accentTheme||'brown',coverImage:DATA.siteSettings?.coverImage||'',coverFit:DATA.siteSettings?.coverFit||'cover'},books};
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


$('publishAppearance')?.addEventListener('click',async()=>{
  const state=$('appearanceState');
  try{
    if(state){state.textContent='Đang xuất bản…';state.className='publish-state';}
    await apiRequest('/publish-v21',{method:'POST',body:JSON.stringify({dataJs:buildDataJs(),catalogJs:buildCatalogJs(),message:'Cập nhật V24.2.5: icon + tên sách, bỏ bìa sách, thêm icon lá bồ đề non đỏ'})});
    if(state){state.textContent='✓ Đã xuất bản';state.className='publish-state ok';}
  }catch(e){if(state){state.textContent='Lỗi: '+e.message;state.className='publish-state err';}}
});

$('publishSiteIcon')?.addEventListener('click',async()=>{
  const state=$('siteIconState');
  try{
    setSiteIcon(siteIcon?.value||DATA.siteSettings?.homeIcon||'theme-openbook'); DATA.siteSettings.homeIconStyle=siteIconStyle?.value||'brown';
    if(state){state.textContent='Đang xuất bản…';state.className='publish-state';}
    await apiRequest('/publish-v21',{method:'POST',body:JSON.stringify({dataJs:buildDataJs(),catalogJs:buildCatalogJs(),message:'Cập nhật biểu tượng Góc nhỏ tu học'})});
    if(state){state.textContent='✓ Đã xuất bản';state.className='publish-state ok';}
  }catch(e){if(state){state.textContent='Lỗi: '+e.message;state.className='publish-state err';}}
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
  const d={book:bookTitle.value,bookIcon:bookIcon?.value||'theme-openbook',bookIconStyle:bookIconStyle?.value||'brown',chapter:chapterTitle.value,title:lessonTitle.value,youtube:youtubeUrl.value,subtitle:lessonSubtitle.value,visibility:lessonVisibility.value,html:editor.innerHTML};
  localStorage.setItem(DRAFT_KEY,JSON.stringify(d));setStatus('Đã lưu bản nháp');
});
$('restoreDraft').addEventListener('click',()=>{
  try{
    const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null'); if(!d){alert('Chưa có bản nháp.');return;}
    bookTitle.value=d.book||'';setBookIconStyle(d.bookIconStyle||'color');setBookIcon(d.bookIcon||'theme-openbook');chapterTitle.value=d.chapter||'';lessonTitle.value=d.title||'';youtubeUrl.value=d.youtube||'';lessonSubtitle.value=d.subtitle||'';lessonVisibility.value=d.visibility==='public'?'public':'private';editor.innerHTML=d.html||'';
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
  let result=String(text||'');

  const uniChars1=['Ấ','ấ','Ầ','ầ','Ẩ','ẩ','Ẫ','ẫ','Ậ','ậ','Ắ','ắ','Ằ','ằ','Ẳ','ẳ','Ẵ','ẵ','Ặ','ặ','Ế','ế','Ề','ề','Ể','ể','Ễ','ễ','Ệ','ệ','Ố','ố','Ồ','ồ','Ổ','ổ','Ỗ','ỗ','Ộ','ộ','Ớ','ớ','Ờ','ờ','Ở','ở','Ỡ','ỡ','Ợ','ợ','Ố','ố','Ồ','ồ','Ổ','ổ','Ỗ','ỗ','Ộ','ộ','Ớ','ớ','Ờ','ờ','Ở','ở','Ỡ','ỡ','Ợ','ợ','Ứ','ứ','Ừ','ừ','Ử','ử','Ữ','ữ','Ự','ự'];
  const vniChars1=['AÁ','aá','AÀ','aà','AÅ','aå','AÃ','aã','AÄ','aä','AÉ','aé','AÈ','aè','AÚ','aú','AÜ','aü','AË','aë','EÁ','eá','EÀ','eà','EÅ','eå','EÃ','eã','EÄ','eä','OÁ','oá','OÀ','oà','OÅ','oå','OÃ','oã','OÄ','oä','ÔÙ','ôù','ÔØ','ôø','ÔÛ','ôû','ÔÕ','ôõ','ÔÏ','ôï','OÁ','oá','OÀ','oà','OÅ','oå','OÃ','oã','OÄ','oä','ÔÙ','ôù','ÔØ','ôø','ÔÛ','ôû','ÔÕ','ôõ','ÔÏ','ôï','ÖÙ','öù','ÖØ','öø','ÖÛ','öû','ÖÕ','öõ','ÖÏ','öï'];

  const uniChars=['Ơ','ơ','ĩ','Ị','ị','À','Á','Â','Ã','È','É','Ê','Ì','Í','Ò','Ó','Ô','Õ','Ù','Ú','Ý','à','á','â','ã','è','é','ê','ì','í','ò','ó','ô','õ','ù','ú','ý','Ă','ă','Đ','đ','Ĩ','Ũ','ũ','Ư','ư','Ạ','ạ','Ả','ả','Ẹ','ẹ','Ẻ','ẻ','Ẽ','ẽ','Ỉ','ỉ','Ọ','ọ','Ỏ','ỏ','Ụ','ụ','Ủ','ủ','Ỳ','ỳ','Ỵ','ỵ','Ỷ','ỷ','Ỹ','ỹ'];
  const vniChars=['Ô','ô','ó','Ò','ò','AØ','AÙ','AÂ','AÕ','EØ','EÙ','EÂ','Ì','Í','OØ','OÙ','OÂ','OÕ','UØ','UÙ','YÙ','aø','aù','aâ','aõ','eø','eù','eâ','ì','í','oø','où','oâ','oõ','uø','uù','yù','AÊ','aê','Ñ','ñ','Ó','UÕ','uõ','Ö','ö','AÏ','aï','AÛ','aû','EÏ','eï','EÛ','eû','EÕ','eõ','Æ','æ','OÏ','oï','OÛ','oû','UÏ','uï','UÛ','uû','YØ','yø','Î','î','YÛ','yû','YÕ','yõ'];

  for(let i=0;i<vniChars1.length;i++) result=result.split(vniChars1[i]).join(uniChars1[i]);
  for(let i=0;i<vniChars.length;i++) result=result.split(vniChars[i]).join(uniChars[i]);
  return result;
}
function hasVietnameseUnicode(text){
  return /[ăâđêôơưĂÂĐÊÔƠƯ]|[àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵÀÁẢÃẠẰẮẲẴẶẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤỪỨỬỮỰỲÝỶỸỴ]/.test(String(text||''));
}

function looksLikeLegacyVniLine(text){
  const t=String(text||'');
  if(!t.trim()) return false;

  // Ký tự rất đặc trưng của VNI.
  if(/[ÑñÖöÆæØøÛûÏïÅåÄäËëÜüÎî]/.test(t)) return true;

  // Các cặp VNI phổ biến; loại OÀ/oà vì Unicode đúng như TOÀN/ngoài có thể chứa cặp này.
  const strongPairs=/(?:AÊ|aê|AÂ|aâ|EÂ|eâ|OÂ|oâ|AÙ|aù|AØ|aø|AÛ|aû|AÏ|aï|EÙ|eù|EØ|eø|EÛ|eû|EÏ|eï|UÙ|uù|UØ|uø|UÛ|uû|UÏ|uï|YÙ|yù|YØ|yø|YÛ|yû|YÕ|yõ|EÀ|eà|EÁ|eá|EÄ|eä|OÁ|oá|OÄ|oä|AÁ|aá|AÀ|aà|AÄ|aä|AÅ|aå|AÃ|aã|AÉ|aé|AÈ|aè|AÚ|aú|AÜ|aü|AË|aë)/;
  return strongPairs.test(t);
}
function looksLikeLegacyVni(text){
  return String(text||'').split(/\r?\n/).some(looksLikeLegacyVniLine);
}
function convertMixedVniText(text){
  let converted=0;
  const lines=String(text||'').split(/\r?\n/).map(line=>{
    let out=line;
    if(looksLikeLegacyVniLine(line)){
      converted++;
      out=vniToUnicode(line);
    }
    return fixKnownPdfSpacing(out);
  });
  return {text:lines.join('\n'),converted};
}

function fixKnownPdfSpacing(text){
  // V22.7: PDF này đôi khi tách riêng chữ "u" trong "Tiểu":
  // "Tiể u Sử" -> "Tiểu Sử".
  // Chỉ sửa mẫu đã xác nhận để tránh ghép nhầm các từ bình thường khác.
  return String(text||'')
    .replace(/\bTiể\s+u\b/g,'Tiểu')
    .replace(/\btiể\s+u\b/g,'tiểu')
    .replace(/\bTIỂ\s+U\b/g,'TIỂU');
}

function escapePdfText(v){return String(v||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function normalizeTocTitle(v){
  return fixKnownPdfSpacing(String(v||''))
    .replace(/^[*∗•·\-–—]+\s*/,'')
    .replace(/\.{2,}.*$/,'')
    .replace(/\s+/g,' ').trim();
}
function tocLevelFromTitle(raw){
  const t=normalizeTocTitle(raw);

  // Cấp 1: phần lớn / chương lớn.
  if(/^(I|II|III|IV|V|VI|VII|VIII|IX|X)[\s.\-–—)]/i.test(t)) return 1;
  if(/^(TIỂU SỬ|LỜI GIỚI THIỆU|DẪN NHẬP|LỜI KHAI THỊ|LỄ PHẬT|KINH TỨ NIỆM XỨ|ĐỊNH NGHĨA|HẢI TRIỀU ÂM TOÀN TẬP)$/i.test(t)) return 1;

  // Cấp 2: nhóm bên trong một chương.
  if(/^[A-ZÀ-Ỹ]\)\s*\d+\s*[-–—]/i.test(t)) return 2;
  if(/^\d+\s*[-–—]/i.test(t)) return 2;

  // Tạm thời là mục con; refineTocLevels sẽ nâng lên cấp 2 khi cần.
  return 3;
}

function refineTocLevels(entries){
  const arr=entries.map(x=>({...x}));
  let currentMajor=false;
  let hasNumberedSubgroup=false;

  for(const e of arr){
    const t=e.title.trim();

    if(/^(I|II|III|IV|V|VI|VII|VIII|IX|X)[\s.\-–—)]/i.test(t) ||
       /^(TIỂU SỬ|LỜI GIỚI THIỆU|DẪN NHẬP|LỜI KHAI THỊ|LỄ PHẬT|KINH TỨ NIỆM XỨ|ĐỊNH NGHĨA|HẢI TRIỀU ÂM TOÀN TẬP)$/i.test(t)){
      e.level=1;
      currentMajor=true;
      hasNumberedSubgroup=false;
      continue;
    }

    if(/^[A-ZÀ-Ỹ]\)\s*\d+\s*[-–—]/i.test(t) || /^\d+\s*[-–—]/i.test(t)){
      e.level=2;
      hasNumberedSubgroup=true;
      continue;
    }

    // Sau I- QUÁN THÂN / II- QUÁN THỌ... nếu chưa xuất hiện nhóm đánh số,
    // các dòng như Hơi thở, Oai nghi... là Mục trực tiếp (cấp 2).
    if(currentMajor && !hasNumberedSubgroup){
      e.level=2;
    }else{
      // Sau NĂM TRIỀN CÁI / BẢY GIÁC CHI / TỨ THÁNH ĐẾ...
      // các dòng Ái dục, Niệm, Khổ... là Mục con (cấp 3).
      e.level=3;
    }
  }
  return arr;
}

function parseTocLine(line,nextLine){
  const txt=String(line||'').replace(/\u00a0/g,' ').trim();
  if(!txt) return null;

  // Tên .... 123
  let m=txt.match(/^(.*?)(?:\.{2,}|…{2,}|\s{2,}|\s+\.+\s*)\s*(\d{1,4})\s*$/);

  // Tên 123 (dự phòng)
  if(!m) m=txt.match(/^(.{2,160}?)\s+(\d{1,4})\s*$/);

  // PDF.js đôi khi tách số trang thành dòng kế tiếp.
  if(!m && nextLine && /^\s*\d{1,4}\s*$/.test(nextLine)){
    m=[null,txt,String(nextLine).trim()];
  }
  if(!m) return null;

  const raw=String(m[1]||'').trim();
  const page=Number(m[2]);
  const title=normalizeTocTitle(raw);
  if(!title || page<1 || page>2000 || title.length<2) return null;
  if(/^(MỤC LỤC|TỨ NIỆM XỨ|GIẢNG NGHĨA)$/i.test(title)) return null;
  return {title,page,level:tocLevelFromTitle(raw),enabled:true};
}

function detectTocEntries(pages){
  const found=[];
  const max=Math.min(40,pages.length);
  let inToc=false, tocSeen=false, quietPages=0;

  for(let pi=0;pi<max;pi++){
    const allLines=String(pages[pi]||'').split('\n').map(x=>x.trim()).filter(Boolean);
    let startAt=0;

    const tocIndex=allLines.findIndex(x=>/M[ỤU]C\s+L[ỤU]C/i.test(x));
    if(tocIndex>=0){
      inToc=true;
      tocSeen=true;
      quietPages=0;
      // QUAN TRỌNG V22.6: không bỏ cả trang có chữ MỤC LỤC.
      // Đọc ngay các dòng phía sau chữ MỤC LỤC trên chính trang này.
      startAt=tocIndex+1;
    }
    if(!inToc) continue;

    const lines=allLines.slice(startAt);
    let pageHits=0;
    for(let i=0;i<lines.length;i++){
      const parsed=parseTocLine(lines[i],lines[i+1]);
      if(!parsed) continue;

      // Nếu parse dùng dòng tiếp theo làm số trang thì bỏ qua dòng số đó.
      if(i+1<lines.length && /^\s*\d{1,4}\s*$/.test(lines[i+1]) &&
         !/\d{1,4}\s*$/.test(lines[i])) i++;

      found.push(parsed);
      pageHits++;
    }

    if(pageHits>0) quietPages=0;
    else if(tocSeen) quietPages++;

    // Chỉ kết thúc sau 2 trang liên tiếp không còn mục, và đã có đủ một lượng mục hợp lý.
    if(tocSeen && quietPages>=2 && found.length>=5) break;
  }

  const seen=new Set();
  const unique=found.filter(x=>{
    const key=x.title.toLocaleLowerCase('vi')+'|'+x.page;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a,b)=>a.page-b.page);

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
  }else{
    finalPages=pages.map(pageText=>fixKnownPdfSpacing(pageText));
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
    <td><select class="toc-level">
      <option value="1" ${Number(item.level)===1?'selected':''}>Chương</option>
      <option value="2" ${Number(item.level)===2?'selected':''}>Mục</option>
      <option value="3" ${Number(item.level)===3?'selected':''}>Mục con</option>
    </select></td>
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
      $('pdfStatus').textContent=`${textMode} Đã nhận ${result.toc.length} mục từ đầu Mục lục, đã sửa lỗi “Tiể u” và tự phân 3 cấp Chương/Mục/Mục con. Độ lệch trang ước tính: ${result.pageOffset>=0?'+':''}${result.pageOffset}. Hãy kiểm tra chữ và Mục lục trước khi đăng.`;
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
        youtube:'',contentHtml,tocLevel:1
      });
    }else{
      const lid=uniqueId(slug(e.title)||('muc-'+(current.lessons.length+1)),current.lessons.map(l=>l.id));
      current.lessons.push({
        id:`${id}-${current.id}-${lid}`,
        title:e.title,
        subtitle:[author,description,`Trang ${e.page}${end>=start?'–'+(end-offset):''}`].filter(Boolean).join(' · '),
        youtube:'',contentHtml,tocLevel:e.level
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
    if(book && !book.icon) book.icon='theme-book';
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


/* ===== V23.9: TẠO ICON APP 192/512 TRONG ADMIN ===== */
(function initAppIconMaker(){
  const fileEl=$('appIconFile'), previewEl=$('appIconPreview'), bgEl=$('appIconBg'), stateEl=$('appIconMakerState');
  if(!previewEl) return;
  let source={type:'current', url:'icon-512.png?v=24.2.5'};
  function state(t,k=''){ if(stateEl){stateEl.textContent=t;stateEl.className='publish-state'+(k?' '+k:'');} }
  function loadImage(url){ return new Promise((resolve,reject)=>{ const im=new Image(); im.onload=()=>resolve(im); im.onerror=reject; im.src=url; }); }
  function fileToUrl(file){ return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); }); }
  function preview(url){ previewEl.innerHTML=`<img src="${url}" alt="Xem trước icon App">`; }
  async function svgSiteIconDataUrl(){
    const lib=window.GNTT_BOOK_ICONS; if(!lib) throw new Error('Chưa tải thư viện biểu tượng');
    const id=siteIcon?.value||DATA.siteSettings?.homeIcon||lib.defaultId;
    const svg=lib.svg(id);
    if(!svg) throw new Error('Không tạo được biểu tượng');
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }
  async function renderPng(size){
    const c=document.createElement('canvas'); c.width=c.height=size; const ctx=c.getContext('2d');
    ctx.fillStyle=(source.type==='site'?(bgEl?.value||'#fff6f5'):'#ffffff'); ctx.fillRect(0,0,size,size);
    const im=await loadImage(source.url);
    if(source.type==='site'){
      const pad=Math.round(size*.17); ctx.drawImage(im,pad,pad,size-pad*2,size-pad*2);
    }else{
      const sw=im.naturalWidth||im.width, sh=im.naturalHeight||im.height;
      const side=Math.min(sw,sh), sx=(sw-side)/2, sy=(sh-side)/2;
      ctx.drawImage(im,sx,sy,side,side,0,0,size,size);
    }
    return await new Promise(resolve=>c.toBlob(resolve,'image/png'));
  }
  async function blobPreview(){ const b=await renderPng(512); const u=URL.createObjectURL(b); preview(u); setTimeout(()=>URL.revokeObjectURL(u),5000); }
  async function download(size){
    try{
      const b=await renderPng(size); const u=URL.createObjectURL(b);
      const a=document.createElement('a'); a.href=u; a.download=`icon-${size}.png`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(u),3000); state(`Đã tạo icon-${size}.png`,'ok');
    }catch(e){ state('Lỗi tạo icon: '+e.message,'err'); }
  }
  window.addEventListener('gntt-app-preset',async(e)=>{
    const x=e.detail||{}; if(!x.url)return;
    try{ source={type:(x.type==='site'?'site':'preset'),url:x.url}; await blobPreview(); state('Đã chọn '+(x.name||'icon có sẵn')+'.','ok'); }catch(err){state('Không tải được icon đã chọn.','err');}
  });
  fileEl?.addEventListener('change',async()=>{
    const f=fileEl.files?.[0]; if(!f)return;
    try{ const u=await fileToUrl(f); source={type:'file',url:u}; await blobPreview(); state('Đã chọn ảnh. Có thể tải icon 192/512.','ok'); }catch(e){state('Không đọc được ảnh.','err');}
  });
  $('usePresetAppIcon1')?.addEventListener('click',async()=>{
    try{ source={type:'preset',url:'app-icon-hinh-so-1.png?v=24.2.5'}; await blobPreview(); state('Đã chọn Hình số 1 – Lá bồ đề non. Bấm “Tải cả 2 icon” để tạo file.','ok'); }catch(e){state('Không tải được Hình số 1.','err');}
  });
  $('useSiteIconForApp')?.addEventListener('click',async()=>{
    try{ source={type:'site',url:await svgSiteIconDataUrl()}; await blobPreview(); state('Đang dùng biểu tượng web đã chọn.','ok'); }catch(e){state(e.message,'err');}
  });
  bgEl?.addEventListener('input',()=>{if(source.type==='site') blobPreview();});
  $('resetAppIconPreview')?.addEventListener('click',()=>{ source={type:'current',url:'icon-512.png?v=24.2.5'}; if(fileEl)fileEl.value=''; preview(source.url); state('Đang xem icon App hiện tại.'); });
  $('downloadAppIcon192')?.addEventListener('click',()=>download(192));
  $('downloadAppIcon512')?.addEventListener('click',()=>download(512));
  $('downloadBothAppIcons')?.addEventListener('click',async()=>{ await download(192); setTimeout(()=>download(512),450); });
})();
/* ===== V23.9: THƯ VIỆN ẢNH CÓ SẴN - KHÔNG BẮT BUỘC UPLOAD ===== */
(function initBuiltInImageLibrary(){
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svgUrl=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  function motif(kind, color='#a45d72'){
    const common='fill="none" stroke="'+color+'" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
    if(kind==='lotus') return `<g ${common}><path d="M50 76C27 63 25 39 50 18c25 21 23 45 0 58Z"/><path d="M50 76C35 65 18 59 14 42c18 1 30 8 36 21M50 76c15-11 32-17 36-34-18 1-30 8-36 21"/><path d="M18 82h64"/></g>`;
    if(kind==='leaf') return `<g ${common}><path d="M51 82C23 65 20 31 51 14c30 18 27 52 0 68Z"/><path d="M51 18v65M51 39 36 29M51 51 68 38M51 63 34 51"/></g>`;
    if(kind==='wheel') return `<g ${common}><circle cx="50" cy="50" r="31"/><circle cx="50" cy="50" r="8"/><path d="M50 19v23M50 58v23M19 50h23M58 50h23M28 28l16 16M56 56l16 16M72 28 56 44M44 56 28 72"/></g>`;
    if(kind==='book') return `<g ${common}><path d="M13 25c16-5 28-2 37 8v48c-9-10-21-13-37-8V25ZM87 25c-16-5-28-2-37 8v48c9-10 21-13 37-8V25Z"/></g>`;
    return `<g ${common}><path d="M50 16c-17 17-23 31-18 43 4 9 12 14 18 22 6-8 14-13 18-22 5-12-1-26-18-43Z"/><path d="M50 28v49"/></g>`;
  }
  const coverDefs=[
    ['Hồng sen','lotus','#fff1f4','#e7a0b1'],['Bồ đề hồng','leaf','#fff4f2','#d6818e'],['Nâu thiền','leaf','#f5eee2','#8a6338'],['Xanh an lạc','leaf','#eef5e5','#76985c'],
    ['Sen sớm mai','lotus','#fff8e8','#d89b72'],['Pháp luân','wheel','#f7efe5','#9b7049'],['Tủ sách','book','#f4eee7','#805f42'],['Hồng nhạt','lotus','#fff7f8','#c97891'],
    ['Xanh non','leaf','#f5f8e8','#8eaa57'],['Kem tĩnh lặng','wheel','#fbf5e8','#b18a56'],['Trà nâu','book','#f1e7da','#76543b'],['Sen xanh','lotus','#edf5ee','#6f9274']
  ];
  function makeCover(i, portrait=false){
    const [name,kind,bg,fg]=coverDefs[i%coverDefs.length], w=portrait?700:1400,h=portrait?1000:700;
    const cx=w/2, cy=h*.43, scale=portrait?3.6:3.0;
    return {name,url:svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><radialGradient id="g"><stop stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="${bg}"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${cx}" cy="${cy}" r="${portrait?245:190}" fill="#fff" opacity=".42"/><g transform="translate(${cx-50*scale} ${cy-50*scale}) scale(${scale})">${motif(kind,fg)}</g><path d="M${w*.12} ${h*.82} Q${w*.5} ${h*.73} ${w*.88} ${h*.82}" fill="none" stroke="${fg}" stroke-opacity=".22" stroke-width="3"/></svg>`)};
  }
  function renderGrid(id, items, onPick){
    const el=$(id); if(!el)return;
    el.innerHTML=items.map((x,i)=>`<button type="button" class="image-preset-choice" data-preset="${i}" title="${esc(x.name)}"><img src="${x.url}" alt="${esc(x.name)}"><small>${esc(x.name)}</small></button>`).join('');
    el.addEventListener('click',e=>{const b=e.target.closest('[data-preset]'); if(!b)return; el.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected')); b.classList.add('selected'); onPick(items[+b.dataset.preset],+b.dataset.preset);});
  }
  const siteCovers=[{name:'Bồ đề non · Nâu nhạt',url:'cover-bo-de-non-v24.png?v=24.2.5'},...coverDefs.map((_,i)=>makeCover(i,false))];
  renderGrid('siteCoverPresets',siteCovers,x=>{DATA.siteSettings.coverImage=x.url; showCover(siteCoverPreview,x.url,'site'); if(siteCoverFile)siteCoverFile.value='';});

  // App: Hình số 1 đứng đầu, sau đó các biểu tượng Phật học có sẵn.
  const app=[];
  app.push({name:'Hình số 1',url:'app-icon-hinh-so-1.png?v=24.2.5',type:'preset'});
  const lib=window.GNTT_BOOK_ICONS;
  if(lib){
    const ids=['lotus-01','lotus-03','lotus-07','lotus-12','bodhi-01','bodhi-04','bodhi-08','bodhi-12','theme-wheel','theme-openbook','theme-meditation','theme-scroll'];
    ids.forEach(id=>{const item=lib.get(id); if(item) app.push({name:item.label||id,url:svgUrl(lib.svg(id)),type:'site'});});
  }
  const el=$('appIconPresets');
  if(el){
    el.innerHTML=app.map((x,i)=>`<button type="button" class="image-preset-choice" data-app-preset="${i}" title="${esc(x.name)}"><img src="${x.url}" alt="${esc(x.name)}"><small>${esc(x.name)}</small></button>`).join('');
    el.addEventListener('click',e=>{const b=e.target.closest('[data-app-preset]');if(!b)return; const x=app[+b.dataset.appPreset]; el.querySelectorAll('.selected').forEach(q=>q.classList.remove('selected'));b.classList.add('selected'); window.dispatchEvent(new CustomEvent('gntt-app-preset',{detail:x}));});
  }
})();


