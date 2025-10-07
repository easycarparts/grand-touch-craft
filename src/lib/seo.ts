// SEO utility functions for dynamic metadata
export const generateSEOMetadata = (page: string, customData?: any) => {
  const baseUrl = "https://grandtouchauto.com";
  
  const seoData = {
    home: {
      title: "Grand Touch Auto – Dubai's Luxury Garage for Repair, Paint, Detailing & PPF",
      description: "From precision diagnostics to high-gloss ceramic finishes, Grand Touch Auto delivers full-service automotive excellence in Dubai. Repair, paint, restoration, detailing & PPF.",
      keywords: "Dubai auto repair, luxury car service, ceramic coating, PPF installation, paint protection, car detailing, automotive restoration, Mercedes service, Porsche service, BMW service",
      ogTitle: "Grand Touch Auto – Dubai's Luxury Automotive Garage",
      ogDescription: "Full-service automotive excellence: Repair, diagnostics, paint, bodywork, detailing, PPF & restoration for luxury vehicles.",
    },
    blog: {
      title: "Automotive Blog & Insights – Grand Touch Auto Dubai",
      description: "Expert automotive insights, tips, and industry news from Dubai's premier luxury car service center. Learn about ceramic coating, PPF, paint correction, and more.",
      keywords: "automotive blog, car care tips, ceramic coating guide, PPF protection, paint correction, car detailing tips, luxury car maintenance, Dubai automotive news",
      ogTitle: "Automotive Blog & Expert Insights – Grand Touch Auto",
      ogDescription: "Stay informed with the latest automotive trends, techniques, and insights from our expert team in Dubai.",
    },
    services: {
      title: "Premium Auto Services – Repair, Paint, Detailing & PPF in Dubai",
      description: "Comprehensive automotive services including advanced diagnostics, factory-grade paintwork, ceramic coating, PPF installation, and luxury car restoration in Dubai.",
      keywords: "auto repair Dubai, car paint service, ceramic coating Dubai, PPF installation, car detailing, luxury car service, automotive restoration, paint correction",
      ogTitle: "Premium Automotive Services – Grand Touch Auto Dubai",
      ogDescription: "Comprehensive automotive care tailored for Dubai's most discerning vehicle owners.",
    },
    about: {
      title: "About Grand Touch Auto – Dubai's Premier Luxury Car Service",
      description: "Learn about Grand Touch Auto's commitment to automotive excellence, certified partnerships with XPEL, 3M, and Gtechniq, and our expert team in Dubai.",
      keywords: "about Grand Touch Auto, Dubai car service, luxury automotive, certified partners, XPEL installer, 3M authorized, Gtechniq certified",
      ogTitle: "About Grand Touch Auto – Dubai's Premier Automotive Excellence",
      ogDescription: "Discover our story of automotive craftsmanship and innovation in Dubai's luxury car service industry.",
    },
    contact: {
      title: "Contact Grand Touch Auto – Dubai Luxury Car Service Center",
      description: "Get in touch with Dubai's premier luxury car service center. Book your appointment for repair, detailing, PPF, or paint services at Grand Touch Auto.",
      keywords: "contact Grand Touch Auto, Dubai car service appointment, luxury car booking, automotive consultation, service inquiry",
      ogTitle: "Contact Grand Touch Auto – Dubai Luxury Car Service",
      ogDescription: "Book your appointment with Dubai's premier luxury automotive service center.",
    },
    portfolio: {
      title: "Portfolio – Grand Touch Auto's Luxury Car Projects in Dubai",
      description: "Explore our portfolio of luxury car projects including ceramic coating, PPF installation, paint correction, and restoration work on premium vehicles in Dubai.",
      keywords: "Grand Touch Auto portfolio, luxury car projects, ceramic coating examples, PPF installation gallery, paint correction before after, car restoration showcase",
      ogTitle: "Portfolio – Luxury Car Projects by Grand Touch Auto",
      ogDescription: "Showcase of our finest automotive work on luxury vehicles in Dubai.",
    },
  };

  const pageData = seoData[page as keyof typeof seoData] || seoData.home;
  
  return {
    title: customData?.title || pageData.title,
    description: customData?.description || pageData.description,
    keywords: customData?.keywords || pageData.keywords,
    ogTitle: customData?.ogTitle || pageData.ogTitle,
    ogDescription: customData?.ogDescription || pageData.ogDescription,
    url: `${baseUrl}/${page === 'home' ? '' : page}`,
    image: customData?.image || `${baseUrl}/placeholder.svg`,
  };
};

