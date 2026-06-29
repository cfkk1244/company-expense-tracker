// ============================================================
// CONSTANTS & GLOBALS
// ============================================================
const MONTHS=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const UNITS=['กล่อง','ชุด','เครื่อง','ดวง','ม้วน','ตลับ','อัน','แผ่น','ขวด','ถุง','อื่น ๆ'];
const BRANCH_TH={khonkaen:'สาขาขอนแก่น',ubon:'สาขาอุบล'};
const now=new Date();
const todayStr=now.toISOString().split('T')[0];
let dashTab='all'; // 'all' | 'khonkaen' | 'ubon'
const formBranch={q:null,i:null,r:null,e:null,p:null};
const attachedFiles={};

// ============================================================
// STORAGE — key includes YEAR so data is preserved across years
// ============================================================
function keyFor(branch,year,month){
  return `biz2_${branch}_${year}_${String(month+1).padStart(2,'0')}`;
}
function loadFor(branch,year,month){
  const r=localStorage.getItem(keyFor(branch,year,month));
  return r?JSON.parse(r):{quotes:[],invoices:[],receipts:[],expenses:[],productions:[]};
}
function saveFor(branch,year,month,data){
  localStorage.setItem(keyFor(branch,year,month),JSON.stringify(data));
}

// Collect all years that have data
function allYears(){
  const ys=new Set();
  ys.add(now.getFullYear());
  for(let k in localStorage){
    if(!k.startsWith('biz2_'))continue;
    const parts=k.split('_');
    if(parts.length>=4)ys.add(parseInt(parts[3]));
  }
  return [...ys].sort((a,b)=>b-a);
}

// Get all docs across all months of a year for both branches (or one)
function docsForYear(type,year,branch){
  const branches=branch?[branch]:['khonkaen','ubon'];
  const result=[];
  branches.forEach(br=>{
    for(let m=0;m<12;m++){
      const d=loadFor(br,year,m);
      (d[type]||[]).forEach(x=>result.push({...x,branch:br,_month:m,_year:year}));
    }
  });
  return result;
}

// Get docs for a specific branch+year+month (or all months)
function docsFor(type,branch,year,month){
  const branches=branch?[branch]:['khonkaen','ubon'];
  const result=[];
  const months=(month===''||month===undefined||month===null)?Array.from({length:12},(_,i)=>i):[parseInt(month)];
  branches.forEach(br=>{
    months.forEach(m=>{
      const d=loadFor(br,year,m);
      (d[type]||[]).forEach(x=>result.push({...x,branch:br,_month:m,_year:year}));
    });
  });
  return result;
}

// ============================================================
// INIT — populate year/month dropdowns
// ============================================================
function initDropdowns(){
  const years=allYears();
  // Dashboard
  populateYearSel('dash-year',years);
  populateMonthSel('dash-month',true);
  // Lists
  ['ql','il','rl','el','pl'].forEach(p=>{
    populateYearSel(p+'-year',years);
    populateMonthSel(p+'-month',false);
  });
  // Default current year/month
  ['dash-year','ql-year','il-year','rl-year','el-year','pl-year'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.value=now.getFullYear();
  });
  ['ql-month','il-month','rl-month','el-month','pl-month'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.value='';
  });
  document.getElementById('dash-month').value=-1;
}

function populateYearSel(id,years){
  const el=document.getElementById(id);if(!el)return;
  el.innerHTML='';
  years.forEach(y=>{const o=document.createElement('option');o.value=y;o.textContent=y+' ('+(y+543)+')';el.appendChild(o);});
}

function populateMonthSel(id,hasAll){
  const el=document.getElementById(id);if(!el)return;
  const cur=el.value;
  el.innerHTML='';
  if(hasAll){const o=document.createElement('option');o.value=-1;o.textContent='ทุกเดือน';el.appendChild(o);}
  else{const o=document.createElement('option');o.value='';o.textContent='ทุกเดือน';el.appendChild(o);}
  MONTHS.forEach((m,i)=>{const o=document.createElement('option');o.value=i;o.textContent=m;el.appendChild(o);});
  el.value=cur;
}

function onYearChange(){
  // Refresh year dropdowns with any newly found years
  const years=allYears();
  ['dash-year','ql-year','il-year','rl-year','el-year','pl-year'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    const cur=el.value;
    populateYearSel(id,years);
    el.value=cur;
  });
}

// ============================================================
// NAVIGATION
// ============================================================
function go(id,el){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  el.classList.add('active');
  const m={dashboard:renderDash,'quote-list':renderQLList,'invoice-list':renderIList,'receipt-list':()=>{populateInvRefs();renderRList();},'expense-list':renderEList,'production-list':renderPList,'receipt-form':populateInvRefs};
  if(m[id])m[id]();
}

// ============================================================
// BRANCH SELECTOR IN FORMS
// ============================================================
function selBr(form,b){
  formBranch[form]=b;
  document.getElementById(form+'-br-kk').className='br-opt'+(b==='khonkaen'?' kk-sel':'');
  document.getElementById(form+'-br-ub').className='br-opt'+(b==='ubon'?' ub-sel':'');
  document.getElementById(form+'-br-warn').classList.remove('show');
  if(form==='r')populateInvRefs();
}
function getBr(form){
  if(!formBranch[form]){document.getElementById(form+'-br-warn').classList.add('show');return null;}
  return formBranch[form];
}

// ============================================================
// DASHBOARD
// ============================================================
function switchDashTab(t){
  dashTab=t;
  ['all','khonkaen','ubon'].forEach(x=>{
    document.getElementById('dt-'+(x==='khonkaen'?'kk':x==='ubon'?'ub':'all')).classList.toggle('active',x===t);
  });
  renderDash();
}

function branchStats(branch,year,monthVal){
  const months=monthVal===-1?Array.from({length:12},(_,i)=>i):[monthVal];
  let st=0,ct=0,cm=0,ex=0,qc=0,ic=0;
  months.forEach(m=>{
    const d=loadFor(branch,year,m);
    st+=d.invoices.reduce((s,e)=>s+(e.saleTotal||0),0);
    ct+=d.invoices.reduce((s,e)=>s+(e.costTotal||0),0);
    cm+=d.invoices.reduce((s,e)=>s+(e.commAmt||0),0);
    ex+=d.expenses.reduce((s,e)=>s+(e.amount||0),0);
    qc+=d.quotes.length; ic+=d.invoices.length;
  });
  return{st,ct,cm,ex,net:st-ct-cm-ex,qc,ic};
}

