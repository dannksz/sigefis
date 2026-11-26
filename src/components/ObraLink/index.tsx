import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export default function ObraLink({ href, children, variant = "detail", active = false }: {
  href: string; children: ReactNode; variant?: "detail" | "tab"; active?: boolean;
}) {
  const style = variant === "tab"
    ? `rounded-md px-4 py-2 shadow-sm transition-colors duration-300 ${active ? "bg-primary" : "bg-white hover:bg-primary-light"}`
    : "min-h-7 gap-1 hover:underline";
  return <Link href={href} scroll={variant !== "tab"} aria-current={active ? "page" : undefined}
    className={`inline-flex items-center font-medium focus-visible:ring-2 focus-visible:ring-primary-dark ${style}`}>
    {variant === "detail" && <ChevronRight size={16} aria-hidden="true" />}{children}
  </Link>;
}
