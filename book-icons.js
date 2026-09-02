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
  const buddhas = Array.from({length:8},(_,i)=>({id:`buddha-${String(i+1).padStart(2,'0')}`,group:'Phật vàng cam',label:`Phật tối giản ${i+1}`}));
  const goldSet = Array.from({length:15},(_,i)=>({id:`gold-${String(i+1).padStart(2,'0')}`,group:'Bộ Phật · Vàng cam',label:`Vàng cam ${i+1}`}));
  const pinkSet = Array.from({length:15},(_,i)=>({id:`pink-${String(i+1).padStart(2,'0')}`,group:'Bộ Phật · Hồng nhạt',label:`Hồng nhạt ${i+1}`}));
  ns.icons=[{id:'image-bodhi-red',group:'Ảnh icon',label:'Lá bồ đề non đỏ'},...goldSet,...pinkSet,...buddhas,...lotus,...bodhi,...themes];
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

  function buddhaSvg(n){
    const head = `<circle cx="32" cy="17" r="5" fill="currentColor"/>`;
    const usnisa = `<circle cx="32" cy="10.8" r="2.2" fill="currentColor"/>`;
    const body = `<path d="M24 27 C27 23 37 23 40 27 C43 32 42 40 40 44 C46 46 50 50 52 54 H12 C14 50 18 46 24 44 C22 40 21 32 24 27 Z" fill="currentColor" opacity=".94"/>`;
    const robe = `<path d="M31 25 C27 31 27 39 29 45" fill="none" stroke="var(--icon-vein,#fff)" stroke-width="1.5" stroke-linecap="round" opacity=".9"/>`;
    const hands = `<path d="M25 38 C29 42 35 42 39 38" fill="none" stroke="var(--icon-vein,#fff)" stroke-width="1.5" stroke-linecap="round"/>`;
    const lotus = `<path d="M16 53 C21 47 27 48 32 53 C37 48 43 47 48 53 C43 57 37 58 32 55 C27 58 21 57 16 53 Z" fill="none" stroke="currentColor" stroke-width="2"/>`;
    let s=head+usnisa+body+robe+hands;
    if([1,4,7].includes(n)) s=`<circle cx="32" cy="28" r="24" fill="none" stroke="currentColor" stroke-width="1.8" opacity=".8"/>`+s;
    if([1,2,5,7].includes(n)) s+=lotus;
    if(n===3) s=`<path d="M32 4 C18 13 14 28 19 41 C22 49 27 54 32 58 C37 54 42 49 45 41 C50 28 46 13 32 4 Z" fill="none" stroke="currentColor" stroke-width="2"/>`+s;
    if(n===5) s=`<path d="M32 5 C20 11 14 20 14 31 C14 44 22 53 32 58 C42 53 50 44 50 31 C50 20 44 11 32 5 Z" fill="none" stroke="currentColor" stroke-width="1.8"/>`+s;
    if(n===6) s=`<circle cx="32" cy="29" r="25" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="2.5 3"/>`+s;
    if(n===8) s+=`<path d="M12 55 C20 51 44 51 52 55" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
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

  function specialSetSvg(n){
    if(n===1) return buddhaSvg(1);
    if(n===2) return wrap(p('M32 58 C17 48 12 35 16 22 C19 12 26 7 32 3 C38 7 45 12 48 22 C52 35 47 48 32 58 Z')+`<g transform="translate(8 10) scale(.75)">${buddhaSvg(2).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g>`);
    if(n===3) return lotusSvg(6);
    if(n===4) return wrap(c(32,17,8)+p('M22 18 C24 8 40 8 42 18')+p('M24 25 C27 30 37 30 40 25')+p('M20 35 C26 40 38 40 44 35')+p('M18 48 C25 42 39 42 46 48')+`<circle cx="27" cy="16" r="1" fill="currentColor"/><circle cx="37" cy="16" r="1" fill="currentColor"/>`);
    if(n===5) return themeSvg('theme-wheel');
    if(n===6) return wrap(p('M19 49 C22 40 23 29 24 17 C25 12 28 12 29 17 L30 31')+p('M30 31 L32 13 C33 9 36 10 36 14 L36 31')+p('M36 31 L40 18 C41 14 44 16 43 20 L40 36')+p('M40 36 C46 30 49 31 48 35 C45 42 41 48 36 53')+lotusSvg(6).replace(/^<svg[^>]*>|<\/svg>$/g,''));
    if(n===7) return wrap(p('M32 54 V31')+p('M32 35 C24 29 18 25 12 24 M32 35 C40 29 46 25 52 24')+p('M32 27 C26 20 23 14 23 9 M32 27 C38 20 41 14 41 9')+`<circle cx="32" cy="31" r="5" fill="currentColor"/>`+p('M25 43 C28 38 36 38 39 43 M21 48 C28 52 36 52 43 48'));
    if(n===8) return wrap(lotusSvg(6).replace(/^<svg[^>]*>|<\/svg>$/g,'')+p('M32 14 C26 21 27 26 32 31 C37 26 38 21 32 14 Z'));
    if(n===9) return wrap(p('M18 51 H46')+p('M21 51 V43 H43 V51')+p('M24 43 C24 34 27 29 32 25 C37 29 40 34 40 43')+p('M27 25 H37 M28 21 H36 M29 17 H35 M30 13 H34 M32 8 V13'));
    if(n===10) return wrap(c(32,32,25)+buddhaSvg(8).replace(/^<svg[^>]*>|<\/svg>$/g,''));
    if(n===11) return wrap(p('M32 54 V28')+p('M32 29 C24 25 21 18 24 10 C30 12 33 18 32 29')+p('M32 29 C40 25 43 18 40 10 C34 12 31 18 32 29')+p('M32 43 C24 40 19 42 15 47 C21 51 27 51 32 47 M32 43 C40 40 45 42 49 47 C43 51 37 51 32 47'));
    if(n===12) return wrap(p('M40 10 C31 10 24 17 24 27 C24 37 30 43 40 46')+p('M39 14 C35 18 34 22 35 26')+p('M35 31 C37 33 40 33 42 31')+p('M26 48 C31 44 38 44 44 49'));
    if(n===13) return themeSvg('theme-prayer');
    if(n===14) return wrap(`<circle cx="32" cy="29" r="25" fill="currentColor" opacity=".12"/>`+buddhaSvg(1).replace(/^<svg[^>]*>|<\/svg>$/g,''));
    return wrap(p('M32 8 C27 14 28 19 32 23 C36 19 37 14 32 8')+p('M32 23 C22 30 19 38 22 47')+p('M32 23 C42 30 45 38 42 47')+p('M14 51 C22 45 27 46 32 52 C37 46 42 45 50 51'));
  }

  ns.svg=function(id){
    id = ns.icons.some(x=>x.id===id) ? id : ns.defaultId;
    if(id.startsWith('gold-')||id.startsWith('pink-')) return specialSetSvg(parseInt(id.slice(-2),10));
    if(id.startsWith('buddha-')) return buddhaSvg(parseInt(id.slice(-2),10));
    if(id.startsWith('lotus-')) return lotusSvg(parseInt(id.slice(-2),10));
    if(id.startsWith('bodhi-')) return bodhiSvg(parseInt(id.slice(-2),10));
    return themeSvg(id);
  };
  ns.get=function(id){return ns.icons.find(x=>x.id===id)||ns.icons.find(x=>x.id===ns.defaultId)};
  ns.colorFor=function(id){
    if(id.startsWith('gold-')) return '#d68a16';
    if(id.startsWith('pink-')) return '#ef8fa3';
    if(id.startsWith('buddha-')) return '#c97818';
    if(id.startsWith('lotus-')){ const n=parseInt(id.slice(-2),10); return [1,2,3,4,10,11,13,14,17,20].includes(n)?'#e76f91':'#b8863b'; }
    if(id.startsWith('bodhi-')) return '#5f7f45';
    return ['theme-lotus'].includes(id)?'#d98298':(['theme-wisdom'].includes(id)?'#5f7f45':'#8a6338');
  };
  ns.render=function(id,style='brown'){
    if(id==='image-bodhi-red') return '<img class="gntt-book-icon-image" src="app-icon-hinh-so-1.png?v=24.2.5" alt="Lá bồ đề non đỏ">';
    const svg=ns.svg(id);
    const colors={brown:'#8a6338',pink:'#e76f91',green:'#5f7f45',orange:'#c97818'};
    if(id.startsWith('gold-')) return `<img class="gntt-book-icon-image gntt-library-art" src="icon-library/${id}.png?v=24.2.15r5" alt="${ns.get(id).label}">`;
    if(id.startsWith('pink-')) return `<img class="gntt-book-icon-image gntt-library-art" src="icon-library/${id}.png?v=24.2.15r5" alt="${ns.get(id).label}">`;
    if(id.startsWith('buddha-')) return svg.replace('<svg ','<svg style=\"color:#c97818;--icon-vein:#fff4df\" ');
    // Backward compatibility: old 'mono' = brown, old 'color' keeps its natural category color.
    if(style==='color') return svg.replace('<svg ','<svg style=\"color:'+ns.colorFor(id)+';--icon-vein:#fff\" ');
    const key=style==='mono'?'brown':style;
    const color=colors[key]||colors.brown;
    return svg.replace('<svg ','<svg style=\"color:'+color+';--icon-vein:#fff\" ');
  };
  window.GNTT_BOOK_ICONS=ns;
})();
