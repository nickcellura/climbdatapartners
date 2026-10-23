const industries = ['Manufacturing','Distribution','Equipment rental','Logistics','Professional services','Other B2B business','Other'];
const employees = ['Under 20','20–99','100–299','300–999','1,000+'];
const years = ['Under 5','5–9','10–19','20+'];
const reply = (status, body) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function onRequestPost({request,env}) {
  const origin = request.headers.get('Origin');
  if (origin !== new URL(request.url).origin) return reply(403,{error:'Please submit your inquiry from this website.'});
  if (!request.headers.get('Content-Type')?.includes('application/json')) return reply(415,{error:'Unsupported submission format.'});
  if (Number(request.headers.get('Content-Length') || 0) > 16000) return reply(413,{error:'Your inquiry is too long.'});
  let body;
  try { const raw = await request.text(); if (raw.length > 16000) return reply(413,{error:'Your inquiry is too long.'}); body = JSON.parse(raw); } catch { return reply(400,{error:'Invalid submission.'}); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(400,{error:'Invalid submission.'});
  if (body.website) return reply(200,{ok:true});
  const fields = {};
  for (const [key,max] of [['fullName',120],['email',254],['company',160],['records',2000]]) {
    if (typeof body[key] !== 'string' || body[key].length > max || (key !== 'records' && !body[key].trim())) return reply(400,{error:'Please complete the required fields within the stated limits.'});
    fields[key] = body[key].trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || /[\r\n]/.test(fields.fullName + fields.email + fields.company)) return reply(400,{error:'Please enter valid contact details.'});
  if (!industries.includes(body.industry) || !employees.includes(body.employees) || !years.includes(body.years) || body.consent !== 'on' || (body.share !== undefined && body.share !== 'on')) return reply(400,{error:'Please complete the selections and required contact consent.'});
  const elapsed = Date.now() - Number(body.startedAt);
  if (!Number.isFinite(elapsed) || elapsed < 2500 || elapsed > 86400000) return reply(400,{error:'Please refresh the page and take a moment to complete the form.'});
  if (!env.RESEND_API_KEY || !env.INQUIRY_TO_EMAIL || !env.INQUIRY_FROM_EMAIL || !env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_SITE_KEY) return reply(503,{error:'Our inquiry form is not yet available. Please try again later.'});
  if (typeof body['cf-turnstile-response'] !== 'string' || body['cf-turnstile-response'].length > 2048) return reply(400,{error:'Please complete the spam protection check.'});
  try {
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:body['cf-turnstile-response'],remoteip:request.headers.get('CF-Connecting-IP') || ''})});
    const verified = await verification.json();
    if (!verification.ok || !verified.success || verified.hostname !== new URL(request.url).hostname) return reply(400,{error:'Spam protection failed. Please refresh and try again.'});
    const campaign = {};
    for (const key of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']) if (typeof body.campaign?.[key] === 'string') campaign[key] = body.campaign[key].slice(0,200);
    const received = new Date().toISOString();
    const values = {...fields,industry:body.industry,employees:body.employees,years:body.years,contactConsent:true,sharingConsent:body.share === 'on',consentVersion:'2026-10-22',received,...campaign};
    const escapeCell = value => '"' + String(value).replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""') + '"';
    const csv = Object.keys(values).map(escapeCell).join(',') + '\r\n' + Object.values(values).map(escapeCell).join(',') + '\r\n';
    const bytes = new TextEncoder().encode(csv);
    let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
    const delivery = await fetch('https://api.resend.com/emails', {method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.INQUIRY_FROM_EMAIL,to:[env.INQUIRY_TO_EMAIL],reply_to:fields.email,subject:'New Climb Data Partners inquiry',text:Object.entries(values).map(([key,value]) => `${key}: ${value}`).join('\n') + '\n\nBusiness/contact information must not be shared with prospective buyers unless sharingConsent is true or separate later permission is obtained.',attachments:[{filename:'inquiry.csv',content:btoa(binary)}]})});
    if (!delivery.ok) return reply(502,{error:'We couldn’t deliver your inquiry. Please try again shortly.'});
    return reply(200,{ok:true});
  } catch { return reply(502,{error:'We couldn’t deliver your inquiry. Please try again shortly.'}); }
}
