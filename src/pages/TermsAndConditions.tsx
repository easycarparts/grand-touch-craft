import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Home
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Terms and Conditions
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          
          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              1. Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms and Conditions govern the provision of automotive services by Grand Touch Auto Repair LLC 
              ("Grand Touch Auto", "we", "us", or "our"), located at DIP 2, Dubai Investment Park - 2, 
              Thani warehouse - 3 11b, Dubai, UAE. By engaging our services or making a payment, you agree to be 
              bound by these terms in accordance with the laws of the United Arab Emirates and the Emirate of Dubai.
            </p>
          </section>

          {/* Pricing and Payment */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              2. Pricing and Payment
            </h2>
            <ul className="text-muted-foreground space-y-3 list-disc pl-6">
              <li>All prices are quoted in UAE Dirhams (AED).</li>
              <li>All prices include 5% Value Added Tax (VAT) as per UAE Federal Tax Authority regulations. VAT is applicable on final invoicing.</li>
              <li>A deposit or advance payment may be required before commencement of work.</li>
              <li>Full payment is due upon completion of services unless otherwise agreed in writing.</li>
              <li>We accept payment via bank transfer, credit/debit cards, and cash.</li>
              <li>
                Bank transfers should be made to:<br />
                <span className="text-foreground/80">Bank: Emirates NBD</span><br />
                <span className="text-foreground/80">Account Name: Grand Touch Auto Repair</span><br />
                <span className="text-foreground/80">IBAN: AE970260001015748129601</span>
              </li>
            </ul>
          </section>

          {/* Warranty */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              3. Warranty
            </h2>
            <ul className="text-muted-foreground space-y-3 list-disc pl-6">
              <li>6 months warranty on parts and workmanship from the date of invoice, unless otherwise specified.</li>
              <li>6 months warranty on tires against manufacturer defects, as per supplier terms.</li>
              <li>PPF (Paint Protection Film) installations carry a 5-year warranty as specified on the invoice.</li>
              <li>Ceramic coating warranties vary by product and will be specified on your invoice.</li>
              <li>Warranty is void if the vehicle has been serviced or modified by a third party after our work.</li>
              <li>Warranty does not cover damage caused by accidents, misuse, neglect, or normal wear and tear.</li>
            </ul>
          </section>

          {/* Liability */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              4. Limitation of Liability
            </h2>
            <ul className="text-muted-foreground space-y-3 list-disc pl-6">
              <li>
                Grand Touch Auto Repair is not liable for any damage incurred during test driving of the vehicle 
                prior to repair, or where the fault is not related to work done by Grand Touch Auto Repair.
              </li>
              <li>
                We are not responsible for pre-existing defects or damage not disclosed by the customer at the time of drop-off.
              </li>
              <li>
                Our liability is limited to the value of services rendered as stated on the invoice.
              </li>
              <li>
                We are not liable for any consequential, indirect, or incidental damages arising from our services.
              </li>
            </ul>
          </section>

          {/* Vehicle Collection */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              5. Vehicle Collection and Storage
            </h2>
            <ul className="text-muted-foreground space-y-3 list-disc pl-6">
              <li>
                <strong className="text-foreground">24-hour collection requirement:</strong> Vehicles must be collected 
                within 24 hours of job completion notification. Grand Touch Auto Repair will not be responsible for 
                any damage or loss caused after this period.
              </li>
              <li>
                <strong className="text-foreground">Storage fees:</strong> A parking fee of AED 50 per day will be 
                charged for every day beyond a 3-day grace period after the estimate or completion notice is sent.
              </li>
              <li>
                Old parts will be discarded and disposed of 7 days after receipt of vehicle by customer, unless 
                otherwise requested in writing.
              </li>
            </ul>
          </section>

          {/* Additional Services */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              6. Additional Services
            </h2>
            <ul className="text-muted-foreground space-y-3 list-disc pl-6">
              <li>
                Pick-up and drop-off service is available at an additional charge depending on your location. 
                Please inquire for rates.
              </li>
              <li>
                Preferential rental car rates can be arranged through our auto rental partner upon request.
              </li>
              <li>
                Any additional work discovered during the service will be communicated to the customer for approval 
                before proceeding. Additional charges may apply.
              </li>
            </ul>
          </section>

          {/* Cancellation and Refunds */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              7. Cancellation and Refunds
            </h2>
            <ul className="text-muted-foreground space-y-3 list-disc pl-6">
              <li>
                Cancellation of services must be made in writing before work commences to receive a full refund of any deposit.
              </li>
              <li>
                Once work has commenced, cancellation fees may apply based on work completed and materials used.
              </li>
              <li>
                Refunds will be processed within 14 business days to the original payment method.
              </li>
              <li>
                Custom orders, special materials, or non-returnable parts are non-refundable.
              </li>
            </ul>
          </section>

          {/* Consumer Rights UAE */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              8. Consumer Rights (UAE)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              In accordance with UAE Federal Law No. 15 of 2020 on Consumer Protection and its amendments, 
              you have the right to:
            </p>
            <ul className="text-muted-foreground space-y-3 list-disc pl-6">
              <li>Receive services that meet the agreed specifications and quality standards.</li>
              <li>Obtain accurate information about services and pricing before engagement.</li>
              <li>File complaints with the Department of Economic Development (DED) if disputes arise.</li>
              <li>Receive invoices and receipts for all transactions.</li>
            </ul>
          </section>

          {/* Dispute Resolution */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              9. Dispute Resolution
            </h2>
            <ul className="text-muted-foreground space-y-3 list-disc pl-6">
              <li>
                Any disputes arising from these terms shall first be resolved through amicable negotiation.
              </li>
              <li>
                If a resolution cannot be reached, disputes shall be referred to the Dubai Courts or the 
                Dubai International Financial Centre (DIFC) Courts, as applicable.
              </li>
              <li>
                These terms are governed by and construed in accordance with the laws of the United Arab Emirates.
              </li>
            </ul>
          </section>

          {/* Data Protection */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              10. Data Protection
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect and process personal data in accordance with our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              and applicable UAE data protection regulations. Your information is used solely for providing 
              our services and will not be shared with third parties without your consent, except as required by law.
            </p>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              11. Contact Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions regarding these Terms and Conditions, please contact us:
            </p>
            <div className="text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Grand Touch Auto Repair LLC</strong></p>
              <p>DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b, Dubai, UAE</p>
              <p>Workshop: <a href="tel:+971547302243" className="text-primary hover:underline">+971 54 730 2243</a></p>
              <p>Detailing: <a href="tel:+971567191045" className="text-primary hover:underline">+971 56 719 1045</a></p>
              <p>Email: <a href="mailto:info@grandtouchautorepair.com" className="text-primary hover:underline">info@grandtouchautorepair.com</a></p>
              <p>TRN: 100537293100003</p>
            </div>
          </section>

          {/* Acceptance */}
          <section className="mt-12 p-6 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground text-sm leading-relaxed">
              By making a payment or engaging our services, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms and Conditions. These terms may be updated from time to time, 
              and the current version will always be available on our website.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;
