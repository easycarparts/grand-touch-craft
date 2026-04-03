import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { updatePageSEO, generateBlogStructuredData } from "@/lib/seo";

const Blog = () => {
  // Helper function to generate SEO-friendly slugs
  const getArticleSlug = (id: number) => {
    const slugMap: { [key: number]: string } = {
      1: 'ceramic-coating-guide',
      2: 'ppf-vs-ceramic-coating', 
      3: 'paint-correction-techniques',
      4: 'custom-vinyl-wraps',
      5: 'performance-tuning',
      6: 'classic-car-restoration',
      7: 'is-ppf-worth-it-dubai'
    };
    return slugMap[id] || 'article-${id}';
  };

  // Sample blog posts data - in a real app, this would come from a CMS or API
  const blogPosts = [
    {
      id: 1,
      title: "The Complete Guide to Ceramic Coating: Protection That Lasts",
      excerpt: "Discover how ceramic coating transforms your vehicle's protection with our comprehensive guide covering application, benefits, and maintenance.",
      content: "Ceramic coating has revolutionized automotive protection, offering superior durability compared to traditional waxes and sealants...",
      author: "Grand Touch Team",
      publishedAt: "2024-01-15",
      readTime: "8 min read",
      category: "Detailing",
      image: "/service-ceramic.jpg",
      featured: true,
    },
    {
      id: 2,
      title: "Paint Protection Film vs Ceramic Coating: Which is Right for You?",
      excerpt: "Compare PPF and ceramic coating to make the best choice for your vehicle's protection needs and budget.",
      content: "When it comes to protecting your vehicle's paint, two main options dominate the market: Paint Protection Film (PPF) and ceramic coating...",
      author: "Grand Touch Team",
      publishedAt: "2024-01-10",
      readTime: "6 min read",
      category: "Protection",
      image: "/service-ppf.jpg",
      featured: false,
    },
    {
      id: 7,
      title: "Is PPF Worth the Investment for Dubai Car Owners?",
      excerpt: "Explore whether paint protection film is worth the investment for car owners in Dubai, comparing STEK and GYEON.",
      author: "Grand Touch Team",
      publishedAt: "2026-04-03",
      readTime: "8 min read",
      category: "Protection",
      image: "/service-ppf.jpg",
      featured: false,
    }
  ];

  return (
    <div>
      <Navbar />
      <main>
        {/* Blog content rendering logic */}
        {blogPosts.map(post => (
          <Card key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <Link to={`/blog/${getArticleSlug(post.id)}`}>Read More</Link>
          </Card>
        ))}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Blog;