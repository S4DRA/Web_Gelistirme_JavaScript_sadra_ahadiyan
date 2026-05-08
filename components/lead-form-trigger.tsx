"use client";

import { ReactNode, useState } from "react";
import { DemoRequestModal } from "@/components/demo-request-modal";

type LeadFormTriggerProps = {
  children: ReactNode;
  className: string;
  source?: "demo" | "contact";
};

export function LeadFormTrigger({
  children,
  className,
  source = "demo",
}: LeadFormTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <DemoRequestModal open={open} onClose={() => setOpen(false)} source={source} />
    </>
  );
}
