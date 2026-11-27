const finder = document.querySelector('#desk-search');
const queryBox = document.querySelector('#topic-query');

function toggleDeskMenu(open = !document.body.classList.contains('menu-open')) {
  document.body.classList.toggle('menu-open', open);
  document.querySelector('.menu-toggle').setAttribute('aria-expanded', String(open));
}
window.addEventListener('hashchange', () => toggleDeskMenu(false));
document.querySelector('#nav').addEventListener('click', () => toggleDeskMenu(false));

function openDeskSearch() {
  finder.showModal();
  queryBox.value = '';
  showDeskMatches();
  queryBox.focus();
}
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey &&
      !finder.open && !pointReader.open && !event.target.closest('input,textarea,select,[contenteditable=true]')) {
    event.preventDefault();
    openDeskSearch();
  }
});
function showDeskMatches() {
  const term = queryBox.value.trim().toLowerCase();
  const lessons = topics.map(([title, subject], i) => ({
    title, subject, description:'Concept lesson', action:() => go('topic/' + i)
  }));
  const banks = new Map();
  for (const q of archive) {
    const key = q.s + '|' + q.t;
    if (!banks.has(key)) banks.set(key, {title:q.t, subject:q.s, tags:new Set(), count:0, id:'t-' + q.id});
    const group = banks.get(key);
    group.count++;
    group.tags.add(q.sub || '');
  }
  const groups = [...banks.values()].map(g => ({...g, description:g.count + ' PYQs',
    action:() => libraryBank(g.id)}));
  const matches = [...lessons, ...groups].filter(g => [g.title, g.subject, ...(g.tags || [])].join(' ').toLowerCase().includes(term))
    .sort((a,b) => Number(b.title.toLowerCase().includes(term)) - Number(a.title.toLowerCase().includes(term))).slice(0,24);
  const results = document.querySelector('#topic-matches');
  results.replaceChildren(...matches.map(g => {
    const button = document.createElement('button');
    button.className = 'item';
    button.innerHTML = '<span><small>'+esc(g.subject)+'</small><br><b>'+esc(g.title)+'</b></span><span class="tag">'+esc(g.description)+'</span>';
    button.onclick = () => { finder.close(); g.action(); };
    return button;
  }));
  if (!matches.length) results.textContent = 'No matching topics. Try a subject or a shorter search.';
}
function weeklyPractice() {
  const days = Array.from({length:7}, (_, i) => {
    const day = new Date(); day.setHours(0,0,0,0); day.setDate(day.getDate()-6+i);
    return {day, count:0};
  });
  for (const a of [...state.attempts,...pyqTries()]) {
    const date = new Date(a.time); date.setHours(0,0,0,0);
    const bucket = days.find(d => +d.day === +date);
    if (bucket) bucket.count++;
  }
  const max = Math.max(1,...days.map(d => d.count));
  const total = days.reduce((sum,d) => sum+d.count,0);
  return '<section class="week-card"><h2>Practice this week</h2><p><b>'+total+'</b> practice attempt'+(total===1?'':'s')+' in 7 days</p><div class="week-bars">'+days.map(d=>{
    const date = d.day.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'});
    return '<div aria-label="'+esc(date)+', '+d.count+' attempts" title="'+esc(date)+': '+d.count+'"><b>'+d.count+'</b><i style="height:'+Math.max(3,Math.round(48*d.count/max))+'px"></i><small>'+esc(d.day.toLocaleDateString(undefined,{weekday:'short'}))+'</small></div>';
  }).join('')+'</div></section>';
}
function deskRevision() {
  revSubject=''; revTopic=''; revType='Mistake'; go('rev');
}
function deskPyqs() {
  mode='pyq'; subject=''; pyTopic=''; year=''; pyStatus=''; page=0; go('practice');
}
overview = function() {
  const active = [...runs()].filter(m=>!m.done && m.end>Date.now()).sort((a,b)=>b.start-a.start)[0];
  const startMock = active ? 'Resume mock test' : 'Build a mock test';
  const target = active ? 'exam/'+active.id : 'mock';
  const due = queue().length + pendingPYQ().length;
  return '<div class="desk-lead"><section class="hero"><div class="copy"><div class="label">GATE CSE / 2027</div><h1>Your study desk</h1><p>Start with a past paper question or practise a concept at your own pace.</p><div class="actions">'+btn('Practise actual PYQs','deskPyqs()','btn')+btn('ChatGPT practice',"modeSet('chat');go('practice')",'btn ghost')+'</div></div><div class="hero-art">'+art+'</div></section>'+weeklyPractice()+'</div>'+metrics()+
    '<div class="desk-shortcuts"><a href="#'+esc(target)+'">'+icon('target')+'<span><b>'+startMock+'</b><small>'+(active?Object.keys(active.answers).filter(k=>active.answers[k]).length+' of '+active.ids.length+' answered':'Choose questions, marks and time')+'</small></span><i>→</i></a><button onclick="deskRevision()">'+icon('rev')+'<span><b>Review mistakes</b><small>'+due+' practice question'+(due===1?'':'s')+' in revision</small></span><i>→</i></button><a href="#studio">'+icon('book')+'<span><b>My question bank</b><small>Open your saved questions</small></span><i>→</i></a></div>'+
    '<div class="section"><div><h2>Core topic lessons</h2><p>Concepts, worked examples and graded practice</p></div>'+btn('View topic library',"go(\'library\')",'link')+'</div>'+cards();
};
render();
