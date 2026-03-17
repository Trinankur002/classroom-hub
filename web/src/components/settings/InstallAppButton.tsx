import { Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button, type ButtonProps } from "@/components/ui/button";

type InstallAppButtonProps = Omit<ButtonProps, "onClick">;

export function InstallAppButton({ children, ...buttonProps }: InstallAppButtonProps) {
  const { canInstall, install } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        void install();
      }}
      {...buttonProps}
    >
      <Download className="h-4 w-4" />
      {children ?? "Install App"}
    </Button>
  );
}
