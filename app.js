const STORAGE_KEY = 'cfhm_activities_v1'
const STORAGE_USERS = 'cfhm_users_v1'

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}

function load(){
  try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):[] }catch(e){return[]}
}
function save(items){localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}

function loadUsers(){
  try{const raw=localStorage.getItem(STORAGE_USERS);return raw?JSON.parse(raw):[] }catch(e){return[]}
}
function saveUsers(items){localStorage.setItem(STORAGE_USERS,JSON.stringify(items))}

function qs(id){return document.getElementById(id)}

function formatDate(dt){
  if(!dt) return ''
  const d=new Date(dt)
  return d.toLocaleString()
}

function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"
})[c])}

/* Activity rendering & CRUD */
function render(){
  const list=qs('activities');list.innerHTML=''
  const q=qs('search').value.trim().toLowerCase();
  const filter=qs('filter').value
  let items=load()
  if(filter==='upcoming') items=items.filter(i=>new Date(i.datetime)>new Date())
  if(filter==='completed') items=items.filter(i=>i.completed)
  if(q) items=items.filter(i=>[i.title,i.type,i.description].join(' ').toLowerCase().includes(q))
  items.sort((a,b)=>new Date(a.datetime)-new Date(b.datetime))
  if(items.length===0){list.innerHTML='<li class="activity"><div class="meta">No activities found.</div></li>';return}
  for(const it of items){
    const li=document.createElement('li');li.className='activity'+(it.completed? ' completed':'')
    if(it.color){ li.style.borderLeft = '6px solid '+it.color; li.style.paddingLeft = '.6rem' }
    const left=document.createElement('div');
    left.innerHTML=`<div class="title"><strong>${escapeHtml(it.title)}</strong></div>
      <div class="meta">${escapeHtml(it.type)} • ${formatDate(it.datetime)}</div>
      ${it.recurrence? `<div class="meta">Recurrence: ${escapeHtml(it.recurrence)}</div>`: ''}
      <div class="meta">${escapeHtml(it.description||'')}</div>`
    const actions=document.createElement('div');actions.className='actions'
    const toggle=document.createElement('button');toggle.textContent=it.completed? 'Mark Open':'Complete';toggle.onclick=()=>toggleComplete(it.id)
    const edit=document.createElement('button');edit.textContent='Edit';edit.onclick=()=>{showTab('activity');editActivity(it.id)}
    const del=document.createElement('button');del.textContent='Delete';del.onclick=()=>deleteActivity(it.id)
    actions.appendChild(toggle);actions.appendChild(edit);actions.appendChild(del)
    li.appendChild(left);li.appendChild(actions);list.appendChild(li)
  }
}

function addOrUpdate(e){
  e.preventDefault()
  const id=qs('activity-id').value
  const title=qs('title').value.trim();
  const datetime=qs('datetime').value;
  const type=qs('type').value;
  const description=qs('description').value.trim();
  if(!title||!datetime) return alert('Please provide title and date/time')
  const items=load()
  if(id){
    const idx=items.findIndex(x=>x.id===id);if(idx>-1){items[idx]={...items[idx],title,datetime,type,description}}
  }else{
    items.push({id:uid(),title,datetime,type,description,completed:false})
  }
  save(items);resetForm();render();
}

function editActivity(id){
  const items=load();const it=items.find(x=>x.id===id);if(!it) return
  qs('activity-id').value=it.id;qs('title').value=it.title;qs('datetime').value=it.datetime;qs('type').value=it.type;qs('description').value=it.description;qs('form-title').textContent='Edit Activity'
}

function deleteActivity(id){if(!confirm('Delete this activity?')) return;const items=load().filter(x=>x.id!==id);save(items);render()}

function toggleComplete(id){const items=load();const i=items.find(x=>x.id===id);if(i){i.completed=!i.completed;save(items);render()}}

function resetForm(){qs('activity-form').reset();qs('activity-id').value='';qs('form-title').textContent='Add Activity';const m=qs('activity-modal');if(m) m.classList.remove('show')}