function renderDash(){
  const year=parseInt(document.getElementById('dash-year').value||now.getFullYear());
  const mVal=parseInt(document.getElementById('dash-month').value);
  const mLabel=mVal===-1?'ทุกเดือน':MONTHS[mVal];
  document.getElementById('dash-badge').textContent=mLabel+' '+year+' ('+(year+543)+')';
  document.getElementById('topbar-ctx').textContent=mLabel+' '+year;

  const kk=branchStats('khonkaen',year,mVal);
  const ub=branchStats('ubon',year,mVal);

  if(dashTab==='all'){
    document.getElementById('dash-combined').style.display='';
    document.getElementById('dash-single').style.display='none';
    const tSt=kk.st+ub.st,tCt=kk.ct+ub.ct,tCm=kk.cm+ub.cm,tEx=kk.ex+ub.ex,tNet=kk.net+ub.net;
    document.getElementById('metrics-total').innerHTML=
      mc('ยอดขายรวม 2 สาขา',fmt(tSt),'บาท','var(--blue)')+
      mc('ต้นทุนรวม',fmt(tCt),'บาท','var(--amber)')+
      mc('ค่าคอมมิสชัน',fmt(tCm),'บาท','var(--g2)')+
      mc('ค่าใช้จ่าย',fmt(tEx),'บาท','var(--red)')+
      mc('กำไรสุทธิรวม',fmt(tNet),'บาท',tNet>=0?'var(--green)':'var(--red)',tNet>=0?'var(--green-bd)':'var(--red-bd)');
    document.getElementById('dash-kk-rows').innerHTML=bRows(kk);
    document.getElementById('dash-ub-rows').innerHTML=bRows(ub);
  } else {
    document.getElementById('dash-combined').style.display='none';
    document.getElementById('dash-single').style.display='';
    const s=dashTab==='khonkaen'?kk:ub;
    const label=BRANCH_TH[dashTab];
    document.getElementById('metrics-single').innerHTML=
      mc(label+' — ยอดขาย',fmt(s.st),'บาท','var(--blue)')+
      mc('ต้นทุน',fmt(s.ct),'บาท','var(--amber)')+
      mc('ค่าคอมมิสชัน',fmt(s.cm),'บาท','var(--g2)')+
      mc('ค่าใช้จ่าย',fmt(s.ex),'บาท','var(--red)')+
      mc('กำไรสุทธิ',fmt(s.net),'บาท',s.net>=0?'var(--green)':'var(--red)',s.net>=0?'var(--green-bd)':'var(--red-bd)');
  }

  // Recent docs
  const branches=dashTab==='all'?['khonkaen','ubon']:[dashTab];
  let allQ=[],allI=[];
  const mList=mVal===-1?Array.from({length:12},(_,i)=>i):[mVal];
  branches.forEach(br=>mList.forEach(m=>{
    const d=loadFor(br,year,m);
    allQ.push(...d.quotes.map(x=>({...x,branch:br})));
    allI.push(...d.invoices.map(x=>({...x,branch:br})));
  }));
  allQ.sort((a,b)=>b.id-a.id);allI.sort((a,b)=>b.id-a.id);

  document.getElementById('dash-quotes').innerHTML=allQ.slice(0,5).map(q=>
    `<div style="display:flex;align-items:center;gap:6px;padding:7px 0;border-bottom:1px solid var(--g4);font-size:13px">
      <div style="flex:1"><div>${q.no} ${bbr(q.branch)}</div><div style="font-size:11px;color:var(--g3)">${q.customer}</div></div>
      <span class="badge ${q.approved?'b-green':'b-amber'}">${q.approved?'อนุมัติ':'รอ'}</span>
      <span class="badge b-purple">฿${fmt(q.total)}</span>
    </div>`).join('')||'<div class="empty" style="padding:1rem">ยังไม่มีข้อมูล</div>';

  document.getElementById('dash-invs').innerHTML=allI.slice(0,5).map(i=>
    `<div style="display:flex;align-items:center;gap:6px;padding:7px 0;border-bottom:1px solid var(--g4);font-size:13px">
      <div style="flex:1"><div>${i.no} ${bbr(i.branch)}</div><div style="font-size:11px;color:var(--g3)">${i.customer}</div></div>
      <span class="badge b-green">฿${fmt(i.saleTotal)}</span>
    </div>`).join('')||'<div class="empty" style="padding:1rem">ยังไม่มีข้อมูล</div>';
}

function mc(lbl,val,sub,color,bc){return`<div class="mc" ${bc?`style="border-color:${bc}"`:''}><div class="lbl">${lbl}</div><div class="val" style="color:${color||'var(--g)'}">${val}</div><div class="sub">${sub}</div></div>`;}
function bRows(s){return`
  <div class="brow"><span>ยอดขาย</span><span style="color:var(--blue);font-weight:600">฿${fmt(s.st)}</span></div>
  <div class="brow"><span>ต้นทุน</span><span style="color:var(--amber)">฿${fmt(s.ct)}</span></div>
  <div class="brow"><span>ค่าคอมมิสชัน</span><span>฿${fmt(s.cm)}</span></div>
  <div class="brow"><span>ค่าใช้จ่าย</span><span style="color:var(--red)">฿${fmt(s.ex)}</span></div>
  <div class="brow"><span>กำไรสุทธิ</span><span class="${s.net>=0?'pos':'neg'}">฿${fmt(s.net)}</span></div>`;}
function bbr(b){return b?`<span class="badge ${b==='khonkaen'?'b-kk':'b-ub'}">${b==='khonkaen'?'ขอนแก่น':'อุบล'}</span>`:'';}

// ============================================================
// FILE ATTACH
// ============================================================
function handleFiles(k,inp){
  if(!attachedFiles[k])attachedFiles[k]=[];
  Array.from(inp.files).forEach(f=>{
    const rd=new FileReader();
    rd.onload=ev=>{attachedFiles[k].push({name:f.name,type:f.type,data:ev.target.result});renderPrev(k);};
    rd.readAsDataURL(f);
  });
}
function renderPrev(k){
  const el=document.getElementById(k);if(!el)return;
  el.innerHTML=(attachedFiles[k]||[]).map((f,i)=>`
    <div class="fthumb">
      ${f.type.startsWith('image/')
        ?`<img src="${f.data}" alt="${f.name}" onclick="viewFile('${k}',${i})" title="คลิกดูรูป">`
        :`<div class="pdf-icon" onclick="viewFile('${k}',${i})" title="คลิกเปิด PDF"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>PDF<span style="font-size:9px;font-weight:400">${f.name.substring(0,10)}</span></div>`}
      <button class="rm" onclick="rmFile('${k}',${i})">×</button>
    </div>`).join('');
}
function rmFile(k,i){attachedFiles[k].splice(i,1);renderPrev(k);}
function viewFile(k,i){
  const f=(attachedFiles[k]||[])[i];if(!f)return;
  if(f.type==='application/pdf'){const w=window.open();w.document.write(`<iframe src="${f.data}" style="width:100%;height:100vh;border:none"></iframe>`);}
  else{const w=window.open();w.document.write(`<img src="${f.data}" style="max-width:100%">`);}
}

// ============================================================
// ITEMS TABLE HELPERS
// ============================================================
function uSel(v){return`<select style="width:82px">${UNITS.map(u=>`<option${u===v?' selected':''}>${u}</option>`).join('')}</select>`;}
function addQItem(){const tb=document.getElementById('q-items-body');const tr=document.createElement('tr');tr.innerHTML=`<td><input type="text" placeholder="ชื่อสินค้า"></td><td><input type="number" min="0" placeholder="0" oninput="calcQ()" style="width:55px"></td><td>${uSel('')}</td><td><input type="number" min="0" step="0.01" placeholder="0.00" oninput="calcQ()"></td><td><input class="ro" readonly></td><td><button onclick="this.closest('tr').remove();calcQ()" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:16px">×</button></td>`;tb.appendChild(tr);}
function addIItem(){const tb=document.getElementById('i-items-body');const tr=document.createElement('tr');tr.innerHTML=`<td><input type="text" placeholder="ชื่อสินค้า"></td><td><input type="number" min="0" placeholder="0" oninput="calcI()" style="width:55px"></td><td>${uSel('')}</td><td><input type="number" min="0" step="0.01" placeholder="0.00" oninput="calcI()"></td><td><input type="number" min="0" step="0.01" placeholder="0.00" oninput="calcI()"></td><td><input class="ro" readonly></td><td><input class="ro" readonly></td><td><button onclick="this.closest('tr').remove();calcI()" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:16px">×</button></td>`;tb.appendChild(tr);}
function addRItem(p,q,u,pu,cu){const tb=document.getElementById('r-items-body');const tr=document.createElement('tr');tr.innerHTML=`<td><input type="text" value="${p||''}" placeholder="ชื่อสินค้า"></td><td><input type="number" min="0" value="${q||''}" placeholder="0" oninput="calcR()" style="width:55px"></td><td>${uSel(u||'')}</td><td><input type="number" min="0" step="0.01" value="${pu||''}" placeholder="0.00" oninput="calcR()"></td><td><input class="ro" readonly></td><td><input type="number" min="0" step="0.01" value="${cu||''}" placeholder="0.00" oninput="calcR()"></td><td><button onclick="this.closest('tr').remove();calcR()" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:16px">×</button></td>`;tb.appendChild(tr);calcR();}

