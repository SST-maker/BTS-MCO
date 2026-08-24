export const AVATAR_OPTIONS={
  background:[
    {id:'ocean',label:'Océan',base:'#081B45',soft:'#155BFF'},
    {id:'electric',label:'Électrique',base:'#0A1E3F',soft:'#00A8FF'},
    {id:'violet',label:'Violet',base:'#27134F',soft:'#7C5CFC'},
    {id:'mint',label:'Menthe',base:'#063D3A',soft:'#16C7A3'},
    {id:'sunset',label:'Sunset',base:'#54230E',soft:'#FF8A2A'},
    {id:'graphite',label:'Graphite',base:'#161A23',soft:'#56657D'}
  ],
  accent:[
    {id:'blue',label:'Bleu',color:'#1677FF'},
    {id:'cyan',label:'Cyan',color:'#19C8FF'},
    {id:'violet',label:'Violet',color:'#8A6CFF'},
    {id:'green',label:'Vert',color:'#20D39A'},
    {id:'gold',label:'Or',color:'#FFC107'},
    {id:'pink',label:'Rose',color:'#FF5DA2'}
  ],
  face:[
    {id:'classic',label:'Classique'},
    {id:'happy',label:'Souriant'},
    {id:'focus',label:'Focus'},
    {id:'wink',label:'Clin d’œil'},
    {id:'stars',label:'Étoiles'}
  ],
  hair:[
    {id:'none',label:'Sans cheveux'},
    {id:'short',label:'Courts'},
    {id:'spike',label:'Pics'},
    {id:'wave',label:'Mèche'},
    {id:'curls',label:'Boucles'},
    {id:'afro',label:'Afro'},
    {id:'side',label:'Dégradé'},
    {id:'long',label:'Longs'},
    {id:'pony',label:'Queue haute'}
  ],
  hairColor:[
    {id:'graphite',label:'Graphite',color:'#172238'},
    {id:'chestnut',label:'Châtain',color:'#653A23'},
    {id:'caramel',label:'Caramel',color:'#A76532'},
    {id:'blond',label:'Blond',color:'#E7C45A'},
    {id:'silver',label:'Argent',color:'#CAD5E6'},
    {id:'blue',label:'Bleu MCO',color:'#176BFF'}
  ],
  glasses:[
    {id:'none',label:'Sans lunettes'},
    {id:'sunglasses',label:'Soleil'},
    {id:'mirror',label:'Miroir bleu'},
    {id:'round',label:'Rondes'},
    {id:'retro',label:'Rétro'},
    {id:'aviator',label:'Aviateur'},
    {id:'gaming',label:'Gaming'},
    {id:'neon',label:'Néon'}
  ],
  hat:[
    {id:'none',label:'Sans chapeau'},
    {id:'cap',label:'Casquette'},
    {id:'beanie',label:'Bonnet'},
    {id:'bucket',label:'Bob'},
    {id:'fedora',label:'Chapeau'},
    {id:'graduate',label:'Diplômé'},
    {id:'cowboy',label:'Cow-boy'},
    {id:'chef',label:'Toque'}
  ],
  accessory:[
    {id:'bolt',label:'Éclair'},
    {id:'crown',label:'Couronne'},
    {id:'cap',label:'Casquette classique'},
    {id:'headphones',label:'Casque'},
    {id:'none',label:'Aucun'}
  ],
  frame:[
    {id:'orbit',label:'Orbite'},
    {id:'shield',label:'Bouclier'},
    {id:'dots',label:'Constellation'},
    {id:'glow',label:'Halo'}
  ]
};

export const DEFAULT_AVATAR={
  background:'ocean',accent:'blue',face:'classic',hair:'none',hairColor:'graphite',
  glasses:'none',hat:'none',accessory:'bolt',frame:'orbit'
};

