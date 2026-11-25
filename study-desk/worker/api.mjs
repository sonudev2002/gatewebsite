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
  if(!row||typeof row.k!=='string'||!/^((attempts|pyqAttempts|cards|custom|weak):[\w.-]{1,130})$/.test(row.k)||!Number.isSafeInteger(row.v)||row.v<0||row.p===undefined)return reply({error:'Invalid record'},400);
  const payload=JSON.stringify(row.p);if(payload.length>80000)return reply({error:'Record too large'},413);
  const update=row.v===0?db.prepare('INSERT INTO study_records(owner,record_key,payload) VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(owner,row.k,payload):db.prepare('UPDATE study_records SET payload=?,version=version+1 WHERE owner=? AND record_key=? AND version=?').bind(payload,owner,row.k,row.v);
  const result=await update.run();if(result.meta.changes===1)return reply({v:row.v+1});
  const current=await db.prepare('SELECT version AS v,payload AS p FROM study_records WHERE owner=? AND record_key=?').bind(owner,row.k).first();
  return reply(current?{v:current.v,p:JSON.parse(current.p)}:{v:0,p:null},409)
}
