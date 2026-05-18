// performance.js – مراقبة وتحسين أداء التطبيق
(function() {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.timing;
            const loadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`⏱️ وقت تحميل الصفحة: ${loadTime}ms`);
            if (window.spAnalytics) window.spAnalytics.sendEvent('performance', { loadTime });
        }, 0);
    });
    if ('connection' in navigator) {
        const conn = navigator.connection;
        console.log(`📡 نوع الشبكة: ${conn.effectiveType}`);
        if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
            document.body.classList.add('slow-connection');
        }
    }
    // تقنية lazy loading للصور (إذا وجدت)
    if ('loading' in HTMLImageElement.prototype) {
        document.querySelectorAll('img').forEach(img => { if (!img.loading) img.loading = 'lazy'; });
    }
})();
