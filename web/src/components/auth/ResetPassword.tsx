import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/auth/OtpInput";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AuthService from "@/services/authservice";

const RESEND_SECONDS = 60;

function extractErrorMessage(error: any): string {
  const responseMessage = error?.response?.data?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage.join(", ");
  }

  if (typeof responseMessage === "string") {
    return responseMessage;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loginWithToken } = useAuth();

  const stateEmail = (location.state as { email?: string } | null)?.email;
  const queryEmail = searchParams.get("email") ?? "";

  const initialEmail = useMemo(() => {
    return (stateEmail || queryEmail || "").trim().toLowerCase();
  }, [queryEmail, stateEmail]);

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  useEffect(() => {
    if (resendSecondsLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendSecondsLeft]);

  const validateOtpStep = () => {
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Email is required",
      });
      return false;
    }

    if (otp.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "OTP must be 6 digits.",
      });
      return false;
    }

    return true;
  };

  const validatePasswordStep = () => {
    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too weak",
        description: "Use at least 8 characters.",
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
      });
      return false;
    }

    return true;
  };

  const handleVerifyOtp = async () => {
    if (!validateOtpStep()) {
      return;
    }

    setIsVerifyingOtp(true);

    try {
      await AuthService.verifyResetOtp({
        email: email.trim().toLowerCase(),
        otp,
      });

      setIsOtpVerified(true);
      toast({
        title: "OTP verified",
        description: "Now set your new password.",
      });
    } catch (error: any) {
      const message = extractErrorMessage(error).toLowerCase();

      if (message.includes("expired")) {
        toast({
          variant: "destructive",
          title: "OTP expired",
          description: "Please request a new OTP and try again.",
        });
        return;
      }

      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please check the code and try again.",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isOtpVerified) {
      toast({
        variant: "destructive",
        title: "Verify OTP first",
        description: "Please verify your OTP before setting a new password.",
      });
      return;
    }

    if (!validatePasswordStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await AuthService.resetPassword({
        email: email.trim().toLowerCase(),
        otp,
        newPassword,
      });

      const token = response?.access_token || response?.accessToken || response?.token;

      if (!token || typeof token !== "string") {
        throw new Error("Authentication token missing from reset response");
      }

      await loginWithToken(token, response?.user ?? null);

      toast({
        title: "Password reset successful",
        description: "You are now signed in.",
      });

      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      const message = extractErrorMessage(error);
      const lower = message.toLowerCase();

      if (lower.includes("expired")) {
        setIsOtpVerified(false);
        toast({
          variant: "destructive",
          title: "OTP expired",
          description: "Please verify again with a fresh OTP.",
        });
        return;
      }

      if (lower.includes("invalid otp") || lower.includes("invalid")) {
        setIsOtpVerified(false);
        toast({
          variant: "destructive",
          title: "Invalid OTP",
          description: "Please verify OTP again.",
        });
        return;
      }

      if (lower.includes("network")) {
        toast({
          variant: "destructive",
          title: "Network error",
          description: "Please check your connection and try again.",
        });
        return;
      }

      toast({
        variant: "destructive",
        title: "Reset failed",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim() || resendSecondsLeft > 0) {
      return;
    }

    setIsResending(true);

    try {
      await AuthService.forgotPassword(email.trim().toLowerCase());
      setResendSecondsLeft(RESEND_SECONDS);
      setIsOtpVerified(false);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "OTP sent",
        description: "If the email exists, a fresh OTP has been sent.",
      });
    } catch (error: any) {
      const message = extractErrorMessage(error);

      toast({
        variant: "destructive",
        title: message.toLowerCase().includes("network") ? "Network error" : "Unable to resend OTP",
        description:
          message.toLowerCase().includes("network")
            ? "Please check your connection and try again."
            : message,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (isOtpVerified) {
      setIsOtpVerified(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value.replace(/\D/g, "").slice(0, 6));
    if (isOtpVerified) {
      setIsOtpVerified(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
        <p className="text-muted-foreground mt-2">
          Verify your OTP first, then set a new password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => handleEmailChange(event.target.value)}
            disabled={isSubmitting || isResending || isVerifyingOtp}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">OTP</Label>
          <OtpInput
            value={otp}
            onChange={handleOtpChange}
            disabled={isSubmitting || isResending || isVerifyingOtp}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Enter the 6-digit OTP sent to your email.</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResendOtp}
              disabled={isSubmitting || isResending || isVerifyingOtp || resendSecondsLeft > 0 || !email.trim()}
              className="h-auto px-0"
            >
              {isResending
                ? "Sending..."
                : resendSecondsLeft > 0
                  ? `Resend in ${resendSecondsLeft}s`
                  : "Resend OTP"}
            </Button>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleVerifyOtp}
          disabled={isSubmitting || isResending || isVerifyingOtp || otp.length !== 6 || !email.trim()}
        >
          {isVerifyingOtp ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying OTP...
            </span>
          ) : isOtpVerified ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              OTP Verified
            </span>
          ) : (
            "Verify OTP"
          )}
        </Button>

        {isOtpVerified && (
          <>
            <div className="space-y-2 relative">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={isSubmitting}
                placeholder="At least 8 characters"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-9 text-muted-foreground"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isSubmitting}
                placeholder="Repeat new password"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-9 text-muted-foreground"
                disabled={isSubmitting}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isSubmitting || isResending}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting password...
                </span>
              ) : (
                "Reset Password"
              )}
            </Button>
          </>
        )}
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Back to{" "}
          <Link to="/login" className="text-primary hover:underline font-medium transition-colors duration-200">
            login
          </Link>
        </p>
      </div>
    </div>
  );
}
