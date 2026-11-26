const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function studyApi(request,db){
  const owner=request.headers.get('oai-authenticated-user-id');
  if(!owner)return reply({error:'Sign in to sync your study records.'},401);
  if(request.method==='GET'){
    const rows=await db.prepare('SELECT record_key AS k, payload AS p, version AS v FROM study_records WHERE owner=?').bind(owner).all();
    return reply(rows.results.map(row=>({...row,p:JSON.parse(row.p)})));
  }
  if(request.method!=='POST')return reply({error:'Method unavailable'},405);
  if(request.headers.get('Origin')!==new URL(request.url).origin||!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'Invalid origin or content type'},403);
  let row;try{row=await request.json()}catch{return reply({error:'Invalid JSON'},400)}
  if(!row||typeof row.k!=='string'||!/^((attempts|pyqAttempts|cards|custom|weak|mockRuns|topicPrefs):[\w.-]{1,130})$/.test(row.k)||!Number.isSafeInteger(row.v)||row.v<0||row.p===undefined)return reply({error:'Invalid record'},400);
  const payload=JSON.stringify(row.p);if(payload.length>80000)return reply({error:'Record too large'},413);
  const update=row.v===0?db.prepare('INSERT INTO study_records(owner,record_key,payload) VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(owner,row.k,payload):db.prepare('UPDATE study_records SET payload=?,version=version+1 WHERE owner=? AND record_key=? AND version=?').bind(payload,owner,row.k,row.v);
  const result=await update.run();if(result.meta.changes===1)return reply({v:row.v+1});
  const current=await db.prepare('SELECT version AS v,payload AS p FROM study_records WHERE owner=? AND record_key=?').bind(owner,row.k).first();
  return reply(current?{v:current.v,p:JSON.parse(current.p)}:{v:0,p:null},409)
}

export async function resourceApi(req,db,catalog){
 const uid=req.headers.get('oai-authenticated-user-id');if(!uid)return reply({error:'Sign in required'},401);
 const url=new URL(req.url);
 if(url.pathname==='/api/catalog'&&req.method==='GET'){
  const page=Number(url.searchParams.get('page')||0),size=36,total=Math.ceil(catalog.length/size);
  if(!Number.isInteger(page)||page<0||page>=total)return reply({error:'Unknown page'},404);
  const edition='cs-2027.1';let row=await db.prepare('SELECT body FROM catalog_pages WHERE edition=? AND page=?').bind(edition,page).first();
  if(!row){row={body:JSON.stringify(catalog.slice(page*size,(page+1)*size))};await db.prepare('INSERT INTO catalog_pages VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(edition,page,row.body).run()}
  return new Response(row.body,{headers:{'Content-Type':'application/json','X-Pages':String(total),'Cache-Control':'private, max-age=3600'}})
 }
 const id=url.pathname.match(/^\/api\/image\/([a-f0-9-]{36})$/)?.[1];if(!id)return reply({error:'Unknown resource'},404);
 if(req.method==='GET'){let r=await db.prepare('SELECT body FROM note_images WHERE owner=? AND id=?').bind(uid,id).first();if(!r)return reply({error:'Image unavailable'},404);return new Response(Uint8Array.from(atob(r.body),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})}
 if(req.method!=='PUT'||req.headers.get('origin')!==url.origin||req.headers.get('content-type')!=='image/jpeg')return reply({error:'Invalid request'},403);
 const data=new Uint8Array(await req.arrayBuffer());if(data.length>480000||data[0]!==255||data[1]!==216||data[2]!==255)return reply({error:'Invalid JPEG'},400);
 let binary='';for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));
 await db.prepare('INSERT INTO note_images VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(uid,id,btoa(binary)).run();return new Response(null,{status:204})
}
