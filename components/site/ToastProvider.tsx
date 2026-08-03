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
          toast: "orriii-toast",
          content: "orriii-toast__content",
          title: "orriii-toast__title",
          description: "orriii-toast__description",
          closeButton: "orriii-toast__close",
          actionButton: "orriii-toast__action",
        },
      }}
    />
  );
}
