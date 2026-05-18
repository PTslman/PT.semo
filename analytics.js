// analytics.js - تتبع إحصائيات بسيطة (بدون خوادم خارجية)
(function() {
    const STORAGE_KEY = 'spStudio_analytics';
    const SESSION_KEY = 'spStudio_session';
    
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 8);
        localStorage.setItem(SESSION_KEY, sessionId);
    }
    
    function sendEvent(eventName, eventData = {}) {
        const event = {
            event: eventName,
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            url: window.location.pathname,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            userAgent: navigator.userAgent.slice(0, 100),
            ...eventData
        };
        const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        events.unshift(event);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, 500)));
        console.log('[Analytics]', eventName, eventData);
    }
    
    window.addEventListener('load', () => sendEvent('page_view', { loadTime: performance.now() }));
    document.addEventListener('click', (e) => {
        const target = e.target;
        const btnId = target.id || target.closest?.('[id]')?.id;
        if (btnId) sendEvent('click', { id: btnId });
    });
    
    window.spAnalytics = { sendEvent, getStats: () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') };
})();
