const USERS_KEY = 'cfhm_users_v1'
const SESSION_KEY = 'cfhm_session'

function qs(id){return document.getElementById(id)}

async function hashPassword(pw){
  const enc=new TextEncoder().encode(pw)
  const hash=await crypto.subtle.digest('SHA-256',enc)
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('')
}

function normalizePhone(p){
  if(!p) return ''
  return String(p).replace(/[^0-9+]/g,'')
}

function loadUsers(){try{const raw=localStorage.getItem(USERS_KEY);return raw?JSON.parse(raw):[]}catch(e){return[]}}
function saveUsers(u){localStorage.setItem(USERS_KEY,JSON.stringify(u))}

function showMsg(m,err=false){const el=qs('auth-msg');el.textContent=m;el.style.color=err? '#b00020':'#1a6ed8'}

async function register(data){
  const users=loadUsers()
  const phone=normalizePhone(data.phone)
  if(!phone || !data.password) return showMsg('Phone and password required',true)
  if(data.password.length<6) return showMsg('Password too short',true)
  if(users.find(u=>u.phone===phone)) return showMsg('An account with that phone exists',true)
  const hash=await hashPassword(data.password)
  users.push({id:Date.now().toString(36),name:data.name||'',role:data.role||'',phone:phone,passwordHash:hash})
  saveUsers(users)
  showMsg('Registration successful — you can now sign in')
  return true
}

async function login(phone,password){
  const users=loadUsers();const p=normalizePhone(phone);const h=await hashPassword(password)
  const u=users.find(x=>x.phone===p && x.passwordHash===h)
  if(!u) return showMsg('Invalid credentials',true)
  sessionStorage.setItem(SESSION_KEY,JSON.stringify({userId:u.id,name:u.name,phone:u.phone}))
  showMsg('Signed in — redirecting...')
  setTimeout(()=>{window.location.href='index.html'},700)
}

function attach(){
  const modeLogin=qs('mode-login'), modeReg=qs('mode-register')
  const form=qs('auth-form'), submit=qs('auth-submit')
  modeLogin.addEventListener('click',()=>{
    modeLogin.classList.add('active');modeReg.classList.remove('active')
    qs('register-fields').style.display='none';qs('register-extra').style.display='none';qs('auth-title').textContent='Sign In';submit.textContent='Sign In'
  })
  modeReg.addEventListener('click',()=>{
    modeLogin.classList.remove('active');modeReg.classList.add('active')
    qs('register-fields').style.display='block';qs('register-extra').style.display='block';qs('auth-title').textContent='Register';submit.textContent='Register'
  })

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const isReg = modeReg.classList.contains('active')
    const phone=qs('auth-phone').value.trim();
    const pw=qs('auth-password').value
    if(isReg){
      const name=qs('reg-name').value.trim();
      const role=qs('reg-role').value.trim();
      const pw2=qs('auth-password-confirm').value
      if(pw!==pw2) return showMsg('Passwords do not match',true)
      const ok=await register({name,role,phone,password:pw})
      if(ok){modeLogin.click();form.reset()}
    }else{
      await login(phone,pw)
    }
  })
}

document.addEventListener('DOMContentLoaded',attach)
