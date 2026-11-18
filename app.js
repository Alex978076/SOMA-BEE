const STORE_KEY = 'soma_demo_v1';
const SESSION_KEY = 'soma_session_v1';
const categories = {
  'Estudo': { icon: '🎓', color: '#806eff' },
  'Rotina': { icon: '🏠', color: '#e2a63d' },
  'Academia': { icon: '🏋️', color: '#36bce5' },
  'Saúde': { icon: '🌱', color: '#35cd91' },
  'Trabalho': { icon: '💼', color: '#7e6cff' },
  'Outros': { icon: '✦', color: '#e27cba' }
};
const defaultState = () => {
  const today = new Date();
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const plus = n => { const d = new Date(today); d.setDate(d.getDate()+n); return iso(d); };
  return {
    user: { name: 'José Antônio', email: 'jose@soma.app' },
    level: 5, xp: 320, xpNext: 500, coins: 2350, gems: 8, streak: 4,
    tasks: [
      {id:101,title:'Revisar matemática',category:'Estudo',time:'08:00',date:plus(0),done:true,rewarded:true},
      {id:102,title:'Enviar relatório',category:'Trabalho',time:'11:30',date:plus(0),done:false},
      {id:103,title:'Estudar para prova',category:'Estudo',time:'15:00',date:plus(0),done:false},
      {id:104,title:'Treino na academia',category:'Academia',time:'18:00',date:plus(0),done:false},
      {id:105,title:'Ler por 20 minutos',category:'Outros',time:'20:30',date:plus(0),done:false},
      {id:106,title:'Organizar a semana',category:'Rotina',time:'09:00',date:plus(1),done:false}
    ],
    goals: [
      {id:201,title:'Finalizar curso de programação',description:'Avançar nas aulas e concluir os módulos.',category:'Estudo',progress:68,target:100,rewarded:false},
      {id:202,title:'Correr 5 km sem parar',description:'Manter uma rotina saudável de treinos.',category:'Saúde',progress:34,target:100,rewarded:false},
      {id:203,title:'Economizar para meu setup',description:'Guardar uma parte do dinheiro todo mês.',category:'Rotina',progress:52,target:100,rewarded:false},
      {id:204,title:'Estudar inglês 4x na semana',description:'Praticar um pouco todos os dias.',category:'Estudo',progress:75,target:100,rewarded:false},
      {id:205,title:'Manter rotina de leitura',description:'Ler com frequência e registrar o progresso.',category:'Outros',progress:20,target:100,rewarded:false}
    ],
    events: [
      {id:301,title:'Trabalho',date:plus(0),start:'08:00',end:'12:00',category:'Trabalho'},
      {id:302,title:'Almoço',date:plus(0),start:'12:30',end:'13:30',category:'Rotina'},
      {id:303,title:'Projeto',date:plus(0),start:'14:00',end:'16:00',category:'Estudo'},
      {id:304,title:'Treino',date:plus(0),start:'19:30',end:'20:30',category:'Academia'},
      {id:305,title:'Leitura',date:plus(1),start:'20:00',end:'20:40',category:'Estudo'},
      {id:306,title:'Planejar a semana',date:plus(2),start:'09:00',end:'09:30',category:'Rotina'}
    ],
    city: { buildings: 3, parks: 1, level: 8, progress: 750, next: 900, bought: [] },
    settings: { notifications: true, reminders: true, sounds: false }
  };
};
let state = loadState();
let currentPage = 'inicio';
let taskFilter = 'Todas';
let taskSearch = '';
let weekOffset = 0;
let isRegister = false;
let toastTimer = null;

