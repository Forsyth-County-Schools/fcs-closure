export function generateStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "FCS School Status Checker",
    "description": "Get instant updates on Forsyth County Schools weather closures and delays. Real-time monitoring with automated alerts.",
    "url": "https://schoolcancelled.today",
    "applicationCategory": "EducationApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "provider": {
      "@type": "Organization",
      "name": "FCS Status Monitor",
      "url": "https://schoolcancelled.today"
    }
  };
}

export function generateBreadcrumbStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://schoolcancelled.today"
      }
    ]
  };
}