const find=(group,id)=>AVATAR_OPTIONS[group].find(x=>x.id===id)||AVATAR_OPTIONS[group][0];
export function normalizeAvatar(v={}){return {
  background:find('background',v?.background).id,
  accent:find('accent',v?.accent).id,
  face:find('face',v?.face).id,
  hair:find('hair',v?.hair||'none').id,
  hairColor:find('hairColor',v?.hairColor||'graphite').id,
  glasses:find('glasses',v?.glasses||'none').id,
  hat:find('hat',v?.hat||'none').id,
  accessory:find('accessory',v?.accessory).id,
  frame:find('frame',v?.frame).id
}}

function eyes(face,accent){
  if(face==='happy') return `<path d="M35 44 Q40 38 45 44" fill="none" stroke="${accent}" stroke-width="4.8" stroke-linecap="round"/><path d="M55 44 Q60 38 65 44" fill="none" stroke="${accent}" stroke-width="4.8" stroke-linecap="round"/><path d="M44 54 Q50 59 56 54" fill="none" stroke="${accent}" stroke-width="3.6" stroke-linecap="round"/>`;
  if(face==='focus') return `<path d="M35 43 L45 41" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><path d="M55 41 L65 43" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><path d="M46 54 H54" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>`;
  if(face==='wink') return `<rect x="35" y="38" width="9" height="13" rx="4.5" fill="${accent}"/><path d="M56 45 Q61 38 66 45" fill="none" stroke="${accent}" stroke-width="4.8" stroke-linecap="round"/><path d="M44 54 Q50 58 56 54" fill="none" stroke="${accent}" stroke-width="3.2" stroke-linecap="round"/>`;
  if(face==='stars') return `<path d="M40 36.5 41.8 41l4.8.3-3.7 3.1 1.2 4.7-4.1-2.5-4.1 2.5 1.2-4.7-3.7-3.1 4.8-.3z" fill="${accent}"/><path d="M60 36.5 61.8 41l4.8.3-3.7 3.1 1.2 4.7-4.1-2.5-4.1 2.5 1.2-4.7-3.7-3.1 4.8-.3z" fill="${accent}"/><path d="M44 55 Q50 60 56 55" fill="none" stroke="${accent}" stroke-width="3.4" stroke-linecap="round"/>`;
  return `<rect x="35" y="38" width="9" height="14" rx="4.5" fill="${accent}"/><rect x="56" y="38" width="9" height="14" rx="4.5" fill="${accent}"/>`;
}

function hairBack(type,color){
  if(type==='long') return `<path d="M25 33 Q25 19 50 18 Q75 19 75 34 L78 62 Q72 71 67 67 L65 37 Q50 29 35 37 L33 67 Q27 71 22 62 Z" fill="${color}" opacity=".98"/>`;
  if(type==='pony') return `<path d="M68 26 Q83 27 83 42 Q84 54 74 60 Q79 47 70 40 Z" fill="${color}"/><circle cx="75" cy="30" r="6" fill="${color}"/>`;
  if(type==='afro') return `<g fill="${color}"><circle cx="30" cy="28" r="10"/><circle cx="39" cy="20" r="11"/><circle cx="50" cy="18" r="12"/><circle cx="61" cy="20" r="11"/><circle cx="70" cy="28" r="10"/></g>`;
  if(type==='curls') return `<g fill="${color}"><circle cx="31" cy="28" r="7"/><circle cx="40" cy="23" r="7"/><circle cx="50" cy="22" r="7"/><circle cx="60" cy="23" r="7"/><circle cx="69" cy="28" r="7"/></g>`;
  return '';
}

