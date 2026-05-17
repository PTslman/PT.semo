// ========== مراقبة وتحسين أداء التطبيق ==========
(function() {
    // قياس وقت تحميل الصفحة
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.timing;
            const loadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`⏱️ وقت تحميل الصفحة: ${loadTime}ms`);
            
            // تسجيل في التحليلات
            if (typeof spAnalytics !== 'undefined') {
                spAnalytics.sendEvent('performance', { loadTime });
            }
        }, 0);
    });
    
    // اكتشاف البطء في الشبكة
    if ('connection' in navigator) {
        const conn = navigator.connection;
        console.log(`📡 نوع الشبكة: ${conn.effectiveType}`);
        console.log(`📡 السرعة المقدرة: ${conn.downlink}Mbps`);
        
        if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
            document.body.classList.add('slow-connection');
            showToast('⚠️ اتصال إنترنت بطيء، قد تختلف سرعة التحميل', 5000);
        }
    }
    
    // استخدام Web Worker للعمليات الثقيلة (اختياري)
    if (window.Worker) {
        // يمكن إنشاء Web Worker للمعالجات الثقيلة
    }
    
    // تحسين التحميل البطيء للصور (Lazy Loading)
    const images = document.querySelectorAll('img');
    if ('loading' in HTMLImageElement.prototype) {
        images.forEach(img => {
            if (!img.loading) img.loading = 'lazy';
        });
    }
    
    // إضافة معالجة للأخطاء
    window.addEventListener('error', (e) => {
        console.error('❌ خطأ في التطبيق:', e.error);
        if (typeof spAnalytics !== 'undefined') {
            spAnalytics.sendEvent('error', { message: e.message });
        }
    });
})();
