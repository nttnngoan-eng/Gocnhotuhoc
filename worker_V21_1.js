// Góc nhỏ tu học - V21.1 Publisher (bài đọc + PDF)
// Giữ nguyên các Secrets/Variables bạn đã tạo trong Cloudflare.
//
// Secrets:
// ADMIN_PASSWORD
// GITHUB_TOKEN
//
// Variables:
// GITHUB_OWNER
// GITHUB_REPO
// GITHUB_BRANCH
// ALLOWED_ORIGIN

const API_VERSION="2022-11-28";

function corsHeaders(env){
  return {
    "Access-Control-Allow-Origin":env.ALLOWED_ORIGIN||"https://nttnngoan-eng.github.io",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type,X-Admin-Password",
    "Access-Control-Max-Age":"86400",
    "Vary":"Origin",
    "Cache-Control":"no-store"
  };
}
function json(data,status,env){
  return new Response(JSON.stringify(data),{status,headers:{...corsHeaders(env),"Content-Type":"application/json; charset=utf-8"}});
}
function safeEqual(a,b){
  a=String(a||"");b=String(b||"");
  if(a.length!==b.length)return false;
  let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);
  return d===0;
}
function b64(text){
  const bytes=new TextEncoder().encode(text);let bin="",chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk)bin+=String.fromCharCode(...bytes.subarray(i,i+chunk));
  return btoa(bin);
}
async function gh(path,env,options={}){
  const url=`https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}${path}`;
  const r=await fetch(url,{...options,headers:{
    "Accept":"application/vnd.github+json",
    "Authorization":`Bearer ${env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version":API_VERSION,
    "User-Agent":"gocnhotuhoc-publisher",
    ...(options.headers||{})
  }});
  const text=await r.text();let d={};try{d=text?JSON.parse(text):{}}catch{d={raw:text}}
  if(!r.ok)throw new Error(d?.message||`GitHub API ${r.status}`);
  return d;
}
async function updateFile(path,content,message,env){
  const branch=env.GITHUB_BRANCH||"main";let sha;
  try{sha=(await gh(`/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`,env,{method:"GET"})).sha}catch{}
  const body={message,content:b64(content),branch};if(sha)body.sha=sha;
  return gh(`/contents/${encodeURIComponent(path)}`,env,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
}

async function updateBase64File(path,base64Content,message,env){
  const branch=env.GITHUB_BRANCH||"main";let sha;
  try{sha=(await gh(`/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}`,env,{method:"GET"})).sha}catch{}
  const body={message,content:base64Content,branch};if(sha)body.sha=sha;
  return gh(`/contents/${path.split('/').map(encodeURIComponent).join('/')}`,env,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
}

export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders(env)});

    const pass=request.headers.get("X-Admin-Password")||"";
    if(!safeEqual(pass,env.ADMIN_PASSWORD))return json({error:"Sai mật khẩu quản trị"},401,env);

    if(url.pathname==="/health"&&request.method==="GET"){
      return json({ok:true,service:"gocnhotuhoc-publisher-v21.1",repo:`${env.GITHUB_OWNER}/${env.GITHUB_REPO}`},200,env);
    }


    if(url.pathname==="/publish-pdf-v21-1"&&request.method==="POST"){
      let p;try{p=await request.json()}catch{return json({error:"Dữ liệu PDF không hợp lệ"},400,env)}
      const pdfPath=String(p.pdfPath||"");
      const pdfBase64=String(p.pdfBase64||"");
      const dataJs=String(p.dataJs||"");
      const catalogJs=String(p.catalogJs||"");
      const message=String(p.message||"Thêm sách PDF").slice(0,180);
      if(!/^pdf\/[a-z0-9._-]+\.pdf$/i.test(pdfPath))return json({error:"Tên file PDF không hợp lệ"},400,env);
      if(!pdfBase64||pdfBase64.length>21_000_000)return json({error:"PDF trống hoặc vượt giới hạn 15 MB"},413,env);
      if(!dataJs.includes("window.GNTT_DATA")||!catalogJs.includes("window.GNTT_CATALOG"))return json({error:"Danh mục không hợp lệ"},400,env);
      try{
        const pdf=await updateBase64File(pdfPath,pdfBase64,message,env);
        const a=await updateFile("data.js",dataJs,message+" - dữ liệu",env);
        const b=await updateFile("catalog.js",catalogJs,message+" - danh mục",env);
        return json({ok:true,pdfCommit:pdf?.commit?.sha||null,dataCommit:a?.commit?.sha||null,catalogCommit:b?.commit?.sha||null},200,env);
      }catch(e){return json({error:"GitHub: "+(e?.message||"Không đăng được PDF")},502,env)}
    }

    if(url.pathname==="/publish-v21"&&request.method==="POST"){
      let p;try{p=await request.json()}catch{return json({error:"Dữ liệu gửi lên không hợp lệ"},400,env)}
      const dataJs=String(p.dataJs||""),catalogJs=String(p.catalogJs||"");
      const message=String(p.message||"Cập nhật Góc nhỏ tu học").slice(0,180);

      if(!dataJs.includes("window.GNTT_DATA")||dataJs.length<50)return json({error:"data.js không hợp lệ"},400,env);
      if(!catalogJs.includes("window.GNTT_CATALOG")||catalogJs.length<30)return json({error:"catalog.js không hợp lệ"},400,env);
      if(dataJs.length>20_000_000)return json({error:"data.js vượt giới hạn an toàn 20 MB"},413,env);

      try{
        const a=await updateFile("data.js",dataJs,message,env);
        const b=await updateFile("catalog.js",catalogJs,message+" - danh mục",env);
        return json({ok:true,dataCommit:a?.commit?.sha||null,catalogCommit:b?.commit?.sha||null},200,env);
      }catch(e){
        return json({error:"GitHub: "+(e?.message||"Không cập nhật được file")},502,env);
      }
    }

    // Giữ endpoint V20 để rollback nếu cần.
    if(url.pathname==="/publish"&&request.method==="POST"){
      let p;try{p=await request.json()}catch{return json({error:"Dữ liệu gửi lên không hợp lệ"},400,env)}
      if(!p.readerHtml||!p.catalogJs)return json({error:"Thiếu dữ liệu V20"},400,env);
      try{
        await updateFile("reader.html",String(p.readerHtml),String(p.message||"Cập nhật reader"),env);
        await updateFile("catalog.js",String(p.catalogJs),String(p.message||"Cập nhật catalog"),env);
        return json({ok:true},200,env);
      }catch(e){return json({error:"GitHub: "+(e?.message||"Không cập nhật được file")},502,env)}
    }

    return json({error:"Không tìm thấy API"},404,env);
  }
};
