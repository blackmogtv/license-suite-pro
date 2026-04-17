import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!open) return null;
  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative w-full bg-surface border border-border rounded-sm shadow-2xl flex flex-col max-h-[90vh]",
          sizes[size],
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-mono text-sm font-bold text-foreground uppercase tracking-wider">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-sm hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="p-4 border-t border-border flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Button({
  variant = "secondary",
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
}) {
  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:brightness-110 accent-glow font-bold",
    secondary:
      "bg-surface border border-border text-foreground hover:bg-accent",
    destructive:
      "bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 font-bold",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-accent",
  };
  return (
    <button
      {...rest}
      className={cn(
        "px-4 py-2 text-xs rounded-sm font-mono uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={cn(
        "w-full bg-background border border-border text-foreground text-sm rounded-sm px-3 py-2 outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all",
        className,
      )}
    />
  );
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={cn(
        "w-full bg-background border border-border text-foreground text-sm rounded-sm px-3 py-2 outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all min-h-[80px]",
        className,
      )}
    />
  );
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-widest mb-1.5 block"
    >
      {children}
    </label>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "CONFIRM",
  destructive,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            CANCEL
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            onClick={handle}
            disabled={loading}
          >
            {loading ? "..." : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </Modal>
  );
}
