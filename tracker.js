;(function () {
  'use strict';

  var TRACK_URL = (typeof AVANTSERVICE_CONFIG !== 'undefined') ? AVANTSERVICE_CONFIG.API_TRACK : 'http://localhost:3000/api/track';

  // ── IDs ────────────────────────────────────────────────────────────────────

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  var userId    = localStorage.getItem('_av_uid') || (function () { var id = uuid(); localStorage.setItem('_av_uid', id); return id; })();
  var sessionId = sessionStorage.getItem('_av_sid') || (function () { var id = uuid(); sessionStorage.setItem('_av_sid', id); return id; })();

  // ── Device ─────────────────────────────────────────────────────────────────

  function getDevice() {
    var ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  // ── UTM params ─────────────────────────────────────────────────────────────

  function getUTMs() {
    var p = new URLSearchParams(window.location.search);
    return {
      utm_source:   p.get('utm_source')   || '',
      utm_medium:   p.get('utm_medium')   || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_content:  p.get('utm_content')  || '',
      utm_term:     p.get('utm_term')     || '',
    };
  }

  // ── Send helper ────────────────────────────────────────────────────────────

  function send(payload) {
    try {
      fetch(TRACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  function sendBeaconJSON(payload) {
    try {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(TRACK_URL, blob);
    } catch (e) {
      send(payload);
    }
  }

  // ── Scroll depth ───────────────────────────────────────────────────────────

  var maxScroll = 0;

  function calcScroll() {
    var doc    = document.documentElement;
    var total  = Math.max(doc.scrollHeight - doc.clientHeight, 1);
    var pct    = Math.min(100, Math.round((window.scrollY / total) * 100));
    if (pct > maxScroll) maxScroll = pct;
  }

  window.addEventListener('scroll', calcScroll, { passive: true });

  // ── Scroll milestones ──────────────────────────────────────────────────────

  var milestones = [25, 50, 75, 90];
  var firedMilestones = {};

  function checkMilestones() {
    calcScroll();
    milestones.forEach(function (m) {
      if (maxScroll >= m && !firedMilestones[m]) {
        firedMilestones[m] = true;
        send({
          type: 'event', session_id: sessionId, user_id: userId,
          page: window.location.pathname,
          event_type: 'scroll_depth', event_label: m + '%', event_value: String(m),
        });
      }
    });
  }

  window.addEventListener('scroll', checkMilestones, { passive: true });

  // ── Page view ──────────────────────────────────────────────────────────────

  var startTime = Date.now();

  send(Object.assign({
    type:         'pageview',
    session_id:   sessionId,
    user_id:      userId,
    page:         window.location.pathname,
    page_title:   document.title || '',
    referrer:     document.referrer || '',
    device:       getDevice(),
    screen_w:     screen.width,
    screen_h:     screen.height,
    landing_page: window.location.pathname,
  }, getUTMs()));

  // ── Update on leave ────────────────────────────────────────────────────────

  function sendUpdate() {
    var elapsed = Math.round((Date.now() - startTime) / 1000);
    sendBeaconJSON({
      type:         'update',
      session_id:   sessionId,
      page:         window.location.pathname,
      time_on_page: elapsed,
      scroll_depth: maxScroll,
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') sendUpdate();
  });

  window.addEventListener('pagehide', sendUpdate);

  // ── CTA & button clicks ────────────────────────────────────────────────────

  function trackCTA(label) {
    send({
      type: 'event', session_id: sessionId, user_id: userId,
      page: window.location.pathname,
      event_type: 'cta_click', event_label: label, event_value: '',
    });
  }

  document.addEventListener('click', function (e) {
    // Anchor CTAs
    var a = e.target.closest('a');
    if (a) {
      var href = a.getAttribute('href') || '';

      // Downloads
      if (/\.(pdf|docx?|xlsx?|zip|rar)$/i.test(href)) {
        send({
          type: 'event', session_id: sessionId, user_id: userId,
          page: window.location.pathname,
          event_type: 'download',
          event_label: href.split('/').pop(),
          event_value: href,
        });
      }

      // CTA links
      if (
        a.classList.contains('cta-button') ||
        a.dataset.track ||
        a.closest('.cta-button')
      ) {
        trackCTA(a.dataset.trackLabel || a.textContent.trim().slice(0, 80) || 'CTA link');
      }
    }

    // Submit & CTA buttons
    var btn = e.target.closest('button');
    if (btn && (btn.type === 'submit' || btn.classList.contains('btn-submit') || btn.dataset.track)) {
      trackCTA(btn.dataset.trackLabel || btn.textContent.trim().slice(0, 80) || 'Button');
    }
  });

  // ── Form submits ───────────────────────────────────────────────────────────

  document.addEventListener('submit', function (e) {
    var form = e.target;
    send({
      type: 'event', session_id: sessionId, user_id: userId,
      page: window.location.pathname,
      event_type:  'form_submit',
      event_label: form.id || form.getAttribute('name') || 'contactForm',
      event_value: '',
    });
  });

  // ── Video plays ────────────────────────────────────────────────────────────

  document.querySelectorAll('video').forEach(function (v) {
    var fired = false;
    v.addEventListener('play', function () {
      if (fired) return;
      fired = true;
      send({
        type: 'event', session_id: sessionId, user_id: userId,
        page: window.location.pathname,
        event_type: 'video_play',
        event_label: v.getAttribute('src') || v.currentSrc || 'video',
        event_value: '',
      });
    });
  });

})();
