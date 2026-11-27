let filteredIds=[],noteEdit='',generated=[],catalogReady=false;
const byId=id=>pyqMap.get(id)||generated.find(q=>q.id===id);
const topicMeta=q=>typeof q.t==='number'?{s:topics[q.t][1],t:topics[q.t][0]}:{s:q.s,t:q.t};
function answerLabel(q){let k=q.key??q.k;return Array.isArray(k)?(k[0]===k[1]?String(k[0]):k.join(' to ')):String(k??'')}
function grade(q,v){if(!String(v??'').trim())return false;let k=q.key??q.k;if(q.type==='NAT'){let x=Number(v);return Number.isFinite(x)&&Array.isArray(k)&&x>=k[0]-1e-9&&x<=k[1]+1e-9}const canon=s=>String(s).toUpperCase().replace(/[ ,]+/g,'').split('').sort().join('');return canon(k)===canon(v)}
const quickRules=[
[/schedul/i,'Turnaround = completion − arrival. For a single CPU burst, waiting = turnaround − burst.','Recompute remaining time at every preemption.'],
[/cache/i,'Sets = data capacity / (block size × ways).','Split address bits into offset, set and tag before counting misses.'],
[/paging|virtual memory/i,'Offset bits = log₂(page size in addressable units).','A TLB miss alone does not imply a page fault.'],
[/context.free|parsing|grammar/i,'Two different leftmost derivations for the same word prove ambiguity.','Check the start symbol, terminal order and empty-word case.'],
[/probability/i,'P(A ∪ B) = P(A) + P(B) − P(A ∩ B).','Check whether sampling with replacement keeps probabilities fixed.'],
[/live variable|data flow/i,'IN = USE ∪ (OUT − DEF). OUT is the union of successor IN sets.','Iterate until a full pass changes no set.'],
[/matrix|linear algebra/i,'Rank + nullity = number of columns.','For an invertible square matrix the nullity is zero.'],
[/big-o|asymptotic|recurrence/i,'Compare eventually positive functions using f/g. A finite positive limit gives Θ.','Write the loop sum or recursion-level cost before simplifying.'],
[/routing|shortest path/i,'Relax u→v by comparing d[v] with d[u] + w(u,v).','Check edge directions and the algorithm’s weight assumptions.'],
[/finite automata|regular expression/i,'The subset construction on n states has at most 2ⁿ states.','Count reachable subsets separately from the theoretical maximum.'],
[/normal form|dependencies/i,'Attribute closure grows until no functional dependency adds an attribute.','A BCNF determinant must be a superkey for every nontrivial dependency.'],
[/transaction/i,'A schedule is conflict-serializable exactly when its precedence graph is acyclic.','Two reads cannot create a conflict edge.'],
[/pipeline/i,'Ideal balanced k-stage time for n instructions is k+n−1 cycles.','Include stalls; distinguish latency from throughput.'],
[/SQL/i,'COUNT(*) counts rows. COUNT(column) excludes NULL values.','Apply grouping before HAVING.'],
[/transmission|physical layer/i,'Transmission delay = bits / bit rate; propagation delay = distance / speed.','Convert bytes to bits before dividing.'],
[/set operation|equivalence|partial order/i,'Equivalence requires reflexivity, symmetry and transitivity.','A partial order uses antisymmetry in place of symmetry.'],
[/tree|spanning/i,'A tree on n vertices has n−1 edges.','Distinguish tree height measured in edges from height measured in levels.'],
[/number system|complement/i,'A b-bit signed two’s-complement value lies between −2^(b−1) and 2^(b−1)−1.','Check signedness before interpreting the highest bit.'],
[/stack|queue/i,'A stack uses LIFO; a FIFO queue removes the oldest item.','Trace each operation in order.'],
[/BFS|DFS|graph/i,'A full adjacency-list traversal costs Θ(V+E).','Check reachability and neighbor ordering separately.']
];
function points(q){if(q.steps)return [['Concept',topics[q.t][5]],['Key Point',q.steps.at(-1)],['Mistake',q.tag]];let matched=quickRules.find(a=>a[0].test(q.t+' '+q.sub));let list=matched?[['Key Point',matched[1]],['Shortcut',matched[2]]]:[];if(q.quick)list.unshift(['Formula',q.quick]);if(q.worked){let clean=plain(q.worked).split(/(?<=[.!?])\s+/).find(s=>s.length>20&&s.length<210&&!/\\|Answer:/.test(s));if(clean)list.push(['Concept',clean])}list.push(['Key Point',(q.y?ref(q)+' · ':'')+q.t+' · expected answer '+answerLabel(q)]);if(q.type==='MSQ')list.push(['Mistake','Mark every correct statement. A partial set earns zero.']);if(q.type==='NAT')list.push(['Shortcut','Keep extra precision until the final entry.']);return list}
function saveQuick(id,i,b){const q=id.startsWith('question/')?questions[+id.slice(9)]:byId(id),[cat,body]=points(q)[i];if(!personalCards().some(x=>x.q===id&&x.b===body)){(state.cards??=[]).unshift({id:crypto.randomUUID(),...topicMeta(q),q:id,cat,b:body});save()}b.textContent='Saved';b.disabled=true}
function quickPanel(q,id){return '<section class="panel"><h3>Quick revision</h3><div class="rev-grid">'+points(q).map(([cat,b],i)=>'<div class="quick-tile">'+revisionTile({...topicMeta(q),cat,b},i,true)+btn('Save point',"saveQuick('"+id+"',"+i+",this)",'link')+'</div>').join('')+'</div></section>'}
const traps=[
['A linear bound misses the quadratic leading term.','','The ratio to n³ tends to zero.','A logarithm grows slower than the leading polynomial.'],
['The ratio tends to zero.','n²/n is unbounded.','','There is no eventual positive lower bound for n/n².'],
['The harmonic sum contributes a log factor.','Later outer iterations make fewer visits.','The i=1 pass alone costs n.',''],
['','Each level contains additional logarithmic work.','The tree does not accumulate n² work.','The per-level cost includes a factor of n.'],
['Assignments may be inside a block.','','Addition does not cause a control transfer.','A return may end a straight-line block.'],
['B bypasses A.','A bypasses B.','','T occurs after J.'],
['This only counts E−V.','This drops one unit from E−V+2.','','Edges are not independent paths.'],
['H does not dominate S.','B does not dominate H.','C does not dominate B.',''],
['The old x is overwritten.','','Only y is read here.','The right-hand side reads y.'],
['DEF kills b.','This omits a and retains b.','','USE contributes a.'],
['','B overwrites the incoming x.','This drops z and w.','B also reads y.'],
['B can read x and y.','H also reads c.','','H must read its branch condition.'],
['','This is finish minus first dispatch.','This is turnaround.','This is the completion clock time.'],
['The third job waits 6.','','Average waiting uses the sum 8.','This is the largest individual wait.'],
['A is preempted twice indirectly by shorter jobs.','Include both shorter jobs before A finishes.','A has two units left at time 12.',''],
['A waits across multiple turns.','Include B’s final time slice.','','This is the burst length.'],
['','Turing machines recognize a larger class.','LBAs recognize context-sensitive languages.','NPDAs recognize all context-free languages.'],
['The grammar enforces sorted symbol blocks.','The expression allows unequal counts.','The order is constrained.',''],
['Matching three unbounded blocks exceeds finite-state memory.','The three-equal-block language is non-context-free.','','The counts have no upper bound.'],
['An infinite language can be decidable.','Decidability does not imply regularity.','','Decidable languages include non-CFLs.'],
['BGP uses path vectors.','','RIP uses distance vectors.','ARP resolves link-layer addresses.'],
['This omits the path beyond the first link.','The rest of the route adds cost.','','The other next hop costs less.'],
['The entire path is checked.','','Removing a local occurrence would conceal the loop.','Path length does not override loop detection.'],
['B must learn the new distance first.','','This counts links rather than exchange rounds.','Direct neighbors are known initially.']
];
function analysisBody(q){if(q.steps)return ol(q.steps)+q.options.map((x,i)=>'<p><b>'+String.fromCharCode(65+i)+'</b> '+esc(x)+' · '+esc(i===q.k?'Matches the derived result.':traps[q.id][i])+'</p>').join('');return (q.worked?'<div class="examtext">'+rich(q.worked)+'</div>':'<p>Open the source discussion for the derivation and alternative approaches.</p>')+'<p><b>Answer</b> '+esc(answerLabel(q))+'</p>'+(q.url?external(q.url,'Source solution and discussion'):'')}
function noteTools(r){return btn('Edit note',"editRevision('"+r.id+"')")+(r.images||[]).map(id=>'<a href="/api/image/'+id+'" target="_blank"><img class="note-thumb" src="/api/image/'+id+'" alt="Revision attachment"></a>').join('')}
function editRevision(id){noteEdit=id;const c=personalCards().find(r=>r.id===id),f=app.querySelector('form[data-q]');f.elements.body.value=c.b;f.elements.cat.value=c.cat;f.elements.topic.value=c.t;f.elements.sub.value=c.s;f.elements.body.focus();f.scrollIntoView({block:'center'})}
function setupNote(f){f.elements.body.required=false;f.querySelector('.btn').insertAdjacentHTML('beforebegin','<label>Screenshots or images<input type="file" name="photos" accept="image/*" multiple></label><details><summary>Handwritten note</summary><canvas width="1000" height="420" aria-label="Draw your revision note"></canvas><button type="button" class="sub">Clear drawing</button></details>');let cv=f.querySelector('canvas'),c=cv.getContext('2d'),on=false;function clear(){c.fillStyle='white';c.fillRect(0,0,cv.width,cv.height);cv.dataset.ink=''}clear();const at=e=>{let r=cv.getBoundingClientRect();return [(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);cv.dataset.ink='1';c.beginPath();c.lineWidth=3;c.moveTo(...at(e));on=true};cv.onpointermove=e=>{if(on){c.lineTo(...at(e));c.stroke()}};cv.onpointerup=cv.onpointercancel=()=>on=false;f.querySelector('details button').onclick=clear}
async function imageBlob(input){let cv=input;if(input instanceof File){let img=await createImageBitmap(input);cv=document.createElement('canvas');let scale=Math.min(1,1400/Math.max(img.width,img.height));cv.width=Math.max(1,img.width*scale);cv.height=Math.max(1,img.height*scale);let ctx=cv.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(img,0,0,cv.width,cv.height);img.close()}for(let q of [.85,.65,.4,.2]){let b=await new Promise(r=>cv.toBlob(r,'image/jpeg',q));if(b&&b.size<480000)return b}throw Error('Reduce image dimensions and retry.')}
async function addCard(e){e.preventDefault();let f=e.target,btn=f.querySelector('.btn'),msg=f.querySelector('[role=status]');if(btn.disabled)return;btn.disabled=true;try{let c=personalCards().find(x=>x.id===noteEdit),images=[...(c?.images||[])],files=[...f.elements.photos.files],cv=f.querySelector('canvas'),body=f.elements.body.value.trim();if(cv.dataset.ink)files.push(cv);if(images.length+files.length>8)throw Error('Use up to eight images.');if(!body&&!files.length&&!images.length)throw Error('Add text, an image or a drawing.');msg.textContent='Saving…';for(let input of files){let id=crypto.randomUUID(),b=await imageBlob(input);let r=await fetch('/api/image/'+id,{method:'PUT',headers:{'Content-Type':'image/jpeg'},body:b});if(!r.ok)throw Error('Upload failed. Your draft is still here.');images.push(id)}let rec={id:c?.id||crypto.randomUUID(),b:body,s:f.elements.sub.value.trim(),t:f.elements.topic.value.trim(),cat:f.elements.cat.value,q:c?.q||f.dataset.q,images};state.cards=[rec,...personalCards().filter(x=>x.id!==rec.id)];noteEdit='';save();render();const m=app.querySelector('form[data-q] [role=status]');if(m)m.textContent='Note saved.'}catch(err){msg.textContent=err.message}finally{btn.disabled=false}}
function sequence(q){return filteredIds.includes(q.id)?filteredIds:archive.map(x=>x.id)}
function questionNav(q){let seq=sequence(q),i=seq.indexOf(q.id);return '<div class="actions">'+[[-1,'Previous question'],[1,'Next question']].map(([d,s])=>'<button class="sub" '+(!seq[i+d]?'disabled':'')+' onclick="go(\'pyq/'+(seq[i+d]||q.id)+'\')">'+s+'</button>').join('')+'<small>'+ (i+1)+' of '+seq.length+'</small></div>'}
const baseUpgrade=render;render=function(){baseUpgrade();let [v,n]=route(),f=app.querySelector('form[data-q]');if(f)setupNote(f);if(v==='pyq'&&pyqMap.has(n)){let q=pyqMap.get(n);app.insertAdjacentHTML('afterbegin',questionNav(q));if(lastPy(n)&&!retrying.has(n)){f.insertAdjacentHTML('beforebegin','<details class="panel"><summary>Detailed analysis</summary>'+analysisBody(q)+'</details>'+quickPanel(q,n))}}if(v==='question'&&submitted&&f)f.insertAdjacentHTML('beforebegin','<details class="panel"><summary>Detailed analysis and alternatives</summary>'+analysisBody(questions[n])+'</details>'+quickPanel(questions[n],'question/'+n));if(window.MathJax?.typesetPromise)window.MathJax.typesetPromise([app]).catch(()=>{})};
window.addEventListener('hashchange',()=>noteEdit='');
async function loadBank(){let data;try{let first=await fetch('/api/catalog?page=0');if(!first.ok)throw Error();let pages=Number(first.headers.get('X-Pages'));if(!pages)throw Error();data=await first.json();for(let i=1;i<pages;i+=8){let group=await Promise.all(Array.from({length:Math.min(8,pages-i)},async(_,j)=>{let r=await fetch('/api/catalog?page='+(i+j));if(!r.ok)throw Error();return r.json()}));data.push(...group.flat())}}catch{data=(await Promise.all(['pyq.json','generated.json'].map(async f=>(await fetch(f)).json()))).flat()}archive=data.filter(q=>q.y).sort((a,b)=>b.y-a.y);generated=data.filter(q=>q.source==='ChatGPT');pyqMap=new Map(archive.map(q=>[q.id,q]));catalogReady=true;render()}

let discussionIndex;
async function readDiscussion(button,id){
 const q=pyqMap.get(id),out=button.parentElement.querySelector('.discussion-copy');button.disabled=true;button.textContent='Loading archived reasoning…';
 try{
  if(!discussionIndex)discussionIndex=fetch('https://raw.githubusercontent.com/TheSerphh/Gate-CSE-Dataset/main/question_details(pdf).json').then(async r=>{if(!r.ok)throw Error();let raw=await r.json();let rows=Array.isArray(raw)?raw:Object.values(raw);return new Map(rows.filter(x=>x.link).map(x=>[x.link.match(/gateoverflow\.in\/(\d+)/)?.[1],x]))}).catch(e=>{discussionIndex=null;throw e});
  let row=(await discussionIndex).get(q.url.match(/gateoverflow\.in\/(\d+)/)?.[1]),answers=row?.answers_html?.filter(s=>typeof s==='string'&&s.length>70);if(!answers?.length)throw Error();
  out.innerHTML='<h4>Community worked explanation</h4>'+rich(answers[0]);if(window.MathJax?.typesetPromise)await window.MathJax.typesetPromise([out]);button.remove()
 }catch{button.textContent='Retry archived reasoning';button.disabled=false;out.textContent='The inline discussion is unavailable. Use the source solution link for this question.'}
}
const basicAnalysis=analysisBody;analysisBody=function(q){return basicAnalysis(q)+(q.y&&!q.worked?'<div><button class="sub" onclick="readDiscussion(this,\''+q.id+'\')">Load worked discussion</button><div class="discussion-copy"></div></div>':'')};
