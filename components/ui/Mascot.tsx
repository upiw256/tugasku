import type { ReactNode } from "react";

export type MascotMood = "success" | "error" | "warning" | "empty" | "neutral";

export function Mascot({ className = "" }: { mood?: MascotMood; className?: string }) {
  return <img src="/mascot/helping.png" alt="" aria-hidden="true" className={`object-contain ${className}`} />;
}

export function MascotEmptyState({ title, message, className = "", children }: { title: string; message?: string; className?: string; children?: ReactNode }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 px-4 py-8 text-center ${className}`}>
      <Mascot mood="empty" className="h-20 w-24" />
      <p className="font-semibold text-foreground/70">{title}</p>
      {message && <p className="max-w-lg text-sm text-foreground/50">{message}</p>}
      {children}
    </div>
  );
}
