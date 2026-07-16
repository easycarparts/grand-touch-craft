import { MapPin, Phone, Mail, Instagram, Clock, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import footerLogo from "@/assets/logo-footer.svg";
import { BUSINESS, EASY_AUTO } from "@/lib/business";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <img
              src={footerLogo}
              alt="Grand Touch Auto Logo"
              className="h-10 w-auto"
            />
            <p className="text-muted-foreground text-sm leading-relaxed">
              Dubai&apos;s STEK-certified studio for PPF, ceramic coating, window
              tinting, detailing, paint, and workshop repairs.
            </p>
            <a
              href={EASY_AUTO.profile}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              <BadgeCheck className="h-4 w-4" />
              Easy Auto Certified Partner
            </a>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: "Services", to: "/services" },
                { label: "Portfolio", to: "/portfolio" },
                { label: "Blog", to: "/blog" },
                { label: "Contact", to: "/contact" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service pillars */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/ppf-dubai"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Paint Protection Film
                </Link>
              </li>
              <li>
                <Link
                  to="/ceramic-coating-dubai"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Ceramic Coating
                </Link>
              </li>
              <li>
                <Link
                  to="/window-tinting-dubai"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Window Tinting
                </Link>
              </li>
              <li>
                <Link
                  to="/car-detailing-dubai"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Detailing &amp; Polishing
                </Link>
              </li>
              <li>
                <Link
                  to="/ppf-cost-calculator"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  PPF Cost Calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <a
                  href={BUSINESS.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {BUSINESS.addressFull}
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <a
                  href={BUSINESS.whatsappWorkshop}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Workshop {BUSINESS.phoneWorkshopDisplay}
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <a
                  href={BUSINESS.whatsappDetailing}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Detailing {BUSINESS.phonePrimaryDisplay}
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="hover:text-primary transition-colors"
                >
                  {BUSINESS.email}
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Clock className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p>{BUSINESS.openingHoursDisplay.days}</p>
                  <p className="text-xs">{BUSINESS.openingHoursDisplay.hours}</p>
                  <p className="text-xs opacity-75">
                    {BUSINESS.openingHoursDisplay.sunday}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {BUSINESS.brandName}. All rights reserved.
            </p>
            <Link
              to="/privacy-policy"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-and-conditions"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Terms & Conditions
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={BUSINESS.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-[0_0_28px_rgba(247,181,43,0.22)] transition hover:bg-primary hover:text-primary-foreground"
              aria-label="Open Grand Touch location on Google Maps"
            >
              <MapPin className="h-4 w-4" />
              Open Location
            </a>
            <a
              href={BUSINESS.instagram}
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
