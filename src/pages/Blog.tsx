import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileBottomBar from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { updatePageSEO, generateBlogStructuredData } from "@/lib/seo";

const Blog = () => {
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
      id: 3,
      title: "Advanced Paint Correction Techniques for Luxury Vehicles",
      excerpt: "Learn the professional techniques used to restore paint to showroom condition on high-end vehicles.",
      content: "Paint correction is an art form that requires precision, patience, and the right tools. For luxury vehicles, the standards are even higher...",
      author: "Grand Touch Team",
      publishedAt: "2024-01-05",
      readTime: "10 min read",
      category: "Detailing",
      image: "/service-correction.jpg",
      featured: false,
    },
    {
      id: 4,
      title: "Custom Vinyl Wraps: Transforming Your Vehicle's Appearance",
      excerpt: "Explore the world of custom vinyl wrapping and how it can completely transform your vehicle's look.",
      content: "Vinyl wrapping offers endless possibilities for personalizing your vehicle. From subtle color changes to bold graphics...",
      author: "Grand Touch Team",
      publishedAt: "2024-01-01",
      readTime: "7 min read",
      category: "Customization",
      image: "/service-wrap.jpg",
      featured: false,
    },
    {
      id: 5,
      title: "Performance Tuning: Unlocking Your Engine's Potential",
      excerpt: "Discover how professional ECU tuning can safely increase power and improve your vehicle's performance.",
      content: "Performance tuning is about more than just adding power. It's about optimizing your engine's efficiency and reliability...",
      author: "Grand Touch Team",
      publishedAt: "2023-12-28",
      readTime: "9 min read",
      category: "Performance",
      image: "/service-performance.jpg",
      featured: false,
    },
    {
      id: 6,
      title: "Classic Car Restoration: Bringing History Back to Life",
      excerpt: "Follow the journey of restoring a classic vehicle from discovery to showroom condition.",
      content: "Classic car restoration is a labor of love that combines mechanical expertise with historical preservation...",
      author: "Grand Touch Team",
      publishedAt: "2023-12-25",
      readTime: "12 min read",
      category: "Restoration",
      image: "/service-restoration.jpg",
      featured: false,
    },
  ];

  const categories = ["All", "Detailing", "Protection", "Customization", "Performance", "Restoration"];

  // Update SEO metadata when component mounts
  useEffect(() => {
    updatePageSEO('blog');
    
    // Add structured data for blog posts
    const structuredData = generateBlogStructuredData(blogPosts);
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      // Clean up structured data script on unmount
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [blogPosts]);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Knowledge Hub</span>
          </div>
          <h1 className="mb-6">Automotive Insights & Expertise</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay informed with the latest automotive trends, techniques, and insights from our expert team
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Featured Article</h2>
            <div className="w-20 h-1 bg-primary rounded-full" />
          </div>
          
          {blogPosts.filter(post => post.featured).map((post) => (
            <Card key={post.id} className="overflow-hidden bg-card border-border/50 hover:border-primary/50 transition-all duration-300 group">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="relative h-64 lg:h-auto overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center space-x-4 mb-4">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {post.category}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {post.readTime}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">By {post.author}</span>
                    <Link to={`/blog/${post.id}`}>
                      <Button variant="ghost" className="group-hover:bg-primary/10 group-hover:text-primary">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                className={`${
                  category === "All" 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Latest Articles</h2>
            <div className="w-20 h-1 bg-primary rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.filter(post => !post.featured).map((post, index) => (
              <Card
                key={post.id}
                className="overflow-hidden bg-card border-border/50 hover:border-primary/50 transition-all duration-300 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-4 left-4 bg-primary/10 text-primary border-primary/20"
                  >
                    {post.category}
                  </Badge>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {post.readTime}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">By {post.author}</span>
                    <Link to={`/blog/${post.id}`}>
                      <Button variant="ghost" size="sm" className="group-hover:bg-primary/10 group-hover:text-primary">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Stay Updated</span>
          </div>
          <h2 className="text-3xl font-bold mb-4 text-foreground">Never Miss an Update</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get the latest automotive insights, tips, and industry news delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
      <MobileBottomBar />
    </div>
  );
};

export default Blog;
