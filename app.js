const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];
const KEY = "studyhub_v1";

const seed = {
  tasks: [
    {id:1,title:"Complete JavaScript course (Functions)",category:"Study",time:"09:00",date:today(),done:true},
    {id:2,title:"Build a small project (ToDo App)",category:"Project",time:"11:00",date:today(),done:true},
    {id:3,title:"Read 10 pages of a book",category:"Reading",time:"14:00",date:today(),done:true},
    {id:4,title:"Workout / Exercise",category:"Personal",time:"17:00",date:today(),done:false},
    {id:5,title:"Learn CSS Grid",category:"Study",time:"19:00",date:today(),done:false},
    {id:6,title:"Edit video (CapCut)",category:"Work",time:"21:00",date:today(),done:false},
  ],
  notes: [
    {id:1,title:"Web Development Roadmap",body:"HTML → CSS → JavaScript → Projects → Backend. Focus on building instead of only watching tutorials.",updated:Date.now()-7200000},
    {id:2,title:"JavaScript Basics",body:"Variables, data types, operators, conditions, loops and functions. Next: arrays and objects.",updated:Date.now()-18000000},
    {id:3,title:"Design Principles",body:"Hierarchy, spacing, contrast, alignment, repetition and consistency.",updated:Date.now()-86400000}
  ],
  courses: [
    {title:"JavaScript",sub:"Functions",progress:62,icon:"JS"},
    {title:"Web Development",sub:"HTML · CSS · JS",progress:38,icon:"5"},
    {title:"UI/UX Design",sub:"Figma",progress:25,icon:"F"},
    {title:"Graphic Design",sub:"Photoshop · Illustrator",progress:10,icon:"G"}
  ],
  activity: [
    ["Task Completed","JavaScript course (Functions)","2 hours ago","✓"],
    ["New Note Added","Web Development Roadmap","3 hours ago","▤"],
    ["Course Progress","JavaScript 62% complete","4 hours ago","◈"],
    ["You joined StudyHub!","Welcome to your learning journey!","5 hours ago","★"]
  ]
};

let state = load();
let taskFilter = "all";
let selectedNote = state.notes[0]?.id || null;
let calDate = new Date();
let selectedDay = iso(calDate);
let timer = {seconds:1500, total:1500, running:false, interval:null, mode:"Focus session"};

