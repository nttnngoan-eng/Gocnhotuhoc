(function(){
  const ns = {};
  const lotus = Array.from({length:20},(_,i)=>({id:`lotus-${String(i+1).padStart(2,'0')}`,group:'Hoa sen',label:`Hoa sen ${i+1}`}));
  const bodhi = Array.from({length:20},(_,i)=>({id:`bodhi-${String(i+1).padStart(2,'0')}`,group:'Lá bồ đề',label:`Lá bồ đề ${i+1}`}));
  const themes = [
    ['theme-book','Chủ đề','Kinh điển'],
    ['theme-lotus','Chủ đề','Phật pháp · Tu học'],
    ['theme-wheel','Chủ đề','Giáo pháp · Luận giải'],
    ['theme-prayer','Chủ đề','Nghi thức · Hành trì'],
    ['theme-meditation','Chủ đề','Thiền · Chánh niệm'],
    ['theme-wisdom','Chủ đề','Trí tuệ · Khai thị'],
    ['theme-scroll','Chủ đề','Luận · Cổ thư'],
    ['theme-openbook','Chủ đề','Tài liệu · Học tập']
  ].map(([id,group,label])=>({id,group,label}));
  ns.icons=[...lotus,...bodhi,...themes];
  ns.defaultId='theme-openbook';

  const wrap = inner => `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" class="gntt-book-icon-svg" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const p = (d,extra='') => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const fillp = d => `<path d="${d}" fill="currentColor" opacity=".9"/>`;
  const c = (cx,cy,r,fill='none') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="currentColor" stroke-width="2"/>`;

  function lotusSvg(n){
    const filled=[1,4,13,20].includes(n);
    const petal = `M32 47 C23 39 21 29 32 14 C43 29 41 39 32 47 Z`;
    const left = `M31 47 C20 46 12 40 10 28 C21 27 29 33 32 43`;
    const right = `M33 47 C44 46 52 40 54 28 C43 27 35 33 32 43`;
    const innerL = `M31 43 C24 39 22 32 25 23 C30 27 32 34 32 41`;
    const innerR = `M33 43 C40 39 42 32 39 23 C34 27 32 34 32 41`;
    let s='';
    if(filled){
      s += `<path d="${petal}" fill="currentColor" opacity=".72"/>`;
      s += `<path d="M31 47 C20 46 12 40 10 28 C21 27 29 33 32 43 Z" fill="currentColor" opacity=".45"/>`;
      s += `<path d="M33 47 C44 46 52 40 54 28 C43 27 35 33 32 43 Z" fill="currentColor" opacity=".45"/>`;
    } else {
      s += p(petal)+p(left)+p(right);
      if(![2,11,12].includes(n)) s += p(innerL)+p(innerR);
    }
    if([3,6,9,14,16,17,18,19,20].includes(n)){
      s += p(`M14 43 C20 52 44 52 50 43`);
      if([9,14,16,19].includes(n)) s += p(`M18 49 C24 55 40 55 46 49`);
    }
    if([5,15,17].includes(n)){
      s += `<path d="M20 11 L22 16 M44 11 L42 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
      s += c(32,10,1.2,'currentColor');
    }
    if(n===7) s = c(32,32,26)+c(32,10,2,'currentColor')+s;
    if(n===15) s = `<path d="M11 33 C11 18 21 8 32 8 C43 8 53 18 53 33" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2.2 3.2"/>`+s;
    if([8,18].includes(n)) s += p(`M32 47 L32 55`)+c(32,58,1.2,'currentColor');
    if(n===10) s += p(`M13 49 C23 46 41 46 51 49`);
    if(n===12) s = p(`M32 50 C23 43 20 32 32 15 C44 32 41 43 32 50 Z`)+p(`M32 50 L32 58`);
    if(n===20) s += p(`M9 33 C18 24 25 26 32 35 C39 26 46 24 55 33`);
    return wrap(s);
  }

  function bodhiSvg(n){
    const filled=[1,3,5,9,11,17,18].includes(n);
    let outline=`M32 55 C18 47 10 37 12 24 C14 11 24 7 32 3 C40 7 50 11 52 24 C54 37 46 47 32 55 Z`;
    if(n===13) outline=`M10 45 C20 44 27 37 31 27 C39 31 47 35 55 33 C51 44 40 51 27 51 C20 51 14 49 10 45 Z`;
    if(n===19) outline=`M32 58 C18 49 11 38 13 24 C15 12 24 7 32 3 C40 7 49 12 51 24 C53 38 46 49 32 58 Z`;
    let s=filled ? `<path d="${outline}" fill="currentColor" opacity=".88"/>` : p(outline);
    if(n!==9 && n!==13){
      const veinColor=filled?'var(--icon-vein,#fff)':'currentColor';
      s += `<path d="M32 10 L32 57" stroke="${veinColor}" stroke-width="1.8" stroke-linecap="round"/>`;
      for(const y of [20,28,36,44]){
        const w=(46-y)*.55+4;
        s += `<path d="M32 ${y} C${32-w/2} ${y-2} ${24-w/2} ${y-4} ${18} ${y-7} M32 ${y} C${32+w/2} ${y-2} ${40+w/2} ${y-4} ${46} ${y-7}" fill="none" stroke="${veinColor}" stroke-width="1.35" stroke-linecap="round" opacity=".9"/>`;
      }
    }
    if([6,8].includes(n)) s += `<path d="M22 30 C27 24 37 24 42 30 C38 36 26 36 22 30 Z" fill="none" stroke="currentColor" stroke-width="1.7"/>`;
    if([10,14].includes(n)) s = c(32,31,27)+s.replace('M32 55','M32 50').replace('L32 57','L32 52');
    if([12,16].includes(n)){
      s += `<circle cx="32" cy="29" r="3" fill="none" stroke="${filled?'#fff':'currentColor'}" stroke-width="1.7"/>`;
      s += `<path d="M24 43 C27 35 37 35 40 43 M21 46 C28 50 36 50 43 46" fill="none" stroke="${filled?'#fff':'currentColor'}" stroke-width="1.7" stroke-linecap="round"/>`;
    }
    if(n===15) s += p(`M15 51 C22 55 42 55 49 51`);
    if(n===18) s += `<path d="${outline}" fill="none" stroke="currentColor" stroke-width="2.2"/>`;
    if(n===19){
      s = p(outline)+`<path d="M32 48 V19 M32 27 L23 22 M32 31 L42 24 M32 36 L21 31 M32 39 L44 33" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`+
        c(23,20,3,'currentColor')+c(42,22,3,'currentColor')+c(20,30,3,'currentColor')+c(45,31,3,'currentColor')+c(32,16,3,'currentColor');
    }
    if(n===20) s += p(`M32 55 C27 58 24 60 22 61`);
    return wrap(s);
  }

  function themeSvg(id){
    if(id==='theme-book') return wrap(p('M9 15 C18 12 26 14 32 19 V52 C26 47 18 45 9 48 Z')+p('M55 15 C46 12 38 14 32 19 V52 C38 47 46 45 55 48 Z'));
    if(id==='theme-openbook') return wrap(p('M7 17 C17 14 25 16 32 21 V53 C25 47 17 45 7 48 Z')+p('M57 17 C47 14 39 16 32 21 V53 C39 47 47 45 57 48 Z')+p('M32 21 V53'));
    if(id==='theme-lotus') return lotusSvg(6);
    if(id==='theme-wisdom') return bodhiSvg(2);
    if(id==='theme-wheel'){
      let s=c(32,32,22)+c(32,32,5)+c(32,32,13);
      for(let i=0;i<8;i++){const a=i*Math.PI/4,x1=32+6*Math.cos(a),y1=32+6*Math.sin(a),x2=32+21*Math.cos(a),y2=32+21*Math.sin(a);s+=`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="currentColor" stroke-width="2"/>`;}
      return wrap(s);
    }
    if(id==='theme-prayer') return wrap(p('M29 51 C22 43 18 35 20 23 C21 17 24 13 27 10 C29 20 30 29 32 37')+p('M35 51 C42 43 46 35 44 23 C43 17 40 13 37 10 C35 20 34 29 32 37')+p('M23 49 C28 54 36 54 41 49'));
    if(id==='theme-meditation') return wrap(c(32,17,5)+p('M32 22 C25 25 24 34 26 39')+p('M32 22 C39 25 40 34 38 39')+p('M26 39 C20 41 16 45 14 50 C24 53 40 53 50 50 C48 45 44 41 38 39')+p('M22 43 C27 47 37 47 42 43'));
    if(id==='theme-scroll') return wrap(p('M17 10 H48 C43 14 43 20 48 24 V49 H18 C22 45 22 39 18 35 V15 C14 15 12 13 12 10 C12 7 14 5 17 5 H48')+p('M18 35 H45')+p('M23 20 H42 M23 27 H42'));
    return wrap(c(32,32,20));
  }

  ns.svg=function(id){
    id = ns.icons.some(x=>x.id===id) ? id : ns.defaultId;
    if(id.startsWith('lotus-')) return lotusSvg(parseInt(id.slice(-2),10));
    if(id.startsWith('bodhi-')) return bodhiSvg(parseInt(id.slice(-2),10));
    return themeSvg(id);
  };
  ns.get=function(id){return ns.icons.find(x=>x.id===id)||ns.icons.find(x=>x.id===ns.defaultId)};
  ns.colorFor=function(id){
    if(id.startsWith('lotus-')){ const n=parseInt(id.slice(-2),10); return [1,2,3,4,10,11,13,14,17,20].includes(n)?'#e76f91':'#b8863b'; }
    if(id.startsWith('bodhi-')) return '#5f7f45';
    return ['theme-lotus'].includes(id)?'#d98298':(['theme-wisdom'].includes(id)?'#5f7f45':'#8a6338');
  };
  ns.render=function(id,style='brown'){
    const svg=ns.svg(id);
    const colors={brown:'#8a6338',pink:'#e76f91',green:'#5f7f45'};
    // Backward compatibility: old 'mono' = brown, old 'color' keeps its natural category color.
    if(style==='color') return svg.replace('<svg ','<svg style=\"color:'+ns.colorFor(id)+';--icon-vein:#fff\" ');
    const key=style==='mono'?'brown':style;
    const color=colors[key]||colors.brown;
    return svg.replace('<svg ','<svg style=\"color:'+color+';--icon-vein:#fff\" ');
  };
  window.GNTT_BOOK_ICONS=ns;
})();