function loadState(){
  try { const saved = localStorage.getItem(STORE_KEY); if(saved) return {...defaultState(),...JSON.parse(saved)}; } catch(e) { console.warn('Não foi possível ler os dados locais.',e); }
  return defaultState();
}
function persist(){ try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch(e) { console.warn('Não foi possível salvar os dados.',e); } }
function esc(value){ return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function todayISO(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function dateFromISO(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function isoDate(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function dateLabel(s, opts={day:'2-digit',month:'short'}){ return dateFromISO(s).toLocaleDateString('pt-BR',opts); }
function categoryIcon(name){ return (categories[name]||categories.Outros).icon; }
function categoryColor(name){ return (categories[name]||categories.Outros).color; }
function categoryOptions(selected){ return Object.keys(categories).map(c=>`<option value="${c}" ${c===selected?'selected':''}>${categoryIcon(c)} ${c}</option>`).join(''); }
function taskStats(){ const all=state.tasks.filter(t=>t.date===todayISO()); const done=all.filter(t=>t.done).length; return {all,done,total:all.length,pct:all.length?Math.round(done/all.length*100):0}; }
function greeting(){ const h=new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; }
function setHeader(title){ document.getElementById('breadcrumbTitle').textContent=title; }
function updateSidebar(){
  document.getElementById('sidebarUser').textContent=state.user.name;
  document.getElementById('sideLevel').textContent=state.level;
  document.getElementById('sideXp').textContent=`${state.xp}/${state.xpNext} XP`;
  document.getElementById('sideXpBar').style.width=`${Math.min(100,state.xp/state.xpNext*100)}%`;
  document.getElementById('taskNavCount').textContent=state.tasks.filter(t=>!t.done).length;
  document.querySelectorAll('.nav-link[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===currentPage));
}
function render(){
  updateSidebar();
  const pages={
    inicio:['Hoje',renderHome], tarefas:['Minhas tarefas',renderTasks], planejamento:['Planejamento',renderPlanner], metas:['Minhas metas',renderGoals], cidade:['Minha cidade',renderCity], perfil:['Meu perfil',renderProfile], conquistas:['Conquistas',renderAchievements], recompensas:['Recompensas',renderRewards], configuracoes:['Configurações',renderSettings]
  };
  const [title,fn]=pages[currentPage]||pages.inicio;
  setHeader(title);
  const theme={inicio:'light',tarefas:'light',recompensas:'green'}[currentPage]||'navy';
  document.body.dataset.theme=theme; document.body.dataset.page=currentPage; document.body.classList.toggle('lg',theme!=='navy');
  document.getElementById('pageContent').innerHTML=fn()+(currentPage==='tarefas'?'<button class="fab" onclick="openModal(\'task\')" aria-label="Nova tarefa">+</button>':'');
  const now=new Date();
  document.getElementById('topDate').textContent=now.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).replace(/^./,c=>c.toUpperCase());
  persist();
}
function setPage(page){ currentPage=page; document.getElementById('sidebar').classList.remove('mobile-open'); render(); window.scrollTo({top:0,behavior:'smooth'}); }
function enterApp(){
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');
  render();
}
function enterAsGuest(){ if(!state.user?.name) state.user={name:'Visitante',email:''}; localStorage.setItem(SESSION_KEY,'1'); enterApp(); showToast('Bem-vindo ao SOMA! Explore sua cidade.'); }
function logout(){ localStorage.removeItem(SESSION_KEY); document.getElementById('appShell').classList.add('hidden'); document.getElementById('loginScreen').classList.remove('hidden'); showToast('Você saiu da demonstração.'); }
function togglePassword(){ const input=document.getElementById('loginPassword'); input.type=input.type==='password'?'text':'password'; }
function toggleRegister(){
  isRegister=!isRegister;
  document.getElementById('loginTitle').textContent=isRegister?'Crie sua conta':'Entre na sua cidade';
  document.getElementById('loginSubtitle').textContent=isRegister?'Comece a construir uma rotina que faz sentido.':'Continue de onde sua evolução parou.';
  document.getElementById('loginButtonText').textContent=isRegister?'Criar minha conta':'Entrar na minha conta';
  document.getElementById('signupCopy').textContent=isRegister?'Já tem uma conta?':'Ainda não tem uma conta?';
  document.getElementById('signupAction').textContent=isRegister?'Fazer login':'Criar conta';
}
document.getElementById('loginForm').addEventListener('submit',e=>{
  e.preventDefault();
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPassword').value;
  if(!email||pass.length<4){showToast('Informe um e-mail e uma senha com pelo menos 4 caracteres.','error');return;}
  if(isRegister){ const first=email.split('@')[0].replace(/[._-]/g,' '); state.user={name:first.split(' ').map(w=>w? w[0].toUpperCase()+w.slice(1):'').join(' '),email}; }
  else if(!state.user.email || state.user.email!==email){ state.user={name:email.split('@')[0].replace(/[._-]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),email}; }
  persist();
  if(document.getElementById('rememberMe').checked) localStorage.setItem(SESSION_KEY,'1'); else localStorage.removeItem(SESSION_KEY);
  enterApp(); showToast(isRegister?'Conta demonstrativa criada!':'Login demonstrativo realizado!');
  if(isRegister){toggleRegister();}
});
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('collapsed');}
function toggleMobileMenu(){document.getElementById('sidebar').classList.toggle('mobile-open');}
function showToast(message,type='success'){
  const host=document.getElementById('toastHost'); const el=document.createElement('div'); el.className=`toast ${type==='error'?'error':''}`;
  el.innerHTML=`<span class="toast-mark">${type==='error'?'!':'✓'}</span><span>${esc(message)}</span>`; host.appendChild(el);
  setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(8px)';setTimeout(()=>el.remove(),250);},3200);
}
function addXP(amount){
  state.xp+=amount; let leveled=false;
  while(state.xp>=state.xpNext){state.xp-=state.xpNext;state.level++;state.xpNext+=100;leveled=true;}
  if(leveled){state.coins+=100;showReward('Você subiu de nível!',`Agora você está no nível ${state.level}. Sua dedicação está construindo uma cidade incrível.`,100,0);}
}
function renderHome(){
  const stats=taskStats();
  const completed=state.tasks.filter(t=>t.done).length;
  const pct=state.tasks.length?Math.round(completed/state.tasks.length*100):0;
  const todayTasks=stats.all.slice().sort((a,b)=>a.time.localeCompare(b.time));
  const next=todayTasks.find(t=>!t.done);
  const goals=state.goals.slice(0,3);
  const recent=state.tasks.filter(t=>t.done).slice(-3).reverse();
  return `
    <section class="page-heading"><div><span class="eyebrow">SEU ESPAÇO DE EVOLUÇÃO</span><h1>${greeting()}, ${esc(state.user.name.split(' ')[0])}! <span>✦</span></h1><p>Um passo de cada vez. Veja o que você pode conquistar hoje.</p></div><div class="heading-actions"><button class="secondary-btn" onclick="setPage('planejamento')">▦ &nbsp; Ver planejamento</button><button class="primary-btn" onclick="openModal('task')">＋ &nbsp; Nova tarefa</button></div></section>
    <section class="stat-grid">
      <article class="card stat-card" style="--accent:#8271ff"><div class="stat-top"><span>Tarefas concluídas hoje</span><span class="stat-icon">✓</span></div><div class="stat-value">${stats.done}<small style="font-size:14px;color:#758fb1">/${stats.total||0}</small></div><div class="stat-foot"><strong>${stats.pct}%</strong> do seu dia concluído</div></article>
      <article class="card stat-card" style="--accent:#f2bd57"><div class="stat-top"><span>Moedas conquistadas</span><span class="stat-icon">◉</span></div><div class="stat-value">${state.coins.toLocaleString('pt-BR')}</div><div class="stat-foot">Continue completando missões</div></article>
      <article class="card stat-card" style="--accent:#44d99e"><div class="stat-top"><span>Dias de sequência</span><span class="stat-icon">♨</span></div><div class="stat-value">${state.streak} <small style="font-size:13px;color:#8099b9">dias</small></div><div class="stat-foot"><strong>Boa constância!</strong> mantenha o ritmo</div></article>
      <article class="card stat-card" style="--accent:#45c6ee"><div class="stat-top"><span>Nível da cidade</span><span class="stat-icon">⌂</span></div><div class="stat-value">${state.city.level}</div><div class="stat-foot">${state.city.progress}/${state.city.next} XP para evoluir</div></article>
    </section>
    <section class="dash-grid">
      <div class="card card-pad"><div class="card-title-row"><div><h3>Minhas tarefas de hoje</h3><p>Pequenas ações criam grandes resultados.</p></div><button class="tiny-link" onclick="setPage('tarefas')">Ver todas →</button></div>
        <div class="task-summary"><img src="assets/alvo.png" class="summary-target" alt="Alvo"/><div class="task-summary-text"><strong>${stats.done} de ${stats.total} tarefas concluídas</strong><span>${next?`Próxima missão: ${esc(next.title)}`:'Você concluiu tudo por hoje! 🎉'}</span><div class="progress-track" style="margin-top:8px"><span style="width:${stats.pct}%"></span></div></div><div class="task-summary-count">${stats.pct}%</div></div>
        <div class="task-list">${todayTasks.length?todayTasks.slice(0,5).map(taskRow).join(''):`<div class="empty-state"><div class="empty-icon">☀</div><strong>Seu dia está livre!</strong><p>Adicione uma tarefa para começar.</p></div>`}</div>
        <button class="secondary-btn" style="width:100%;margin-top:13px" onclick="openModal('task')">＋ Adicionar nova tarefa</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:15px">
        <div class="card city-preview"><div class="card-title-row"><div><h3>Minha cidade</h3><p>Seu progresso em forma de cidade.</p></div><button class="tiny-link" onclick="setPage('cidade')">Visitar →</button></div><div class="city-art-wrap"><img src="assets/cidade-principal.png" alt="Cidade do SOMA"/></div><div class="city-preview-foot"><div class="level-chip"><b>Nível ${state.city.level} <strong>•</strong> ${state.city.progress}/${state.city.next} XP</b><span>Uma cidade em constante evolução</span></div><div class="mini-city-progress"><div class="progress-track"><span style="width:${Math.min(100,state.city.progress/state.city.next*100)}%"></span></div></div></div></div>
        <div class="card card-pad"><div class="card-title-row"><div><h3>Metas em andamento</h3><p>Não perca seus objetivos de vista.</p></div><button class="tiny-link" onclick="setPage('metas')">Ver metas →</button></div><div class="goal-mini">${goals.map(g=>`<div class="goal-mini-row"><div class="goal-mini-icon">${categoryIcon(g.category)}</div><div class="goal-mini-info"><strong>${esc(g.title)}</strong><div class="progress-track"><span style="width:${g.progress}%"></span></div></div><span class="goal-mini-pct">${g.progress}%</span></div>`).join('')}</div></div>
      </div>
    </section>
    <section class="card card-pad section-gap"><div class="card-title-row"><div><h3>Atividade recente</h3><p>Suas últimas conquistas registradas.</p></div><span class="pill green">● Em evolução</span></div>${recent.length?recent.map(t=>`<div class="activity-line"><span class="activity-dot"></span><div><strong>${esc(t.title)}</strong><span>Missão concluída · ${esc(t.category)}</span></div><time>+50 moedas</time></div>`).join(''):`<div class="empty-state"><div class="empty-icon">✦</div><strong>Suas conquistas aparecerão aqui.</strong><p>Conclua uma tarefa para registrar sua primeira atividade.</p></div>`}</section>`;
}
function taskRow(t){ return `<div class="task-row ${t.done?'is-done':''}"><button class="task-check ${t.done?'done':''}" onclick="toggleTask(${t.id})" aria-label="${t.done?'Reabrir':'Concluir'} tarefa">${t.done?'✓':''}</button><span class="task-emoji">${categoryIcon(t.category)}</span><div class="task-main"><strong>${esc(t.title)}</strong><span>${esc(t.category)} · ${dateLabel(t.date,{day:'2-digit',month:'short'})}</span></div><span class="task-time">${esc(t.time||'Sem horário')}</span><button class="row-action" onclick="openModal('task-edit',${t.id})" title="Editar tarefa">✎</button><button class="row-action delete-action" onclick="deleteTask(${t.id})" title="Excluir tarefa">×</button></div>`; }
function renderTasks(){
  const today=taskStats();
  const filters=['Todas','Estudo','Rotina','Academia','Trabalho','Saúde','Outros'];
  let list=state.tasks.filter(t=>(taskFilter==='Todas'||t.category===taskFilter)&&(`${t.title} ${t.category}`.toLowerCase().includes(taskSearch.toLowerCase()))).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  const grouped={}; list.forEach(t=>(grouped[t.date]??=[]).push(t));
  const rows=Object.entries(grouped).map(([date,items])=>`<div style="margin-bottom:17px"><div class="card-title-row" style="margin:0 0 9px"><h3>${date===todayISO()?'Hoje':dateLabel(date,{weekday:'long',day:'2-digit',month:'long'})}</h3><span class="pill">${items.length} ${items.length===1?'tarefa':'tarefas'}</span></div><div class="all-task-list">${items.map(t=>taskRow(t)+`<div class="task-row-actions" style="display:none"></div>`).join('')}</div></div>`).join('');
  return `<section class="page-heading"><div><span class="eyebrow">ORGANIZE SUA ROTINA</span><h1>Minhas tarefas</h1><p>Transforme sua lista de afazeres em pequenas vitórias.</p></div><div class="heading-actions"><button class="primary-btn" onclick="openModal('task')">＋ &nbsp; Nova tarefa</button></div></section>
    <div class="toolbar"><div class="filter-tabs">${filters.map(f=>`<button class="filter-tab ${taskFilter===f?'active':''}" onclick="setTaskFilter('${f}')">${f==='Todas'?'▦':categoryIcon(f)} &nbsp;${f}</button>`).join('')}</div><label class="search-box">⌕ <input placeholder="Buscar tarefa..." value="${esc(taskSearch)}" oninput="setTaskSearch(this.value)" /></label></div>
    <div class="task-page-layout"><div class="card task-overview"><div class="task-summary"><img src="assets/alvo.png" class="summary-target" alt="Alvo"/><div class="task-summary-text"><strong>Seu progresso de hoje</strong><span>${today.done} de ${today.total} tarefas concluídas</span><div class="progress-track" style="margin-top:8px"><span style="width:${today.pct}%"></span></div></div><div class="task-summary-count">${today.pct}%</div></div>${rows||`<div class="empty-state"><div class="empty-icon">☷</div><strong>Nenhuma tarefa encontrada.</strong><p>Tente mudar o filtro ou adicione uma nova tarefa.</p></div>`}</div>
      <aside class="task-side"><div class="card card-pad"><div class="card-title-row"><h3>Resumo do dia</h3><span class="pill purple">Hoje</span></div><div class="daily-ring" style="--pct:${today.pct}%"><div><strong>${today.pct}%</strong><span>concluído</span></div></div><div class="category-legend"><div class="legend-row"><span style="--dot:#43d69b">Concluídas</span><b>${today.done}</b></div><div class="legend-row"><span style="--dot:#7c6cff">Pendentes</span><b>${today.total-today.done}</b></div></div></div>
      <div class="card tip-card"><div class="tip-emoji">💡</div><h3>Dica de produtividade</h3><p>Comece pela tarefa mais importante. Dividir grandes objetivos em pequenas ações torna o progresso mais leve.</p></div>
      <div class="card tip-card"><div class="tip-emoji">🔥</div><h3>Sua sequência</h3><p>Você está há <b style="color:#f5c768">${state.streak} dias</b> mantendo sua evolução. Continue assim!</p></div></aside></div>`;
}
function setTaskFilter(f){taskFilter=f;render();}
function setTaskSearch(v){taskSearch=v;const pos=window.scrollY;render();const input=document.querySelector('.search-box input');if(input){input.focus();input.setSelectionRange(v.length,v.length);}window.scrollTo(0,pos);}
function toggleTask(id){
  const t=state.tasks.find(x=>x.id===id); if(!t)return;
  t.done=!t.done;
  if(t.done && !t.rewarded){
    t.rewarded=true;
    state.coins+=50;addXP(20);state.city.progress+=15;
    while(state.city.progress>=state.city.next){state.city.progress-=state.city.next;state.city.level++;state.city.next+=150;}
    showToast('Tarefa concluída! +50 moedas e +20 XP.');
  }else if(t.done){showToast('Tarefa concluída novamente.');}
  else {showToast('Tarefa voltou para pendentes.');}
  persist();render();
}
function deleteTask(id){if(!confirm('Deseja excluir esta tarefa?'))return;state.tasks=state.tasks.filter(t=>t.id!==id);persist();render();showToast('Tarefa removida.');}
function renderPlanner(){
  const today=new Date();const monday=new Date(today);monday.setDate(today.getDate()-((today.getDay()+6)%7)+weekOffset*7);
  const days=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d;});
  const start=days[0].toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});const end=days[6].toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
  const short=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const cols=days.map(d=>{const iso=isoDate(d);const ev=state.events.filter(x=>x.date===iso).sort((a,b)=>a.start.localeCompare(b.start));return `<div class="calendar-day ${iso===todayISO()?'today':''}"><div class="day-heading"><span>${short[d.getDay()]}</span><strong>${d.getDate()}</strong></div>${ev.map(e=>`<div class="calendar-event" style="--event-color:${categoryColor(e.category)}" onclick="eventDetails(${e.id})"><small>${esc(e.start)} – ${esc(e.end)}</small>${esc(e.title)}</div>`).join('')}${ev.length===0?'<div style="text-align:center;color:#526d8d;font-size:9px;padding-top:18px">Sem eventos</div>':''}</div>`;}).join('');
  const upcoming=state.events.filter(e=>e.date>=todayISO()).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).slice(0,5);
  return `<section class="page-heading"><div><span class="eyebrow">PLANEJE COM INTENÇÃO</span><h1>Planejamento</h1><p>Visualize sua semana e reserve espaço para o que importa.</p></div><div class="heading-actions"><button class="primary-btn" onclick="openModal('event')">＋ &nbsp; Novo compromisso</button></div></section>
    <div class="planner-toolbar" style="margin-bottom:15px"><button class="small-icon-btn" onclick="changeWeek(-1)">‹</button><h3 class="week-label">${start} — ${end}</h3><button class="small-icon-btn" onclick="changeWeek(1)">›</button><button class="secondary-btn" style="padding:8px 12px;font-size:10px;margin-left:5px" onclick="weekOffset=0;render()">Hoje</button></div>
    <div class="planner-layout"><div class="card calendar-card"><div class="calendar-grid">${cols}</div></div><aside class="planner-side"><div class="card card-pad"><div class="card-title-row"><div><h3>Próximos compromissos</h3><p>O que vem pela frente.</p></div><span class="pill purple">Agenda</span></div><div class="agenda-list">${upcoming.length?upcoming.map(e=>`<div class="agenda-item"><time class="agenda-time">${esc(e.start)}</time><span class="agenda-mark" style="--event-color:${categoryColor(e.category)}"></span><div class="agenda-info"><strong>${esc(e.title)}</strong><span>${dateLabel(e.date,{day:'2-digit',month:'short'})} · ${esc(e.category)}</span></div></div>`).join(''):'<div class="empty-state"><strong>Agenda livre.</strong><p>Adicione um compromisso para começar.</p></div>'}</div></div>
      <div class="card tip-card"><div class="tip-emoji">🗓️</div><h3>Uma semana equilibrada</h3><p>Alterne períodos de foco com pausas. Um bom planejamento também inclui tempo para descansar.</p><button class="tiny-link" style="padding:12px 0 0" onclick="openModal('event')">Adicionar compromisso →</button></div></aside></div>`;
}
function changeWeek(n){weekOffset+=n;render();}
function eventDetails(id){const e=state.events.find(x=>x.id===id);if(!e)return;openModal('event-details',id);}
function renderGoals(){
  const done=state.goals.filter(g=>g.progress>=100).length;const avg=state.goals.length?Math.round(state.goals.reduce((a,g)=>a+g.progress,0)/state.goals.length):0;
  return `<section class="page-heading"><div><span class="eyebrow">SEUS OBJETIVOS, SEU CAMINHO</span><h1>Minhas metas</h1><p>Defina objetivos, acompanhe sua evolução e celebre cada conquista.</p></div><div class="heading-actions"><button class="primary-btn" onclick="openModal('goal')">＋ &nbsp; Nova meta</button></div></section>
    <section class="goals-overview"><div class="card goal-stat"><span>Metas ativas</span><strong>${state.goals.length-done}</strong></div><div class="card goal-stat"><span>Metas concluídas</span><strong>${done}</strong></div><div class="card goal-stat"><span>Progresso geral</span><strong>${avg}%</strong></div></section>
    <div class="card card-pad" style="margin-bottom:15px"><div class="card-title-row"><div><h3>Visão geral das metas</h3><p>Seu progresso acumulado em todos os objetivos.</p></div><span class="pill green">${avg}% concluído</span></div><div class="progress-track green" style="height:9px"><span style="width:${avg}%"></span></div></div>
    <div class="goal-grid">${state.goals.map(g=>`<article class="card goal-card"><div class="goal-card-head"><div class="goal-icon">${categoryIcon(g.category)}</div><div class="goal-title"><h3>${esc(g.title)}</h3><p>${esc(g.description||g.category)}</p></div><button class="goal-menu" onclick="deleteGoal(${g.id})" title="Excluir meta">⋯</button></div><div class="goal-progress"><span>Progresso</span><strong>${g.progress}%</strong></div><div class="progress-track ${g.progress>=100?'green':''}"><span style="width:${Math.min(100,g.progress)}%"></span></div><div class="goal-foot"><span>${g.progress>=100?'✦ Meta concluída':`Meta: ${g.target}%`}</span><div class="goal-actions"><button onclick="updateGoal(${g.id},-10)" ${g.progress<=0?'disabled':''}>−10%</button><button onclick="updateGoal(${g.id},10)" ${g.progress>=100?'disabled':''}>＋10%</button></div></div></article>`).join('')||'<div class="empty-state"><strong>Você ainda não tem metas.</strong><p>Crie sua primeira meta e acompanhe o progresso.</p></div>'}</div>`;
}
function updateGoal(id,amount){const g=state.goals.find(x=>x.id===id);if(!g)return;const was=g.progress>=100;g.progress=Math.max(0,Math.min(100,g.progress+amount));if(!was&&g.progress>=100&&!g.rewarded){g.rewarded=true;state.coins+=150;addXP(50);showReward('Meta concluída!',`Você finalizou “${g.title}”. Essa conquista merece ser celebrada!`,150,50);}else showToast(amount>0?'Progresso atualizado!':'Progresso ajustado.');persist();render();}
function deleteGoal(id){if(!confirm('Deseja excluir esta meta?'))return;state.goals=state.goals.filter(g=>g.id!==id);persist();render();showToast('Meta removida.');}
function renderCity(){
  const upgrades=[{id:'home',name:'Residencial',desc:'Amplie as moradias da cidade.',cost:1200,icon:'assets/casa.png',kind:'building'},{id:'shop',name:'Centro comercial',desc:'Mais movimento e oportunidades.',cost:1000,icon:'assets/cidade-predios.png',kind:'building'},{id:'park',name:'Parque ecológico',desc:'Traga mais verde para sua cidade.',cost:800,icon:'assets/cidade-secundaria.png',kind:'park'}];
  return `<section class="page-heading"><div><span class="eyebrow">SEU PROGRESSO GANHA FORMA</span><h1>Minha cidade</h1><p>Cada missão concluída ajuda seu mundo a crescer.</p></div><div class="heading-actions"><span class="pill purple">✦ Nível ${state.city.level}</span><span class="pill yellow">◉ ${state.coins.toLocaleString('pt-BR')} moedas</span></div></section>
    <section class="city-hero"><div class="card city-scene"><div class="city-scene-head"><div><h2>Sua cidade está crescendo!</h2><p>Continue evoluindo para desbloquear novas construções.</p></div><span class="city-level-badge">NÍVEL <b>${state.city.level}</b></span></div><div class="city-art-large"><img src="assets/cidade-principal.png" alt="Visão isométrica da cidade"/></div><div class="city-scene-foot"><div class="city-xp"><div><span>Experiência da cidade</span><strong>${state.city.progress}/${state.city.next} XP</strong></div><div class="progress-track green"><span style="width:${Math.min(100,state.city.progress/state.city.next*100)}%"></span></div></div><div class="city-resources"><span class="resource-chip"><img src="assets/moeda.png" alt=""/> <b>${state.coins.toLocaleString('pt-BR')}</b></span><span class="resource-chip">💎 <b>${state.gems}</b></span></div></div></div>
      <aside class="city-side"><div class="card city-profile-card"><div class="city-profile-top"><img src="assets/avatar.png" alt="Avatar"/><div><strong>${esc(state.user.name)}</strong><span>Prefeito(a) · Nível ${state.level}</span></div></div><div class="city-mini-stats"><div><strong>${state.city.buildings}</strong><span>Construções</span></div><div><strong>${state.city.parks}</strong><span>Áreas verdes</span></div><div><strong>${state.tasks.filter(t=>t.done).length}</strong><span>Missões feitas</span></div></div></div><div class="card card-pad"><div class="card-title-row"><h3>Próxima evolução</h3><span class="pill purple">Nível ${state.city.level+1}</span></div><p class="muted" style="font-size:10px;line-height:1.6">Complete tarefas para gerar experiência e desbloquear novas áreas e construções.</p><div class="progress-track" style="margin:12px 0 7px"><span style="width:${Math.min(100,state.city.progress/state.city.next*100)}%"></span></div><span class="muted" style="font-size:9px">${Math.max(0,state.city.next-state.city.progress)} XP restantes</span></div></aside></section>
    <section class="city-actions-grid"><button class="city-action-card" onclick="document.getElementById('upgradeSection').scrollIntoView({behavior:'smooth'})"><span>🏗️</span><strong>Construir</strong><small>Novas estruturas</small></button><button class="city-action-card" onclick="document.getElementById('upgradeSection').scrollIntoView({behavior:'smooth'})"><span>🔧</span><strong>Melhorar</strong><small>Evolua sua cidade</small></button><button class="city-action-card" onclick="setPage('conquistas')"><span>🏆</span><strong>Conquistas</strong><small>Veja seus troféus</small></button><button class="city-action-card" onclick="openModal('shop')"><span>🛍️</span><strong>Loja</strong><small>Itens especiais</small></button></section>
    <section id="upgradeSection"><div class="card-title-row"><div><h3>Próximas construções</h3><p>Invista suas moedas para expandir a cidade.</p></div><span class="pill yellow">◉ ${state.coins.toLocaleString('pt-BR')}</span></div><div class="upgrade-grid">${upgrades.map(u=>{const bought=state.city.bought.includes(u.id);return `<article class="card upgrade-card"><div class="upgrade-art"><img src="${u.icon}" alt=""/></div><div class="upgrade-info"><strong>${u.name}</strong><span>${u.desc}</span></div><button class="upgrade-buy" onclick="purchaseUpgrade('${u.id}')" ${bought?'disabled':''}>${bought?'Construído':`◉ ${u.cost.toLocaleString('pt-BR')}`}</button></article>`}).join('')}</div></section>`;
}
function purchaseUpgrade(id){
  const options={home:{name:'Residencial',cost:1200},shop:{name:'Centro comercial',cost:1000},park:{name:'Parque ecológico',cost:800}};const u=options[id];if(!u||state.city.bought.includes(id))return;
  if(state.coins<u.cost){showToast('Moedas insuficientes. Complete mais tarefas para ganhar moedas.','error');return;}
  state.coins-=u.cost;state.city.bought.push(id);if(id==='park')state.city.parks++;else state.city.buildings++;state.city.progress+=80;addXP(30);persist();render();showToast(`${u.name} construído com sucesso!`);
}
function renderProfile(){
  const completed=state.tasks.filter(t=>t.done).length;const goalsDone=state.goals.filter(g=>g.progress>=100).length;const achievements=getAchievements();
  return `<section class="page-heading"><div><span class="eyebrow">SUA JORNADA NO SOMA</span><h1>Meu perfil</h1><p>Acompanhe sua evolução e personalize seu espaço.</p></div><div class="heading-actions"><button class="secondary-btn" onclick="setPage('configuracoes')">⚙ &nbsp; Configurações</button><button class="primary-btn" onclick="openModal('profile')">✎ &nbsp; Editar perfil</button></div></section>
    <section class="card profile-hero"><img src="assets/avatar.png" alt="Avatar do perfil"/><div class="profile-identity"><h2>${esc(state.user.name)}</h2><p>${esc(state.user.email||'Visitante do SOMA')}</p><span class="pill purple">✦ Nível ${state.level} · Em evolução</span></div><button class="secondary-btn" onclick="setPage('cidade')">Ver minha cidade →</button></section>
    <section class="profile-stats"><div class="card profile-stat"><span>Tarefas concluídas</span><strong>${completed}</strong></div><div class="card profile-stat"><span>Metas alcançadas</span><strong>${goalsDone}</strong></div><div class="card profile-stat"><span>Moedas acumuladas</span><strong>${state.coins.toLocaleString('pt-BR')}</strong></div><div class="card profile-stat"><span>Sequência atual</span><strong>${state.streak} dias</strong></div></section>
    <section class="profile-panels"><div class="card card-pad"><div class="card-title-row"><div><h3>Conquistas recentes</h3><p>Suas vitórias até aqui.</p></div><button class="tiny-link" onclick="setPage('conquistas')">Ver todas →</button></div><div class="achievement-list">${achievements.filter(a=>a.unlocked).slice(0,4).map(achievementSmall).join('')||'<div class="empty-state"><strong>Suas conquistas aparecerão aqui.</strong></div>'}</div></div>
      <div class="card card-pad"><div class="card-title-row"><div><h3>Preferências</h3><p>Personalize sua experiência.</p></div><button class="tiny-link" onclick="setPage('configuracoes')">Abrir →</button></div><div class="settings-row"><div><strong>Notificações</strong><span>Receber avisos de atividade.</span></div><input class="switch" type="checkbox" ${state.settings.notifications?'checked':''} onchange="changeSetting('notifications',this.checked)"/></div><div class="settings-row"><div><strong>Lembretes</strong><span>Ser lembrado das tarefas.</span></div><input class="switch" type="checkbox" ${state.settings.reminders?'checked':''} onchange="changeSetting('reminders',this.checked)"/></div><div class="settings-row"><div><strong>Efeitos sonoros</strong><span>Sons de interação na interface.</span></div><input class="switch" type="checkbox" ${state.settings.sounds?'checked':''} onchange="changeSetting('sounds',this.checked)"/></div></div></section>`;
}
function getAchievements(){const done=state.tasks.filter(t=>t.done).length;const goals=state.goals.filter(g=>g.progress>=100).length;return [
  {icon:'🎯',title:'Primeiro passo',desc:'Conclua sua primeira tarefa.',unlocked:done>=1},
  {icon:'🔥',title:'Constância',desc:'Mantenha uma sequência de dias.',unlocked:state.streak>=3},
  {icon:'📚',title:'Mente ativa',desc:'Conclua 5 tarefas.',unlocked:done>=5},
  {icon:'🏆',title:'Meta alcançada',desc:'Finalize uma meta pessoal.',unlocked:goals>=1},
  {icon:'🏙️',title:'Construtor',desc:'Construa sua primeira estrutura.',unlocked:state.city.bought.length>=1},
  {icon:'⭐',title:'Em ascensão',desc:'Alcance o nível 6.',unlocked:state.level>=6},
  {icon:'💎',title:'Colecionador',desc:'Acumule 10 gemas.',unlocked:state.gems>=10},
  {icon:'🌳',title:'Cidade verde',desc:'Construa um parque.',unlocked:state.city.parks>=2}
];}
function achievementSmall(a){return `<div class="achievement"><div class="achievement-icon">${a.icon}</div><div><strong>${a.title}</strong><span>${a.desc}</span></div></div>`;}
function renderAchievements(){const arr=getAchievements();const unlocked=arr.filter(a=>a.unlocked).length;return `<section class="page-heading"><div><span class="eyebrow">CADA PASSO MERECE SER CELEBRADO</span><h1>Conquistas</h1><p>Desbloqueie medalhas à medida que sua cidade evolui.</p></div><span class="pill yellow">🏆 ${unlocked}/${arr.length} desbloqueadas</span></section><div class="card card-pad" style="margin-bottom:16px"><div class="card-title-row"><div><h3>Sua coleção</h3><p>Continue avançando para completar o álbum.</p></div><strong style="font:700 20px Outfit,sans-serif">${Math.round(unlocked/arr.length*100)}%</strong></div><div class="progress-track"><span style="width:${unlocked/arr.length*100}%"></span></div></div><div class="achievement-page-grid">${arr.map(a=>`<article class="card achievement-big ${a.unlocked?'':'locked'}"><div class="achievement-icon">${a.unlocked?a.icon:'🔒'}</div><h3>${a.title}</h3><p>${a.desc}</p><span class="pill ${a.unlocked?'green':''}">${a.unlocked?'Desbloqueada':'Bloqueada'}</span></article>`).join('')}</div>`;}
function renderSettings(){return `<section class="page-heading"><div><span class="eyebrow">SEU ESPAÇO, SUAS REGRAS</span><h1>Configurações</h1><p>Gerencie suas preferências e os dados desta demonstração.</p></div></section><div class="settings-layout"><section class="card settings-card"><h3>Preferências gerais</h3><p>Escolha como deseja interagir com o SOMA.</p><div class="setting-action"><div><strong>Notificações</strong><span>Avisos sobre tarefas e conquistas.</span></div><input class="switch" type="checkbox" ${state.settings.notifications?'checked':''} onchange="changeSetting('notifications',this.checked)"/></div><div class="setting-action"><div><strong>Lembretes</strong><span>Ajuda para manter sua rotina em dia.</span></div><input class="switch" type="checkbox" ${state.settings.reminders?'checked':''} onchange="changeSetting('reminders',this.checked)"/></div><div class="setting-action"><div><strong>Efeitos sonoros</strong><span>Ativar sons em interações.</span></div><input class="switch" type="checkbox" ${state.settings.sounds?'checked':''} onchange="changeSetting('sounds',this.checked)"/></div></section><section class="card settings-card"><h3>Dados e privacidade</h3><p>Suas informações ficam salvas apenas neste navegador.</p><div class="setting-action"><div><strong>Exportar meus dados</strong><span>Baixe uma cópia das tarefas, metas e progresso.</span></div><button class="secondary-btn" style="padding:8px 10px;font-size:9px" onclick="exportData()">Exportar JSON</button></div><div class="setting-action"><div><strong>Restaurar demonstração</strong><span>Voltar aos dados iniciais do projeto.</span></div><button class="danger-btn" onclick="resetDemo()">Restaurar</button></div><div class="setting-action"><div><strong>Sair da conta</strong><span>Encerrar esta sessão neste navegador.</span></div><button class="secondary-btn" style="padding:8px 10px;font-size:9px" onclick="logout()">Sair</button></div></section><section class="card settings-card"><h3>Sobre o projeto</h3><p>Uma experiência de produtividade gamificada.</p><div class="setting-action"><div><strong>SOMA · Versão 1.0</strong><span>Interface demonstrativa com armazenamento local.</span></div><span class="pill green">Ativo</span></div><div class="setting-action"><div><strong>Próximas integrações</strong><span>Autenticação, sincronização e banco de dados.</span></div><span class="pill yellow">Futuro</span></div></section></div>`;}
function changeSetting(key,value){state.settings[key]=value;persist();showToast('Preferência atualizada.');}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='soma-meus-dados.json';a.click();URL.revokeObjectURL(url);showToast('Arquivo de dados exportado.');}
function resetDemo(){if(!confirm('Isso vai apagar as alterações locais e restaurar os dados de exemplo. Continuar?'))return;state=defaultState();persist();render();showToast('Demonstração restaurada.');}
function openModal(type,id){
  const backdrop=document.getElementById('modalBackdrop'),title=document.getElementById('modalTitle'),eyebrow=document.getElementById('modalEyebrow'),body=document.getElementById('modalBody');
  let content='';eyebrow.textContent='SUA EVOLUÇÃO';
  if(type==='task'){
    title.textContent='Nova tarefa';content=`<form class="modal-form" onsubmit="handleModalSubmit(event,'task')"><div class="form-field"><label for="mTaskTitle">Nome da tarefa</label><input id="mTaskTitle" name="title" required maxlength="70" placeholder="Ex.: Estudar matemática" /></div><div class="form-row"><div class="form-field"><label>Categoria</label><select name="category">${categoryOptions('Estudo')}</select></div><div class="form-field"><label>Horário</label><input name="time" type="time" value="09:00" /></div></div><div class="form-field"><label>Data</label><input name="date" type="date" value="${todayISO()}" required /></div><button class="primary-btn form-submit" type="submit">Criar tarefa <span>→</span></button></form>`;
  }else if(type==='task-edit'){
    const t=state.tasks.find(x=>x.id===id);if(!t)return;title.textContent='Editar tarefa';content=`<form class="modal-form" onsubmit="handleModalSubmit(event,'task-edit',${id})"><div class="form-field"><label>Nome da tarefa</label><input name="title" value="${esc(t.title)}" required maxlength="70" /></div><div class="form-row"><div class="form-field"><label>Categoria</label><select name="category">${categoryOptions(t.category)}</select></div><div class="form-field"><label>Horário</label><input name="time" type="time" value="${esc(t.time||'09:00')}" /></div></div><div class="form-field"><label>Data</label><input name="date" type="date" value="${esc(t.date)}" required /></div><button class="primary-btn form-submit" type="submit">Salvar tarefa <span>→</span></button></form>`;
  }else if(type==='goal'){
    title.textContent='Criar nova meta';content=`<form class="modal-form" onsubmit="handleModalSubmit(event,'goal')"><div class="form-field"><label>Nome da meta</label><input name="title" required maxlength="70" placeholder="Ex.: Aprender um novo idioma" /></div><div class="form-field"><label>Descrição</label><textarea name="description" maxlength="180" placeholder="Descreva o que deseja alcançar..."></textarea></div><div class="form-field"><label>Categoria</label><select name="category">${categoryOptions('Estudo')}</select></div><button class="primary-btn form-submit" type="submit">Criar meta <span>→</span></button></form>`;
  }else if(type==='event'){
    title.textContent='Novo compromisso';content=`<form class="modal-form" onsubmit="handleModalSubmit(event,'event')"><div class="form-field"><label>Nome do compromisso</label><input name="title" required maxlength="60" placeholder="Ex.: Reunião, estudo, treino..." /></div><div class="form-field"><label>Data</label><input name="date" type="date" value="${todayISO()}" required /></div><div class="form-row"><div class="form-field"><label>Início</label><input name="start" type="time" value="09:00" required /></div><div class="form-field"><label>Fim</label><input name="end" type="time" value="10:00" required /></div></div><div class="form-field"><label>Categoria</label><select name="category">${categoryOptions('Trabalho')}</select></div><button class="primary-btn form-submit" type="submit">Adicionar à agenda <span>→</span></button></form>`;
  }else if(type==='event-details'){
    const e=state.events.find(x=>x.id===id);if(!e)return;title.textContent=e.title;content=`<p class="modal-copy">${dateLabel(e.date,{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}<br>${esc(e.start)} – ${esc(e.end)} · ${esc(e.category)}</p><button class="danger-btn" style="margin-top:15px" onclick="deleteEvent(${e.id})">Excluir compromisso</button>`;
  }else if(type==='profile'){
    title.textContent='Editar perfil';content=`<form class="modal-form" onsubmit="handleModalSubmit(event,'profile')"><div class="form-field"><label>Nome de exibição</label><input name="name" value="${esc(state.user.name)}" required maxlength="40" /></div><div class="form-field"><label>E-mail</label><input name="email" type="email" value="${esc(state.user.email)}" placeholder="voce@email.com" /></div><button class="primary-btn form-submit" type="submit">Salvar alterações <span>→</span></button></form>`;
  }else if(type==='shop'){
    title.textContent='Loja do SOMA';content=`<div class="modal-copy">Use suas moedas para desbloquear itens especiais para sua cidade. Nesta demonstração, os itens abaixo são ilustrativos.</div><div class="task-list" style="margin-top:15px"><div class="task-row"><span class="task-emoji">🌳</span><div class="task-main"><strong>Kit de árvores</strong><span>Decoração para áreas verdes</span></div><button class="upgrade-buy" onclick="buyShopItem('trees',250)">◉ 250</button></div><div class="task-row"><span class="task-emoji">💡</span><div class="task-main"><strong>Iluminação urbana</strong><span>Deixe as ruas mais acolhedoras</span></div><button class="upgrade-buy" onclick="buyShopItem('lights',400)">◉ 400</button></div><div class="task-row"><span class="task-emoji">⛲</span><div class="task-main"><strong>Fonte central</strong><span>Um novo ponto de encontro</span></div><button class="upgrade-buy" onclick="buyShopItem('fountain',600)">◉ 600</button></div></div><p class="modal-copy" style="margin-top:13px">Saldo atual: <b style="color:#f2ca72">${state.coins.toLocaleString('pt-BR')} moedas</b></p>`;
  }
  body.innerHTML=content;backdrop.classList.remove('hidden');
}
function handleModalSubmit(e,type,id){
  e.preventDefault();const fd=new FormData(e.target);
  if(type==='task'){
    state.tasks.push({id:Date.now(),title:fd.get('title').trim(),category:fd.get('category'),time:fd.get('time')||'23:59',date:fd.get('date'),done:false});showToast('Tarefa adicionada à sua lista!');
  }else if(type==='task-edit'){
    const t=state.tasks.find(x=>x.id===id);if(t){t.title=fd.get('title').trim();t.category=fd.get('category');t.time=fd.get('time')||'23:59';t.date=fd.get('date');}showToast('Tarefa atualizada!');
  }else if(type==='goal'){
    state.goals.push({id:Date.now(),title:fd.get('title').trim(),description:fd.get('description').trim(),category:fd.get('category'),progress:0,target:100,rewarded:false});showToast('Nova meta criada!');
  }else if(type==='event'){
    if(fd.get('end')<=fd.get('start')){showToast('O horário de término precisa ser depois do início.','error');return;}
    state.events.push({id:Date.now(),title:fd.get('title').trim(),date:fd.get('date'),start:fd.get('start'),end:fd.get('end'),category:fd.get('category')});showToast('Compromisso adicionado à agenda!');
  }else if(type==='profile'){
    state.user.name=fd.get('name').trim();state.user.email=fd.get('email').trim();showToast('Perfil atualizado!');
  }
  closeModal();persist();render();
}
function deleteEvent(id){if(!confirm('Excluir este compromisso?'))return;state.events=state.events.filter(e=>e.id!==id);closeModal();persist();render();showToast('Compromisso excluído.');}
function buyShopItem(id,cost){if(state.coins<cost){showToast('Moedas insuficientes.','error');return;}state.coins-=cost;state.city.bought.push(`shop-${id}`);persist();closeModal();render();showToast('Item adquirido!');}
function closeModal(){document.getElementById('modalBackdrop').classList.add('hidden');}
function backdropClose(e){if(e.target.id==='modalBackdrop')closeModal();}
function showReward(title,description,coins,xp){
  const backdrop=document.getElementById('modalBackdrop'),body=document.getElementById('modalBody');document.getElementById('modalEyebrow').textContent='NOVA CONQUISTA';document.getElementById('modalTitle').textContent='';
  body.innerHTML=`<div class="reward-modal"><div class="reward-gift">🏆</div><h3>${esc(title)}</h3><p>${esc(description)}</p><div class="reward-points">${coins?`<span>◉ +${coins} moedas</span>`:''}${xp?`<span>✦ +${xp} XP</span>`:''}</div><button class="primary-btn" style="width:100%" onclick="closeModal()">Continuar evoluindo</button></div>`;backdrop.classList.remove('hidden');
}
function openNotifications(){
  const body=document.getElementById('modalBody');document.getElementById('modalEyebrow').textContent='CENTRAL DE AVISOS';document.getElementById('modalTitle').textContent='Notificações';
  body.innerHTML=`<div class="task-list"><div class="task-row"><span class="task-emoji">🎯</span><div class="task-main"><strong>Seu dia está esperando por você!</strong><span>Confira suas tarefas e avance nas suas metas.</span></div></div><div class="task-row"><span class="task-emoji">🏙️</span><div class="task-main"><strong>Sua cidade pode evoluir</strong><span>Complete missões para ganhar experiência.</span></div></div><div class="task-row"><span class="task-emoji">🔥</span><div class="task-main"><strong>${state.streak} dias de sequência</strong><span>Você está construindo uma ótima constância.</span></div></div></div><button class="secondary-btn" style="width:100%;margin-top:16px" onclick="closeModal()">Fechar</button>`;
  document.getElementById('modalBackdrop').classList.remove('hidden');
}
// Fechamento por teclado e inicialização
window.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
if(localStorage.getItem(SESSION_KEY)==='1') enterApp();

