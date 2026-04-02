import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AuthService from "@/services/authservice";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Email is required",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await AuthService.forgotPassword(email.trim());

      toast({
        title: "Check your email",
        description: "If the email exists, an OTP has been sent.",
      });

      const normalizedEmail = email.trim().toLowerCase();
      navigate(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`, {
        replace: true,
        state: { email: normalizedEmail },
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to send OTP. Please try again.";

      toast({
        variant: "destructive",
        title: "Request failed",
        description: Array.isArray(message) ? message.join(", ") : message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Forgot Password</h2>
        <p className="text-muted-foreground mt-2">
          Enter your email and we will send you a 6-digit OTP
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending OTP...
            </span>
          ) : (
            "Send OTP"
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link
          to="/login"
          className="text-sm text-primary hover:underline transition-colors duration-200"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
