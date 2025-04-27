"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-gray-800 group-[.toaster]:text-gray-100 group-[.toaster]:border-gray-700 group-[.toaster]:shadow-purple-900/20 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-gray-400",
          actionButton: "group-[.toast]:bg-[#9d00ff] group-[.toast]:text-white group-[.toast]:hover:bg-purple-700",
          cancelButton: "group-[.toast]:bg-gray-700 group-[.toast]:text-gray-300 group-[.toast]:hover:bg-gray-600",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
