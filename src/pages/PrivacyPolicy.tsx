import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Privacy Policy | Grand Touch Auto";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: January 2025</p>

        <ScrollArea className="h-full">
          <div className="space-y-8 text-foreground">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Grand Touch Auto ("we," "us," or "our") respects your privacy and is committed to protecting your personal data. 
                This privacy policy explains how we collect, use, disclose, and safeguard your information when you visit our 
                website www.grandtouchauto.ae and use our services.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    We may collect personal information that you voluntarily provide to us, including:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Name and contact information (email, phone number)</li>
                    <li>Vehicle information (make, model, year)</li>
                    <li>Service requests and booking details</li>
                    <li>Payment information (processed securely by third-party processors)</li>
                    <li>Communication preferences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">2.2 Automatically Collected Information</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    When you visit our website, we automatically collect certain information:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Referral sources</li>
                    <li>Location data (with your consent)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-bold mb-4">3. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use cookies and similar tracking technologies to track activity on our website and hold certain information.
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">3.1 Types of Cookies We Use</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website</li>
                    <li><strong>Marketing Cookies:</strong> Used to track visitors across websites for advertising purposes</li>
                    <li><strong>Preference Cookies:</strong> Remember your preferences and settings</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Third-Party Advertising */}
            <section>
              <h2 className="text-2xl font-bold mb-4">4. Third-Party Advertising and Analytics</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">4.1 Meta (Facebook) Pixel</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    We use Meta Pixel (Facebook Pixel) to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Measure and optimize our advertising campaigns</li>
                    <li>Build targeted audiences for advertising</li>
                    <li>Track conversions from Facebook and Instagram ads</li>
                    <li>Understand user behavior across devices</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    Meta may use this data in accordance with their own privacy policy. You can learn more at{" "}
                    <a href="https://www.facebook.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      facebook.com/privacy
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">4.2 TikTok Pixel</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    We use TikTok Pixel to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Track conversions from TikTok ads</li>
                    <li>Optimize ad delivery and performance</li>
                    <li>Build custom audiences for remarketing</li>
                    <li>Measure the effectiveness of our TikTok advertising campaigns</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    TikTok may use this data in accordance with their privacy policy. You can learn more at{" "}
                    <a href="https://www.tiktok.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      tiktok.com/legal/privacy-policy
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">4.3 Google Analytics</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may use Google Analytics to understand how visitors use our website. Google Analytics uses cookies 
                    to collect information about website usage anonymously.
                  </p>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-bold mb-4">5. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We use the collected information for various purposes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>To provide and maintain our services</li>
                <li>To process bookings and service requests</li>
                <li>To communicate with you about services, appointments, and updates</li>
                <li>To improve our website and services</li>
                <li>To send marketing communications (with your consent)</li>
                <li>To detect and prevent fraud</li>
                <li>To comply with legal obligations</li>
                <li>To deliver targeted advertising on social media platforms</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-bold mb-4">6. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Service Providers:</strong> Third-party companies that help us operate our business</li>
                <li><strong>Advertising Partners:</strong> Meta (Facebook/Instagram) and TikTok for advertising purposes</li>
                <li><strong>Payment Processors:</strong> To process your payments securely</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold mb-4">7. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data against 
                unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over 
                the internet is 100% secure.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold mb-4">8. Your Rights and Choices</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You have the following rights regarding your personal data:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Access:</strong> Request access to your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Cookie Control:</strong> Manage cookie preferences through your browser settings</li>
                <li><strong>Advertising Opt-out:</strong> Opt out of personalized advertising through Meta and TikTok settings</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </section>

            {/* Opt-Out Instructions */}
            <section>
              <h2 className="text-2xl font-bold mb-4">9. How to Opt-Out of Targeted Advertising</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Meta (Facebook/Instagram):</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Visit{" "}
                    <a href="https://www.facebook.com/settings?tab=ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      facebook.com/settings?tab=ads
                    </a>{" "}
                    to manage your ad preferences
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">TikTok:</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Go to Settings and privacy → Ads → Personalization and disable personalized ads
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Browser Cookies:</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You can set your browser to refuse all or some browser cookies, or to alert you when websites set or 
                    access cookies. Note that if you disable or refuse cookies, some parts of our website may become inaccessible 
                    or not function properly.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold mb-4">10. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal data only for as long as necessary to fulfill the purposes outlined in this privacy policy, 
                unless a longer retention period is required or permitted by law.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold mb-4">11. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal 
                information from children. If you become aware that a child has provided us with personal data, please 
                contact us.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-bold mb-4">12. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than the United Arab Emirates. 
                We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold mb-4">13. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new 
                privacy policy on this page and updating the "Last Updated" date. You are advised to review this privacy 
                policy periodically for any changes.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold mb-4">14. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about this privacy policy or our data practices, please contact us:
              </p>
              <div className="bg-muted/50 p-6 rounded-lg space-y-2">
                <p className="font-semibold">Grand Touch Auto</p>
                <p className="text-muted-foreground">DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b, Dubai, UAE</p>
                <p className="text-muted-foreground">Email: info@grandtouchautorepair.com</p>
                <p className="text-muted-foreground">Phone: +971 54 730 2243 (Workshop)</p>
                <p className="text-muted-foreground">Phone: +971 56 719 1045 (Detailing)</p>
              </div>
            </section>

            {/* UAE Specific */}
            <section>
              <h2 className="text-2xl font-bold mb-4">15. UAE-Specific Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                This privacy policy is designed to comply with UAE data protection regulations. As a business operating 
                in the UAE, we are committed to protecting your privacy rights in accordance with local laws and regulations.
              </p>
            </section>
          </div>
        </ScrollArea>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