function exportData(){const items=load();const blob=new Blob([JSON.stringify(items, null, 2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='cfhm_activities.json';a.click();URL.revokeObjectURL(url)}

function importFile(file){if(!file) return;const r=new FileReader();r.onload=()=>{
  try{const imported=JSON.parse(r.result);if(!Array.isArray(imported)) throw new Error('Invalid')
    const existing=load();const merged=[...existing]
    for(const it of imported){if(!it.id) it.id=uid(); if(!merged.find(x=>x.id===it.id)) merged.push(it)}
    save(merged);render();alert('Import complete')
  }catch(err){alert('Failed to import: invalid file')}
}
 r.readAsText(file)}

/* Users rendering & CRUD */
function renderUsers(){
  const list=qs('users-list');list.innerHTML=''
  const users=loadUsers()
  if(users.length===0){list.innerHTML='<li class="user-item"><div class="user-meta">No users added.</div></li>';return}
  for(const u of users){
    const li=document.createElement('li');li.className='user-item'
    const left=document.createElement('div');left.innerHTML=`<div><strong>${escapeHtml(u.name)}</strong></div><div class="user-meta">${escapeHtml(u.role||'')} ${u.email? '• '+escapeHtml(u.email):''} ${u.phone? '• '+escapeHtml(u.phone):''}</div>`
    const actions=document.createElement('div');
    const edit=document.createElement('button');edit.textContent='Edit';edit.onclick=()=>{showTab('users');editUser(u.id)}
    const del=document.createElement('button');del.textContent='Delete';del.onclick=()=>deleteUser(u.id)
    actions.appendChild(edit);actions.appendChild(del)
    li.appendChild(left);li.appendChild(actions);list.appendChild(li)
  }
}

function addOrUpdateUser(e){
  e.preventDefault()
  const id=qs('user-id').value
  const name=qs('user-name').value.trim();
  const role=qs('user-role').value.trim();
  const email=qs('user-email').value.trim();
  const phone=qs('user-phone').value.trim();
  if(!name) return alert('Please provide the user name')
  const users=loadUsers()
  if(id){
    const idx=users.findIndex(x=>x.id===id);if(idx>-1){users[idx]={...users[idx],name,role,email,phone}}
  }else{
    users.push({id:uid(),name,role,email,phone})
  }
  saveUsers(users);resetUserForm();renderUsers();
}

function editUser(id){const users=loadUsers();const u=users.find(x=>x.id===id);if(!u) return;qs('user-id').value=u.id;qs('user-name').value=u.name;qs('user-role').value=u.role||'';qs('user-email').value=u.email||'';qs('user-phone').value=u.phone||'';qs('user-form-title').textContent='Edit User'}

function deleteUser(id){if(!confirm('Delete this user?')) return;const users=loadUsers().filter(x=>x.id!==id);saveUsers(users);renderUsers()}

function resetUserForm(){qs('user-form').reset();qs('user-id').value='';qs('user-form-title').textContent='Manage Users'}

/* Tabs */
function showTab(name){const tabs=document.querySelectorAll('.tab');for(const t of tabs){t.style.display='none'};const btns=document.querySelectorAll('.tab-btn');for(const b of btns){b.classList.remove('active')}const sel=document.getElementById(name+'-tab');if(sel) sel.style.display='block';const activeBtn=document.querySelector(`.tab-btn[data-tab="${name}"]`);if(activeBtn) activeBtn.classList.add('active')}

function attach(){
  qs('activity-form').addEventListener('submit',addOrUpdate);
  qs('reset-btn').addEventListener('click',resetForm);
  qs('search').addEventListener('input',render);
  qs('filter').addEventListener('change',render);
  qs('export').addEventListener('click',exportData);
  qs('import-file').addEventListener('change',e=>importFile(e.target.files[0]));
  window.addEventListener('storage',()=>{render();renderUsers()})

  // user form
  qs('user-form').addEventListener('submit',addOrUpdateUser);
  qs('user-reset').addEventListener('click',resetUserForm);

  // tabs
  const tabBtns=document.querySelectorAll('.tab-btn');for(const b of tabBtns){b.addEventListener('click',()=>{showTab(b.dataset.tab)})}
}

function nextOccurrence(weekday, timeStr){
  // weekday: 0=Sunday,1=Monday,...6=Saturday
  // timeStr: 'HH:MM' (24h)
  const parts=timeStr.split(':').map(Number)
  const now=new Date()
  const target=new Date(now)
  target.setHours(parts[0]||0, parts[1]||0, 0, 0)
  const delta=(weekday - target.getDay() + 7) % 7
  if(delta===0 && target<=now){
    // same day but time passed -> move one week ahead
    target.setDate(target.getDate()+7)
  }else{
    target.setDate(target.getDate()+delta)
  }
  return target.toISOString()
}

function nextLastWeekdayOfMonth(weekday, timeStr){
  // weekday: 0=Sunday...6=Saturday. timeStr: 'HH:MM'
  const parts = timeStr.split(':').map(Number)
  const now = new Date()
  const makeForMonth = (year, month) => {
    const lastDay = new Date(year, month+1, 0)
    const offset = (lastDay.getDay() - weekday + 7) % 7
    const d = new Date(year, month, lastDay.getDate() - offset)
    d.setHours(parts[0]||0, parts[1]||0, 0, 0)
    return d
  }
  // try this month
  let target = makeForMonth(now.getFullYear(), now.getMonth())
  if(target <= now){
    // move to next month
    const m = now.getMonth()+1
    const y = now.getFullYear() + (m>11?1:0)
    const mm = m % 12
    target = makeForMonth(y, mm)
  }
  return target.toISOString()
}

function seedDefaultActivities(){
  try{
    if(localStorage.getItem('cfhm_seeded_v1')) return
    const items=load()
    const existsTitle = (title)=> items.find(i=>i.title && i.title.toLowerCase()===title.toLowerCase())
    // Seed Tuesday service: Tue 10:00 — 14:00 (red)
    if(!existsTitle('Tuesday Service')){
      items.push({id:uid(),title:'Tuesday Service',datetime:nextOccurrence(2,'10:00'),type:'Service',description:'Weekly Tuesday service — 10:00 to 14:00',completed:false,recurrence:'weekly',color:'#e53935'})
    }
    // Seed Sunday service: Sun 9:00 — 12:30 (blue)
    if(!existsTitle('Sunday Service')){
      items.push({id:uid(),title:'Sunday Service',datetime:nextOccurrence(0,'09:00'),type:'Service',description:'Weekly Sunday service — 09:00 to 12:30',completed:false,recurrence:'weekly',color:'#1e88e5'})
    }
    // Seed Last Friday Vigil: last Friday monthly, all-night (start 22:00), purple
    if(!existsTitle('Last Friday Vigil')){
      items.push({id:uid(),title:'Last Friday Vigil',datetime:nextLastWeekdayOfMonth(5,'22:00'),type:'Vigil',description:'Monthly last-Friday all-night prayer (starts 22:00)',completed:false,recurrence:'monthly',color:'#8e24aa'})
    }
    if(items.length) save(items)
    localStorage.setItem('cfhm_seeded_v1','1')
  }catch(e){console.warn('Seeding failed',e)}
}

document.addEventListener('DOMContentLoaded',()=>{
  // hamburger menu
  const menuToggle=qs('menu-toggle')
  if(menuToggle){
    menuToggle.addEventListener('click',()=>{
      const container=qs('container')
      if(container){
        container.classList.toggle('menu-open')
      }
    })
  }

  // profile modal - click image or button to open
  const prophImageBtn=qs('prophet-image-btn'), profileBtn=qs('profile-btn'), profileModal=qs('profile-modal'), closeProfile=qs('close-profile')
  const openProfile=()=>{profileModal.classList.add('show')}
  const closeProfileModal=()=>{profileModal.classList.remove('show')}
  
  if(prophImageBtn) prophImageBtn.addEventListener('click',openProfile)
  if(profileBtn) profileBtn.addEventListener('click',openProfile)
  if(closeProfile) closeProfile.addEventListener('click',closeProfileModal)
  if(profileModal) profileModal.addEventListener('click',(e)=>{if(e.target===profileModal) closeProfileModal()})

  // activity modal
  const addActivityBtn=qs('add-activity-btn'), activityModal=qs('activity-modal'), closeActivity=qs('close-activity')
  if(addActivityBtn){
    addActivityBtn.addEventListener('click',()=>{activityModal.classList.add('show')})
    closeActivity.addEventListener('click',()=>{activityModal.classList.remove('show')})
    activityModal.addEventListener('click',(e)=>{if(e.target===activityModal) activityModal.classList.remove('show')})
  }

  attach();showTab('users');seedDefaultActivities();render();renderUsers()
})
