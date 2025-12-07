import { useState, useEffect } from 'react';

// Media query breakpoints
export const breakpoints = {
    mobile: '(max-width: 767px)',
    tablet: '(min-width: 768px) and (max-width: 1023px)',
    desktop: '(min-width: 1024px)',
    mobileAndTablet: '(max-width: 1023px)'
};

// Custom hook for media queries
export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        // Set initial value
        setMatches(media.matches);

        // Create listener
        const listener = () => setMatches(media.matches);

        // Add listener
        media.addEventListener('change', listener);

        // Cleanup
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

// Convenience hooks
export const useIsMobile = () => useMediaQuery(breakpoints.mobile);
export const useIsTablet = () => useMediaQuery(breakpoints.tablet);
export const useIsDesktop = () => useMediaQuery(breakpoints.desktop);
export const useIsMobileOrTablet = () => useMediaQuery(breakpoints.mobileAndTablet);

// Helper functions
export const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
};

export const isTablet = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
};

// Get responsive value based on screen size
export const getResponsiveValue = (mobile, tablet, desktop) => {
    if (isMobile()) return mobile;
    if (isTablet()) return tablet;
    return desktop;
};