// ============================================================
// CALC
// ============================================================
function calcQ(){let sub=0;document.querySelectorAll('#q-items-body tr').forEach(tr=>{const ins=tr.querySelectorAll('input[type=number]');const qty=parseFloat(ins[0]?.value)||0,pu=parseFloat(ins[1]?.value)||0,t=qty*pu;sub+=t;const ro=tr.querySelector('input.ro');if(ro)ro.value=t?fmt(t):'';});const uv=parseInt(document.getElementById('q-vat').value),va=uv?sub*.07:0;document.getElementById('q-sub').value=sub?fmt(sub):'';document.getElementById('q-vat-amt').value=va?fmt(va):'';document.getElementById('q-total').value=(sub+va)?fmt(sub+va):'';}
function calcI(){let st=0,ct=0;document.querySelectorAll('#i-items-body tr').forEach(tr=>{const ins=tr.querySelectorAll('input[type=number]');const qty=parseFloat(ins[0]?.value)||0,cu=parseFloat(ins[1]?.value)||0,pu=parseFloat(ins[2]?.value)||0,s=qty*pu,c=qty*cu;st+=s;ct+=c;const ros=tr.querySelectorAll('input.ro');if(ros[0])ros[0].value=s?fmt(s):'';if(ros[1])ros[1].value=c?fmt(c):'';});const cr=parseFloat(document.getElementById('i-cr').value)||0,comm=st*cr/100,pf=st-ct-comm;document.getElementById('i-st').value=st?fmt(st):'';document.getElementById('i-ct').value=ct?fmt(ct):'';document.getElementById('i-ca').value=comm?fmt(comm):'';document.getElementById('i-pf').value=(st||ct)?fmt(pf):'';document.getElementById('i-pf').style.color=pf<0?'var(--red)':'var(--green)';}
function calcR(){let st=0,ct=0;document.querySelectorAll('#r-items-body tr').forEach(tr=>{const ins=tr.querySelectorAll('input[type=number]');const qty=parseFloat(ins[0]?.value)||0,pu=parseFloat(ins[1]?.value)||0,cu=parseFloat(ins[2]?.value)||0,s=qty*pu,c=qty*cu;st+=s;ct+=c;const ro=tr.querySelector('input.ro');if(ro)ro.value=s?fmt(s):'';});const cr=parseFloat(document.getElementById('r-cr').value)||0,comm=st*cr/100,pf=st-ct-comm;document.getElementById('r-st').value=st?fmt(st):'';document.getElementById('r-ct').value=ct?fmt(ct):'';document.getElementById('r-ca').value=comm?fmt(comm):'';document.getElementById('r-pf').value=(st||ct)?fmt(pf):'';document.getElementById('r-pf').style.color=pf<0?'var(--red)':'var(--green)';}

// ============================================================
// GET ITEMS FROM TABLE
// ============================================================
function getQItems(){return Array.from(document.querySelectorAll('#q-items-body tr')).map(tr=>{const ins=tr.querySelectorAll('input');const sel=tr.querySelector('select');const qty=parseFloat(ins[1]?.value)||0,pu=parseFloat(ins[2]?.value)||0;return{product:ins[0]?.value||'',qty,unit:sel?.value||'',priceUnit:pu,total:qty*pu};});}
function getIItems(){return Array.from(document.querySelectorAll('#i-items-body tr')).map(tr=>{const ins=tr.querySelectorAll('input[type=number]');const sel=tr.querySelector('select');const qty=parseFloat(ins[0]?.value)||0,cu=parseFloat(ins[1]?.value)||0,pu=parseFloat(ins[2]?.value)||0;const p=tr.querySelector('input[type=text]');return{product:p?.value||'',qty,unit:sel?.value||'',costUnit:cu,priceUnit:pu,saleTotal:qty*pu,costTotal:qty*cu};});}
function getRItems(){return Array.from(document.querySelectorAll('#r-items-body tr')).map(tr=>{const ins=tr.querySelectorAll('input[type=number]');const sel=tr.querySelector('select');const qty=parseFloat(ins[0]?.value)||0,pu=parseFloat(ins[1]?.value)||0,cu=parseFloat(ins[2]?.value)||0;const p=tr.querySelector('input[type=text]');return{product:p?.value||'',qty,unit:sel?.value||'',priceUnit:pu,saleTotal:qty*pu,costUnit:cu};});}

// ============================================================

