const config = window.CLIMB_CONFIG || {};
const form = document.querySelector('#inquiry-form');
const status = document.querySelector('#form-status');
const utmKeys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
const campaign = {};
const params = new URLSearchParams(location.search);
for (const key of utmKeys) if (params.has(key)) campaign[key] = params.get(key).slice(0,200);
let widget;
let siteKey;
if (form) {
  document.querySelector('#started-at').value = Date.now();
  fetch('/api/config').then(r => r.ok ? r.json() : {}).then(data => {
    siteKey = data.turnstileSiteKey;
    if (!siteKey) return;
    window.onTurnstileReady = () => { widget = window.turnstile.render('#turnstile', { sitekey: siteKey, theme: 'light' }); };
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileReady&render=explicit';
    script.onerror = () => { status.textContent = 'Spam protection could not load. Please refresh or check your connection.'; };
    document.head.append(script);
  }).catch(() => {});
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button');
    button.disabled = true;
    status.textContent = 'Sending your inquiry…';
    try {
      const payload = Object.fromEntries(new FormData(form));
      payload.campaign = campaign;
      let result;
      if (config.demoForm && ['localhost','127.0.0.1'].includes(location.hostname)) result = {demo:true};
      else {
        const response = await fetch('/api/inquiry', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
        result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'We couldn’t send your inquiry. Please try again shortly.');
      }
      form.hidden = true;
      const success = document.querySelector('#success');
      success.hidden = false;
      if (result.demo) success.querySelector('p:not(.eyebrow)').textContent = 'Preview only: this demonstrates the confirmation screen. No inquiry was sent.';
      success.focus();
      if (!result.demo) window.dispatchEvent(new CustomEvent(config.conversionEvent || 'climb_inquiry_success', {detail:{campaign}}));
    } catch (error) {
      status.textContent = error.message;
      if (widget !== undefined && window.turnstile) window.turnstile.reset(widget);
    } finally { button.disabled = false; }
  });
}
if (config.analyticsToken) {
  const script = document.createElement('script');
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.defer = true;
  script.dataset.cfBeacon = JSON.stringify({token:config.analyticsToken});
  document.head.append(script);
}
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
