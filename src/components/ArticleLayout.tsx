import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileBottomBar from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Share2, BookOpen, User, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { updatePageSEO } from "@/lib/seo";
import "./ArticleContent.css";

// ArticleContent component for proper HTML formatting
const ArticleContent = ({ content }: { content: string }) => {
  const formatContent = (text: string) => {
    // Split content into paragraphs and process each
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      
      // Handle headers with proper IDs for SEO and navigation
      if (trimmed.startsWith('## ')) {
        const headerText = trimmed.replace('## ', '');
        const headerId = headerText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return (
          <h2 
            key={index} 
            id={headerId}
            className="text-3xl font-bold text-foreground mt-12 mb-6 first:mt-0 scroll-mt-20"
          >
            {headerText}
          </h2>
        );
      }
      
      if (trimmed.startsWith('### ')) {
        const headerText = trimmed.replace('### ', '');
        const headerId = headerText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return (
          <h3 
            key={index} 
            id={headerId}
            className="text-2xl font-semibold text-foreground mt-10 mb-4 first:mt-0 scroll-mt-20"
          >
            {headerText}
          </h3>
        );
      }
      
      if (trimmed.startsWith('#### ')) {
        const headerText = trimmed.replace('#### ', '');
        const headerId = headerText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return (
          <h4 
            key={index} 
            id={headerId}
            className="text-xl font-semibold text-foreground mt-8 mb-3 first:mt-0 scroll-mt-20"
          >
            {headerText}
          </h4>
        );
      }
      
      // Handle bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n').filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '));
        return (
          <ul key={index} className="list-disc list-inside space-y-2 mb-6 text-foreground">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-lg leading-relaxed">
                {item.replace(/^[-*] /, '')}
              </li>
            ))}
          </ul>
        );
      }
      
      // Handle numbered lists
      if (/^\d+\. /.test(trimmed)) {
        const items = trimmed.split('\n').filter(line => /^\d+\. /.test(line.trim()));
        return (
          <ol key={index} className="list-decimal list-inside space-y-2 mb-6 text-foreground">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-lg leading-relaxed">
                {item.replace(/^\d+\. /, '')}
              </li>
            ))}
          </ol>
        );
      }
      
      // Handle bold text
      const boldText = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Handle italic text
      const italicText = boldText.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Handle links
      const linkText = italicText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer">$1</a>');
      
      // Regular paragraphs
      if (trimmed.length > 0) {
        return (
          <p 
            key={index} 
            className="text-lg leading-relaxed text-foreground mb-6"
            dangerouslySetInnerHTML={{ __html: linkText }}
          />
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  return (
    <article className="article-content">
      {formatContent(content)}
    </article>
  );
};

interface ArticleLayoutProps {
  article: {
    id: number;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    publishedAt: string;
    readTime: string;
    category: string;
    image: string;
    featured: boolean;
    tags?: string[];
    relatedArticles?: any[];
  };
  relatedArticles?: any[];
}

const ArticleLayout = ({ article, relatedArticles = [] }: ArticleLayoutProps) => {
  // Helper function to generate SEO-friendly slugs
  const getArticleSlug = (id: number) => {
    const slugMap: { [key: number]: string } = {
      1: 'ceramic-coating-guide',
      2: 'ppf-vs-ceramic-coating', 
      3: 'paint-correction-techniques',
      4: 'custom-vinyl-wraps',
      5: 'performance-tuning',
      6: 'classic-car-restoration'
    };
    return slugMap[id] || `article-${id}`;
  };

  // Update SEO metadata for individual article
  useEffect(() => {
    const customSEOData = {
      title: `${article.title} – Grand Touch Auto Blog`,
      description: article.excerpt,
      keywords: `${article.category.toLowerCase()}, automotive, Dubai, ${article.tags?.join(', ') || ''}, car care, luxury vehicles`,
      ogTitle: article.title,
      ogDescription: article.excerpt,
      image: article.image,
    };
    
    updatePageSEO('blog', customSEOData);
    
    // Add structured data for individual article
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": article.title,
      "description": article.excerpt,
      "image": article.image,
      "author": {
        "@type": "Person",
        "name": article.author
      },
      "publisher": {
        "@type": "Organization",
        "name": "Grand Touch Auto",
        "url": "https://grandtouchauto.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://grandtouchauto.com/placeholder.svg"
        }
      },
      "datePublished": article.publishedAt,
      "dateModified": article.publishedAt,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://grandtouchauto.com/blog/${getArticleSlug(article.id)}`
      },
      "articleSection": article.category,
      "wordCount": article.content.split(' ').length,
      "timeRequired": article.readTime
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [article]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      
      {/* Article Header */}
      <article className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <div className="mb-8">
            <Link 
              to="/blog" 
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </div>

          {/* Article Meta */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {article.category}
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-2" />
                {article.readTime}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="w-4 h-4 mr-2" />
                {article.author}
              </div>
            </div>

            {/* Article Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground leading-tight">
              {article.title}
            </h1>

            {/* Article Excerpt */}
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              {article.excerpt}
            </p>

            {/* Share Button */}
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShare}
                className="hover:bg-primary/10 hover:text-primary"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Article
              </Button>
            </div>
          </div>

          {/* Featured Image */}
          <div className="mb-12">
            <img 
              src={article.image} 
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Article Content */}
          <div className="prose prose-invert max-w-none">
            <ArticleContent content={article.content} />
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="hover:bg-primary/10 hover:text-primary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Author Bio */}
          <div className="mt-12 pt-8 border-t border-border">
            <Card className="p-6 bg-card/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{article.author}</h3>
                  <p className="text-muted-foreground text-sm">
                    Expert automotive professionals at Grand Touch Auto, delivering world-class service 
                    to Dubai's most prestigious vehicles with certified techniques and premium materials.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
          <div className="container mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Related Articles</h2>
              <div className="w-20 h-1 bg-primary rounded-full" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedArticles.slice(0, 3).map((relatedArticle) => (
                <Card
                  key={relatedArticle.id}
                  className="overflow-hidden bg-card border-border/50 hover:border-primary/50 transition-all duration-300 group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={relatedArticle.image} 
                      alt={relatedArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <Badge 
                      variant="secondary" 
                      className="absolute top-4 left-4 bg-primary/10 text-primary border-primary/20"
                    >
                      {relatedArticle.category}
                    </Badge>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(relatedArticle.publishedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {relatedArticle.readTime}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {relatedArticle.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                      {relatedArticle.excerpt}
                    </p>
                    <Link 
                      to={`/blog/${getArticleSlug(relatedArticle.id)}`}
                      className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
                    >
                      Read More
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
      <WhatsAppButton />
      <MobileBottomBar />
    </div>
  );
};

export default ArticleLayout;
