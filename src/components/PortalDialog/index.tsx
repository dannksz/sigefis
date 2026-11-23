"use client";

import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";

interface PortalDialogProps {
  label: string;
  title: string;
  children: ReactNode;
  trigger?: ReactNode;
  className?: string;
}

export default function PortalDialog({ label, title, children, trigger, className }: PortalDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button type="button" className={className} aria-label={label} onClick={() => ref.current?.showModal()}>
        {trigger ?? label}
      </button>
      <dialog ref={ref} className="portal-dialog" aria-labelledby={titleId}>
        <div className="portal-dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <form method="dialog">
            <button type="submit" aria-label="Fechar"><X size={20} aria-hidden="true" /></button>
          </form>
        </div>
        <div className="portal-dialog-content">{children}</div>
      </dialog>
    </>
  );
}
