import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ThankYouPayment = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-lg w-full bg-card border-primary/20">
        <CardContent className="pt-12 pb-10 px-8 text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Thank You!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your payment has been received successfully.
            </p>
          </div>

          {/* Confirmation Message */}
          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <p className="text-foreground">
              We appreciate your business. A confirmation email will be sent to you shortly.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <Link to="/">
                <Home className="mr-2 w-4 h-4" />
                Return Home
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
            >
              <Link to="/bookings">
                Book Again
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThankYouPayment;
