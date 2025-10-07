import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookServiceDialog from "@/components/BookServiceDialog";

const WhatsAppButton = () => {
  return (
    <BookServiceDialog>
      <Button
        size="lg"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-elegant animate-glow p-0"
        aria-label="Book via WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </BookServiceDialog>
  );
};

export default WhatsAppButton;