function hairFront(type,color){
  if(type==='none'||type==='afro'||type==='curls') return '';
  if(type==='short') return `<path d="M31 31 Q34 23 42 24 L46 19 L50 24 L57 19 L60 25 Q67 24 70 31 Q60 27 50 29 Q40 27 31 31 Z" fill="${color}"/>`;
  if(type==='spike') return `<path d="M29 32 L34 22 L40 27 L45 17 L50 26 L56 16 L60 27 L68 20 L71 33 Q49 27 29 32 Z" fill="${color}"/>`;
  if(type==='wave') return `<path d="M29 32 Q34 19 51 21 Q64 21 70 30 Q54 25 45 34 Q39 38 33 34 Q38 32 42 27 Q35 28 29 32 Z" fill="${color}"/>`;
  if(type==='side') return `<path d="M30 31 Q33 21 48 21 Q61 21 70 29 Q59 27 49 31 L42 26 Q37 33 30 34 Z" fill="${color}"/><path d="M29 32 L29 42" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
  if(type==='long') return `<path d="M29 33 Q33 21 50 20 Q67 21 71 33 Q60 28 51 30 Q42 28 29 33 Z" fill="${color}"/>`;
  if(type==='pony') return `<path d="M29 32 Q34 20 51 21 Q64 21 70 30 Q58 26 50 30 Q39 27 29 32 Z" fill="${color}"/>`;
  return '';
}

function glasses(type,accent){
  if(type==='none') return '';
  if(type==='sunglasses') return `<path d="M31 38 H47 L45 50 Q40 56 34 50 Z M53 38 H69 L66 50 Q60 56 55 50 Z" fill="#07101F" opacity=".96"/><path d="M47 41 H53" stroke="#07101F" stroke-width="3"/><path d="M30 39 L26 37 M70 39 L74 37" stroke="#07101F" stroke-width="2.5"/>`;
  if(type==='mirror') return `<defs><linearGradient id="mirrorLens" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#E9FAFF"/><stop offset=".45" stop-color="#39C8FF"/><stop offset="1" stop-color="#136CFF"/></linearGradient></defs><rect x="31" y="37" width="17" height="14" rx="5" fill="url(#mirrorLens)" stroke="#E9FAFF" stroke-width="1.5"/><rect x="52" y="37" width="17" height="14" rx="5" fill="url(#mirrorLens)" stroke="#E9FAFF" stroke-width="1.5"/><path d="M48 42 H52" stroke="#E9FAFF" stroke-width="2"/>`;
  if(type==='round') return `<circle cx="40" cy="44" r="8" fill="none" stroke="#F8FBFF" stroke-width="2.2"/><circle cx="60" cy="44" r="8" fill="none" stroke="#F8FBFF" stroke-width="2.2"/><path d="M48 44 H52" stroke="#F8FBFF" stroke-width="2.2"/><path d="M32 42 L27 40 M68 42 L73 40" stroke="#F8FBFF" stroke-width="2"/>`;
  if(type==='retro') return `<path d="M31 37 H47 V49 H33 Q31 47 31 37 Z M53 37 H69 V47 Q68 49 66 49 H53 Z" fill="#151A26" stroke="#FFC107" stroke-width="2"/><path d="M47 41 H53" stroke="#FFC107" stroke-width="2"/>`;
  if(type==='aviator') return `<path d="M31 38 Q39 35 48 38 L46 47 Q44 52 39 52 Q33 52 32 47 Z M52 38 Q61 35 69 38 L68 47 Q67 52 61 52 Q56 52 54 47 Z" fill="#172238" stroke="#DDE7F6" stroke-width="1.5"/><path d="M48 40 Q50 38 52 40" fill="none" stroke="#DDE7F6" stroke-width="1.5"/>`;
  if(type==='gaming') return `<path d="M29 38 L47 36 L50 42 L53 36 L71 38 L67 50 L55 50 L50 45 L45 50 L33 50 Z" fill="#090E1C" stroke="${accent}" stroke-width="2"/><path d="M34 41 L44 40 M56 40 L66 41" stroke="#19C8FF" stroke-width="2" opacity=".8"/>`;
  return `<path d="M30 41 Q35 35 46 39 L50 45 L54 39 Q65 35 70 41 Q65 48 55 48 L50 44 L45 48 Q35 48 30 41 Z" fill="none" stroke="${accent}" stroke-width="2.7"/><path d="M32 39 L27 37 M68 39 L73 37" stroke="${accent}" stroke-width="2.2"/>`;
}

