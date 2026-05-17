// analytics.js - تتبع إحصائيات الاستخدام
(function() {
    const ANALYTICS_ENABLED = true;
    const SITE_ID = 'sp-studio';
    
    function sendEvent(eventName, eventData = {}) {
        if (!ANALYTICS_ENABLED) return;
        
        const data = {
            site: SITE_ID,
            event: eventName,
            timestamp: new Date().toISOString(),
            url: window.location.pathname,
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            ...eventData
        };
        
        // حفظ في localStorage للإحصائيات المحلية
        const stats = JSON.parse(localStorage.getItem('spStudio_stats') || '[]');
        stats.unshift(data);
        localStorage.setItem('spStudio_stats', JSON.stringify(stats.slice(0, 100)));
        
        console.log('[Analytics]', eventName, eventData);
    }
    
    // تتبع الصفحات
    sendEvent('page_view');
    
    // تتبع تفاعلات المستخدم
    document.addEventListener('click', (e) => {
        const target = e.target;
        const btnId = target.id;
        const btnText = target.innerText?.slice(0, 50);
        if (btnId || btnText) {
            sendEvent('click', { id: btnId, text: btnText });
        }
    });
    
    // تصدير الدوال للاستخدام العالمي
    window.spAnalytics = { sendEvent };
})();
