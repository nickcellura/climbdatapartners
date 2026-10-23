import {test} from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/inquiry.js';
const base = {fullName:'Jane Smith',email:'jane@example.com',company:'Example Operations',industry:'Manufacturing',employees:'30–99',years:'10–19',records:'Production histories',consent:'on',startedAt:Date.now()-10000,'cf-turnstile-response':'test-token'};
const env = {RESEND_API_KEY:'test-key',INQUIRY_TO_EMAIL:'owner@example.com',INQUIRY_FROM_EMAIL:'inquiries@example.com',TURNSTILE_SECRET_KEY:'test-secret',TURNSTILE_SITE_KEY:'test-public'};
const run = (data=base,settings=env,origin='https://example.com') => onRequestPost({request:new Request('https://example.com/api/inquiry',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)}),env:settings});
test('rejects submissions from another origin',async()=>assert.equal((await run(base,env,'https://other.com')).status,403));
test('requires contact consent',async()=>assert.equal((await run({...base,consent:undefined})).status,400));
test('validates email, enum values, length, and elapsed time',async()=>{for(const change of [{email:'invalid'},{employees:'5000'},{records:'x'.repeat(2001)},{startedAt:Date.now()}]) assert.equal((await run({...base,...change})).status,400);});
test('honeypot silently discards spam without delivering',async()=>assert.equal((await run({...base,website:'spam'})).status,200));
test('missing credentials never produce a false success',async()=>assert.equal((await run(base,{})).status,503));
test('verifies captcha then sends email with safe CSV and separate consent',async()=>{
 const original=globalThis.fetch; let mail;
 globalThis.fetch=async(url,options)=>{if(url.includes('siteverify'))return Response.json({success:true,hostname:'example.com'});mail=JSON.parse(options.body);return Response.json({id:'sent'});};
 try{assert.equal((await run({...base,company:'=SUM(A1)',campaign:{utm_source:'email'},share:'on'})).status,200);assert.equal(mail.reply_to,'jane@example.com');assert.match(mail.text,/sharingConsent: true/);assert.match(mail.text,/utm_source: email/);assert.match(Buffer.from(mail.attachments[0].content,'base64').toString(),/'=SUM/);assert.doesNotMatch(mail.text,/test-token|test-secret/);}finally{globalThis.fetch=original;}
});
test('buyer sharing is off unless explicitly checked',async()=>{
 const original=globalThis.fetch;let text;
 globalThis.fetch=async(url,options)=>{if(url.includes('siteverify'))return Response.json({success:true,hostname:'example.com'});text=JSON.parse(options.body).text;return Response.json({id:'sent'});};
 try{assert.equal((await run()).status,200);assert.match(text,/sharingConsent: false/);}finally{globalThis.fetch=original;}
});
test('failed spam checks and email failures do not report success',async()=>{
 const original=globalThis.fetch;
 try{globalThis.fetch=async()=>Response.json({success:false});assert.equal((await run()).status,400);globalThis.fetch=async(url)=>url.includes('siteverify')?Response.json({success:true,hostname:'example.com'}):new Response('',{status:503});assert.equal((await run()).status,502);}finally{globalThis.fetch=original;}
});
