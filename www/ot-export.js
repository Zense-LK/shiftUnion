(function overtimeExportPlugin(){
 "use strict";
 function overtimeReportData(){
  const [from,to]=cyc();
  const done=L.filter(e=>Number.isFinite(e.in)&&Number.isFinite(e.out)&&e.out>e.in&&e.in>=from&&e.in<to)
   .sort((a,b)=>a.in-b.in).map(e=>({entry:e,ot:calc(e,e.out)}));
  const groups=[{title:"OT 1.5",key:"o15"},{title:"OT 2.0",key:"o20"}].map(g=>{
   const rows=done.filter(o=>o.ot[g.key]>1/3600).map(o=>({date:o.entry.in,clockIn:o.entry.in,clockOut:o.entry.out,hours:o.ot[g.key]}));
   return {...g,rows,total:rows.reduce((a,r)=>a+r.hours,0)};
  });
  return {from,to,groups};
 }
 function overtimePdfBytes(report){
  const PW=595.28,PH=841.89,M=42;
  const ink=[.18,.17,.31],muted=[.44,.43,.55],accent=[.40,.27,.70],bg=[.97,.96,.99],purple=[.92,.89,.98];
  let cmds=[],pages=[],y=0;
  const color=(c,stroke=false)=>`${c.map(v=>v.toFixed(3)).join(" ")} ${stroke?"RG":"rg"}`;
  const esc=v=>String(v).normalize("NFKD").replace(/[^\x20-\x7E]/g,"?").replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
  function rect(x,top,w,h,c){cmds.push(color(c),`${x.toFixed(2)} ${(PH-top-h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`)}
  function txt(x,top,size,value,bold=false,c=ink){cmds.push(color(c),`BT /${bold?"F2":"F1"} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${(PH-top-size).toFixed(2)} Tm (${esc(value)}) Tj ET`)}
  function line(x1,y1,x2,y2,c=purple){cmds.push(color(c,true),".5 w",`${x1.toFixed(2)} ${(PH-y1).toFixed(2)} m ${x2.toFixed(2)} ${(PH-y2).toFixed(2)} l S`)}
  const d=ms=>new Date(ms).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
  const weekday=ms=>new Date(ms).toLocaleDateString("en-GB",{weekday:"short"});
  const tm=ms=>new Date(ms).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:true}).replace(/\s/g," ");
  const hours=n=>n.toFixed(2)+" h";
  function newPage(){
   if(cmds.length)pages.push(cmds.join("\n")+"\n");
   cmds=[];
   rect(0,0,PW,7,accent);
   txt(M,28,11,"SHIFT UNION",true,accent);
   txt(M,51,21,"Overtime Clock Logs",true,ink);
   txt(M,86,9,`Cycle: ${d(report.from)} - ${d(report.to-1)}`,false,muted);
   line(M,110,PW-M,110);
   y=128;
  }
  function heading(name){
   if(y>PH-130)newPage();
   rect(M,y,PW-M*2,27,purple);
   txt(M+12,y+5,12,name,true,accent);
   y+=40;
   rect(M,y,PW-M*2,25,bg);
   txt(M+9,y+6,8,"DATE",true,muted);
   txt(M+115,y+6,8,"CLOCK IN",true,muted);
   txt(M+222,y+6,8,"CLOCK OUT",true,muted);
   txt(M+357,y+6,8,"OT HOURS",true,muted);
   y+=25;
  }
  function row(r,groupName){
   if(y>PH-110){newPage();heading(groupName)}
   if(Math.floor(y/29)%2===0)rect(M,y,PW-M*2,30,bg);
   txt(M+9,y+8,9,d(r.date)+" "+weekday(r.date),false,ink);
   txt(M+115,y+8,9,tm(r.clockIn),false,ink);
   txt(M+222,y+8,9,tm(r.clockOut),false,ink);
   txt(M+357,y+8,9,hours(r.hours),true,accent);
   y+=30;line(M,y,PW-M,y,[.89,.87,.94]);
  }
  newPage();
  report.groups.forEach(g=>{
   if(y>PH-160)newPage();
   heading(g.title);
   if(!g.rows.length){txt(M+9,y+8,9,"No completed overtime entries in this cycle.",false,muted);y+=35}
   else g.rows.forEach(r=>row(r,g.title));
   if(y>PH-105)newPage();
   rect(M,y+6,PW-M*2,33,purple);
   txt(M+12,y+14,10,`${g.title} total`,true,ink);
   txt(M+357,y+14,10,hours(g.total),true,accent);
   y+=57;
  });
  pages.push(cmds.join("\n")+"\n");
  const objects=[],obj=x=>{objects.push(x);return objects.length};
  const catalog=obj(""),rootPages=obj("");
  const font=obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold=obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pids=[];
  pages.forEach(content=>{
   const len=new TextEncoder().encode(content).length;
   const stream=obj(`<< /Length ${len} >>\nstream\n${content}endstream`);
   const page=obj(`<< /Type /Page /Parent ${rootPages} 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 ${font} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${stream} 0 R >>`);
   pids.push(page);
  });
  objects[catalog-1]=`<< /Type /Catalog /Pages ${rootPages} 0 R >>`;
  objects[rootPages-1]=`<< /Type /Pages /Count ${pids.length} /Kids [${pids.map(p=>p+" 0 R").join(" ")}] >>`;
  let pdf="%PDF-1.4\n",offsets=[0];
  objects.forEach((body,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${body}\nendobj\n`});
  const xref=pdf.length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(o=>pdf+=`${String(o).padStart(10,"0")} 00000 n \n`);
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
 }
 async function exportOvertimePdf(){
  if(demoActive){toast("Turn off Demo mode to export real overtime logs");return}
  const report=overtimeReportData();
  if(!report.groups.some(g=>g.rows.length)){toast("No completed OT 1.5 or OT 2.0 shifts in this cycle");return}
  const filename=`Shift-Union-OT-${dk(report.from)}-${dk(report.to-1)}.pdf`;
  const bytes=overtimePdfBytes(report);
  try{
   const P=CPl();
   if(P.Filesystem&&P.Share){
    let bin="";
    for(let i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode(...bytes.subarray(i,i+8192));
    const saved=await P.Filesystem.writeFile({path:filename,data:btoa(bin),directory:"CACHE"});
    await P.Share.share({title:"Shift Union OT 1.5 & OT 2.0 logs",files:[saved.uri],dialogTitle:"Share overtime logs"});
   }else{
    const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
    const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),15000);
   }
   toast("Overtime report ready");
  }catch(e){toast("Could not export PDF — please try again");console.error("Overtime export",e)}
 }
 document.getElementById("ot-export").addEventListener("click",exportOvertimePdf);
})();