// ============================================================
// PRODUCTION ORDER — ฟอร์มสั่งผลิตสินค้า
// ============================================================
function addPItem(qty='',cost=''){
  const tb=document.getElementById('p-items-body');if(!tb)return;
  const tr=document.createElement('tr');
  tr.innerHTML=`
    <td class="tn p-row-no"></td>
    <td><input type="number" min="0" step="1" value="${qty}" placeholder="0" oninput="calcP()"></td>
    <td><input type="number" min="0" step="0.01" value="${cost}" placeholder="0.00" oninput="calcP()"></td>
    <td><input class="ro" readonly></td>
    <td><input class="ro" readonly></td>
    <td><input class="ro readonly-big" readonly></td>
    <td><button class="btn btn-danger btn-sm" onclick="this.closest('tr').remove();calcP()">ลบ</button></td>`;
  tb.appendChild(tr);calcP();
}
function calcP(){
  const useVat=parseInt(document.querySelector('input[name="p-vat"]:checked')?.value||0);
  let subTotal=0,vatTotal=0,totalAll=0;
  document.querySelectorAll('#p-items-body tr').forEach((tr,idx)=>{
    const nums=tr.querySelectorAll('input[type=number]');
    const outs=tr.querySelectorAll('input.ro');
    const qty=parseFloat(nums[0]?.value)||0;
    const cost=parseFloat(nums[1]?.value)||0;
    const sub=qty*cost;
    const vat=useVat?sub*0.07:0;
    const total=sub+vat;
    const no=tr.querySelector('.p-row-no');if(no)no.textContent=idx+1;
    if(outs[0])outs[0].value=fmt(sub);
    if(outs[1])outs[1].value=fmt(vat);
    if(outs[2])outs[2].value=fmt(total);
    subTotal+=sub;vatTotal+=vat;totalAll+=total;
  });
  const subEl=document.getElementById('p-sub-total'),vatEl=document.getElementById('p-vat-total'),totalEl=document.getElementById('p-total');
  if(subEl)subEl.value=fmt(subTotal);if(vatEl)vatEl.value=fmt(vatTotal);if(totalEl)totalEl.value=fmt(totalAll);
  return{sub:subTotal,vat:vatTotal,total:totalAll,useVat};
}
function getPItems(){
  return Array.from(document.querySelectorAll('#p-items-body tr')).map(tr=>{
    const nums=tr.querySelectorAll('input[type=number]');
    const qty=parseFloat(nums[0]?.value)||0;
    const cost=parseFloat(nums[1]?.value)||0;
    const sub=qty*cost;
    const useVat=parseInt(document.querySelector('input[name="p-vat"]:checked')?.value||0);
    const vat=useVat?sub*0.07:0;
    return{qty,costUnit:cost,subtotal:sub,vatAmt:vat,total:sub+vat};
  }).filter(x=>x.qty>0||x.costUnit>0);
}
function saveProduction(){
  const b=getBr('p');if(!b)return;
  const no=document.getElementById('p-no').value.trim(),date=document.getElementById('p-date').value,maker=document.getElementById('p-maker').value.trim(),cust=document.getElementById('p-cust').value.trim(),job=document.getElementById('p-job').value.trim();
  const items=getPItems();
  if(!no||!date||!maker||!cust||!job||!items.length){alert('กรุณากรอกเลขที่, วันที่, ผู้รับผลิต, ลูกค้า, ชื่องาน และรายการสินค้าที่สั่งผลิต');return;}
  if(items.some(x=>!x.qty||!x.costUnit)){alert('กรุณากรอกจำนวนและราคาต้นทุนต่อหน่วยให้ครบทุกแถว');return;}
  const totals=calcP();const{year,month}=dateToYM(date);const d=loadFor(b,year,month);if(!d.productions)d.productions=[];
  const productionRecord={
    id:Date.now(),no,date,maker,customer:cust,job,items,
    qty:items.reduce((s,x)=>s+x.qty,0),
    costUnit:items.length===1?items[0].costUnit:0,
    subtotal:totals.sub,useVat:totals.useVat,vatAmt:totals.vat,total:totals.total,
    note:document.getElementById('p-note').value.trim(),
    attachments:attachedFiles['p-att']||[]
  };
  d.productions.push(productionRecord);
  saveFor(b,year,month,d);

  // Firebase optional: ถ้าเปิด js/firebase-bridge.js แล้ว จะบันทึกขึ้น Cloud เพิ่มด้วย
  if(window.FirebaseService?.saveProduction){
    window.FirebaseService.saveProduction({...productionRecord,branch:b,year,month})
      .catch(err=>console.error('Firebase saveProduction error:',err));
  }

  attachedFiles['p-att']=[];renderPrev('p-att');resetProduction();onYearChange();renderDash();alert('บันทึกสั่งผลิตสินค้าเรียบร้อย!');
}
function resetProduction(){
  formBranch.p=null;['p-br-kk','p-br-ub'].forEach(id=>{const el=document.getElementById(id);if(el)el.className='br-opt';});document.getElementById('p-br-warn')?.classList.remove('show');
  ['p-no','p-maker','p-cust','p-job','p-sub-total','p-vat-total','p-total','p-note'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const date=document.getElementById('p-date');if(date)date.value=todayStr;
  const vat=document.querySelector('input[name="p-vat"][value="1"]');if(vat)vat.checked=true;
  attachedFiles['p-att']=[];renderPrev('p-att');
  const tb=document.getElementById('p-items-body');if(tb)tb.innerHTML='';addPItem(1,'');calcP();
}
function renderPList(){
  const{branch,month,year,search}=getListFilters('pl');const mVal=month===''?null:parseInt(month);const branches=branch?[branch]:['khonkaen','ubon'];let all=[];const mList=mVal===null?Array.from({length:12},(_,i)=>i):[mVal];
  branches.forEach(br=>mList.forEach(m=>{const d=loadFor(br,year,m);(d.productions||[]).forEach(x=>all.push({...x,branch:br,_m:m,_y:year}));}));
  all.sort((a,b)=>b.id-a.id);if(search)all=all.filter(p=>(p.no||'').toLowerCase().includes(search)||(p.job||'').toLowerCase().includes(search)||(p.customer||'').toLowerCase().includes(search));
  const empty=document.getElementById('pempty'),tbl=document.getElementById('ptbl');if(!tbl)return;empty.style.display=all.length?'none':'block';
  tbl.innerHTML=all.map(p=>`<tr><td><span class="badge b-blue">${p.no}</span></td><td>${bbr(p.branch)}</td><td>${p.date}</td><td>${p.maker||'-'}</td><td>${p.customer||'-'}</td><td>${p.job||'-'}</td><td class="tn">${fmt(p.qty)}</td><td class="tn">฿${fmt(p.costUnit)}</td><td class="tn"><b>฿${fmt(p.total)}</b></td><td>${p.useVat?'รวม VAT':'ไม่รวม VAT'}</td><td style="display:flex;gap:4px"><button class="btn btn-view btn-sm" onclick='showDetail("production",${JSON.stringify(p).replace(/'/g,"\\'")})'>ดู</button><button class="btn btn-danger btn-sm" onclick="delDoc('${p.branch}',${p._y},${p._m},'productions',${p.id})">ลบ</button></td></tr>`).join('');
}

// SAVE
// ============================================================
function dateToYM(dateStr){const d=new Date(dateStr);return{year:d.getFullYear(),month:d.getMonth()};}

function saveQuote(){
  const b=getBr('q');if(!b)return;
  const no=document.getElementById('q-no').value.trim(),date=document.getElementById('q-date').value,cust=document.getElementById('q-cust').value.trim();
  if(!no||!date||!cust){alert('กรุณากรอกเลขที่, วันที่ และชื่อลูกค้า');return;}
  const items=getQItems();if(!items.length){alert('กรุณาเพิ่มรายการสินค้า');return;}
  const sub=items.reduce((s,i)=>s+i.total,0),uv=parseInt(document.getElementById('q-vat').value),va=uv?sub*.07:0;
  const{year,month}=dateToYM(date);
  const d=loadFor(b,year,month);
  d.quotes.push({id:Date.now(),no,date,customer:cust,salesPerson:document.getElementById('q-sales').value.trim(),items,subtotal:sub,useVat:uv,vatAmt:va,total:sub+va,note:document.getElementById('q-note').value.trim(),attachments:attachedFiles['q-att']||[],approved:false});
  saveFor(b,year,month,d);attachedFiles['q-att']=[];renderPrev('q-att');resetF('quote');onYearChange();renderDash();alert('บันทึกใบเสนอราคาเรียบร้อย!');
}

function saveInvoice(){
  const b=getBr('i');if(!b)return;
  const no=document.getElementById('i-no').value.trim(),date=document.getElementById('i-date').value,cust=document.getElementById('i-cust').value.trim();
  if(!no||!date||!cust){alert('กรุณากรอกเลขที่บิล, วันที่ และชื่อลูกค้า');return;}
  const items=getIItems();if(!items.length){alert('กรุณาเพิ่มรายการสินค้า');return;}
  const st=items.reduce((s,i)=>s+i.saleTotal,0),ct=items.reduce((s,i)=>s+i.costTotal,0);
  const cr=parseFloat(document.getElementById('i-cr').value)||0,comm=st*cr/100;
  const{year,month}=dateToYM(date);
  const d=loadFor(b,year,month);
  d.invoices.push({id:Date.now(),no,date,customer:cust,salesPerson:document.getElementById('i-sales').value.trim(),items,saleTotal:st,costTotal:ct,commRate:cr,commAmt:comm,profit:st-ct-comm,note:document.getElementById('i-note').value.trim(),attachments:attachedFiles['i-att']||[]});
  saveFor(b,year,month,d);attachedFiles['i-att']=[];renderPrev('i-att');resetF('invoice');onYearChange();renderDash();alert('บันทึกบิลใบส่งสินค้าเรียบร้อย!');
}

function saveReceipt(){
  const b=getBr('r');if(!b)return;
  const no=document.getElementById('r-no').value.trim(),date=document.getElementById('r-date').value,cust=document.getElementById('r-cust').value.trim();
  if(!no||!date||!cust){alert('กรุณากรอกเลขที่, วันที่ และชื่อลูกค้า');return;}
  const items=getRItems(),st=items.reduce((s,i)=>s+i.saleTotal,0),ct=items.reduce((s,i)=>s+(i.costUnit||0)*(i.qty||0),0);
  const cr=parseFloat(document.getElementById('r-cr').value)||0,comm=st*cr/100;
  const{year,month}=dateToYM(date);
  const d=loadFor(b,year,month);
  d.receipts.push({id:Date.now(),no,date,invNo:document.getElementById('r-inv-no').value.trim()||document.getElementById('r-inv-ref').value,salesPerson:document.getElementById('r-sales').value.trim(),customer:cust,items,saleTotal:st,costTotal:ct,commRate:cr,commAmt:comm,profit:st-ct-comm,note:document.getElementById('r-note').value.trim()});
  saveFor(b,year,month,d);resetF('receipt');onYearChange();renderDash();alert('บันทึกใบเสร็จรับเงินเรียบร้อย!');
}

function saveExpense(){
  const b=getBr('e');if(!b)return;
  const date=document.getElementById('e-date').value,desc=document.getElementById('e-desc').value.trim(),amount=parseFloat(document.getElementById('e-amount').value)||0;
  if(!date||!desc||!amount){alert('กรุณากรอกวันที่, รายละเอียด และจำนวนเงิน');return;}
  const{year,month}=dateToYM(date);
  const d=loadFor(b,year,month);
  d.expenses.push({id:Date.now(),date,cat:document.getElementById('e-cat').value,desc,amount,by:document.getElementById('e-by').value.trim(),note:document.getElementById('e-note').value.trim()});
  saveFor(b,year,month,d);resetF('expense');onYearChange();renderDash();alert('บันทึกค่าใช้จ่ายเรียบร้อย!');
}

// ============================================================
// RESET FORMS
// ============================================================
function resetF(t){
  const f=t[0];formBranch[f]=null;
  document.getElementById(f+'-br-kk').className='br-opt';
  document.getElementById(f+'-br-ub').className='br-opt';
  document.getElementById(f+'-br-warn').classList.remove('show');
  if(t==='quote'){['q-no','q-cust','q-sales','q-note'].forEach(id=>document.getElementById(id).value='');document.getElementById('q-date').value=todayStr;document.getElementById('q-items-body').innerHTML='';['q-sub','q-vat-amt','q-total'].forEach(id=>document.getElementById(id).value='');attachedFiles['q-att']=[];renderPrev('q-att');}
  if(t==='invoice'){['i-no','i-cust','i-sales','i-cr','i-note'].forEach(id=>document.getElementById(id).value='');document.getElementById('i-date').value=todayStr;document.getElementById('i-items-body').innerHTML='';['i-st','i-ct','i-ca','i-pf'].forEach(id=>document.getElementById(id).value='');attachedFiles['i-att']=[];renderPrev('i-att');}
  if(t==='receipt'){['r-no','r-cust','r-sales','r-inv-no','r-cr','r-note'].forEach(id=>document.getElementById(id).value='');document.getElementById('r-date').value=todayStr;document.getElementById('r-items-body').innerHTML='';['r-st','r-ct','r-ca','r-pf'].forEach(id=>document.getElementById(id).value='');}
  if(t==='expense'){['e-desc','e-by','e-note'].forEach(id=>document.getElementById(id).value='');document.getElementById('e-amount').value='';document.getElementById('e-date').value=todayStr;}
}

// ============================================================
// POPULATE INVOICE REFS (for receipt form)
// ============================================================
function populateInvRefs(){
  const sel=document.getElementById('r-inv-ref');sel.innerHTML='<option value="">-- เลือกจากบิลที่มี --</option>';
  const br=formBranch['r'];
  const branches=br?[br]:['khonkaen','ubon'];
  const years=allYears();
  branches.forEach(b=>years.forEach(y=>{for(let m=0;m<12;m++){const d=loadFor(b,y,m);(d.invoices||[]).forEach(inv=>{const o=document.createElement('option');o.value=JSON.stringify({b,y,m,no:inv.no});o.textContent=`[${BRANCH_TH[b]}] ${inv.no} | ${inv.customer} | ${inv.date}`;sel.appendChild(o);});}}));
}
function fillFromInv(){
  const val=document.getElementById('r-inv-ref').value;if(!val)return;
  const{b,y,m,no}=JSON.parse(val);
  const d=loadFor(b,y,m);const inv=d.invoices.find(i=>i.no===no);if(!inv)return;
  selBr('r',b);
  document.getElementById('r-inv-no').value=inv.no;
  document.getElementById('r-cust').value=inv.customer;
  document.getElementById('r-sales').value=inv.salesPerson||'';
  document.getElementById('r-cr').value=inv.commRate||'';
  document.getElementById('r-items-body').innerHTML='';
  (inv.items||[]).forEach(it=>addRItem(it.product,it.qty,it.unit,it.priceUnit,it.costUnit));
}

// ============================================================
// RENDER LISTS (with search filters)
// ============================================================
function getListFilters(prefix){
  return{
    branch:document.getElementById(prefix+'-br')?.value||'',
    month:document.getElementById(prefix+'-month')?.value,
    year:parseInt(document.getElementById(prefix+'-year')?.value||now.getFullYear()),
    search:(document.getElementById(prefix+'-search')?.value||'').toLowerCase()
  };
}

function renderQLList(){
  const{branch,month,year,search}=getListFilters('ql');
  const mVal=month===''?null:parseInt(month);
  const branches=branch?[branch]:['khonkaen','ubon'];
  let all=[];
  const mList=mVal===null?Array.from({length:12},(_,i)=>i):[mVal];
  branches.forEach(br=>mList.forEach(m=>{const d=loadFor(br,year,m);(d.quotes||[]).forEach(x=>all.push({...x,branch:br,_m:m,_y:year}));}));
  all.sort((a,b)=>b.id-a.id);
  if(search)all=all.filter(q=>q.no.toLowerCase().includes(search)||q.customer.toLowerCase().includes(search));
  document.getElementById('qempty').style.display=all.length?'none':'block';
  document.getElementById('qtbl').innerHTML=all.map(q=>`<tr>
    <td><span class="badge b-purple">${q.no}</span></td>
    <td>${bbr(q.branch)}</td><td>${q.date}</td><td>${q.customer}</td><td>${q.salesPerson||'-'}</td>
    <td class="tn">฿${fmt(q.total)}</td>
    <td>${q.useVat?'<span class="badge b-blue">มี VAT</span>':'<span class="badge b-gray">ไม่มี</span>'}</td>
    <td>${q.approved?'<span class="qs-approved">✅ อนุมัติแล้ว</span>':'<span class="qs-pending">⏳ รอ</span>'}</td>
    <td><label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px"><input type="checkbox" ${q.approved?'checked':''} onchange="toggleApprove('${q.branch}',${q._y},${q._m},${q.id},this.checked)"> อนุมัติ</label></td>
    <td style="display:flex;gap:4px">
      <button class="btn btn-view btn-sm" onclick='showDetail("quote",${JSON.stringify(q).replace(/'/g,"\\'")})'><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
      <button class="btn btn-danger btn-sm" onclick="delDoc('${q.branch}',${q._y},${q._m},'quotes',${q.id})">ลบ</button>
    </td>
  </tr>`).join('');
}

function toggleApprove(br,y,m,id,val){const d=loadFor(br,y,m);const f=d.quotes.find(q=>q.id===id);if(f){f.approved=val;saveFor(br,y,m,d);renderQLList();renderDash();}}

function renderIList(){
  const{branch,month,year,search}=getListFilters('il');
  const mVal=month===''?null:parseInt(month);
  const branches=branch?[branch]:['khonkaen','ubon'];
  let all=[];
  const mList=mVal===null?Array.from({length:12},(_,i)=>i):[mVal];
  branches.forEach(br=>mList.forEach(m=>{const d=loadFor(br,year,m);(d.invoices||[]).forEach(x=>all.push({...x,branch:br,_m:m,_y:year}));}));
  all.sort((a,b)=>b.id-a.id);
  if(search)all=all.filter(i=>i.no.toLowerCase().includes(search)||i.customer.toLowerCase().includes(search));
  document.getElementById('iempty').style.display=all.length?'none':'block';
  document.getElementById('itbl').innerHTML=all.map(inv=>`<tr>
    <td><span class="badge b-green">${inv.no}</span></td>
    <td>${bbr(inv.branch)}</td><td>${inv.date}</td><td>${inv.customer}</td><td>${inv.salesPerson||'-'}</td>
    <td class="tn">฿${fmt(inv.saleTotal)}</td><td class="tn">฿${fmt(inv.costTotal)}</td>
    <td class="tn">฿${fmt(inv.commAmt)}</td>
    <td class="tn ${inv.profit>=0?'pos':'neg'}">฿${fmt(inv.profit)}</td>
    <td style="display:flex;gap:4px">
      <button class="btn btn-view btn-sm" onclick='showDetail("invoice",${JSON.stringify(inv).replace(/'/g,"\\'")})'><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
      <button class="btn btn-danger btn-sm" onclick="delDoc('${inv.branch}',${inv._y},${inv._m},'invoices',${inv.id})">ลบ</button>
    </td>
  </tr>`).join('');
}

function renderRList(){
  const{branch,month,year,search}=getListFilters('rl');
  const mVal=month===''?null:parseInt(month);
  const branches=branch?[branch]:['khonkaen','ubon'];
  let all=[];
  const mList=mVal===null?Array.from({length:12},(_,i)=>i):[mVal];
  branches.forEach(br=>mList.forEach(m=>{const d=loadFor(br,year,m);(d.receipts||[]).forEach(x=>all.push({...x,branch:br,_m:m,_y:year}));}));
  all.sort((a,b)=>b.id-a.id);
  if(search)all=all.filter(r=>r.no.toLowerCase().includes(search)||r.customer.toLowerCase().includes(search));
  document.getElementById('rempty').style.display=all.length?'none':'block';
  document.getElementById('rtbl').innerHTML=all.map(r=>`<tr>
    <td><span class="badge b-blue">${r.no}</span></td>
    <td>${bbr(r.branch)}</td><td>${r.date}</td><td>${r.invNo||'-'}</td><td>${r.customer}</td><td>${r.salesPerson||'-'}</td>
    <td class="tn">฿${fmt(r.saleTotal)}</td>
    <td class="tn ${r.profit>=0?'pos':'neg'}">฿${fmt(r.profit)}</td>
    <td style="display:flex;gap:4px">
      <button class="btn btn-view btn-sm" onclick='showDetail("receipt",${JSON.stringify(r).replace(/'/g,"\\'")})'><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
      <button class="btn btn-danger btn-sm" onclick="delDoc('${r.branch}',${r._y},${r._m},'receipts',${r.id})">ลบ</button>
    </td>
  </tr>`).join('');
}

function renderEList(){
  const{branch,month,year}=getListFilters('el');
  const mVal=month===''?null:parseInt(month);
  const branches=branch?[branch]:['khonkaen','ubon'];
  let all=[];
  const mList=mVal===null?Array.from({length:12},(_,i)=>i):[mVal];
  branches.forEach(br=>mList.forEach(m=>{const d=loadFor(br,year,m);(d.expenses||[]).forEach(x=>all.push({...x,branch:br,_m:m,_y:year}));}));
  all.sort((a,b)=>b.id-a.id);
  document.getElementById('eempty').style.display=all.length?'none':'block';
  document.getElementById('etbl').innerHTML=all.map(e=>`<tr>
    <td>${e.date}</td><td>${bbr(e.branch)}</td>
    <td><span class="badge b-amber">${e.cat}</span></td>
    <td>${e.desc}</td><td>${e.by||'-'}</td>
    <td class="tn neg">฿${fmt(e.amount)}</td>
    <td><button class="btn btn-danger btn-sm" onclick="delDoc('${e.branch}',${e._y},${e._m},'expenses',${e.id})">ลบ</button></td>
  </tr>`).join('');
}

function delDoc(br,y,m,type,id){
  if(!confirm('ลบรายการนี้?'))return;
  const d=loadFor(br,y,m);d[type]=d[type].filter(x=>x.id!==id);saveFor(br,y,m,d);
  renderDash();renderQLList();renderIList();renderRList();renderEList();renderPList();
}

// ============================================================
// DETAIL MODAL
// ============================================================
function showDetail(type,doc){
  document.getElementById('detail-modal').classList.add('open');
  let title='',body='';
  function dr(k,v){return`<div class="detail-row"><span class="dk">${k}</span><span class="dv">${v||'-'}</span></div>`;}

  if(type==='quote'){
    title=`📄 ใบเสนอราคา — ${doc.no}`;
    body=dr('เลขที่',doc.no)+dr('วันที่',doc.date)+dr('สาขา',BRANCH_TH[doc.branch]||'-')+dr('ลูกค้า',doc.customer)+dr('พนักงานขาย',doc.salesPerson)+
      dr('ยอดก่อน VAT','฿'+fmt(doc.subtotal))+dr('VAT 7%',doc.useVat?'฿'+fmt(doc.vatAmt):'ไม่มี VAT')+dr('ยอดรวมทั้งหมด','฿'+fmt(doc.total))+
      dr('สถานะ',doc.approved?'✅ อนุมัติแล้ว':'⏳ รอการอนุมัติ')+dr('หมายเหตุ',doc.note);
  }
  if(type==='production'){
    title=`🏭 สั่งผลิตสินค้า — ${doc.no}`;
    body=dr('เลขที่',doc.no)+dr('วันที่',doc.date)+dr('สาขา',BRANCH_TH[doc.branch]||'-')+dr('ผู้รับผลิต',doc.maker)+dr('ลูกค้า',doc.customer)+dr('ชื่องาน',doc.job)+dr('จำนวน',fmt(doc.qty))+dr('ราคาต้นทุน/หน่วย','฿'+fmt(doc.costUnit))+dr('VAT 7%',doc.useVat?'฿'+fmt(doc.vatAmt):'ไม่รวม VAT')+dr('ราคารวมต้นทุน','฿'+fmt(doc.total))+dr('หมายเหตุ',doc.note);
  }
  if(type==='invoice'){
    title=`🧾 บิลใบส่งสินค้า — ${doc.no}`;
    body=dr('เลขที่บิล',doc.no)+dr('วันที่',doc.date)+dr('สาขา',BRANCH_TH[doc.branch]||'-')+dr('ลูกค้า',doc.customer)+dr('พนักงานขาย',doc.salesPerson)+
      dr('ยอดขายรวม','฿'+fmt(doc.saleTotal))+dr('ต้นทุนรวม','฿'+fmt(doc.costTotal))+
      dr('ค่าคอมมิสชัน ('+doc.commRate+'%)','฿'+fmt(doc.commAmt))+dr('กำไรสุทธิ',`<span class="${doc.profit>=0?'pos':'neg'}">฿${fmt(doc.profit)}</span>`)+dr('หมายเหตุ',doc.note);
  }
  if(type==='receipt'){
    title=`🧾 ใบเสร็จรับเงิน — ${doc.no}`;
    body=dr('เลขที่ใบเสร็จ',doc.no)+dr('วันที่',doc.date)+dr('สาขา',BRANCH_TH[doc.branch]||'-')+dr('เลขบิลอ้างอิง',doc.invNo)+dr('ลูกค้า',doc.customer)+dr('พนักงานขาย',doc.salesPerson)+
      dr('ยอดขายรวม','฿'+fmt(doc.saleTotal))+dr('ต้นทุนรวม','฿'+fmt(doc.costTotal))+
      dr('ค่าคอมมิสชัน ('+doc.commRate+'%)','฿'+fmt(doc.commAmt))+dr('กำไรสุทธิ',`<span class="${doc.profit>=0?'pos':'neg'}">฿${fmt(doc.profit)}</span>`)+dr('หมายเหตุ',doc.note);
  }

  // Items table
  if(doc.items?.length){
    body+=`<div style="margin-top:1rem;font-size:12px;font-weight:700;color:var(--g3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">รายการสินค้า</div>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:var(--g5)">${Object.keys(doc.items[0]).filter(k=>!['product','unit','costUnit'].includes(k)||true).map(()=>'').join('')}
        <th style="padding:6px 8px;border:1px solid var(--g4);font-size:11px;color:var(--g2)">สินค้า</th>
        <th style="padding:6px 8px;border:1px solid var(--g4);font-size:11px;color:var(--g2)">จำนวน</th>
        <th style="padding:6px 8px;border:1px solid var(--g4);font-size:11px;color:var(--g2)">หน่วย</th>
        <th style="padding:6px 8px;border:1px solid var(--g4);font-size:11px;color:var(--g2)">ราคา/หน่วย</th>
        <th style="padding:6px 8px;border:1px solid var(--g4);font-size:11px;color:var(--g2)">รวม</th>
      </tr></thead><tbody>
      ${doc.items.map(it=>`<tr>
        <td style="padding:6px 8px;border:1px solid var(--g4)">${it.product}</td>
        <td style="padding:6px 8px;border:1px solid var(--g4);text-align:center">${it.qty}</td>
        <td style="padding:6px 8px;border:1px solid var(--g4)">${it.unit||''}</td>
        <td style="padding:6px 8px;border:1px solid var(--g4);text-align:right">฿${fmt(it.priceUnit)}</td>
        <td style="padding:6px 8px;border:1px solid var(--g4);text-align:right">฿${fmt(it.total||it.saleTotal)}</td>
      </tr>`).join('')}
      </tbody></table></div>`;
  }

  // Attachments
  const atts=doc.attachments||[];
  if(atts.length){
    body+=`<div style="margin-top:1rem;font-size:12px;font-weight:700;color:var(--g3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">หลักฐานแนบ (${atts.length} ไฟล์)</div>
    <div class="attach-grid">`;
    atts.forEach(f=>{
      if(f.type.startsWith('image/')){
        body+=`<div class="attach-item" onclick="openFile('${f.data}','image')" title="คลิกเพื่อดูรูป"><img src="${f.data}" alt="${f.name}"><div style="font-size:10px;color:var(--g3);text-align:center;margin-top:3px">${f.name}</div></div>`;
      } else {
        body+=`<div class="attach-item" onclick="openFile('${f.data}','pdf')" title="คลิกเปิด PDF"><div class="pdf-box"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>PDF</div><div style="font-size:10px;color:var(--g3);text-align:center;margin-top:3px;max-width:90px;word-break:break-all">${f.name}</div></div>`;
      }
    });
    body+='</div>';
  }

  document.getElementById('modal-title').innerHTML=title;
  document.getElementById('modal-body').innerHTML=body;
}

function openFile(data,type){
  const w=window.open();
  if(type==='pdf')w.document.write(`<iframe src="${data}" style="width:100%;height:100vh;border:none"></iframe>`);
  else w.document.write(`<img src="${data}" style="max-width:100%;display:block;margin:auto">`);
}
function closeModal(){document.getElementById('detail-modal').classList.remove('open');}

// ============================================================
// EXPORT / IMPORT — เลือกเดือน เลือกปี และโหลดไฟล์รายปีได้
// ============================================================
function loadSheetJS(cb){
  if(window.XLSX){cb();return;}
  const s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload=cb;
  document.head.appendChild(s);
}

function initExportControls(){
  const years=allYears();
  populateYearSel('ex-year',years);
  populateMonthSel('ex-month',false);
  const y=document.getElementById('ex-year');
  const m=document.getElementById('ex-month');
  if(y)y.value=now.getFullYear();
  if(m)m.value=String(now.getMonth());
}

function normalizeDataPack(data){
  return {
    quotes:Array.isArray(data?.quotes)?data.quotes:[],
    invoices:Array.isArray(data?.invoices)?data.invoices:[],
    receipts:Array.isArray(data?.receipts)?data.receipts:[],
    expenses:Array.isArray(data?.expenses)?data.expenses:[],
    productions:Array.isArray(data?.productions)?data.productions:[]
  };
}

function hasAnyData(data){
  const d=normalizeDataPack(data);
  return d.quotes.length||d.invoices.length||d.receipts.length||d.expenses.length||d.productions.length;
}

function getExportSelection(){
  const yEl=document.getElementById('ex-year');
  const mEl=document.getElementById('ex-month');
  const tEl=document.getElementById('ex-type');
  return {
    year:parseInt(yEl?.value||now.getFullYear()),
    month:mEl?.value===''?null:parseInt(mEl?.value??now.getMonth()),
    type:tEl?.value||'all'
  };
}

function thaiYear(y){return y+'-'+(y+543);}
function safeName(s){return String(s).replace(/[\\/:*?"<>|\s]+/g,'_');}
function monthKeyToIndex(key){
  if(typeof key==='number')return key>=0&&key<=11?key:key-1;
  const str=String(key);
  const th=MONTHS.indexOf(str);
  if(th>=0)return th;
  const n=parseInt(str,10);
  if(Number.isFinite(n))return n>=1&&n<=12?n-1:n;
  return -1;
}

function collectBackupData({year=null,month=null,includeEmpty=false}={}){
  const years=year?[parseInt(year)]:allYears();
  const months=month===null||month===undefined?Array.from({length:12},(_,i)=>i):[parseInt(month)];
  const result={};
  years.forEach(y=>{
    result[y]={};
    ['khonkaen','ubon'].forEach(br=>{
      result[y][br]={};
      months.forEach(m=>{
        const d=normalizeDataPack(loadFor(br,y,m));
        if(includeEmpty||hasAnyData(d))result[y][br][MONTHS[m]]=d;
      });
    });
  });
  return result;
}

function downloadJSON(payload,filename){
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportSelectedMonthJSON(){
  const {year,month}=getExportSelection();
  if(month===null){alert('กรุณาเลือกเดือนก่อนดาวน์โหลดไฟล์รายเดือน');return;}
  const payload={
    meta:{app:'comform-esan',backupType:'month',year,month:month+1,monthName:MONTHS[month],exportedAt:new Date().toISOString()},
    data:collectBackupData({year,month,includeEmpty:true})
  };
  downloadJSON(payload,`backup_comform_${year}_${String(month+1).padStart(2,'0')}_${safeName(MONTHS[month])}.json`);
}

function exportSelectedYearJSON(){
  const {year}=getExportSelection();
  const payload={
    meta:{app:'comform-esan',backupType:'year',year,exportedAt:new Date().toISOString()},
    data:collectBackupData({year,includeEmpty:true})
  };
  downloadJSON(payload,`backup_comform_year_${year}_${year+543}.json`);
}

function exportAllJSON(){
  const payload={
    meta:{app:'comform-esan',backupType:'all',exportedAt:new Date().toISOString()},
    data:collectBackupData({includeEmpty:false})
  };
  downloadJSON(payload,`backup_comform_all_${now.getFullYear()}_${now.getFullYear()+543}.json`);
}

function exportSelectedMonthExcel(){
  const {year,month,type}=getExportSelection();
  if(month===null){alert('กรุณาเลือกเดือนก่อนดาวน์โหลด Excel รายเดือน');return;}
  exportXLSX(type,{year,month,scopeLabel:`${year}_${String(month+1).padStart(2,'0')}_${safeName(MONTHS[month])}`});
}

function exportSelectedYearExcel(){
  const {year,type}=getExportSelection();
  exportXLSX(type,{year,scopeLabel:`year_${year}_${year+543}`});
}

function exportXLSX(type,options={}){
  loadSheetJS(()=>{
    const wb=XLSX.utils.book_new();
    const years=options.year?[parseInt(options.year)]:allYears();
    const months=options.month!==undefined&&options.month!==null&&options.month!==''?[parseInt(options.month)]:Array.from({length:12},(_,i)=>i);
    const branches=options.branch?[options.branch]:['khonkaen','ubon'];

    if(type==='all'||type==='invoices'){
      const rows=[['สาขา','ปี','เดือน','เลขที่บิล','วันที่','ลูกค้า','พนักงานขาย','สินค้า','จำนวน','หน่วย','ราคาขาย/หน่วย','ยอดขายรวม','ต้นทุน/หน่วย','ต้นทุนรวม','%คอม','คอมมิสชัน','กำไรสุทธิ','หมายเหตุ']];
      years.forEach(y=>branches.forEach(br=>months.forEach(m=>{
        const d=normalizeDataPack(loadFor(br,y,m));
        d.invoices.forEach(inv=>{
          if((inv.items||[]).length){
            (inv.items||[]).forEach((it,idx)=>rows.push([idx===0?BRANCH_TH[br]:'',idx===0?y:'',idx===0?MONTHS[m]:'',idx===0?inv.no:'',idx===0?inv.date:'',idx===0?inv.customer:'',idx===0?inv.salesPerson||'':'',it.product,it.qty,it.unit||'',it.priceUnit,it.saleTotal,it.costUnit||0,it.costTotal,idx===0?inv.commRate:'',idx===0?inv.commAmt:'',idx===0?inv.profit:'',idx===0?inv.note||'':'']));
          }else{
            rows.push([BRANCH_TH[br],y,MONTHS[m],inv.no,inv.date,inv.customer,inv.salesPerson||'','',0,'',0,inv.saleTotal,0,inv.costTotal,inv.commRate,inv.commAmt,inv.profit,inv.note||'']);
          }
        });
      })));
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'บิลใบส่งสินค้า');
    }

    if(type==='all'||type==='quotes'){
      const rows=[['สาขา','ปี','เดือน','เลขที่','วันที่','ลูกค้า','พนักงานขาย','สินค้า','จำนวน','หน่วย','ราคา/หน่วย','ราคารวม','ยอดก่อน VAT','VAT 7%','ยอดรวม','สถานะ','หมายเหตุ']];
      years.forEach(y=>branches.forEach(br=>months.forEach(m=>{
        const d=normalizeDataPack(loadFor(br,y,m));
        d.quotes.forEach(q=>{
          if((q.items||[]).length){
            (q.items||[]).forEach((it,idx)=>rows.push([idx===0?BRANCH_TH[br]:'',idx===0?y:'',idx===0?MONTHS[m]:'',idx===0?q.no:'',idx===0?q.date:'',idx===0?q.customer:'',idx===0?q.salesPerson||'':'',it.product,it.qty,it.unit||'',it.priceUnit,it.total,idx===0?q.subtotal:'',idx===0?q.vatAmt:'',idx===0?q.total:'',idx===0?(q.approved?'อนุมัติแล้ว':'รอ'):'',idx===0?q.note||'':'']));
          }else{
            rows.push([BRANCH_TH[br],y,MONTHS[m],q.no,q.date,q.customer,q.salesPerson||'','',0,'',0,0,q.subtotal,q.vatAmt,q.total,q.approved?'อนุมัติแล้ว':'รอ',q.note||'']);
          }
        });
      })));
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'ใบเสนอราคา');
    }

    if(type==='all'||type==='receipts'){
      const rows=[['สาขา','ปี','เดือน','เลขที่ใบเสร็จ','วันที่','เลขบิล','ลูกค้า','พนักงานขาย','สินค้า','จำนวน','หน่วย','ราคาขาย/หน่วย','ยอดขาย','%คอม','คอมมิสชัน','กำไรสุทธิ','หมายเหตุ']];
      years.forEach(y=>branches.forEach(br=>months.forEach(m=>{
        const d=normalizeDataPack(loadFor(br,y,m));
        d.receipts.forEach(r=>{
          if((r.items||[]).length){
            (r.items||[]).forEach((it,idx)=>rows.push([idx===0?BRANCH_TH[br]:'',idx===0?y:'',idx===0?MONTHS[m]:'',idx===0?r.no:'',idx===0?r.date:'',idx===0?r.invNo||'':'',idx===0?r.customer:'',idx===0?r.salesPerson||'':'',it.product,it.qty,it.unit||'',it.priceUnit,it.saleTotal,idx===0?r.commRate:'',idx===0?r.commAmt:'',idx===0?r.profit:'',idx===0?r.note||'':'']));
          }else{
            rows.push([BRANCH_TH[br],y,MONTHS[m],r.no,r.date,r.invNo||'',r.customer,r.salesPerson||'','',0,'',0,r.saleTotal,r.commRate,r.commAmt,r.profit,r.note||'']);
          }
        });
      })));
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'ใบเสร็จรับเงิน');
    }

    if(type==='all'||type==='expenses'){
      const rows=[['สาขา','ปี','เดือน','วันที่','หมวดหมู่','รายละเอียด','ผู้บันทึก','จำนวนเงิน (บาท)','หมายเหตุ']];
      years.forEach(y=>branches.forEach(br=>months.forEach(m=>{
        const d=normalizeDataPack(loadFor(br,y,m));
        d.expenses.forEach(e=>rows.push([BRANCH_TH[br],y,MONTHS[m],e.date,e.cat,e.desc,e.by||'',e.amount,e.note||'']));
      })));
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'ค่าใช้จ่าย');
    }

    if(type==='all'||type==='productions'){
      const rows=[['สาขา','ปี','เดือน','เลขที่','วันที่','ผู้รับผลิต','ลูกค้า','ชื่องาน','จำนวน','ราคาต้นทุน/หน่วย','ต้นทุนก่อน VAT','VAT 7%','ราคารวมต้นทุน','รูปแบบ VAT','หมายเหตุ']];
      years.forEach(y=>branches.forEach(br=>months.forEach(m=>{
        const d=normalizeDataPack(loadFor(br,y,m));
        d.productions.forEach(p=>rows.push([BRANCH_TH[br],y,MONTHS[m],p.no,p.date,p.maker,p.customer,p.job,p.qty,p.costUnit,p.subtotal,p.vatAmt,p.total,p.useVat?'รวม VAT 7%':'ไม่รวม VAT',p.note||'']));
      })));
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'สั่งผลิตสินค้า');
    }

    const label={all:'ทุกรายการ',invoices:'บิลขาย',quotes:'ใบเสนอราคา',receipts:'ใบเสร็จ',expenses:'ค่าใช้จ่าย',productions:'สั่งผลิตสินค้า'}[type]||type;
    const scope=options.scopeLabel||`all_${now.getFullYear()}_${now.getFullYear()+543}`;
    XLSX.writeFile(wb,`export_comform_${safeName(label)}_${scope}.xlsx`);
  });
}