/* ---- Recompensas (tela verde do design) ---- */
function renderRewards(){
  const claimed=state.lastClaim===todayISO();
  const list=state.tasks.filter(t=>t.date===todayISO()).slice(0,4).map(t=>`<div class="rw-task ${t.done?'done':''}"><span>${t.done?'✓':'○'}</span>${esc(t.title||t.name||'Tarefa')}</div>`).join('')||'<div class="rw-task">Nenhuma tarefa para hoje</div>';
  const gem='<svg viewBox="0 0 24 24"><path fill="#7b3fe4" d="M6 3h12l4 6-10 12L2 9z"/><path fill="#a77bff" d="M6 3l6 6 6-6M2 9h20M12 9l-3-6m3 6l3-6" opacity=".55"/></svg>';
  return `<section class="rewards"><div class="rw-panel">${list}</div>
    <h1>Você merece novos brindes<br>e muitas conquistas!</h1>
    <div class="rw-pair"><div class="rw-item"><div class="rw-orb"><img src="assets/moeda.png" alt="Moedas"></div>+100</div><div class="rw-item"><div class="rw-orb">${gem}</div>+5</div></div>
    <button class="rw-btn" onclick="claimReward()" ${claimed?'disabled':''}>${claimed?'Resgatado hoje ✓':'Resgatar'}</button>
    <p class="rw-foot">◉ ${state.coins.toLocaleString('pt-BR')} moedas · ◆ ${state.gems||0} gemas</p>
    <img class="rw-city" src="assets/cidade-principal.png" alt="Sua cidade"></section>`;
}
function claimReward(){
  if(state.lastClaim===todayISO()){showToast('Você já resgatou os brindes de hoje.','error');return;}
  state.lastClaim=todayISO(); state.coins+=100; state.gems=(state.gems||0)+5; persist();
  showReward('Brindes resgatados!','Suas moedas e gemas de hoje já estão na sua conta.',100,0); render();
}
function socialLogin(name){ showToast(`Entrar com ${name} estará disponível quando o site receber um backend.`); }
