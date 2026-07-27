"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      closeButton
      duration={6000}
      expand
      gap={12}
      mobileOffset={{ top: 72, right: 16, left: 16 }}
      offset={{ top: 24, right: 24 }}
      position="top-right"
      swipeDirections={["right"]}
      theme="light"
      visibleToasts={3}
      toastOptions={{
        classNames: {
          toast: "orin-toast",
          content: "orin-toast__content",
          title: "orin-toast__title",
          description: "orin-toast__description",
          closeButton: "orin-toast__close",
          actionButton: "orin-toast__action",
        },
      }}
    />
  );
}