// Function to update document head with SEO metadata
export const updatePageSEO = (page: string, customData?: any) => {
  const seoData = generateSEOMetadata(page, customData);
  
  // Update title
  document.title = seoData.title;
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', seoData.description);
  }
  
  // Update meta keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    metaKeywords.setAttribute('content', seoData.keywords);
  } else {
    const keywordsMeta = document.createElement('meta');
    keywordsMeta.name = 'keywords';
    keywordsMeta.content = seoData.keywords;
    document.head.appendChild(keywordsMeta);
  }
  
  // Update Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', seoData.ogTitle);
  }
  
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', seoData.ogDescription);
  }
  
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) {
    ogUrl.setAttribute('content', seoData.url);
  } else {
    const urlMeta = document.createElement('meta');
    urlMeta.setAttribute('property', 'og:url');
    urlMeta.content = seoData.url;
    document.head.appendChild(urlMeta);
  }
  
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) {
    ogImage.setAttribute('content', seoData.image);
  }
  
  // Update Twitter Card tags
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute('content', seoData.ogTitle);
  } else {
    const twitterTitleMeta = document.createElement('meta');
    twitterTitleMeta.name = 'twitter:title';
    twitterTitleMeta.content = seoData.ogTitle;
    document.head.appendChild(twitterTitleMeta);
  }
  
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescription) {
    twitterDescription.setAttribute('content', seoData.ogDescription);
  } else {
    const twitterDescMeta = document.createElement('meta');
    twitterDescMeta.name = 'twitter:description';
    twitterDescMeta.content = seoData.ogDescription;
    document.head.appendChild(twitterDescMeta);
  }
  
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (twitterImage) {
    twitterImage.setAttribute('content', seoData.image);
  }
};

// Business schema markup for LocalBusiness
export const generateBusinessStructuredData = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Grand Touch Auto",
    "description": "Dubai's luxury automotive studio for repair, paint, detailing, PPF, and restoration services",
    "url": "https://grandtouchauto.com",
    "telephone": "+971567191045",
    "email": "info@grandtouchauto.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b",
      "addressLocality": "Dubai",
      "addressRegion": "Dubai",
      "addressCountry": "AE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "25.2048",
      "longitude": "55.2708"
    },
    "openingHours": "Mo-Sa 09:00-18:00",
    "priceRange": "$$$",
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "25.2048",
        "longitude": "55.2708"
      },
      "geoRadius": "50000"
    },
    "logo": {
      "@type": "ImageObject",
      "url": "https://grandtouchauto.com/placeholder.svg",
      "width": 200,
      "height": 60
    },
    "image": [
      "https://grandtouchauto.com/service-ceramic.jpg",
      "https://grandtouchauto.com/service-ppf.jpg",
      "https://grandtouchauto.com/service-correction.jpg"
    ],
    "sameAs": [
      "https://www.instagram.com/grandtouchauto"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Automotive Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Auto Repair & Diagnostics",
            "description": "Advanced ECU diagnostics and full mechanical service for luxury and performance vehicles"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Paint & Bodywork",
            "description": "Factory-grade refinishing, color matching, and full body restorations"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Detailing & Ceramic Coating",
            "description": "Multi-stage detailing and nano-ceramic protection for superior gloss and durability"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "PPF & Vinyl Wrapping",
            "description": "Premium XPEL/STEK/3M films and custom vinyl wraps for protection and transformation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Restoration & Customization",
            "description": "Classic car restoration and custom modifications"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Off-Road & Performance",
            "description": "Suspension tuning, lift kits, and performance upgrades"
          }
        }
      ]
    }
  };
  
  return structuredData;
};

// Structured data for blog posts
export const generateBlogStructuredData = (posts: any[]) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Grand Touch Auto Blog",
    "description": "Expert automotive insights, tips, and industry news from Dubai's premier luxury car service center.",
    "url": "https://grandtouchauto.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Grand Touch Auto",
      "url": "https://grandtouchauto.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://grandtouchauto.com/placeholder.svg"
      }
    },
    "blogPost": posts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "author": {
        "@type": "Person",
        "name": post.author
      },
      "datePublished": post.publishedAt,
      "dateModified": post.publishedAt,
      "image": post.image,
      "url": `https://grandtouchauto.com/blog/${post.id}`,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://grandtouchauto.com/blog/${post.id}`
      }
    }))
  };
  
  return structuredData;
};
