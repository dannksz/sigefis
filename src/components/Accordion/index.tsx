import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

type Item = { id: string; title: string; content: ReactNode };

export default function Accordion({ name, items }: { name: string; items: readonly Item[] }) {
  return (
    <div className="space-y-3">
      {items.map(({ id, title, content }) => (
        <details key={id} name={name} className="group rounded-lg border border-neutral-300 bg-white open:border-primary-dark">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-4 font-semibold hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary [&::-webkit-details-marker]:hidden">
            {title}
            <ChevronDown aria-hidden="true" className="size-5 shrink-0 transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <div className="border-t border-neutral-200 px-5 py-4 leading-relaxed">{content}</div>
        </details>
      ))}
    </div>
  );
}
