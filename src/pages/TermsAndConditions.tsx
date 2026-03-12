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

        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Terms and Conditions
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* 1. Introduction and scope */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              1. Introduction and scope
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong className="text-foreground">1.1</strong> These Terms and Conditions (&quot;Terms&quot;) apply to all services provided by Grand Touch Auto (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), including but not limited to: auto repair and diagnostics, paint and bodywork, detailing and ceramic coating, paint protection film (PPF), vinyl wrapping, restoration, customization, and related automotive services (together, &quot;Services&quot;).
              </p>
              <p>
                <strong className="text-foreground">1.2</strong> By requesting a quote, accepting an estimate, booking an appointment, or leaving your vehicle with us, you (&quot;Customer&quot;, &quot;you&quot;, &quot;your&quot;) agree to these Terms. If you do not agree, you must not use our Services.
              </p>
              <p>
                <strong className="text-foreground">1.3</strong> These Terms apply in addition to any service-specific terms (e.g. PPF or ceramic coating warranty documents) and any written estimate or invoice you accept. In case of conflict, the signed estimate or invoice prevails for that job, but these Terms otherwise apply in full.
              </p>
            </div>
          </section>

          {/* 2. Definitions */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              2. Definitions
            </h2>
            <ul className="text-muted-foreground space-y-2 list-none pl-0">
              <li><strong className="text-foreground">Estimate</strong> – A written quote or estimate we provide for specific work.</li>
              <li><strong className="text-foreground">Invoice</strong> – The final bill for work done, which may differ from the Estimate if extra work is agreed.</li>
              <li><strong className="text-foreground">Original paint</strong> – Factory-applied paint by the vehicle manufacturer, with no full or partial respray.</li>
              <li><strong className="text-foreground">Respray / non-original paint</strong> – Any area that has been repainted or touched up after leaving the factory (by any party other than the manufacturer).</li>
            </ul>
          </section>

          {/* 3. Estimates and pricing */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              3. Estimates and pricing
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong className="text-foreground">3.1</strong> Estimates are valid for the period stated on them (or 14 days if none stated). We may revise pricing after that or if the scope of work or vehicle condition changes.
              </p>
              <p>
                <strong className="text-foreground">3.2</strong> All prices are in United Arab Emirates Dirhams (AED) and, unless otherwise stated, include VAT where applicable.
              </p>
              <p>
                <strong className="text-foreground">3.3</strong> Estimates are based on the information you provide and our initial inspection. If we find additional work is required (e.g. paint correction, repair, or surface preparation), we will inform you and may issue a revised estimate. We will not carry out extra chargeable work without your approval unless it is necessary for safety or to complete the agreed work and we have attempted to contact you.
              </p>
              <p>
                <strong className="text-foreground">3.4</strong> The final amount due is as shown on the Invoice. You agree to pay that amount in full by the due date(s) stated on the Invoice.
              </p>
            </div>
          </section>

          {/* 4. Payment */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              4. Payment
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong className="text-foreground">4.1</strong> Payment terms are as stated on the Invoice (e.g. on completion, or part payment in advance). We may require a deposit before starting work.
              </p>
              <p>
                <strong className="text-foreground">4.2</strong> We accept payment by the methods we specify (e.g. bank transfer, card). Bank details for transfer are on our website and on the Invoice. You are responsible for any bank charges.
              </p>
              <p>
                <strong className="text-foreground">4.3</strong> If payment is late, we may charge interest at a reasonable rate and/or suspend further work or services until the balance is paid. We may also exercise any other rights we have under applicable law.
              </p>
              <p>
                <strong className="text-foreground">4.4</strong> Ownership of any parts or materials we supply does not pass to you until we have received full payment.
              </p>
            </div>
          </section>

          {/* 5. Paint condition and non-original paint */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              5. Paint condition and non-original paint (respray)
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong className="text-foreground">5.1 Disclosure:</strong> You must inform us before any installation (e.g. PPF, ceramic coating, or other paint-dependent work) if the vehicle has any non-original paint or respray, including partial panels, touch-ups, or previous repairs. This applies to the whole vehicle or any specific area we will work on.
              </p>
              <p>
                <strong className="text-foreground">5.2 No liability for respray-related failure:</strong> We are not responsible for paint peeling, lifting, cracking, or any other paint failure that results from the vehicle having been resprayed or having non-original paint, whether or not you disclosed it. If you did not inform us before install that the car is not all original paint, we are still not liable for such paint failure.
              </p>
              <p>
                <strong className="text-foreground">5.3 Pre-existing defects:</strong> We are not responsible for pre-existing paint defects, poor prior repair, or paint failure that is revealed or worsened during our work (including during installation or removal of film or coatings). Any rectification of such issues is at your cost unless we expressly agree otherwise in writing.
              </p>
              <p>
                <strong className="text-foreground">5.4</strong> You accept that working on non-original or defective paint carries a higher risk of adhesion or appearance issues, and you agree that our liability is limited as set out in these Terms and in any service-specific terms.
              </p>
            </div>
          </section>

          {/* 6. PPF (Paint Protection Film) */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              6. PPF (Paint Protection Film)
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong className="text-foreground">6.1 Material warranty:</strong> Any warranty on the PPF material itself is provided by the manufacturer only. We do not give a separate material warranty; we pass on the manufacturer&apos;s warranty where applicable.
              </p>
              <p>
                <strong className="text-foreground">6.2 Workmanship:</strong> We provide an installation workmanship guarantee subject to (a) your compliance with these Terms and any care instructions we give, and (b) your attendance at any mandatory inspections we specify.
              </p>
              <p>
                <strong className="text-foreground">6.3 Mandatory inspection:</strong> You must bring the vehicle for inspection within 14 days of installation. If you do not attend this inspection, the installation guarantee may be void.
              </p>
              <p>
                <strong className="text-foreground">6.4 Ongoing inspections:</strong> To keep any warranty or guarantee valid, you must attend 6-monthly inspections as we require. Failure to do so may void the installation guarantee and/or manufacturer warranty.
              </p>
              <p>
                <strong className="text-foreground">6.5 What is not covered:</strong> We and the manufacturer are not responsible for: impact damage, misuse, poor aftercare, neglect, failure to attend inspections, or pre-existing paint conditions or non-original paint (including respray), or any paint failure arising from those. Labour to remove or reinstall film is chargeable unless we agree otherwise in writing.
              </p>
              <p>
                <strong className="text-foreground">6.6 Defects we cover:</strong> Installation-related defects (e.g. lifting, bubbling, or alignment issues where our procedures were followed and the surface was as represented) will be rectified in line with our workmanship guarantee, subject to the above conditions.
              </p>
              <p>
                <strong className="text-foreground">6.7 Warranty scope for PPF and wrap:</strong> Our warranty for PPF or wrap includes rectifying any issues with the installation for whatever reason. It strictly does not include refunds if the customer chooses to remove the wrap or PPF. Removal of film or wrap is chargeable and is outside the scope of the warranty.
              </p>
              <p>
                <strong className="text-foreground">6.8 Manufacturer warranty claims:</strong> Where a warranty claim relates to the material (manufacturer defect) and not to our installation, we are not liable for the labour to remove and/or reinstall the material. Such labour is chargeable, as the fault lies with the manufacturer and not with our installation. We may charge for labour to rectify issues arising from manufacturer defects.
              </p>
            </div>
          </section>

          {/* 7. Ceramic coating */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              7. Ceramic coating
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong className="text-foreground">7.1</strong> Any warranty on the ceramic coating product is from the manufacturer and is subject to correct maintenance and any inspection schedule we specify.
              </p>
              <p>
                <strong className="text-foreground">7.2 6-monthly inspection:</strong> To maintain warranty validity, you must attend 6-monthly inspections (which may include a complimentary wash and inspection) as we require.
              </p>
              <p>
                <strong className="text-foreground">7.3 What is not covered:</strong> Coating failure due to improper care, misuse, external damage, or pre-existing or non-original paint is not covered. Reapplication or correction is chargeable unless we agree otherwise in writing.
              </p>
            </div>
          </section>

          {/* 8. General exclusions and limitations of liability */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              8. General exclusions and limitations of liability
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong className="text-foreground">8.1 Test drives and unrelated faults:</strong> We are not liable for any damage to the vehicle occurring during test drives or road tests, or where the fault or damage is not related to work carried out by us.
              </p>
              <p>
                <strong className="text-foreground">8.2 Consequential loss:</strong> We are not liable for any indirect or consequential loss (e.g. loss of use, loss of profit, alternative transport, or other costs) except where such liability cannot be excluded by law.
              </p>
              <p>
                <strong className="text-foreground">8.3 Cap on liability:</strong> Unless otherwise required by law, our total liability to you for any claim arising from or in connection with our Services is limited to the amount you actually paid us for the specific service that gave rise to the claim.
              </p>
              <p>
                <strong className="text-foreground">8.4 Force majeure:</strong> We are not liable for failure or delay in performing our obligations where that is caused by events beyond our reasonable control (e.g. natural disaster, war, civil unrest, pandemic, government action, power failure, or supplier failure).
              </p>
            </div>
          </section>

          {/* 9. Vehicle collection, storage and parking */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              9. Vehicle collection, storage and parking
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong className="text-foreground">9.1 Collection:</strong> You must collect the vehicle within 24 hours after we notify you that the job is complete (or within any other period we specify). After that, we are not responsible for any damage to or loss of the vehicle or its contents, except where caused by our negligence.
              </p>
              <p>
                <strong className="text-foreground">9.2 Parking fee:</strong> If the vehicle remains with us for more than 3 days after the estimate was sent (or such other period as we specify), we may charge a parking fee of AED 50 per day (or such other rate as we notify) for each day thereafter until collection.
              </p>
              <p>
                <strong className="text-foreground">9.3 Abandoned vehicles:</strong> If you do not collect the vehicle or respond to our reasonable attempts to contact you, we may, after a reasonable period and in line with applicable law, take steps to recover our charges and dispose of or store the vehicle. You remain liable for all costs and charges.
              </p>
            </div>
          </section>

          {/* 10. Pick-up, drop-off and rental */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              10. Pick-up, drop-off and rental
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong className="text-foreground">10.1</strong> Pick-up and drop-off may be available at an additional charge depending on zone and availability. Rates are as we quote at the time of booking.
              </p>
              <p>
                <strong className="text-foreground">10.2</strong> Where we arrange a rental vehicle through a partner, terms and rates are as agreed with that partner. We are not responsible for the rental agreement or the rental vehicle.
              </p>
            </div>
          </section>

          {/* 11. Your obligations */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              11. Your obligations
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong className="text-foreground">11.1</strong> You must provide accurate information about the vehicle (including its paint history and any non-original paint or respray) and ensure the vehicle is in a condition that allows us to perform the Services safely and as agreed.
              </p>
              <p>
                <strong className="text-foreground">11.2</strong> You must follow any aftercare, maintenance, and inspection requirements we give you. Failure to do so may void warranties and guarantees.
              </p>
              <p>
                <strong className="text-foreground">11.3</strong> You are responsible for ensuring you have appropriate insurance for the vehicle. We do not insure your vehicle while it is in our care unless we expressly agree otherwise in writing.
              </p>
            </div>
          </section>

          {/* 12. Cancellation and postponement */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              12. Cancellation and postponement
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong className="text-foreground">12.1</strong> If you cancel or postpone after we have started work or committed resources, we may charge a cancellation or postponement fee and/or retain any deposit, in line with our policy and what we have communicated to you.
              </p>
              <p>
                <strong className="text-foreground">12.2</strong> We may cancel or postpone Services for reasons such as force majeure, safety, or non-payment. We will try to give reasonable notice where possible.
              </p>
            </div>
          </section>

          {/* 13. Intellectual property and marketing */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              13. Intellectual property and marketing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">13.1</strong> We may take photographs or videos of vehicles we work on for our records, quality control, and marketing (e.g. website, social media). By using our Services, you consent to such use unless you tell us in writing that you do not consent. We will not use registration or other identifying details in a way that identifies you personally without your consent.
            </p>
          </section>

          {/* 14. Privacy and data */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              14. Privacy and data
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">14.1</strong> We process your personal data in accordance with our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              and applicable data protection law. By using our Services, you agree to that processing.
            </p>
          </section>

          {/* 15. General */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              15. General
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong className="text-foreground">15.1 Entire agreement:</strong> These Terms, together with any accepted Estimate or Invoice and any service-specific terms, constitute the entire agreement between you and us regarding the Services.
              </p>
              <p>
                <strong className="text-foreground">15.2 Variation:</strong> We may update these Terms from time to time. The version on our website at the time you engage our Services applies. Continued use of our Services after changes constitutes acceptance of the updated Terms.
              </p>
              <p>
                <strong className="text-foreground">15.3 Severability:</strong> If any part of these Terms is held to be invalid or unenforceable, the rest remains in effect.
              </p>
              <p>
                <strong className="text-foreground">15.4 Waiver:</strong> Our failure to enforce any right does not waive that right.
              </p>
              <p>
                <strong className="text-foreground">15.5 Governing law and dispute resolution:</strong> These Terms are governed by the laws of the United Arab Emirates and the Emirate of Dubai. Any dispute shall be subject to the exclusive jurisdiction of the courts of Dubai, unless otherwise required by law.
              </p>
            </div>
          </section>

          {/* 16. Contact */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              16. Contact
            </h2>
            <div className="text-muted-foreground space-y-2 leading-relaxed">
              <p><strong className="text-foreground">Grand Touch Auto</strong></p>
              <p>Location: DIP 2, Dubai Investment Park - 2, Thani warehouse - 3 11b, Dubai, UAE</p>
              <p>Phone: <a href="tel:+971567191045" className="text-primary hover:underline">+971 56 719 1045</a></p>
              <p>Email: <a href="mailto:hello@grandtouchauto.ae" className="text-primary hover:underline">hello@grandtouchauto.ae</a></p>
              <p>Hours: Monday–Saturday, 9:00 AM – 6:00 PM</p>
              <p>For questions about these Terms or our Services, please contact us using the details above.</p>
            </div>
          </section>

          <section className="mt-12 p-6 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground text-sm leading-relaxed">
              By requesting a quote, accepting an estimate, booking an appointment, or leaving your vehicle with us, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;
