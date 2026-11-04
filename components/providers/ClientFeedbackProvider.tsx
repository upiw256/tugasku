"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import { Mascot } from "@/components/ui/Mascot";

export default function ClientFeedbackProvider() {
  useEffect(() => {
    const originalAlert = window.alert;
    const originalFire = Swal.fire.bind(Swal);
    const originalMixin = Swal.mixin.bind(Swal);

    const decorateOptions = (first: any, second?: any, third?: any) => {
      const options: any = typeof first === "string"
        ? { title: first, text: typeof second === "string" ? second : "", icon: third }
        : { ...(first || {}) };
      if (options.toast) {
        options.iconHtml ??= '<img src="/mascot/helping.png" alt="" style="width:36px;height:36px;object-fit:contain" />';
      } else {
        options.imageUrl ??= "/mascot/helping.png";
        options.imageWidth ??= 144;
        options.imageAlt ??= "Maskot TugasKu";
      }
      return options;
    };

    window.alert = (message?: unknown) => {
      void originalFire({
        title: "",
        text: String(message ?? ""),
        imageUrl: "/mascot/helping.png",
        imageWidth: 144,
        imageAlt: "Maskot TugasKu",
        confirmButtonText: "Mengerti",
      });
    };

    Swal.fire = ((...args: any[]) => {
      return originalFire(decorateOptions(args[0], args[1], args[2]));
    }) as typeof Swal.fire;

    Swal.mixin = ((mixinOptions: any) => {
      const mixed = originalMixin(mixinOptions);
      const mixedFire = mixed.fire.bind(mixed);
      mixed.fire = ((...args: any[]) => mixedFire(decorateOptions(args[0], args[1], args[2]))) as typeof mixed.fire;
      return mixed;
    }) as typeof Swal.mixin;

    return () => {
      window.alert = originalAlert;
      Swal.fire = originalFire as typeof Swal.fire;
      Swal.mixin = originalMixin as typeof Swal.mixin;
    };
  }, []);

  return (
    <Toaster position="top-center" gutter={10} toastOptions={{ duration: 4000 }}>
      {(toast) => (
        <div className={`flex max-w-sm items-center gap-3 rounded-xl border border-border-custom bg-surface px-4 py-3 shadow-xl ${toast.visible ? "animate-in fade-in slide-in-from-top-2" : "animate-out fade-out"}`}>
          <Mascot mood={toast.type === "success" ? "success" : toast.type === "error" ? "error" : "neutral"} className="h-12 w-12 shrink-0" />
          <div className="text-sm font-medium text-foreground">{toast.message}</div>
        </div>
      )}
    </Toaster>
  );
}
