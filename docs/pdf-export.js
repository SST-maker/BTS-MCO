const NAVY=[10,30,63], BLUE=[30,91,255], GOLD=[255,193,7], INK=[20,39,68], MUTED=[96,113,138], PALE=[244,248,255], LINE=[222,232,245], WHITE=[255,255,255], RED=[176,54,66];
const escPdf=s=>String(s??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
function winAnsi(s=''){
  const map={'€':'\x80','‚':'\x82','ƒ':'\x83','„':'\x84','…':'\x85','†':'\x86','‡':'\x87','ˆ':'\x88','‰':'\x89','Š':'\x8A','‹':'\x8B','Œ':'\x8C','Ž':'\x8E','‘':'\x91','’':'\x92','“':'\x93','”':'\x94','•':'\x95','–':'\x96','—':'\x97','˜':'\x98','™':'\x99','š':'\x9A','›':'\x9B','œ':'\x9C','ž':'\x9E','Ÿ':'\x9F','→':' -> ','←':' <- ','✓':'OK','⚠':'!','🎯':'','📘':'','🧠':'','🧮':'','🏆':'','📊':''};
  return String(s).replace(/[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ→←✓⚠🎯📘🧠🧮🏆📊]/g,c=>map[c]??c).replace(/[^\x00-\xFF]/g,'');
}
const rgb=c=>`${(c[0]/255).toFixed(3)} ${(c[1]/255).toFixed(3)} ${(c[2]/255).toFixed(3)}`;
function wrap(text,max=88){
  const out=[];for(const raw of String(text??'').split(/\n/)){if(!raw.trim()){out.push('');continue}let line='';for(const word of raw.split(/\s+/)){if(!line){line=word;continue}if((line+' '+word).length<=max)line+=' '+word;else{out.push(line);line=word}}if(line)out.push(line)}return out;
}
class Doc{
  constructor(){this.pages=[[]];this.y=742;this.pageNo=1;}
  c(){return this.pages[this.pages.length-1]}
  cmd(s){this.c().push(s)}
  header(meta){
    this.cmd(`${rgb(NAVY)} rg 0 0 595 842 re f`);this.cmd(`${rgb(WHITE)} rg 0 770 595 72 re f`); // temporarily white canvas below? overwritten next
  }
  newPage(meta){this.pages.push([]);this.pageNo++;this.y=742;this.paintPage(meta)}
  paintPage(meta){
    this.cmd(`${rgb(WHITE)} rg 0 0 595 842 re f`);
    this.cmd(`${rgb(NAVY)} rg 0 770 595 72 re f`);
    this.cmd(`${rgb(GOLD)} rg 0 766 595 4 re f`);
    this.text('MCO QUIZ ARENA',46,808,15,true,WHITE);
    this.text('NCR Solutions - BTS MCO',46,790,8,false,[190,210,239]);
    this.text(meta,549,798,8,true,[210,224,245],'right');
    this.cmd(`${rgb(LINE)} RG 46 48 m 549 48 l S`);
    this.text(`Page ${this.pageNo}`,549,32,8,false,MUTED,'right');
  }
  ensure(h,meta){if(this.y-h<62)this.newPage(meta)}
  text(t,x,y,size=10,bold=false,color=INK,align='left'){
    const v=winAnsi(t);const avg=size*.50;let xx=x;if(align==='right')xx=x-v.length*avg;if(align==='center')xx=x-v.length*avg/2;
    this.cmd(`BT ${rgb(color)} rg /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${xx.toFixed(1)} ${y.toFixed(1)} Tm (${escPdf(v)}) Tj ET`);
  }
  paragraph(t,{size=10,color=INK,bold=false,indent=0,max=88,leading=14,meta}={}){
    const lines=wrap(t,max);this.ensure(lines.length*leading+6,meta);for(const l of lines){this.text(l,46+indent,this.y,size,bold,color);this.y-=leading}this.y-=4;
  }
  section(title,meta){this.ensure(38,meta);this.y-=4;this.cmd(`${rgb(PALE)} rg 46 ${this.y-20} 503 30 re f`);this.cmd(`${rgb(BLUE)} rg 46 ${this.y-20} 4 30 re f`);this.text(title,60,this.y-2,11,true,NAVY);this.y-=38;}
  chip(text,x,y,w=88){this.cmd(`${rgb(PALE)} rg ${x} ${y} ${w} 22 re f`);this.text(text,x+8,y+7,8,true,BLUE)}
  document(d,i,meta){
    const lines=wrap(d.content,77);const h=Math.max(70,42+lines.length*12);this.ensure(h+10,meta);
    this.cmd(`${rgb([249,251,255])} rg 46 ${this.y-h+8} 503 ${h} re f`);this.cmd(`${rgb(LINE)} RG 46 ${this.y-h+8} 503 ${h} re S`);
    this.text(d.title||`Document ${i+1}`,60,this.y-13,10,true,NAVY);let yy=this.y-34;
    for(const line of lines){this.text(line,60,yy,8.7,false,MUTED);yy-=12}
    this.y-=h+8;
  }
  task(t,i,meta){
    const lines=wrap(t.prompt,76);const h=42+lines.length*13;this.ensure(h+8,meta);
    this.cmd(`${rgb([247,250,255])} rg 46 ${this.y-h+7} 503 ${h} re f`);
    this.cmd(`${rgb(BLUE)} rg 58 ${this.y-26} 24 24 re f`);this.text(String(i+1),70,this.y-19,9,true,WHITE,'center');
    this.text(t.title||`Question ${i+1}`,94,this.y-14,10.5,true,INK);let yy=this.y-34;for(const line of lines){this.text(line,94,yy,9,false,MUTED);yy-=13}this.y-=h+8;
  }
  correction(c,i,meta){
    const lines=wrap(c.expected,74);const h=46+lines.length*13;this.ensure(h+8,meta);
    this.cmd(`${rgb([255,249,232])} rg 46 ${this.y-h+7} 503 ${h} re f`);this.cmd(`${rgb(GOLD)} rg 46 ${this.y-h+7} 4 ${h} re f`);
    this.text(`${i+1}. ${c.title||'Correction'} - ${c.points||0} pts`,60,this.y-15,10,true,[111,79,0]);let yy=this.y-36;for(const line of lines){this.text(line,60,yy,9,false,[94,75,30]);yy-=13}this.y-=h+8;
  }
  build(meta){
    const objs=[];const pageIds=[];const contentIds=[];let next=5;
    for(let i=0;i<this.pages.length;i++){pageIds.push(next++);contentIds.push(next++)}
    objs[1]='<< /Type /Catalog /Pages 2 0 R >>';
    objs[2]=`<< /Type /Pages /Kids [${pageIds.map(x=>`${x} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
    objs[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objs[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    for(let i=0;i<this.pages.length;i++){
      const stream=this.pages[i].join('\n');
      objs[pageIds[i]]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentIds[i]} 0 R >>`;
      objs[contentIds[i]]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    }
    let pdf='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';const offsets=[0];
    for(let i=1;i<objs.length;i++){if(!objs[i])continue;offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objs[i]}\nendobj\n`}
    const xref=pdf.length;pdf+=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;
    for(let i=1;i<objs.length;i++)pdf+=`${String(offsets[i]||0).padStart(10,'0')} 00000 n \n`;
    pdf+=`trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const bytes=new Uint8Array(pdf.length);for(let i=0;i<pdf.length;i++)bytes[i]=pdf.charCodeAt(i)&255;return new Blob([bytes],{type:'application/pdf'});
  }
}
export function downloadCasePdf(c,{includeCorrection=false,homework=false}={}){
  const meta=`${c.subject} ${c.year} - ${c.chapter} - leçon ${c.lesson}`;const d=new Doc();d.paintPage(meta);
  d.text(homework?'CAS PRATIQUE - TRAVAIL A LA MAISON':'CAS PRATIQUE - VERSION ELEVE',46,d.y,9,true,BLUE);d.y-=26;
  d.paragraph(c.title,{size:20,bold:true,color:NAVY,max:48,leading:23,meta});
  d.paragraph(`${c.difficulty} • ${c.durationMinutes} min • ${c.workFormat}`,{size:9,color:MUTED,max:82,meta});
  if(homework)d.paragraph(c.homeworkNote,{size:9,color:[111,79,0],bold:true,max:82,meta});
  d.section('Contexte professionnel',meta);d.paragraph(c.context,{size:10,max:84,leading:14,meta});
  if((c.concepts||[]).length){d.section('Notions mobilisées',meta);d.paragraph(c.concepts.join(' • '),{size:9,color:BLUE,max:82,meta});}
  d.section('Documents',meta);(c.documents||[]).forEach((x,i)=>d.document(x,i,meta));
  d.section('Travail à réaliser',meta);(c.tasks||[]).forEach((x,i)=>d.task(x,i,meta));
  d.section('Barème indicatif',meta);(c.rubric||[]).forEach(r=>d.paragraph(`${r.criterion} — ${r.points} points`,{size:9,max:82,meta}));
  if(includeCorrection){d.section('Corrigé professeur',meta);(c.correction||[]).forEach((x,i)=>d.correction(x,i,meta));d.section('Note professeur',meta);d.paragraph(c.teacherNote||'',{size:9,max:82,meta});}
  const blob=d.build(meta);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`Cas_${c.subject}_${c.year}_${String(c.lesson).replace('.','-')}_${includeCorrection?'CORRIGE':'ELEVE'}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