function today(){ return iso(new Date()); }
function iso(d){ return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
function load(){
  try { return {...seed,...JSON.parse(localStorage.getItem(KEY)||"{}")}; }
  catch { return {...seed}; }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function toast(msg){
  const t=$("#toast"); $(".toast p").textContent=msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove("show"),2400);
}
function addActivity(title,sub,icon="✓"){ state.activity.unshift([title,sub,"just now",icon]); state.activity=state.activity.slice(0,6); }

function renderTasks(){
  const lists=[$("#taskList"),$("#allTaskList")].filter(Boolean);
  const filtered=state.tasks.filter(t=>taskFilter==="all" || (taskFilter==="active"&&!t.done) || (taskFilter==="completed"&&t.done));
  const html=filtered.map(t=>`
    <div class="task ${t.done?"done":""}" data-id="${t.id}">
      <button class="check ${t.done?"checked":""}" data-action="toggle" aria-label="Toggle task">${t.done?"✓":""}</button>
      <span class="task-title">${esc(t.title)}</span>
      <span class="tag ${esc(t.category)}">${esc(t.category)}</span>
      <span class="task-time">${esc(t.time||"Anytime")}</span>
      <span class="task-actions"><button data-action="edit" title="Edit">✎</button><button data-action="delete" title="Delete">×</button></span>
    </div>`).join("") || `<div class="empty-state">No tasks in this filter. Nice work.</div>`;
  lists.forEach((el,i)=>el.innerHTML=i===0?html:html);
  $("#taskCount").textContent=`${filtered.length} task${filtered.length===1?"":"s"}`;
  updateStats();
}
function updateStats(){
  const total=state.tasks.length, done=state.tasks.filter(t=>t.done).length, active=total-done;
  $("#totalTasks").textContent=total; $("#completedTasks").textContent=done; $("#progressTasks").textContent=active;
  const percent=total?Math.round(done/total*100):0;
  $("#overallPercent").textContent=percent+"%"; $("#overallBar").style.width=percent+"%";
}
function renderCourses(){
  const html=state.courses.map(c=>`
    <article class="course-card">
      <div class="course-logo">${esc(c.icon)}</div><h3>${esc(c.title)}</h3><p>${esc(c.sub)}</p>
      <div class="course-progress"><span>Progress</span><b>${c.progress}%</b></div>
      <div class="course-bar"><i style="width:${c.progress}%"></i></div><span class="course-open">Continue →</span>
    </article>`).join("");
  $("#courseGrid").innerHTML=html; $("#allCourseGrid").innerHTML=html;
}
function renderNotes(){
  $("#recentNotes").innerHTML=state.notes.slice(0,3).map(n=>`
    <button class="note-row note-select" data-note="${n.id}"><span class="note-dot">▤</span><span><strong>${esc(n.title)}</strong><small>Updated ${relative(n.updated)}</small></span></button>`).join("");
  $("#notesList").innerHTML=state.notes.map(n=>`
    <button class="note-select ${selectedNote===n.id?"active":""}" data-note="${n.id}"><strong>${esc(n.title)}</strong><small>Updated ${relative(n.updated)}</small></button>`).join("") || `<p class="muted">No notes yet.</p>`;
  const n=state.notes.find(x=>x.id===selectedNote);
  $("#noteTitle").value=n?.title||""; $("#noteBody").value=n?.body||""; $("#editorStatus").textContent=n?`Last saved ${relative(n.updated)}`:"No note selected";
}
function relative(ts){const m=Math.max(1,Math.round((Date.now()-ts)/60000));return m<60?`${m} min ago`:m<1440?`${Math.round(m/60)} hours ago`:`${Math.round(m/1440)} day${m>=2880?"s":""} ago`;}
function renderActivity(){
  $("#activityList").innerHTML=state.activity.slice(0,5).map(a=>`<div class="activity-row"><span class="activity-icon">${esc(a[3])}</span><div><strong>${esc(a[0])}</strong><small>${esc(a[1])} · ${esc(a[2])}</small></div></div>`).join("");
}
function renderAll(){renderTasks();renderCourses();renderNotes();renderActivity();renderCalendar();}

function openModal(){ $("#modalBackdrop").classList.add("open"); $("#taskTitle").focus(); $("#taskDate").value=today();}
function closeModal(){ $("#modalBackdrop").classList.remove("open"); $("#taskForm").reset(); $("#taskTime").value="18:00";}
function submitTask(e){
  e.preventDefault();
  const task={id:Date.now(),title:$("#taskTitle").value.trim(),category:$("#taskCategory").value,time:$("#taskTime").value,date:$("#taskDate").value||today(),done:false};
  if(!task.title)return;
  state.tasks.push(task); addActivity("New Task Added",task.title,"+"); save(); renderAll(); closeModal(); toast("Task added — go get it.");
}
function taskAction(e){
  const btn=e.target.closest("[data-action]"); if(!btn)return;
  const row=btn.closest(".task"); const id=Number(row.dataset.id); const t=state.tasks.find(x=>x.id===id);
  if(!t)return;
  if(btn.dataset.action==="toggle"){t.done=!t.done;addActivity(t.done?"Task Completed":"Task Reopened",t.title,t.done?"✓":"↻");toast(t.done?"Task completed!":"Task reopened.");}
  if(btn.dataset.action==="delete"){state.tasks=state.tasks.filter(x=>x.id!==id);addActivity("Task Deleted",t.title,"×");toast("Task removed.");}
  if(btn.dataset.action==="edit"){const next=prompt("Edit task name:",t.title);if(next?.trim()){t.title=next.trim();toast("Task updated.");}}
  save();renderAll();
}

function nav(view){
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${view}`));
  window.scrollTo({top:0,behavior:"smooth"}); $("#sidebar").classList.remove("open");
  if(view==="calendar")renderCalendar();
}
function initNav(){
  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-view]"); if(b)nav(b.dataset.view);
  });
  $$(".nav-item").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.view)));
}

function setupTimer(){
  const update=()=>{
    const mins=String(Math.floor(timer.seconds/60)).padStart(2,"0"),secs=String(timer.seconds%60).padStart(2,"0");
    ["#miniTimer","#mainTimer"].forEach(s=>{if($(s))$(s).textContent=`${mins}:${secs}`});
    $("#timerLabel").textContent=timer.mode;
    const pct=timer.total?timer.seconds/timer.total:1;
    const deg=Math.max(3,pct*360);
    ["#miniTimerRing","#mainTimerRing"].forEach(s=>{if($(s))$(s).style.background=`conic-gradient(#a34cff 0 ${deg*.35}%,#4f66ff ${deg*.35}% ${deg}%,#19304f ${deg}% 100%)`;});
  };
  const start=()=>{
    if(timer.running)return;
    timer.running=true; $("#miniStart").textContent="Ⅱ"; $("#mainStart").textContent="Pause focus";
    timer.interval=setInterval(()=>{
      timer.seconds--;update();
      if(timer.seconds<=0){clearInterval(timer.interval);timer.running=false;timer.seconds=timer.total;toast("Session complete. Take your break.");$("#miniStart").textContent="▶";$("#mainStart").textContent="Start focus";addActivity("Focus Session Complete",timer.mode,"◷");save();renderActivity();}
    },1000);
  };
  const pause=()=>{clearInterval(timer.interval);timer.running=false;$("#miniStart").textContent="▶";$("#mainStart").textContent="Start focus";};
  const reset=()=>{pause();timer.seconds=timer.total;update();};
  $("#miniStart").onclick=()=>timer.running?pause():start(); $("#mainStart").onclick=()=>timer.running?pause():start();
  $("#miniReset").onclick=reset; $("#mainReset").onclick=reset;
  $$(".timer-presets button").forEach(b=>b.onclick=()=>{const m=Number(b.dataset.minutes);timer.total=m*60;timer.seconds=timer.total;timer.mode=m===25?"Focus session":m===5?"Short break":"Long break";$$(".timer-presets button").forEach(x=>x.classList.toggle("selected",x===b));update();});
  $$(".big-presets button").forEach(b=>b.onclick=()=>{const m=Number(b.dataset.mainMinutes);timer.total=m*60;timer.seconds=timer.total;timer.mode=m===25?"Focus session":"Break session";$$(".big-presets button").forEach(x=>x.classList.toggle("selected",x===b));update();});
  update();
}

function renderCalendar(){
  const y=calDate.getFullYear(),m=calDate.getMonth();
  $("#monthTitle").textContent=calDate.toLocaleString(undefined,{month:"long",year:"numeric"});
  const first=new Date(y,m,1), start=new Date(y,m,1-first.getDay()), days=[];
  for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);days.push(d);}
  $("#calendarDays").innerHTML=days.map(d=>{
    const ds=iso(d), muted=d.getMonth()!==m, isToday=ds===today(), sel=ds===selectedDay, has=state.tasks.some(t=>t.date===ds);
    return `<button class="${muted?"muted ":""}${isToday?"today ":""}${sel?"selected ":""}${has?"has-task":""}" data-date="${ds}">${d.getDate()}</button>`;
  }).join("");
  $("#selectedDate").textContent=new Date(selectedDay+"T12:00:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
  const tasks=state.tasks.filter(t=>t.date===selectedDay);
  $("#dayTasks").innerHTML=tasks.length?tasks.map(t=>`<div class="day-task"><b>${esc(t.title)}</b><small>${esc(t.time||"Anytime")} · ${esc(t.category)} ${t.done?"· Completed":""}</small></div>`).join(""):`<p class="muted">No tasks scheduled. A blank day can be a useful day.</p>`;
}
$("#calendarDays").addEventListener("click",e=>{const b=e.target.closest("[data-date]");if(b){selectedDay=b.dataset.date;renderCalendar();}});
$("#prevMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar()};
$("#nextMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar()};

function setupNotes(){
  $("#newNoteBtn").onclick=()=>{const n={id:Date.now(),title:"Untitled note",body:"",updated:Date.now()};state.notes.unshift(n);selectedNote=n.id;save();renderNotes();$("#noteTitle").focus();};
  document.addEventListener("click",e=>{const b=e.target.closest("[data-note]");if(b){selectedNote=Number(b.dataset.note);renderNotes();}});
  $("#saveNoteBtn").onclick=()=>{const n=state.notes.find(x=>x.id===selectedNote);if(!n){toast("Create a note first.");return;}n.title=$("#noteTitle").value.trim()||"Untitled note";n.body=$("#noteBody").value;n.updated=Date.now();save();renderNotes();toast("Note saved locally.");addActivity("Note Updated",n.title,"▤");save();renderActivity();};
  $("#saveQuickNote").onclick=()=>{const body=$("#quickNote").value.trim();if(!body){toast("Write something first.");return;}const n={id:Date.now(),title:"Quick note",body,updated:Date.now()};state.notes.unshift(n);$("#quickNote").value="";save();renderNotes();toast("Quick note saved.");};
}

function setupTheme(){
  const stored=localStorage.getItem("studyhub_theme");if(stored==="light")document.body.classList.add("light");
  const toggle=()=>{document.body.classList.toggle("light");localStorage.setItem("studyhub_theme",document.body.classList.contains("light")?"light":"dark");$("#themeBtn").textContent=document.body.classList.contains("light")?"☀":"☾";};
  $("#themeBtn").onclick=toggle;$("#settingsTheme").onclick=()=>{toggle();$("#settingsTheme").classList.toggle("active",!document.body.classList.contains("light"));};
  $("#motionSwitch").onclick=()=>{$("#motionSwitch").classList.toggle("active");document.body.classList.toggle("no-motion");};
}
function setupSearch(){
  const input=$("#globalSearch");
  input.oninput=()=>{
    const q=input.value.toLowerCase().trim();
    if(!q){renderTasks();renderNotes();return;}
    const hits=state.tasks.filter(t=>`${t.title} ${t.category}`.toLowerCase().includes(q));
    $("#taskList").innerHTML=hits.map(t=>`
      <div class="task ${t.done?"done":""}" data-id="${t.id}"><button class="check ${t.done?"checked":""}" data-action="toggle">${t.done?"✓":""}</button><span class="task-title">${esc(t.title)}</span><span class="tag">${esc(t.category)}</span><span class="task-time">${esc(t.time)}</span><span class="task-actions"><button data-action="delete">×</button></span></div>`).join("")||`<div class="empty-state">No matching tasks.</div>`;
    nav("dashboard");
  };
  document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();input.focus();}});
}
function setupMisc(){
  $("#year").textContent=new Date().getFullYear();
  $("#menuBtn").onclick=()=>$("#sidebar").classList.add("open");$("#mobileClose").onclick=()=>$("#sidebar").classList.remove("open");
  $("#notificationBtn").onclick=()=>$("#notificationPop").classList.toggle("show");
  $("#fullscreenBtn").onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
  $("#modalClose").onclick=closeModal;$("#modalBackdrop").onclick=e=>{if(e.target.id==="modalBackdrop")closeModal()};document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
  $("#addTaskBtn").onclick=openModal;$("#addTaskBtn2").onclick=openModal;$("#taskForm").onsubmit=submitTask;
  $("#taskList").addEventListener("click",taskAction);$("#allTaskList").addEventListener("click",taskAction);
  $$(".filter").forEach(b=>b.onclick=()=>{taskFilter=b.dataset.filter;$$(".filter").forEach(x=>x.classList.toggle("active",x===b));renderTasks();});
  $("#clearData").onclick=()=>{if(confirm("Clear all local tasks and notes?")){localStorage.removeItem(KEY);location.reload();}};
  document.addEventListener("mousemove",e=>{const g=$(".cursor-glow");g.style.left=e.clientX+"px";g.style.top=e.clientY+"px";});
}
initNav();setupTimer();setupNotes();setupTheme();setupSearch();setupMisc();renderAll();
