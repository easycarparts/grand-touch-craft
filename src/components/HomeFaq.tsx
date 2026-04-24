import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { homeFaqItems } from "@/lib/home-faq-items";

const HomeFaq = () => {
  return (
    <section className="relative border-y border-white/10 bg-black/30 px-3 py-14 sm:px-6 sm:py-18 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45 sm:text-[11px]">
            Questions owners ask
          </p>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Common questions, answered.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            The questions serious owners ask before trusting a car to Grand Touch &mdash; from PPF costs and brands to how we handle paint, diagnostics and handover. If your question isn't here, WhatsApp Sean directly.
          </p>
        </div>

        <Card className="rounded-2xl border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,8,8,0.96))] p-3 text-white sm:p-5">
          <Accordion type="single" collapsible className="w-full">
            {homeFaqItems.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`home-faq-${index}`}
                className="border-b border-white/10 last:border-b-0"
              >
                <AccordionTrigger className="py-3.5 text-left text-[14px] font-semibold text-white hover:no-underline sm:py-4 sm:text-base">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-6 text-white/68">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </section>
  );
};

export default HomeFaq;
