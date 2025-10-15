// Simple GDPR Consent Manager
document.addEventListener('DOMContentLoaded', function() {
    const banner = document.getElementById('gdpr-consent-banner');
    const acceptBtn = document.getElementById('gdpr-accept-btn');
    const manageBtn = document.getElementById('gdpr-manage-btn');
    
    // Check if user already made a choice
    if (!localStorage.getItem('gdpr_consent')) {
        // Show banner if no choice made (for all users initially)
        banner.style.display = 'block';
        console.log('Showing GDPR banner - no consent stored');
    } else {
        // User already made choice, hide banner and enable ads if consented
        banner.style.display = 'none';
        const consent = localStorage.getItem('gdpr_consent');
        if (consent === 'accepted') {
            enableAds();
        }
        console.log('GDPR consent already exists:', consent);
    }
    
    // Accept All button
    acceptBtn.addEventListener('click', function() {
        localStorage.setItem('gdpr_consent', 'accepted');
        banner.style.display = 'none';
        enableAds();
        console.log('User accepted all cookies');
    });
    
    // Manage Options button - simple implementation (reject non-essential)
    manageBtn.addEventListener('click', function() {
        localStorage.setItem('gdpr_consent', 'necessary_only');
        banner.style.display = 'none';
        enableNecessaryOnly();
        console.log('User selected necessary cookies only');
    });
    
    function enableAds() {
        console.log('Enabling ads and updating consent...');
        
        // Update Google Consent
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'ad_storage': 'granted',
                'analytics_storage': 'granted',
                'personalization_storage': 'granted',
                'functionality_storage': 'granted'
            });
        }
        
        // Refresh all ads on the page
        try {
            // Re-push all adsbygoogle instances
            (adsbygoogle = window.adsbygoogle || []).push({});
            console.log('Ads refreshed successfully');
        } catch (e) {
            console.log('Error refreshing ads:', e);
        }
    }
    
    function enableNecessaryOnly() {
        console.log('Enabling necessary cookies only...');
        
        // Only enable necessary cookies
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'ad_storage': 'denied',
                'analytics_storage': 'denied',
                'personalization_storage': 'denied',
                'functionality_storage': 'denied'
            });
        }
    }
    
    // Simple affiliate tracking
    window.trackAffiliateClick = function(service) {
        console.log('Affiliate click tracked:', service);
        // You can add Google Analytics event tracking here later
    };
});

// Force ad refresh function (can be called manually if needed)
window.refreshAds = function() {
    try {
        (adsbygoogle = window.adsbygoogle || []).push({});
        console.log('Manual ad refresh triggered');
    } catch (e) {
        console.log('Error in manual ad refresh:', e);
    }
};
