// Performance optimization utilities

// Image Lazy Loading
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Resource Preloading
function preloadResources() {
    const links = [
        { href: '/css/styles.css', as: 'style' },
        { href: '/js/main.js', as: 'script' },
        // Add more resources to preload
    ];

    links.forEach(link => {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.href = link.href;
        preloadLink.as = link.as;
        document.head.appendChild(preloadLink);
    });
}

// Caching Strategy
const cacheManager = {
    cacheName: 'app-cache-v1',
    urlsToCache: [
        '/',
        '/css/styles.css',
        '/js/main.js',
        '/images/logo.png',
        // Add more URLs to cache
    ],

    async setupCache() {
        const cache = await caches.open(this.cacheName);
        await cache.addAll(this.urlsToCache);
    },

    async fetchWithCache(request) {
        const cache = await caches.open(this.cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }

        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
    }
};

// Performance Monitoring
const performanceMonitor = {
    metrics: {},

    startMeasure(name) {
        this.metrics[name] = performance.now();
    },

    endMeasure(name) {
        if (this.metrics[name]) {
            const duration = performance.now() - this.metrics[name];
            console.log(`${name} took ${duration}ms`);
            // Send to analytics service
            this.sendToAnalytics(name, duration);
        }
    },

    sendToAnalytics(name, duration) {
        // Implement analytics sending logic
        console.log(`Sending ${name} metric to analytics: ${duration}ms`);
    }
};

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle Function
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Initialize performance optimizations
document.addEventListener('DOMContentLoaded', function() {
    setupLazyLoading();
    preloadResources();
    cacheManager.setupCache();
    
    // Monitor page load performance
    performanceMonitor.startMeasure('pageLoad');
    window.addEventListener('load', () => {
        performanceMonitor.endMeasure('pageLoad');
    });
});

// Export performance utilities
export {
    setupLazyLoading,
    preloadResources,
    cacheManager,
    performanceMonitor,
    debounce,
    throttle
}; 