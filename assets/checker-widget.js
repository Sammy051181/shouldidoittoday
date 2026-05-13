/* checker-widget.js — embedded live GO/CAUTION/NO-GO checker for sub-pages
   Configure with window.CWConfig = { task, region, period } before including. */
(function () {
  var C = window.CWConfig || {};
  var TASK = C.task || 'grass';
  var REGION_KEY = (C.region || 'UK').toUpperCase();
  var INIT_PERIOD = C.period || 'today';
  var CONTAINER_ID = C.containerId || 'cwWidget';

  /* ── RULES ─────────────────────────────────────────────────────────────── */
  var RULES = {
    grass:   { rainProb: 30, windMaxMph: 26, tempMinC: 8,  tempMaxC: 28, hours: [8,  18], minHours: 2 },
    washCar: { rainProb: 30, windMaxMph: 30, tempMinC: 4,  tempMaxC: 26, hours: [8,  19], minHours: 2 },
    washing: { rainProb: 22, windMaxMph: 34, tempMinC: 8,  tempMaxC: 32, hours: [7,  18], minHours: 4 },
    paint:   { rainProb: 15, windMaxMph: 22, tempMinC: 10, tempMaxC: 25, hours: [9,  17], minHours: 5 },
    bbq:     { rainProb: 40, windMaxMph: 28, tempMinC: 10, tempMaxC: 34, hours: [11, 21], minHours: 2 },
    dog:     { rainProb: 60, windMaxMph: 42, tempMinC: -2, tempMaxC: 26, hours: [6,  22], minHours: 1 },
    jacket:  { rainProb: 45, windMaxMph: 34, tempMinC: 12, tempMaxC:100, hours: [6,  23], minHours: 1 },
    run:     { rainProb: 60, windMaxMph: 35, tempMinC: 2,  tempMaxC: 25, hours: [5,  22], minHours: 1 },
    windows: { rainProb: 25, windMaxMph: 24, tempMinC: 4,  tempMaxC: 25, hours: [8,  17], minHours: 2 },
    plants:  { rainProb: 45, windMaxMph: 35, tempMinC: 4,  tempMaxC: 34, hours: [6,  21], minHours: 1 },
    camping: { rainProb: 35, windMaxMph: 22, tempMinC: 5,  tempMaxC: 30, hours: [10, 22], minHours: 4 },
    hiking:  { rainProb: 45, windMaxMph: 32, tempMinC: 3,  tempMaxC: 26, hours: [7,  19], minHours: 3 },
    cycling: { rainProb: 45, windMaxMph: 28, tempMinC: 3,  tempMaxC: 28, hours: [6,  20], minHours: 2 },
    golf:    { rainProb: 35, windMaxMph: 25, tempMinC: 4,  tempMaxC: 28, hours: [7,  19], minHours: 3 },
  };

  /* ── REGION CONFIG ──────────────────────────────────────────────────────── */
  var REGIONS = {
    UK: { tempUnit: 'C', windUnit: 'mph', locale: 'en-GB', placeholder: 'Postcode, town or city',             countryCode: 'GB' },
    IE: { tempUnit: 'C', windUnit: 'kmh', locale: 'en-IE', placeholder: 'Town, city or area',                 countryCode: 'IE' },
    US: { tempUnit: 'F', windUnit: 'mph', locale: 'en-US', placeholder: 'ZIP code, city or state',            countryCode: 'US' },
    CA: { tempUnit: 'C', windUnit: 'kmh', locale: 'en-CA', placeholder: 'Postal code, town or city',          countryCode: 'CA' },
    AU: { tempUnit: 'C', windUnit: 'kmh', locale: 'en-AU', placeholder: 'Postcode, suburb or city',           countryCode: 'AU' },
    NZ: { tempUnit: 'C', windUnit: 'kmh', locale: 'en-NZ', placeholder: 'Postcode, town or city',             countryCode: 'NZ' },
  };

  var rgn = REGIONS[REGION_KEY] || REGIONS.UK;
  var rule = RULES[TASK] || RULES.grass;

  /* ── HELPERS ────────────────────────────────────────────────────────────── */
  function sod(d) { var x = new Date(d); x.setHours(0,0,0,0); return x; }
  function makeTime(day, h) { var x = new Date(day); x.setHours(h,0,0,0); return x; }
  function hoursAfter(d, h) { return new Date(+d + h * 3600000); }
  function hoursBefore(d, h) { return new Date(+d - h * 3600000); }
  function between(rows, a, b) { return rows.filter(function(r){ return r.time >= a && r.time <= b; }); }
  function avg(a, fb) { return a.length ? a.reduce(function(t,v){return t+v;},0)/a.length : (fb||0); }
  function maxVal(a, fb) { return a.length ? Math.max.apply(null, a) : (fb||0); }
  function sumArr(a) { return a.reduce(function(t,v){return t+v;},0); }
  function mm(rows) { return sumArr(rows.map(function(r){return r.precip;})); }
  function fTemp(c) { return rgn.tempUnit === 'F' ? (Math.round(c*9/5+32)+'°F') : (Math.round(c)+'°C'); }
  function fWind(m) { return rgn.windUnit === 'kmh' ? (Math.round(m*1.60934)+' km/h') : (Math.round(m)+' mph'); }
  function fTime(d) { return d.toLocaleTimeString(rgn.locale, {hour:'2-digit', minute:'2-digit'}); }
  function isStorm(rows) { return rows.some(function(r){return r.wc >= 95;}); }
  function isWintry(rows) { return rows.some(function(r){return [56,57,66,67,71,73,75,77,85,86].indexOf(r.wc) >= 0;}); }

  /* ── GEOCODING ──────────────────────────────────────────────────────────── */
  function cleanPostcode(v) { return v.trim().toUpperCase().replace(/\s+/g,''); }

  function looksLikeUkPostcode(v) {
    var c = cleanPostcode(v);
    return /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/.test(c) || /^[A-Z]{1,2}[0-9][A-Z0-9]?$/.test(c);
  }

  function looksLikeUsZip(v) { return /^[0-9]{5}(-[0-9]{4})?$/.test(v.trim()); }

  async function geocodeUkPostcode(q) {
    var c = cleanPostcode(q);
    if (/^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/.test(c)) {
      var r = await fetch('https://api.postcodes.io/postcodes/' + encodeURIComponent(c));
      if (r.ok) { var d = await r.json(); if (d.result) return { lat: d.result.latitude, lon: d.result.longitude, name: [d.result.postcode, d.result.admin_district, 'UK'].filter(Boolean).join(', ') }; }
    }
    var out = c.replace(/[0-9][A-Z]{2}$/, '');
    var r2 = await fetch('https://api.postcodes.io/outcodes/' + encodeURIComponent(out));
    if (r2.ok) { var d2 = await r2.json(); if (d2.result) return { lat: d2.result.latitude, lon: d2.result.longitude, name: [d2.result.outcode, Array.isArray(d2.result.admin_district)?d2.result.admin_district[0]:d2.result.admin_district,'UK'].filter(Boolean).join(', ') }; }
    throw new Error('Postcode not found. Try a full postcode or nearby town.');
  }

  async function geocodeText(q) {
    if (REGION_KEY === 'UK' && looksLikeUkPostcode(q)) return geocodeUkPostcode(q);
    if (REGION_KEY === 'US' && looksLikeUsZip(q)) {
      var r = await fetch('https://api.zippopotam.us/US/' + q.trim().slice(0,5));
      if (r.ok) { var d = await r.json(); var p = d.places && d.places[0]; if (p) return { lat: +p.latitude, lon: +p.longitude, name: [p['place name'], p.state, 'US'].filter(Boolean).join(', ') }; }
    }
    var variants = [q.trim()];
    if (REGION_KEY === 'UK') variants.push(q + ', UK', q + ', England');
    if (REGION_KEY === 'AU') variants.push(q + ', Australia');
    if (REGION_KEY === 'NZ') variants.push(q + ', New Zealand');
    if (REGION_KEY === 'IE') variants.push(q + ', Ireland');
    if (REGION_KEY === 'CA') variants.push(q + ', Canada');
    for (var i = 0; i < variants.length; i++) {
      var res = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(variants[i]) + '&count=10&language=en&format=json');
      if (!res.ok) continue;
      var data = await res.json();
      if (!data.results || !data.results.length) continue;
      var preferred = rgn.countryCode;
      var matches = data.results.filter(function(r){ return r.country_code === preferred; });
      var best = (matches.length ? matches : data.results)[0];
      return { lat: best.latitude, lon: best.longitude, name: [best.name, best.admin1, best.country_code].filter(Boolean).join(', ') };
    }
    throw new Error('Location not found. Try a postcode, nearby town or city.');
  }

  async function reverseGeocode(lat, lon) {
    if (REGION_KEY === 'UK') {
      try {
        var r = await fetch('https://api.postcodes.io/postcodes?lon=' + lon + '&lat=' + lat + '&limit=1');
        if (r.ok) { var d = await r.json(); var p = d.result && d.result[0]; if (p) return [p.admin_district, p.region, 'UK'].filter(Boolean).join(', '); }
      } catch(e) {}
    }
    return 'your current location';
  }

  /* ── WEATHER ────────────────────────────────────────────────────────────── */
  async function getWeather(lat, lon) {
    var params = new URLSearchParams({
      latitude: lat, longitude: lon,
      hourly: 'temperature_2m,apparent_temperature,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,soil_moisture_1_to_3cm',
      current: 'temperature_2m,apparent_temperature,precipitation,rain,wind_speed_10m',
      timezone: 'auto', forecast_days: '4', past_days: '3', wind_speed_unit: 'mph'
    });
    var r = await fetch('https://api.open-meteo.com/v1/forecast?' + params.toString());
    if (!r.ok) throw new Error('Weather check failed. Try again shortly.');
    return r.json();
  }

  function buildRows(data) {
    return data.hourly.time.map(function(t, i) {
      return {
        time:   new Date(t),
        temp:   data.hourly.temperature_2m[i],
        feels:  (data.hourly.apparent_temperature  || [])[i] || data.hourly.temperature_2m[i],
        precip: data.hourly.precipitation[i] || 0,
        rp:     data.hourly.precipitation_probability[i] || 0,
        wc:     (data.hourly.weather_code || [])[i] || 0,
        wind:   data.hourly.wind_speed_10m[i] || 0,
        gust:   (data.hourly.wind_gusts_10m || [])[i] || 0,
        hum:    (data.hourly.relative_humidity_2m || [])[i],
        soil:   (data.hourly.soil_moisture_1_to_3cm || [])[i],
      };
    });
  }

  function findWindow(rows, ok, minH) {
    var run = [], best = [];
    rows.forEach(function(r) {
      if (ok(r)) { run.push(r); } else { if (run.length > best.length) best = run; run = []; }
    });
    if (run.length > best.length) best = run;
    if (best.length < minH) return 'No clear window';
    return fTime(best[0].time) + '–' + fTime(hoursAfter(best[best.length-1].time, 1));
  }

  /* ── ANALYSIS ───────────────────────────────────────────────────────────── */
  function analyseDay(data, day, isToday) {
    var now = new Date();
    var rows = buildRows(data);
    var start = makeTime(day, rule.hours[0]);
    var end = makeTime(day, rule.hours[1]);
    var base = isToday ? now : start;
    var useful = between(rows, isToday ? new Date(Math.max(+start, +now)) : start, end);
    var next12 = between(rows, base, hoursAfter(base, 12));
    var past24 = between(rows, hoursBefore(base, 24), base);

    var ctx = {
      temp:     avg(useful.map(function(r){return r.temp;}), data.current.temperature_2m),
      maxTemp:  maxVal(useful.map(function(r){return r.temp;}), data.current.temperature_2m),
      minFeels: Math.min.apply(null, useful.length ? useful.map(function(r){return r.feels;}) : [data.current.apparent_temperature || data.current.temperature_2m]),
      maxWind:  maxVal(useful.map(function(r){return r.wind;}), 0),
      maxGust:  maxVal(useful.map(function(r){return r.gust;}), 0),
      rp:       maxVal(useful.map(function(r){return r.rp;}), 0),
      rn12:     mm(next12),
      rp24:     mm(past24),
      rt:       mm(useful),
      avgHum:   avg(useful.map(function(r){return r.hum;}).filter(function(v){return v != null;}), null),
      storm:    isStorm(useful) || isStorm(next12),
      wintry:   isWintry(useful) || isWintry(next12),
      curRain:  isToday ? (data.current.precipitation || data.current.rain || 0) : 0,
      soil:     (function(){ var f = rows.slice().reverse().find(function(r){return r.time <= base && r.soil != null;}); return f ? f.soil : null; })(),
    };

    var goodRow = function(r) {
      return r.rp <= rule.rainProb && r.precip < 0.2 && r.wind <= rule.windMaxMph && r.temp >= rule.tempMinC && r.temp <= rule.tempMaxC;
    };

    var score = 100, reasons = [];
    var best = findWindow(useful, goodRow, rule.minHours);

    if (!useful.length)         { score -= 40; reasons.push('No usable daylight window remaining today.'); }
    if (ctx.curRain > 0)        { score -= (TASK==='run'||TASK==='dog') ? 10 : 35; reasons.push('It is raining now.'); }
    if (ctx.storm)              { score -= 45; reasons.push('Storm or thunder risk detected.'); }
    if (ctx.wintry)             { score -= 30; reasons.push('Wintry or icy conditions present.'); }
    if (ctx.rp > rule.rainProb) { score -= 20; reasons.push('Rain risk is higher than ideal ('+ Math.round(ctx.rp) +'%).'); }
    if (ctx.maxWind > rule.windMaxMph || ctx.maxGust > rule.windMaxMph + 10) { score -= 18; reasons.push('Wind may be too strong (' + fWind(ctx.maxWind) + ').'); }
    if (ctx.temp < rule.tempMinC)  { score -= 16; reasons.push('It may be too cold (' + fTemp(ctx.temp) + ').'); }
    if (ctx.temp > rule.tempMaxC)  { score -= 16; reasons.push('It may be too hot (' + fTemp(ctx.temp) + ').'); }

    if (TASK === 'grass') {
      if (ctx.rp24 > 2) { score -= 35; reasons.push('Grass is likely wet from recent rain.'); }
    }
    if (TASK === 'washing') {
      if (best === 'No clear window') { score -= 35; reasons.push('Not enough dry daylight hours for washing to dry properly.'); }
      if (ctx.avgHum && ctx.avgHum > 82) { score -= 18; reasons.push('High humidity — drying will be slow.'); }
    }
    if (TASK === 'paint') {
      if (ctx.rp24 > 1)  { score -= 35; reasons.push('Surfaces may still be damp from recent rain.'); }
      if (ctx.rn12 > 0.2) { score -= 35; reasons.push('Rain possible before paint has time to cure.'); }
    }
    if (TASK === 'washCar' || TASK === 'windows') {
      if (ctx.rn12 > 0.5) { score -= 25; reasons.push('Rain likely soon — results may not last.'); }
      if (ctx.temp <= 2) { score -= 35; reasons.push('Near-freezing — surfaces could be icy or unsafe.'); }
    }
    if (TASK === 'bbq') {
      best = findWindow(useful.filter(function(r){return r.time.getHours() >= 12 && r.time.getHours() <= 21;}), goodRow, 2);
      if (ctx.storm) { score -= 55; reasons.unshift('Thunder or storm risk — outdoor cooking unsafe.'); }
      else if (ctx.maxGust > 38) { score -= 35; reasons.push('Very strong gusts make BBQs harder and less safe.'); }
      else if (ctx.maxGust > 28) { score -= 18; reasons.push('Gusts may make BBQ setup and cooking less comfortable.'); }
    }
    if (TASK === 'run') {
      if (ctx.maxTemp >= 29) { score -= 45; reasons.push('May be too hot for a safe run.'); }
      else if (ctx.maxTemp >= 22) { score -= 15; reasons.push('Heat may make running harder.'); }
    }
    if (TASK === 'dog') {
      if (ctx.maxTemp >= 28) { score -= 45; reasons.push('May be too hot for a safe dog walk — check pavement heat.'); }
      else if (ctx.maxTemp >= 23) { score -= 20; reasons.push('Heat may be uncomfortable for dogs on pavements.'); }
    }
    if (TASK === 'plants') {
      score = 42; reasons = [];
      best = findWindow(useful.filter(function(r){var h=r.time.getHours();return [6,7,8,9,18,19,20].indexOf(h)>=0;}), function(r){return r.precip<0.1&&r.rp<60;}, 1);
      if (ctx.curRain > 0)      { score -= 35; reasons.push('It is raining now — no need to water.'); }
      if (ctx.rn12 >= 2)        { score -= 30; reasons.push('Useful rain expected soon.'); }
      else                      { score += 10; reasons.push('No useful rain expected soon.'); }
      if (ctx.rp24 >= 5)        { score -= 32; reasons.push('Good rainfall in the last 24 hours.'); }
      else if (mm(between(rows, hoursBefore(base, 72), base)) < 1) { score += 18; reasons.push('It has been fairly dry recently.'); }
      if (ctx.maxTemp >= 25)    { score += 14; reasons.push('Warm weather can dry pots and baskets faster.'); }
      if (ctx.maxWind >= 18)    { score += 8;  reasons.push('Wind can dry surface soil faster.'); }
      if (ctx.soil !== null && ctx.soil < 0.22) { score += 16; reasons.push('Near-surface soil moisture looks low.'); }
    }
    if (TASK === 'jacket') {
      var status = 'NO', css = 'no'; reasons = [];
      if (ctx.minFeels <= 11)                                      { status = 'TAKE ONE'; css = '';        reasons.push('It will feel cold enough for a coat.'); }
      else if (ctx.minFeels <= 15 || ctx.rn12 > 0.5 || ctx.maxWind > 18) { status = 'MAYBE';    css = 'caution'; reasons.push('A light layer or waterproof may be useful.'); }
      else                                                         { reasons.push('It looks mild enough without a coat.'); }
      return { status: status, css: css, best: status === 'NO' ? 'Not needed' : 'Take one', rain: Math.round(ctx.rp) + '% max', wind: fWind(ctx.maxWind), temp: fTemp(ctx.minFeels), why: reasons };
    }

    if (best === 'No clear window') { score -= 20; reasons.push('No clear usable window in the forecast.'); }
    if (!reasons.length) reasons.push('Conditions look suitable for this task.');

    var status, css;
    if (TASK === 'plants') {
      if (score >= 76 && ctx.rn12 < 2 && ctx.curRain <= 0) { status = 'WATER'; css = ''; }
      else if (score < 45)  { status = 'WAIT'; css = 'no'; }
      else                  { status = 'CHECK SOIL'; css = 'caution'; }
    } else if (TASK === 'bbq' && (ctx.storm || ctx.maxGust > 40)) {
      status = 'WARNING'; css = 'no';
    } else {
      if (score < 45)      { status = 'NO-GO';   css = 'no'; }
      else if (score < 72) { status = 'CAUTION'; css = 'caution'; }
      else                 { status = 'GO';      css = ''; }
    }

    return { status: status, css: css, best: best, rain: Math.round(ctx.rp) + '% max', wind: fWind(ctx.maxWind), temp: fTemp(ctx.temp), why: reasons };
  }

  /* ── STYLES ─────────────────────────────────────────────────────────────── */
  var CSS = `
#cwWidget{font-family:inherit}
.cw-tabs{display:flex;gap:6px;margin-bottom:10px}
.cw-tab{flex:1;padding:8px 6px;border:1px solid var(--line,#dce8da);border-radius:999px;background:#fff;font:inherit;font-weight:800;font-size:.84rem;cursor:pointer;color:#607063;transition:all .15s}
.cw-tab.active{background:var(--green,#16783c);color:#fff;border-color:var(--green,#16783c)}
.cw-loc-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:7px}
.cw-input{width:100%;padding:11px 14px;border:1px solid var(--line,#dce8da);border-radius:14px;font:inherit;font-size:.94rem;outline:none;background:#fff;color:var(--ink,#162119)}
.cw-input:focus{border-color:#14b8a6;box-shadow:0 0 0 3px rgba(20,184,166,.12)}
.cw-btn{padding:11px 16px;border:0;border-radius:14px;background:var(--green,#16783c);color:#fff;font:inherit;font-weight:900;font-size:.92rem;cursor:pointer;white-space:nowrap}
.cw-btn:hover{background:#115f31}
.cw-geo{width:100%;padding:9px;border:1px solid var(--line,#dce8da);border-radius:12px;background:#fff;font:inherit;font-weight:700;font-size:.85rem;color:var(--green,#16783c);cursor:pointer;margin-bottom:9px;display:flex;align-items:center;justify-content:center;gap:6px}
.cw-geo:hover{background:#f0fdf4;border-color:#86efac}
.cw-status{font-size:.82rem;color:#607063;margin-bottom:8px;min-height:18px;display:flex;align-items:center;gap:7px}
.cw-pulse{width:7px;height:7px;border-radius:50%;background:#14b8a6;box-shadow:0 0 0 4px rgba(20,184,166,.18);flex-shrink:0;animation:cwPulse 1.4s ease-in-out infinite}
@keyframes cwPulse{0%,100%{box-shadow:0 0 0 4px rgba(20,184,166,.18)}50%{box-shadow:0 0 0 7px rgba(20,184,166,.06)}}
.cw-result{border-radius:18px;overflow:hidden;border:2px solid rgba(22,120,60,.18);margin-top:2px;animation:cwFade .3s ease}
@keyframes cwFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.cw-result.caution{border-color:rgba(180,83,9,.28)}
.cw-result.no{border-color:rgba(185,28,28,.28)}
.cw-top{display:grid;grid-template-columns:80px 1fr;gap:12px;padding:14px 14px 10px;align-items:start}
.cw-verdict{border-radius:12px;text-align:center;font-weight:1000;font-size:1rem;padding:11px 6px;line-height:1.1;background:#dcfce7;color:var(--green,#16783c);letter-spacing:-.02em}
.cw-verdict.caution{background:#fff7ed;color:#b45309}
.cw-verdict.no{background:#fff1f2;color:#b91c1c}
.cw-reason{margin:0 0 8px;font-size:.88rem;color:#24352a;font-weight:600;line-height:1.4}
.cw-facts{display:flex;flex-wrap:wrap;gap:5px}
.cw-fact{background:#f5f8f1;border-radius:8px;padding:3px 8px;font-size:.78rem;font-weight:700;color:#607063}
.cw-why{padding:0 14px 12px 28px;font-size:.83rem;color:#607063;margin:0;list-style:disc}
.cw-why li+li{margin-top:3px}
.cw-full-link{display:block;text-align:center;padding:10px;background:rgba(22,120,60,.06);border-top:1px solid rgba(22,120,60,.12);font-size:.82rem;font-weight:800;color:var(--green,#16783c);text-decoration:none}
.cw-full-link:hover{background:rgba(22,120,60,.11)}
@media(max-width:480px){.cw-top{grid-template-columns:1fr;gap:8px}.cw-verdict{padding:8px 6px}}
`;

  /* ── DOM ────────────────────────────────────────────────────────────────── */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    // Inject styles once
    if (!document.getElementById('cwStyles')) {
      var s = document.createElement('style');
      s.id = 'cwStyles'; s.textContent = CSS;
      document.head.appendChild(s);
    }

    // Determine full-checker URL
    var regionParam = REGION_KEY === 'UK' ? '' : ('&region=' + REGION_KEY.toLowerCase());
    var taskSlug = (C.taskSlug || TASK);
    var fullUrl = '/?' + (REGION_KEY !== 'UK' ? 'region=' + REGION_KEY.toLowerCase() + '&' : '') + 'task=' + taskSlug + '&period=today#main';

    container.innerHTML = [
      '<div class="cw-tabs">',
        '<button class="cw-tab active" data-cwp="today">Today</button>',
        '<button class="cw-tab" data-cwp="tomorrow">Tomorrow</button>',
        '<button class="cw-tab" data-cwp="weekend">Weekend</button>',
      '</div>',
      '<div class="cw-loc-row">',
        '<input id="cwInput" class="cw-input" type="search" placeholder="' + rgn.placeholder + '" maxlength="80" autocomplete="off">',
        '<button id="cwCheck" class="cw-btn">Check</button>',
      '</div>',
      '<button id="cwGeo" class="cw-geo">📍 Use my location</button>',
      '<div id="cwStatus" class="cw-status"></div>',
      '<div id="cwResult" class="cw-result" style="display:none">',
        '<div class="cw-top">',
          '<div id="cwVerdict" class="cw-verdict">—</div>',
          '<div>',
            '<p id="cwReason" class="cw-reason"></p>',
            '<div class="cw-facts">',
              '<span class="cw-fact">Window: <strong id="cwWindow">—</strong></span>',
              '<span class="cw-fact">Rain: <strong id="cwRain">—</strong></span>',
              '<span class="cw-fact">Wind: <strong id="cwWind">—</strong></span>',
              '<span class="cw-fact">Temp: <strong id="cwTemp">—</strong></span>',
            '</div>',
          '</div>',
        '</div>',
        '<ul class="cw-why" id="cwWhy"></ul>',
        '<a class="cw-full-link" href="' + fullUrl + '" id="cwFullLink">More details &amp; weekly forecast →</a>',
      '</div>',
    ].join('');

    var curPeriod = INIT_PERIOD;
    var lastPlace = null;
    var lastData = null;

    function setStatus(text, pulse) {
      var el = document.getElementById('cwStatus');
      el.innerHTML = '';
      if (pulse) { var dot = document.createElement('span'); dot.className = 'cw-pulse'; el.appendChild(dot); }
      var span = document.createElement('span'); span.textContent = text; el.appendChild(span);
    }

    function getTargetDay(data) {
      var today = sod(new Date());
      if (curPeriod === 'today')    return today;
      if (curPeriod === 'tomorrow') return sod(hoursAfter(today, 24));
      // weekend: nearest Saturday
      var day = today.getDay();
      var toSat = day === 6 ? 7 : (6 - day + 7) % 7 || 7;
      return sod(hoursAfter(today, toSat * 24));
    }

    function renderResult(name, data) {
      var day = getTargetDay(data);
      var isToday = sod(day).getTime() === sod(new Date()).getTime();
      var r = analyseDay(data, day, isToday);

      var result = document.getElementById('cwResult');
      result.className = 'cw-result' + (r.css ? ' ' + r.css : '');
      result.style.display = '';

      var v = document.getElementById('cwVerdict');
      v.className = 'cw-verdict' + (r.css ? ' ' + r.css : '');
      v.textContent = r.status;

      document.getElementById('cwReason').textContent = r.why[0] || 'Conditions checked.';
      document.getElementById('cwWindow').textContent = r.best;
      document.getElementById('cwRain').textContent   = r.rain;
      document.getElementById('cwWind').textContent   = r.wind;
      document.getElementById('cwTemp').textContent   = r.temp;
      document.getElementById('cwWhy').innerHTML = r.why.map(function(w){ return '<li>' + w + '</li>'; }).join('');

      var periodParam = curPeriod !== 'today' ? '&period=' + curPeriod : '&period=today';
      var locParam = name !== 'your current location' ? '&location=' + encodeURIComponent(name) : '';
      document.getElementById('cwFullLink').href = '/?' + (REGION_KEY !== 'UK' ? 'region=' + REGION_KEY.toLowerCase() + '&' : '') + 'task=' + taskSlug + periodParam + locParam + '#main';

      setStatus('Showing: ' + name + (curPeriod !== 'today' ? ' (' + curPeriod + ')' : ''), false);
    }

    async function runCheck(q) {
      try {
        document.getElementById('cwResult').style.display = 'none';
        setStatus('Looking up location…', true);
        var place = await geocodeText(q);
        setStatus('Getting weather…', true);
        var data = await getWeather(place.lat, place.lon);
        lastPlace = place;
        lastData = data;
        renderResult(place.name, data);
      } catch(e) {
        setStatus(e.message || 'Something went wrong. Try another location.', false);
      }
    }

    async function runGeo() {
      if (!navigator.geolocation) { setStatus('Geolocation not supported. Enter a location.', false); return; }
      setStatus('Requesting location…', true);
      document.getElementById('cwResult').style.display = 'none';
      navigator.geolocation.getCurrentPosition(
        async function(pos) {
          try {
            var lat = pos.coords.latitude, lon = pos.coords.longitude;
            setStatus('Getting weather…', true);
            var data = await getWeather(lat, lon);
            var name = await reverseGeocode(lat, lon);
            lastPlace = { lat: lat, lon: lon, name: name };
            lastData = data;
            renderResult(name, data);
          } catch(e) { setStatus(e.message || 'Could not check location.', false); }
        },
        function() { setStatus('Location permission not granted. Enter a location.', false); },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
      );
    }

    // Events
    document.getElementById('cwCheck').addEventListener('click', function() {
      var q = document.getElementById('cwInput').value.trim();
      if (q) runCheck(q);
    });
    document.getElementById('cwInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { var q = this.value.trim(); if (q) runCheck(q); }
    });
    document.getElementById('cwGeo').addEventListener('click', runGeo);

    container.querySelectorAll('[data-cwp]').forEach(function(tab) {
      tab.addEventListener('click', function() {
        container.querySelectorAll('[data-cwp]').forEach(function(t){ t.classList.remove('active'); });
        this.classList.add('active');
        curPeriod = this.dataset.cwp;
        if (lastData && lastPlace) renderResult(lastPlace.name, lastData);
      });
    });

    // Auto-detect on load
    runGeo();
  });
})();