function hat(type,accent){
  if(type==='none') return '';
  if(type==='cap') return `<path d="M31 28 Q48 13 68 23 L65 31 H34 Z" fill="${accent}" stroke="#F8FBFF" stroke-width="1.2"/><path d="M64 26 Q74 24 78 29 Q70 32 63 31" fill="${accent}" stroke="#F8FBFF" stroke-width="1"/>`;
  if(type==='beanie') return `<path d="M32 29 Q34 14 50 13 Q66 14 68 29 Z" fill="${accent}" stroke="#F8FBFF" stroke-width="1.2"/><rect x="31" y="26" width="38" height="7" rx="3.5" fill="#0A1E3F" stroke="${accent}" stroke-width="1.2"/><circle cx="50" cy="12" r="4" fill="#FFC107"/>`;
  if(type==='bucket') return `<path d="M32 23 Q50 15 68 23 L65 31 H35 Z" fill="#F7FAFF" stroke="${accent}" stroke-width="1.5"/><path d="M28 30 Q50 25 72 30 Q70 35 50 34 Q30 35 28 30 Z" fill="${accent}"/>`;
  if(type==='fedora') return `<path d="M36 27 L39 16 H61 L65 27 Z" fill="#172238" stroke="#F8FBFF" stroke-width="1.2"/><path d="M27 29 Q50 24 73 29 Q70 34 50 33 Q30 34 27 29 Z" fill="#172238"/><rect x="38" y="24" width="25" height="3.5" rx="1.7" fill="${accent}"/>`;
  if(type==='graduate') return `<path d="M27 20 L50 11 L74 20 L50 29 Z" fill="#0B1733" stroke="${accent}" stroke-width="1.3"/><path d="M36 24 V31 Q50 37 64 31 V24" fill="#0B1733" stroke="${accent}" stroke-width="1.2"/><path d="M72 21 V34" stroke="#FFC107" stroke-width="1.8"/><circle cx="72" cy="35" r="2.2" fill="#FFC107"/>`;
  if(type==='cowboy') return `<path d="M37 28 Q39 16 50 16 Q61 16 63 28 Z" fill="#B87835" stroke="#F6D19C" stroke-width="1.2"/><path d="M25 30 Q50 23 75 30 Q68 36 50 33 Q32 36 25 30 Z" fill="#B87835" stroke="#F6D19C" stroke-width="1"/><path d="M39 26 H62" stroke="#172238" stroke-width="3"/>`;
  return `<path d="M35 28 Q34 20 41 18 Q41 10 50 11 Q59 10 59 18 Q67 19 65 28 Z" fill="#F8FBFF" stroke="#D8E2F1" stroke-width="1.2"/><rect x="36" y="27" width="28" height="6" rx="2" fill="#F8FBFF" stroke="#D8E2F1" stroke-width="1.2"/>`;
}

function accessory(type,accent,hatType){
  if(type==='none') return '';
  if(type==='crown' && hatType==='none') return `<path d="M35 25 L39 16 L47 23 L51 13 L58 23 L66 16 L69 25 Z" fill="#FFC107" stroke="#fff" stroke-width="1.2"/>`;
  if(type==='cap' && hatType==='none') return `<path d="M35 25 Q49 14 65 23 L63 28 H38 Z" fill="${accent}"/><path d="M63 24 Q72 23 75 27 Q69 29 62 29" fill="${accent}"/>`;
  if(type==='headphones' && hatType==='none') return `<path d="M29 39 Q29 19 50 19 Q71 19 71 39" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><rect x="24" y="37" width="8" height="17" rx="4" fill="#F8FBFF" stroke="${accent}" stroke-width="2"/><rect x="68" y="37" width="8" height="17" rx="4" fill="#F8FBFF" stroke="${accent}" stroke-width="2"/>`;
  if(type==='bolt') return hatType==='none'
    ? `<path d="M50 11 L44 23 H50 L46 34 L60 18 H53 L57 11 Z" fill="#FFC107" stroke="#fff" stroke-width="1.2"/>`
    : `<path d="M50 18 L46 25 H50 L47 31 L56 22 H52 L55 18 Z" fill="#FFC107" stroke="#fff" stroke-width=".8"/>`;
  return '';
}

