const $ = s => document.querySelector(s);

const $$ = s => [...document.querySelectorAll(s)];
const storeKey='smartCenterDataV1';
let currentUser=null;
const initial={students:[],teachers:[],groups:[],attendance:[],transactions:[],subscriptions:[],parents:[],materials:[],users:[],settings:{name:'Smart Center',phone:'',address:''}};
let db=load();
function load(){try{return {...initial,...JSON.parse(localStorage.getItem(storeKey)||'{}')}}catch(e){return structuredClone(initial)}}
function save(){
  // بيانات المنصة محفوظة محليًا على هذا المتصفح فقط؛ Supabase مستخدم لتسجيل الدخول لا غير.
  localStorage.setItem(storeKey,JSON.stringify(db));
}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(v){return Number(v||0).toLocaleString('ar-EG',{maximumFractionDigits:2})+' ج.م';}
let soundEnabled=localStorage.getItem('smartCenterSound')!=='off';
function playSuccessSound(){if(!soundEnabled)return;try{const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;const ctx=new AudioCtx();const now=ctx.currentTime;[[660,0],[880,.13]].forEach(([freq,delay])=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,now+delay);gain.gain.setValueAtTime(.0001,now+delay);gain.gain.exponentialRampToValueAtTime(.12,now+delay+.018);gain.gain.exponentialRampToValueAtTime(.0001,now+delay+.19);osc.connect(gain);gain.connect(ctx.destination);osc.start(now+delay);osc.stop(now+delay+.21)});setTimeout(()=>ctx.close(),500)}catch(e){}}
function toast(msg){let t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
function dateNow(){return new Date().toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'});}
$('#todayText').textContent=dateNow();$('#year').textContent=new Date().getFullYear();
const pageNames={dashboard:'لوحة التحكم',students:'إدارة الطلاب',teachers:'إدارة المدرسين',groups:'إدارة المجموعات',attendance:'الحضور والغياب',finance:'الحسابات والإيرادات والمصروفات',subscriptions:'الاشتراكات',receipts:'إيصالات الدفع',parents:'أولياء الأمور',materials:'المذكرات والملفات',schedule:'جدول المحاضرات',users:'المستخدمون والصلاحيات',settings:'إعدادات السنتر'};
let current='dashboard';
$('#nav').addEventListener('click',e=>{let b=e.target.closest('[data-page]');if(b)go(b.dataset.page)});
$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
function syncSoundButton(){const b=$('#soundToggle');if(!b)return;b.textContent=soundEnabled?'♫':'♪';b.classList.toggle('muted',!soundEnabled);b.title=soundEnabled?'إيقاف صوت التأكيد':'تشغيل صوت التأكيد';b.setAttribute('aria-label',b.title)}
$('#soundToggle').onclick=()=>{soundEnabled=!soundEnabled;localStorage.setItem('smartCenterSound',soundEnabled?'on':'off');syncSoundButton();if(soundEnabled)playSuccessSound();toast(soundEnabled?'تم تشغيل صوت التأكيد':'تم إيقاف صوت التأكيد')};
syncSoundButton();
function go(page){current=page;$('#pageTitle').textContent=pageNames[page];$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('#sidebar').classList.remove('open');render();}
function pageHead(title,desc,button=''){return `<div class="page-head"><div><h2>${title}</h2><p>${desc||''}</p></div>${button}</div>`}
function stat(label,value,icon){return `<div class="stat-card"><div><small>${label}</small><strong>${value}</strong></div><div class="stat-icon">${icon}</div></div>`}
function table(headers,rows){return `<div class="table-card"><div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}" class="empty">لا توجد بيانات حتى الآن</td></tr>`}</tbody></table></div></div>`}
function actionBtns(type,id){return `<div class="actions"><button class="mini-btn" onclick="editItem('${type}','${id}')">تعديل</button><button class="mini-btn" onclick="deleteItem('${type}','${id}')">حذف</button></div>`}
function render(){const root=$('#content');({dashboard:dashboardPage,students:studentsPage,teachers:teachersPage,groups:groupsPage,attendance:attendancePage,finance:financePage,subscriptions:subscriptionsPage,receipts:receiptsPage,parents:parentsPage,materials:materialsPage,schedule:schedulePage,users:usersPage,settings:settingsPage}[current]||dashboardPage)(root);}
function dashboardPage(root){
 const income=db.transactions.filter(x=>x.kind==='income').reduce((a,x)=>a+ +x.amount,0),out=db.transactions.filter(x=>x.kind==='expense').reduce((a,x)=>a+ +x.amount,0);
 const today=new Date().toISOString().slice(0,10),present=db.attendance.filter(x=>x.date===today&&x.status==='حاضر').length,absent=db.attendance.filter(x=>x.date===today&&x.status==='غائب').length;
 let bars=Array.from({length:6},(_,i)=>{let d=new Date();d.setMonth(d.getMonth()-5+i);let m=d.getMonth();let val=db.transactions.filter(x=>x.kind==='income'&&new Date(x.date).getMonth()===m).reduce((a,x)=>a+ +x.amount,0);return {name:d.toLocaleDateString('ar-EG',{month:'short'}),val}});
 let max=Math.max(1,...bars.map(x=>x.val));
 root.innerHTML=pageHead('مرحبًا بك في Smart Center','نظرة عامة على أداء السنتر وإدارته اليومية')+
 `<div class="stats-grid">${stat('إجمالي الطلاب',db.students.length,'♙')}${stat('عدد المدرسين',db.teachers.length,'♟')}${stat('إجمالي الإيرادات',money(income),'ج')}${stat('صافي الحسابات',money(income-out),'▥')}</div>
 <div class="dashboard-grid"><div><div class="panel"><div class="panel-title"><h3>ملخص الإيرادات خلال آخر 6 أشهر</h3><span>حسب البيانات المسجلة</span></div><div class="bar-chart">${bars.map(x=>`<div class="bar-col"><b style="font-size:9px">${x.val?Math.round(x.val):''}</b><div class="bar" style="height:${Math.max(3,x.val/max*72)}%"></div><small>${x.name}</small></div>`).join('')}</div></div>
 <div class="panel"><div class="panel-title"><h3>إجراءات سريعة</h3><span>اختصارات</span></div><div class="quick-grid"><button class="quick" onclick="openForm('students')"><i>＋</i>إضافة طالب</button><button class="quick" onclick="openForm('transactions')"><i>↗</i>تسجيل حركة مالية</button><button class="quick" onclick="openForm('attendance')"><i>✓</i>تسجيل حضور</button><button class="quick" onclick="openForm('groups')"><i>▤</i>إضافة مجموعة</button><button class="quick" onclick="go('subscriptions')"><i>◷</i>الاشتراكات</button><button class="quick" onclick="go('receipts')"><i>▧</i>إيصالات الدفع</button></div></div></div>
 <div><div class="panel"><div class="panel-title"><h3>الحضور اليوم</h3><span>${dateNow()}</span></div><div class="stats-grid" style="grid-template-columns:repeat(2,1fr);margin:0">${stat('حاضر',present,'✓')}${stat('غائب',absent,'×')}</div></div>
 <div class="panel"><div class="panel-title"><h3>آخر الحركات المالية</h3><button class="btn secondary" onclick="go('finance')">عرض الكل</button></div>${table(['النوع','الوصف','المبلغ','التاريخ'],db.transactions.slice(-5).reverse().map(x=>`<tr><td><span class="badge ${x.kind==='income'?'green':'red'}">${x.kind==='income'?'إيراد':'مصروف'}</span></td><td>${esc(x.description)}</td><td>${money(x.amount)}</td><td>${esc(x.date)}</td></tr>`).join(''))}</div></div></div>`;
}
const configs={
 students:{title:'الطلاب',desc:'إدارة بيانات الطلاب ووسائل التواصل والمجموعات',btn:'＋ إضافة طالب',fields:[['name','اسم الطالب','text',1],['phone','رقم الهاتف','tel',1],['parentPhone','هاتف ولي الأمر','tel'],['grade','الصف الدراسي','text'],['groupId','المجموعة','group'],['monthlyFee','قيمة الاشتراك','number'],['joinDate','تاريخ التسجيل','date']]},
 teachers:{title:'المدرسون',desc:'بيانات المدرسين والمواد والمستحقات',btn:'＋ إضافة مدرس',fields:[['name','اسم المدرس','text',1],['phone','رقم الهاتف','tel'],['subject','المادة','text'],['payment','نظام المستحقات','select:نسبة,راتب ثابت,بالحصة'],['amount','قيمة الراتب / النسبة','number']]},
 groups:{title:'المجموعات',desc:'تنظيم المجموعات ومواعيد الحصص',btn:'＋ إضافة مجموعة',fields:[['name','اسم المجموعة','text',1],['subject','المادة','text'],['teacherId','المدرس','teacher'],['grade','الصف الدراسي','text'],['days','أيام المحاضرات','text'],['time','موعد المحاضرة','text'],['fee','سعر الاشتراك','number'],['capacity','العدد المسموح','number']]},
 parents:{title:'أولياء الأمور',desc:'بيانات أولياء الأمور وربطهم بالطلاب',btn:'＋ إضافة ولي أمر',fields:[['name','اسم ولي الأمر','text',1],['phone','رقم الهاتف','tel',1],['studentName','اسم الطالب','text'],['notes','ملاحظات','text']]},
 users:{title:'المستخدمون والصلاحيات',desc:'إدارة حسابات فريق العمل ومستويات الوصول',btn:'＋ إضافة مستخدم',fields:[['name','اسم المستخدم','text',1],['username','اسم الدخول','text',1],['role','الصلاحية','select:مدير,استقبال,محاسب,مدرس'],['phone','رقم الهاتف','tel']]}
};
function listPage(root,type,headers,mapper){let c=configs[type];root.innerHTML=pageHead(c.title,c.desc,`<button class="btn" onclick="openForm('${type}')">${c.btn}</button>`)+`<div class="table-card"><div class="table-tools"><input class="search" id="tableSearch" placeholder="ابحث بالاسم أو البيانات..."><span class="muted" style="font-size:11px">عدد السجلات: ${db[type].length}</span></div><div id="tableArea">${table(headers,db[type].map(mapper).join(''))}</div></div>`;$('#tableSearch').oninput=e=>{let q=e.target.value.toLowerCase();$('#tableArea').innerHTML=table(headers,db[type].filter(x=>JSON.stringify(x).toLowerCase().includes(q)).map(mapper).join(''));};}
function studentsPage(r){listPage(r,'students',['الكود','اسم الطالب','الهاتف','الصف','المجموعة','الاشتراك','إجراءات'],x=>`<tr><td>${esc(x.code)}</td><td>${esc(x.name)}</td><td>${esc(x.phone)}</td><td>${esc(x.grade)}</td><td>${esc(groupName(x.groupId))}</td><td>${money(x.monthlyFee)}</td><td>${actionBtns('students',x.id)}</td></tr>`)}
function teachersPage(r){listPage(r,'teachers',['الاسم','الهاتف','المادة','نظام المستحقات','القيمة','إجراءات'],x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.phone)}</td><td>${esc(x.subject)}</td><td>${esc(x.payment)}</td><td>${money(x.amount)}</td><td>${actionBtns('teachers',x.id)}</td></tr>`)}
function groupsPage(r){listPage(r,'groups',['اسم المجموعة','المادة','المدرس','الصف','الأيام','الموعد','الاشتراك','إجراءات'],x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.subject)}</td><td>${esc(teacherName(x.teacherId))}</td><td>${esc(x.grade)}</td><td>${esc(x.days)}</td><td>${esc(x.time)}</td><td>${money(x.fee)}</td><td>${actionBtns('groups',x.id)}</td></tr>`)}
function parentsPage(r){listPage(r,'parents',['اسم ولي الأمر','الهاتف','اسم الطالب','ملاحظات','إجراءات'],x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.phone)}</td><td>${esc(x.studentName)}</td><td>${esc(x.notes)}</td><td>${actionBtns('parents',x.id)}</td></tr>`)}
function usersPage(r){listPage(r,'users',['الاسم','اسم الدخول','الصلاحية','الهاتف','إجراءات'],x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.username)}</td><td><span class="badge">${esc(x.role)}</span></td><td>${esc(x.phone)}</td><td>${actionBtns('users',x.id)}</td></tr>`)}
function groupName(id){return db.groups.find(x=>x.id===id)?.name||'—'}function teacherName(id){return db.teachers.find(x=>x.id===id)?.name||'—'}
function attendancePage(r){r.innerHTML=pageHead('الحضور والغياب','تسجيل ومتابعة حضور الطلاب في كل محاضرة',`<button class="btn" onclick="openForm('attendance')">＋ تسجيل حضور</button>`)+`<div class="info-note">سجّل حالة كل طالب مع التاريخ والمجموعة. هذه النسخة تسجل الحضور يدويًا؛ يمكن إضافة قارئ QR وربطه بقاعدة بيانات في مرحلة التطوير.</div>`+table(['التاريخ','الطالب','المجموعة','الحالة','ملاحظات','إجراءات'],db.attendance.slice().reverse().map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.studentName)}</td><td>${esc(groupName(x.groupId))}</td><td><span class="badge ${x.status==='حاضر'?'green':'red'}">${esc(x.status)}</span></td><td>${esc(x.notes)}</td><td>${actionBtns('attendance',x.id)}</td></tr>`).join(''))}
function financePage(r){let inc=db.transactions.filter(x=>x.kind==='income').reduce((a,x)=>a+ +x.amount,0),out=db.transactions.filter(x=>x.kind==='expense').reduce((a,x)=>a+ +x.amount,0);r.innerHTML=pageHead('الحسابات','متابعة الإيرادات والمصروفات وصافي الحسابات',`<button class="btn" onclick="openForm('transactions')">＋ تسجيل حركة مالية</button>`)+`<div class="stats-grid">${stat('إجمالي الإيرادات',money(inc),'↗')}${stat('إجمالي المصروفات',money(out),'↙')}${stat('صافي الحسابات',money(inc-out),'ج')}${stat('عدد الحركات',db.transactions.length,'▤')}</div>`+table(['النوع','التصنيف','الوصف','المبلغ','التاريخ','إجراءات'],db.transactions.slice().reverse().map(x=>`<tr><td><span class="badge ${x.kind==='income'?'green':'red'}">${x.kind==='income'?'إيراد':'مصروف'}</span></td><td>${esc(x.category)}</td><td>${esc(x.description)}</td><td>${money(x.amount)}</td><td>${esc(x.date)}</td><td>${actionBtns('transactions',x.id)}</td></tr>`).join(''))}
function subscriptionsPage(r){r.innerHTML=pageHead('الاشتراكات','متابعة المبالغ المدفوعة والمتبقية لكل طالب',`<button class="btn" onclick="openForm('subscriptions')">＋ تسجيل اشتراك</button>`)+table(['الطالب','المجموعة','الشهر','المطلوب','المدفوع','المتبقي','الحالة','إجراءات'],db.subscriptions.slice().reverse().map(x=>{let remain=+x.required-+x.paid;return `<tr><td>${esc(x.studentName)}</td><td>${esc(groupName(x.groupId))}</td><td>${esc(x.month)}</td><td>${money(x.required)}</td><td>${money(x.paid)}</td><td class="${remain>0?'money-negative':'money-positive'}">${money(remain)}</td><td><span class="badge ${remain>0?'orange':'green'}">${remain>0?'متبقي':'مدفوع'}</span></td><td>${actionBtns('subscriptions',x.id)}</td></tr>`}).join(''))}
function receiptsPage(r){r.innerHTML=pageHead('إيصالات الدفع','عرض وطباعة إيصالات مدفوعات الطلاب',`<button class="btn" onclick="openForm('transactions')">＋ تسجيل دفعة جديدة</button>`)+`<div class="info-note">تظهر هنا الحركات المالية المصنفة كإيراد. استخدم زر طباعة لإصدار إيصال مبسط.</div>`+table(['رقم الإيصال','التاريخ','الطالب / الوصف','المبلغ','الإجراء'],db.transactions.filter(x=>x.kind==='income').slice().reverse().map(x=>`<tr><td>${esc(x.receipt||x.id.slice(-6))}</td><td>${esc(x.date)}</td><td>${esc(x.description)}</td><td>${money(x.amount)}</td><td><button class="mini-btn" onclick="printReceipt('${x.id}')">طباعة الإيصال</button></td></tr>`).join(''))}
function materialsPage(r){r.innerHTML=pageHead('المذكرات والملفات','رفع وتنظيم ملفات PDF والمواد التعليمية',`<button class="btn" onclick="openForm('materials')">＋ إضافة ملف</button>`)+`<div class="info-note">يتم حفظ بيانات الملف ورابطه في هذه النسخة. ارفع ملفاتك على خدمة تخزين آمنة ثم أضف الرابط؛ رفع الملفات محليًا يحتاج مساحة تخزين خلفية عند النشر.</div>`+table(['اسم الملف','المادة','المجموعة','الرابط','إجراءات'],db.materials.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.subject)}</td><td>${esc(groupName(x.groupId))}</td><td>${x.url?`<a href="${esc(x.url)}" target="_blank">فتح الملف</a>`:'—'}</td><td>${actionBtns('materials',x.id)}</td></tr>`).join(''))}
function schedulePage(r){r.innerHTML=pageHead('جدول المحاضرات','مواعيد المجموعات والمدرسين خلال الأسبوع',`<button class="btn" onclick="go('groups')">إدارة المجموعات</button>`)+table(['المجموعة','المادة','المدرس','الأيام','الوقت','الصف'],db.groups.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.subject)}</td><td>${esc(teacherName(x.teacherId))}</td><td>${esc(x.days)}</td><td>${esc(x.time)}</td><td>${esc(x.grade)}</td></tr>`).join(''))}
function settingsPage(r){r.innerHTML=pageHead('إعدادات السنتر','تخصيص بيانات السنتر وإدارة النسخ الاحتياطية')+`<div class="setting-card"><h3>بيانات السنتر</h3><form id="settingsForm" class="form-grid"><div class="field"><label>اسم السنتر</label><input name="name" value="${esc(db.settings.name)}" required></div><div class="field"><label>رقم الهاتف</label><input name="phone" value="${esc(db.settings.phone)}"></div><div class="field full"><label>العنوان</label><input name="address" value="${esc(db.settings.address)}"></div><div class="field full"><button class="btn">حفظ الإعدادات</button></div></form></div><div class="setting-card"><h3>البيانات والنسخ الاحتياطي</h3><p>البيانات محفوظة على نفس المتصفح والجهاز باستخدام Local Storage. استخدم النسخة الاحتياطية للاحتفاظ بنسخة من بياناتك. لا تستخدم هذه النسخة كقاعدة بيانات مشتركة بين عدة أجهزة.</p><button class="btn secondary" onclick="backup()">تنزيل نسخة احتياطية JSON</button> <label class="btn secondary" style="display:inline-block">استيراد نسخة<input type="file" accept=".json,application/json" hidden onchange="restore(event)"></label><button class="btn danger" onclick="clearData()">مسح جميع البيانات</button></div>`;$('#settingsForm').onsubmit=e=>{e.preventDefault();db.settings=Object.fromEntries(new FormData(e.target));save();toast('تم حفظ الإعدادات');};}
function fieldHtml(f){let [name,label,type,required]=f;let req=required?'required':'';if(type==='group'||type==='teacher'||type==='student'){let arr=type==='group'?db.groups:type==='teacher'?db.teachers:db.students;return `<div class="field"><label>${label}</label><select name="${name}" ${req}><option value="">اختر</option>${arr.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>`}
 if(type.startsWith('select:'))return `<div class="field"><label>${label}</label><select name="${name}" ${req}>${type.slice(7).split(',').map(x=>`<option>${x}</option>`).join('')}</select></div>`;
 return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" ${req} ${type==='number'?'min="0" step="0.01"':''}></div>`}
function openForm(type,id=null){let editing=id?db[type].find(x=>x.id===id):null;let fields=[];
 if(configs[type])fields=configs[type].fields;
 if(type==='transactions')fields=[['kind','نوع الحركة','select:income,expense',1],['category','التصنيف','text',1],['description','الوصف / اسم الطالب','text',1],['amount','المبلغ بالجنيه','number',1],['date','التاريخ','date',1]];
 if(type==='attendance')fields=[['studentId','الطالب','student',1],['groupId','المجموعة','group'],['date','التاريخ','date',1],['status','الحالة','select:حاضر,غائب,متأخر',1],['notes','ملاحظات','text']];
 if(type==='subscriptions')fields=[['studentId','الطالب','student',1],['groupId','المجموعة','group'],['month','الشهر','text',1],['required','المبلغ المطلوب','number',1],['paid','المبلغ المدفوع','number',1]];
 if(type==='materials')fields=[['name','اسم الملف','text',1],['subject','المادة','text'],['groupId','المجموعة','group'],['url','رابط الملف','url']];
 let title=editing?'تعديل البيانات':({students:'إضافة طالب جديد',teachers:'إضافة مدرس جديد',groups:'إضافة مجموعة جديدة',parents:'إضافة ولي أمر',users:'إضافة مستخدم',transactions:'تسجيل حركة مالية',attendance:'تسجيل حضور أو غياب',subscriptions:'تسجيل اشتراك',materials:'إضافة مذكرة أو ملف'}[type]||'إضافة بيانات');
 $('#modalRoot').innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><h3>${title}</h3><button class="close" onclick="closeModal()">✕</button></div><form id="dataForm"><div class="form-grid">${fields.map(f=>fieldHtml(f)).join('')}</div><div class="modal-actions"><button class="btn">حفظ البيانات</button><button type="button" class="btn secondary" onclick="closeModal()">إلغاء</button></div></form></div></div>`;
 let form=$('#dataForm');fields.forEach(f=>{let el=form.elements[f[0]];if(el&&editing)el.value=editing[f[0]]??'';if(el&&f[2]==='date'&&!editing)el.value=new Date().toISOString().slice(0,10)});
 form.onsubmit=e=>{e.preventDefault();let data=Object.fromEntries(new FormData(form));if(type==='attendance'){let s=db.students.find(x=>x.id===data.studentId);data.studentName=s?.name||''}if(type==='subscriptions'){let s=db.students.find(x=>x.id===data.studentId);data.studentName=s?.name||''}
 if(editing)Object.assign(editing,data);else{data.id=crypto.randomUUID();if(type==='students')data.code='ST-'+String(Date.now()).slice(-6);if(type==='transactions'&&data.kind==='income')data.receipt='RC-'+String(Date.now()).slice(-7);db[type].push(data)}
 save();closeModal();render();if(!editing)playSuccessSound();toast(editing?'تم تعديل البيانات بنجاح':'تمت إضافة البيانات بنجاح');};
}
function closeModal(){$('#modalRoot').innerHTML=''}
function editItem(type,id){openForm(type,id)}
function deleteItem(type,id){if(!confirm('هل أنت متأكد من حذف هذا السجل؟'))return;db[type]=db[type].filter(x=>x.id!==id);save();render();toast('تم حذف السجل')}
function printReceipt(id){let x=db.transactions.find(y=>y.id===id);if(!x)return;let w=window.open('','_blank','width=600,height=700');w.document.write(`<html lang="ar" dir="rtl"><meta charset="utf-8"><title>إيصال دفع</title><body style="font-family:Tahoma;text-align:center;padding:35px"><h2>${esc(db.settings.name)}</h2><h3>إيصال استلام نقدية</h3><hr><p>رقم الإيصال: ${esc(x.receipt||x.id.slice(-6))}</p><p>التاريخ: ${esc(x.date)}</p><p>البيان: ${esc(x.description)}</p><h2>المبلغ: ${money(x.amount)}</h2><hr><p>شكرًا لثقتكم بنا</p><script>window.print()<\/script></body></html>`);w.document.close()}
function downloadBackup(payload, suffix=''){
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;
  a.download='smart-center-backup-'+new Date().toISOString().slice(0,10)+(suffix||'')+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function backup(){
  const payload={
    app:'Smart Center',
    backupVersion:1,
    createdAt:new Date().toISOString(),
    data:db
  };
  downloadBackup(payload);
  toast('تم تنزيل النسخة الاحتياطية بنجاح');
}
function restore(e){
  const f=e.target.files&&e.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const parsed=JSON.parse(rd.result);
      // دعم النسخ الجديدة ذات الغلاف، وكذلك ملفات النسخ القديمة.
      const candidate=parsed&&parsed.data&&parsed.app==='Smart Center'?parsed.data:parsed;
      const required=['students','teachers','groups','attendance','transactions','subscriptions','parents','materials','users'];
      if(!candidate||typeof candidate!=='object'||required.some(k=>!Array.isArray(candidate[k]))||
         !candidate.settings||typeof candidate.settings!=='object'){
        throw new Error('invalid backup structure');
      }
      if(!confirm('سيتم استبدال البيانات الحالية بالنسخة المختارة. سيتم تنزيل نسخة أمان من البيانات الحالية أولًا. هل تريد المتابعة؟'))return;
      downloadBackup({app:'Smart Center',backupVersion:1,createdAt:new Date().toISOString(),data:db},'-before-restore');
      db={...structuredClone(initial),...candidate,settings:{...initial.settings,...candidate.settings}};
      save();render();toast('تم استيراد النسخة الاحتياطية بنجاح');
    }catch(err){toast('ملف النسخة غير صالح أو لا يخص Smart Center')}
    finally{e.target.value='';}
  };
  rd.onerror=()=>{toast('تعذر قراءة ملف النسخة');e.target.value='';};
  rd.readAsText(f);
}
function clearData(){if(!confirm('تحذير: سيتم حذف كل البيانات نهائيًا من هذا المتصفح. هل تريد المتابعة؟'))return;db=structuredClone(initial);save();render();toast('تم مسح البيانات')}
$('#backupBtn').onclick=backup;
function boot(){ $('#appShell').hidden=false; render(); }
boot();
