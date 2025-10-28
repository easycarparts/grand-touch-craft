import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ThankYou = () => {
  const location = useLocation();
  const bookingData = location.state?.bookingData;

  useEffect(() => {
    // Meta Pixel tracking for conversion
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', {
        value: bookingData?.price || 0,
        currency: 'AED',
        content_name: bookingData?.serviceName || 'Service Booking',
        content_category: bookingData?.category || 'Automotive Service'
      });
    }

    // Google Analytics tracking (if you have it)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: Date.now().toString(),
        value: bookingData?.price || 0,
        currency: 'AED',
        items: [{
          item_id: bookingData?.serviceName || 'service',
          item_name: bookingData?.serviceName || 'Service Booking',
          category: bookingData?.category || 'Automotive Service',
          quantity: 1,
          price: bookingData?.price || 0
        }]
      });
    }
  }, [bookingData]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <CheckCircle className="w-24 h-24 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              Thank You!
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Your booking has been submitted successfully
            </p>
          </div>

          {/* Booking Summary */}
          {bookingData && (
            <div className="bg-[#1a1a1a] rounded-xl border border-primary/20 p-6 mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">Booking Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <span className="text-gray-400">Service:</span>
                  <p className="text-white font-medium">{bookingData.serviceName}</p>
                </div>
                <div>
                  <span className="text-gray-400">Vehicle Size:</span>
                  <p className="text-white font-medium">{bookingData.vehicleSize}</p>
                </div>
                <div>
                  <span className="text-gray-400">Customer:</span>
                  <p className="text-white font-medium">{bookingData.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-400">Total Price:</span>
                  <p className="text-white font-medium">AED {bookingData.price?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-[#1a1a1a] rounded-xl border border-primary/20 p-6 mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">What Happens Next?</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-black text-sm font-bold">1</span>
                </div>
                <p className="text-gray-300">We've sent your booking details to our team via email</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-black text-sm font-bold">2</span>
                </div>
                <p className="text-gray-300">WhatsApp should have opened for you to confirm with Sean</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-black text-sm font-bold">3</span>
                </div>
                <p className="text-gray-300">Sean will confirm availability and schedule your appointment</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-[#1a1a1a] rounded-xl border border-primary/20 p-6 mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">Need Help?</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions or need to modify your booking, contact Sean directly:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-black font-semibold"
              >
                <a href="https://wa.me/971567191045" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 w-4 h-4" />
                  WhatsApp Sean
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Link to="/contact">
                  Contact Page
                </Link>
              </Button>
            </div>
          </div>

          {/* Return Home */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-black font-semibold px-8 py-6"
            >
              <Link to="/">
                Return Home
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 px-8 py-6"
            >
              <Link to="/bookings">
                Book Another Service
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
