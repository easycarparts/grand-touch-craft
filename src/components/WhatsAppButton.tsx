import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookServiceDialog from "@/components/BookServiceDialog";

const WhatsAppButton = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <BookServiceDialog>
        <Button
          size="lg"
          className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-elegant animate-glow p-0"
          aria-label="Book your service"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </BookServiceDialog>
    </div>
  );
};

export default WhatsAppButton;
