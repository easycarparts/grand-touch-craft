import { Phone, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileBottomBar = () => {
  const handleCall = () => {
    window.location.href = "tel:+971XXXXXXXXX";
  };

  const handleWhatsApp = () => {
    const phoneNumber = "971XXXXXXXXX";
    const message = "Hello, I'd like to inquire about your automotive services.";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/50 shadow-elegant">
      <div className="grid grid-cols-3 gap-2 p-3">
        <Button
          onClick={handleCall}
          variant="outline"
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-2 border-primary/30 hover:bg-primary/10"
        >
          <Phone className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">Call</span>
        </Button>
        
        <Button
          onClick={handleWhatsApp}
          variant="outline"
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-2 border-primary/30 hover:bg-primary/10"
        >
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">WhatsApp</span>
        </Button>
        
        <Button
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Calendar className="w-4 h-4" />
          <span className="text-xs font-medium">Book</span>
        </Button>
      </div>
    </div>
  );
};

export default MobileBottomBar;
