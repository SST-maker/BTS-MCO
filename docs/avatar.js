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
  accessory:[
    {id:'bolt',label:'Éclair'},
    {id:'crown',label:'Couronne'},
    {id:'cap',label:'Casquette'},
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
export const DEFAULT_AVATAR={background:'ocean',accent:'blue',face:'classic',accessory:'bolt',frame:'orbit'};
const find=(group,id)=>AVATAR_OPTIONS[group].find(x=>x.id===id)||AVATAR_OPTIONS[group][0];
export function normalizeAvatar(v={}){return {
  background:find('background',v?.background).id,
  accent:find('accent',v?.accent).id,
  face:find('face',v?.face).id,
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
function accessory(type,accent){
  if(type==='crown') return `<path d="M35 25 L39 16 L47 23 L51 13 L58 23 L66 16 L69 25 Z" fill="#FFC107" stroke="#fff" stroke-width="1.2"/>`;
  if(type==='cap') return `<path d="M35 25 Q49 14 65 23 L63 28 H38 Z" fill="${accent}"/><path d="M63 24 Q72 23 75 27 Q69 29 62 29" fill="${accent}"/>`;
  if(type==='headphones') return `<path d="M29 39 Q29 19 50 19 Q71 19 71 39" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><rect x="24" y="37" width="8" height="17" rx="4" fill="#F8FBFF" stroke="${accent}" stroke-width="2"/><rect x="68" y="37" width="8" height="17" rx="4" fill="#F8FBFF" stroke="${accent}" stroke-width="2"/>`;
  if(type==='none') return '';
  return `<path d="M50 11 L44 23 H50 L46 34 L60 18 H53 L57 11 Z" fill="#FFC107" stroke="#fff" stroke-width="1.2"/>`;
}
function frame(type,soft,accent){
  if(type==='shield') return `<path d="M50 6 L84 18 V48 Q84 75 50 93 Q16 75 16 48 V18 Z" fill="${soft}" opacity=".18" stroke="${accent}" stroke-width="2"/>`;
  if(type==='dots') return `<g fill="${accent}" opacity=".38"><circle cx="17" cy="23" r="2"/><circle cx="79" cy="18" r="1.6"/><circle cx="83" cy="67" r="2.3"/><circle cx="21" cy="74" r="1.7"/><circle cx="72" cy="84" r="1.3"/><circle cx="12" cy="49" r="1.2"/></g>`;
  if(type==='glow') return `<circle cx="50" cy="48" r="38" fill="${soft}" opacity=".16"/><circle cx="50" cy="48" r="31" fill="${accent}" opacity=".08"/>`;
  return `<circle cx="50" cy="48" r="40" fill="none" stroke="${accent}" stroke-width="2.4" opacity=".72"/><path d="M17 63 Q10 46 18 29" fill="none" stroke="${soft}" stroke-width="3.4" stroke-linecap="round"/><path d="M83 33 Q90 52 80 69" fill="none" stroke="${soft}" stroke-width="3.4" stroke-linecap="round"/>`;
}
export function avatarMarkup(value={},className='avatar-svg',label='Avatar élève'){
  const a=normalizeAvatar(value),bg=find('background',a.background),ac=find('accent',a.accent).color;
  return `<svg class="${className}" viewBox="0 0 100 100" role="img" aria-label="${label.replace(/"/g,'&quot;')}">
  <rect width="100" height="100" rx="24" fill="${bg.base}"/>
  <circle cx="76" cy="28" r="31" fill="${bg.soft}" opacity=".28"/>
  <circle cx="22" cy="82" r="25" fill="${ac}" opacity=".10"/>
  ${frame(a.frame,bg.soft,ac)}
  <path d="M28 87 Q31 70 42 67 H58 Q69 70 72 87 Z" fill="#F7FAFF" stroke="#D8E2F1" stroke-width="1.4"/>
  <path d="M39 68 L44 78 H56 L61 68" fill="${ac}" opacity=".92"/>
  <rect x="24" y="29" width="52" height="39" rx="17" fill="#F9FBFF" stroke="#D7E0EC" stroke-width="1.5"/>
  <rect x="28" y="33" width="44" height="30" rx="13" fill="#071A3C"/>
  <rect x="20" y="40" width="6" height="16" rx="3" fill="#F9FBFF" stroke="#D7E0EC" stroke-width="1.2"/>
  <rect x="74" y="40" width="6" height="16" rx="3" fill="#F9FBFF" stroke="#D7E0EC" stroke-width="1.2"/>
  ${eyes(a.face,ac)}
  ${accessory(a.accessory,ac)}
  <circle cx="50" cy="77" r="4" fill="#071A3C"/><path d="M48 78 L51 74 H55 L52 78 H55 L49 83 L51 79 Z" fill="#FFC107"/>
  </svg>`;
}
export function avatarSummary(a={}){const n=normalizeAvatar(a);return `${find('background',n.background).label} • ${find('accent',n.accent).label} • ${find('face',n.face).label} • ${find('accessory',n.accessory).label}`}
