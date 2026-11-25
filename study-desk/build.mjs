import fs from 'node:fs';
const files=Object.fromEntries(fs.readdirSync('web').map(n=>['/'+n,fs.readFileSync('web/'+n,'utf8')]));
const api=fs.readFileSync('worker/api.mjs','utf8');
const serve=`export default {async fetch(req,env){const path=new URL(req.url).pathname;if(path==='/api/study')return studyApi(req,env.DB);const name=path==='/'?'/index.html':path;if(!Object.hasOwn(files,name))return new Response('Not found',{status:404});const ext=name.split('.').pop();return new Response(files[name],{headers:{'Content-Type':({'js':'text/javascript','css':'text/css','json':'application/json','html':'text/html','txt':'text/plain'})[ext]+'; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'private, no-cache'}})}}`;
fs.mkdirSync('dist/server',{recursive:true});fs.writeFileSync('dist/server/index.js',api+'\nconst files='+JSON.stringify(files)+';\n'+serve);
