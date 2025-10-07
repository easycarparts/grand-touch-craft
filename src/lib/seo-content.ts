// Utility to manage SEO content visibility
export const hideSEOContent = () => {
  const seoContent = document.getElementById('seo-content');
  if (seoContent) {
    seoContent.style.display = 'none';
  }
};

export const showSEOContent = () => {
  const seoContent = document.getElementById('seo-content');
  if (seoContent) {
    seoContent.style.display = 'block';
  }
};

// Hide SEO content when React app loads
export const initializeSEOContent = () => {
  // Hide the SEO content once React has loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideSEOContent);
  } else {
    hideSEOContent();
  }
};
