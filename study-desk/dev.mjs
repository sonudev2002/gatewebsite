import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {studyApi} from './worker/api.mjs';
const db=new DatabaseSync(process.env.STUDY_LOCAL_DB||'study.local.sqlite');
if(!db.prepare("SELECT name FROM sqlite_master WHERE name='study_records'").get())db.exec(fs.readFileSync('drizzle/0000_study_records.sql','utf8'));
const adapter={prepare(sql){const statement=db.prepare(sql);return {bind(...args){return {first:()=>statement.get(...args),all:()=>({results:statement.all(...args)}),run:()=>({meta:statement.run(...args)})}}}}};
const root=path.resolve('web');
const port=Number(process.env.PORT||(process.argv.includes('--port')?process.argv[process.argv.indexOf('--port')+1]:5173));
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://'+req.headers.host);
 if(url.pathname==='/api/study'){
   let chunks=[];for await(const chunk of req)chunks.push(chunk);
   const headers=new Headers();headers.set('oai-authenticated-user-id','local-developer');
   for(const h of ['content-type','origin'])if(req.headers[h])headers.set(h,req.headers[h]);
   const request=new Request(url,{method:req.method,headers,body:chunks.length?Buffer.concat(chunks):undefined});
   const answer=await studyApi(request,adapter);res.writeHead(answer.status,Object.fromEntries(answer.headers));res.end(await answer.text());return
 }
 const filename=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404).end();return}
 res.setHeader('Content-Type',({js:'text/javascript',json:'application/json',html:'text/html',css:'text/css'})[path.extname(filename).slice(1)]||'text/plain');fs.createReadStream(filename).pipe(res)
}catch{res.writeHead(500).end('Request failed')}}).listen(port,'127.0.0.1',()=>console.log('Study Desk on port '+port))
