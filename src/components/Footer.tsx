import { MapPin, Phone, Mail, Instagram, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">
              <span className="text-primary">GRAND</span>
              <span className="text-foreground"> TOUCH</span>
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
            Dubai's luxury automotive studio for workshop repairs, diagnostics, servicing, paint & bodywork,
            premium detailing, ceramic coatings, PPF, vinyl wraps, restorations, and performance upgrades.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2">
              {["Services", "Portfolio", "About", "Contact"].map((link) => (
                <li key={link}>
                  <Link
                    to={`/${link.toLowerCase()}`}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <a
                  href="https://maps.app.goo.gl/j6CZCqFX2bDYtCLf7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b, Dubai, UAE
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <a href="https://wa.me/971547302243" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Workshop +971 54 730 2243
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <a href="https://wa.me/971567191045" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Detailing +971 56 719 1045
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <span>info@grandtouchautorepair.com</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Opening Hours</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start space-x-3">
                <Clock className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p>Monday - Saturday</p>
                  <p className="text-xs">9:00 AM - 6:00 PM</p>
                </div>
              </li>
              <li className="text-xs opacity-75">Sunday - Closed</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2025 Grand Touch Auto. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <a
              href="https://www.instagram.com/grandtouchauto/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