function importJSON(ev){
  const f=ev.target.files[0];if(!f)return;
  const rd=new FileReader();rd.onload=e=>{
    try{
      const raw=JSON.parse(e.target.result);
      const obj=raw.data||raw;

      // Support old single-key format: {quotes,invoices,receipts,expenses,productions}
      if(obj.quotes||obj.invoices||obj.receipts||obj.expenses||obj.productions){
        const y=now.getFullYear(),m=now.getMonth();
        saveFor('khonkaen',y,m,normalizeDataPack(obj));
      } else {
        // New format: {year: {branch: {monthName: data}}}
        Object.entries(obj).forEach(([y,brs])=>{
          if(!brs||typeof brs!=='object')return;
          Object.entries(brs).forEach(([br,months])=>{
            if(!['khonkaen','ubon'].includes(br)||!months||typeof months!=='object')return;
            Object.entries(months).forEach(([mName,data])=>{
              const mIdx=monthKeyToIndex(mName);
              if(mIdx>=0&&mIdx<=11)saveFor(br,parseInt(y),mIdx,normalizeDataPack(data));
            });
          });
        });
      }

      onYearChange();
      initExportControls();
      renderDash();
      alert('นำเข้าไฟล์ JSON สำเร็จ!');
      ev.target.value='';
    }catch(err){
      console.error(err);
      alert('ไฟล์ไม่ถูกต้อง หรือรูปแบบ JSON ไม่ตรงกับระบบ');
    }
  };
  rd.readAsText(f);
}

// ============================================================
// HELPERS
// ============================================================
function fmt(n){return Number(n||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});}

// Init date fields
['q-date','i-date','r-date','e-date','p-date'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=todayStr;});

// ============================================================
// BOOT
// ============================================================
initDropdowns();
initExportControls();
renderDash();
addQItem();addIItem();addRItem();addPItem(1,'');calcP();