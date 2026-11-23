"use client";

import { ChevronDown, Search } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";

export type SearchableOption = { value: string; label: string };
type Props = { label: string; value?: string; options: SearchableOption[]; onChange: (value: string) => void; disabled?: boolean };

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export default function SearchableDropdown({ label, value = "", options, onChange, disabled = false }: Props) {
  const id = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value);
  const visibleOptions = useMemo(() => {
    const term = normalize(query.trim());
    return term ? options.filter((option) => normalize(option.label).includes(term)) : options;
  }, [options, query]);

  function select(nextValue: string) {
    onChange(nextValue);
    detailsRef.current?.removeAttribute("open");
    setQuery("");
  }

  return (
    <details ref={detailsRef} className="group relative border-b border-[#8f8f8f] text-sm" onToggle={(event) => {
      if (event.currentTarget.open) requestAnimationFrame(() => inputRef.current?.focus());
      else setQuery("");
    }}>
      <summary className={`flex min-h-7 list-none items-center justify-between gap-2 py-1 outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-primary-dark ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`} aria-disabled={disabled} onClick={(event) => disabled && event.preventDefault()}>
        <span className="truncate">{selected?.label ?? label}</span>
        <ChevronDown size={13} className="shrink-0 transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-[min(270px,80vw)] rounded-md border border-[#bcbcbc] bg-white p-2 shadow-lg">
        <label htmlFor={id} className="sr-only">Pesquisar {label.toLocaleLowerCase("pt-BR")}</label>
        <div className="mb-2 flex items-center gap-2 rounded border border-[#bcbcbc] px-2 focus-within:border-secondary focus-within:shadow-sm">
          <Search size={13} aria-hidden="true" />
          <input ref={inputRef} id={id} type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Escape") { detailsRef.current?.removeAttribute("open"); detailsRef.current?.querySelector("summary")?.focus(); }
          }} placeholder={`Digite para buscar ${label.toLocaleLowerCase("pt-BR")}`} className="min-h-9 min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </div>
        <div className="max-h-44 overflow-y-auto" role="listbox" aria-label={label}>
          {value && <button type="button" onClick={() => select("")} className="block min-h-8 w-full cursor-pointer rounded px-2 text-left hover:bg-ice focus-visible:bg-ice focus-visible:outline-none">Todos</button>}
          {visibleOptions.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onClick={() => select(option.value)} className="block min-h-8 w-full cursor-pointer rounded px-2 text-left hover:bg-primary-light focus-visible:bg-primary-light focus-visible:outline-none aria-selected:bg-primary">{option.label}</button>)}
          {visibleOptions.length === 0 && <p className="px-2 py-2 text-[#666]">Nenhuma opção encontrada.</p>}
        </div>
      </div>
    </details>
  );
}