function frame(type,soft,accent){
  if(type==='shield') return `<path d="M50 6 L84 18 V48 Q84 75 50 93 Q16 75 16 48 V18 Z" fill="${soft}" opacity=".18" stroke="${accent}" stroke-width="2"/>`;
  if(type==='dots') return `<g fill="${accent}" opacity=".38"><circle cx="17" cy="23" r="2"/><circle cx="79" cy="18" r="1.6"/><circle cx="83" cy="67" r="2.3"/><circle cx="21" cy="74" r="1.7"/><circle cx="72" cy="84" r="1.3"/><circle cx="12" cy="49" r="1.2"/></g>`;
  if(type==='glow') return `<circle cx="50" cy="48" r="38" fill="${soft}" opacity=".16"/><circle cx="50" cy="48" r="31" fill="${accent}" opacity=".08"/>`;
  return `<circle cx="50" cy="48" r="40" fill="none" stroke="${accent}" stroke-width="2.4" opacity=".72"/><path d="M17 63 Q10 46 18 29" fill="none" stroke="${soft}" stroke-width="3.4" stroke-linecap="round"/><path d="M83 33 Q90 52 80 69" fill="none" stroke="${soft}" stroke-width="3.4" stroke-linecap="round"/>`;
}

export function avatarMarkup(value={},className='avatar-svg',label='Avatar élève'){
  const a=normalizeAvatar(value),bg=find('background',a.background),ac=find('accent',a.accent).color,hc=find('hairColor',a.hairColor).color;
  const hairVisible=a.hat==='none' || ['graduate','cowboy','fedora'].includes(a.hat);
  return `<svg class="${className}" viewBox="0 0 100 100" role="img" aria-label="${label.replace(/"/g,'&quot;')}">
  <rect width="100" height="100" rx="24" fill="${bg.base}"/>
  <circle cx="76" cy="28" r="31" fill="${bg.soft}" opacity=".28"/>
  <circle cx="22" cy="82" r="25" fill="${ac}" opacity=".10"/>
  ${frame(a.frame,bg.soft,ac)}
  ${hairVisible?hairBack(a.hair,hc):''}
  <path d="M28 87 Q31 70 42 67 H58 Q69 70 72 87 Z" fill="#F7FAFF" stroke="#D8E2F1" stroke-width="1.4"/>
  <path d="M39 68 L44 78 H56 L61 68" fill="${ac}" opacity=".92"/>
  <rect x="24" y="29" width="52" height="39" rx="17" fill="#F9FBFF" stroke="#D7E0EC" stroke-width="1.5"/>
  ${hairVisible?hairFront(a.hair,hc):''}
  <rect x="28" y="33" width="44" height="30" rx="13" fill="#071A3C"/>
  <rect x="20" y="40" width="6" height="16" rx="3" fill="#F9FBFF" stroke="#D7E0EC" stroke-width="1.2"/>
  <rect x="74" y="40" width="6" height="16" rx="3" fill="#F9FBFF" stroke="#D7E0EC" stroke-width="1.2"/>
  ${eyes(a.face,ac)}
  ${glasses(a.glasses,ac)}
  ${accessory(a.accessory,ac,a.hat)}
  ${hat(a.hat,ac)}
  <circle cx="50" cy="77" r="4" fill="#071A3C"/><path d="M48 78 L51 74 H55 L52 78 H55 L49 83 L51 79 Z" fill="#FFC107"/>
  </svg>`;
}

export function avatarSummary(a={}){
  const n=normalizeAvatar(a);
  const bits=[find('background',n.background).label,find('accent',n.accent).label,find('face',n.face).label];
  if(n.hair!=='none') bits.push(find('hair',n.hair).label);
  if(n.glasses!=='none') bits.push(find('glasses',n.glasses).label);
  if(n.hat!=='none') bits.push(find('hat',n.hat).label);
  return bits.join(' • ');
}
