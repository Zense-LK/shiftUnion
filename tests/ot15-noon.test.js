/* Shift Union 11.6.1: tests the production calculation, not a copied implementation. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../www/index.html"),"utf8");
const match=html.match(/function calc\(e,now=Date\.now\(\)\)\{[\s\S]*?(?=\nconst netOf=)/);
assert.ok(match,"Production calc() must be available");
const S={ss:"13:00",se:"21:15",cut:"12:00",post:true,satOn:false,sa:"13:00",sb:"17:00"};
const hm=(s,ts)=>{const [h,m]=s.split(":").map(Number),d=new Date(ts);d.setHours(h,m,0,0);return d.getTime()};
const calc=new Function("S","hm",match[0]+"\nreturn calc;")(S,hm);
const when=(h,m)=>new Date(2026,10,16,h,m,0,0).getTime();
const tests=[
  ["before noon receives late OT", {in:when(11,59),out:when(22,15),t:"N"},2+1/60,0],
  ["noon exactly does not", {in:when(12,0),out:when(22,15),t:"N"},0,0],
  ["after noon does not", {in:when(13,0),out:when(22,15),t:"N"},0,0],
  ["9:15 exactly produces no after-shift OT", {in:when(13,0),out:when(21,15),t:"N"},0,0],
  ["earlier OT remains", {in:when(11,0),out:when(21,15),t:"N"},2,0],
  ["OT2 unaffected", {in:when(13,0),out:when(22,15),t:"20"},0,9.25],
  ["normal to OT2 split", {in:when(13,0),out:when(22,15),t:"N",split:when(21,15),t2:"20"},0,1],
  ["OT2 to normal split", {in:when(13,0),out:when(22,15),t:"20",split:when(21,15),t2:"N"},0,8.25],
  ["early normal to OT2", {in:when(11,0),out:when(22,15),t:"N",split:when(21,15),t2:"20"},2,1]
];
function near(actual,expected,label){assert.ok(Math.abs(actual-expected)<1e-7,`${label}: expected ${expected}, got ${actual}`)}
for(const [name,entry,o15,o20] of tests){const actual=calc(entry);near(actual.o15,o15,name+" OT1.5");near(actual.o20,o20,name+" OT2.0");console.log("PASS:",name)}
S.se="20:00";
near(calc({in:when(13,0),out:when(22,0),t:"N"}).o15,1.25,"pre-21:15 earnings with earlier end");
near(calc({in:when(11,0),out:when(22,0),t:"N"}).o15,4,"eligible early clock-in with earlier end");
S.se="21:15";S.post=false;
near(calc({in:when(11,0),out:when(22,15),t:"N"}).o15,2,"post-shift setting disabled");
const exporter=fs.readFileSync(path.join(__dirname,"../www/ot-export.js"),"utf8");
assert.match(exporter,/calc\(e,e\.out\)/,"PDF export must reuse production overtime calculation");
console.log("All 12 OT 1.5 policy checks passed; PDF uses shared production calc().");
