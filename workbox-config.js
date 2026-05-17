// workbox-config.js - إعدادات Workbox للتخزين المؤقت المتقدم
module.exports = {
    globDirectory: './',
    globPatterns: [
        '**/*.{html,js,css,png,json}'
    ],
    globIgnores: [
        'node_modules/**/*',
        'workbox-config.js'
    ],
    swDest: './sw.js',
    runtimeCaching: [{
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
        handler: 'CacheFirst',
        options: {
            cacheName: 'images-cache',
            expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60
            }
        }
    }, {
        urlPattern: /\.(?:css|js)$/,
        handler: 'StaleWhileRevalidate',
        options: {
            cacheName: 'assets-cache'
        }
    }, {
        urlPattern: /\/api\//,
        handler: 'NetworkFirst',
        options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 5
        }
    }]
};
