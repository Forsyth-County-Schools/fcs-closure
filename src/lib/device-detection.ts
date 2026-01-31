// Mobile device detection utilities

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
}

// Check if the device is mobile
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;
  
  // Common mobile device indicators
  const mobileKeywords = [
    'mobile', 'android', 'iphone', 'ipod', 'blackberry',
    'windows phone', 'opera mini', 'iemobile', 'kindle',
    'webos', 'phone', 'tablet'
  ];
  
  // Check user agent for mobile keywords
  const hasMobileKeyword = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // Check screen size (typical mobile devices are <= 768px width)
  const hasMobileScreenSize = screenWidth <= 768;
  
  // Check for touch capability (most mobile devices have touch)
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return hasMobileKeyword || (hasMobileScreenSize && hasTouch);
}

// Check if the device is tablet
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;
  
  // Common tablet indicators
  const tabletKeywords = ['ipad', 'tablet', 'kindle', 'silk', 'android 3'];
  const hasTabletKeyword = tabletKeywords.some(keyword => userAgent.includes(keyword));
  
  // Tablet screen size range (768px - 1024px)
  const hasTabletScreenSize = screenWidth > 768 && screenWidth <= 1024;
  
  return hasTabletKeyword || hasTabletScreenSize;
}

// Get device information
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      userAgent: 'Server',
      screenWidth: 1920,
      screenHeight: 1080
    };
  }
  
  return {
    isMobile: isMobileDevice(),
    isTablet: isTabletDevice(),
    isDesktop: !isMobileDevice() && !isTabletDevice(),
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height
  };
}

// Get responsive breakpoints
export function getBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  const deviceInfo = getDeviceInfo();
  
  if (deviceInfo.isMobile) return 'mobile';
  if (deviceInfo.isTablet) return 'tablet';
  return 'desktop';
}

// Get device-specific styles
export function getDeviceStyles() {
  const deviceInfo = getDeviceInfo();
  
  return {
    container: deviceInfo.isMobile ? 'px-4 py-3' : 'px-6 py-4',
    cardPadding: deviceInfo.isMobile ? 'p-4' : 'p-6',
    fontSize: {
      title: deviceInfo.isMobile ? 'text-2xl' : 'text-3xl',
      subtitle: deviceInfo.isMobile ? 'text-lg' : 'text-xl',
      body: deviceInfo.isMobile ? 'text-sm' : 'text-base'
    },
    spacing: {
      small: deviceInfo.isMobile ? 'gap-2' : 'gap-4',
      medium: deviceInfo.isMobile ? 'gap-3' : 'gap-6',
      large: deviceInfo.isMobile ? 'gap-4' : 'gap-8'
    }
  };
}
