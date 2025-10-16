import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Wrench, Shield } from "lucide-react";
import React from "react";

interface BookServiceDialogProps {
  children: React.ReactNode;
}

const openWhatsApp = (phoneNumber: string, message: string) => {
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
};

const BookServiceDialog: React.FC<BookServiceDialogProps> = ({ children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Book Your Service</DialogTitle>
          <DialogDescription>
            Choose the service type to connect with our team on WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Workshop & Repair"
              onClick={() =>
                openWhatsApp(
                  "971547302243",
                  "Hello, I'd like to book Workshop & Repair services (repairs/diagnostics/servicing/paint)."
                )
              }
              className="group text-left"
            >
              <Card className="p-6 h-full border-border/50 hover:border-primary/60 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-glow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      Workshop & Repair
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Repairs, diagnostics, servicing, and paint.
                    </p>
                  </div>
                </div>
              </Card>
            </button>
          </DialogClose>

          <DialogClose asChild>
            <button
              type="button"
              aria-label="Detailing & Protection"
              onClick={() =>
                openWhatsApp(
                  "971567191045",
                  "Hello, I'd like to book Detailing & Protection services (detailing/PPF/wrap)."
                )
              }
              className="group text-left"
            >
              <Card className="p-6 h-full border-border/50 hover:border-primary/60 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-glow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      Detailing & Protection
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Detailing, PPF, wraps, and enhancements.
                    </p>
                  </div>
                </div>
              </Card>
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookServiceDialog;



