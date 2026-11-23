"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { currentPage: number; totalPages: number; onPageChange: (page: number) => void; disabled?: boolean };

export default function Pagination({ currentPage, totalPages, onPageChange, disabled = false }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex justify-center py-8" aria-label="Paginação dos registros">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Página anterior" disabled={disabled || currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="grid size-9 cursor-pointer place-items-center disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={17} aria-hidden="true" /></button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <button key={page} type="button" aria-label={`Ir para a página ${page}`} aria-current={currentPage === page ? "page" : undefined} disabled={disabled} onClick={() => onPageChange(page)} className="grid size-9 cursor-pointer place-items-center bg-primary text-sm transition-colors duration-300 hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary aria-current:bg-primary-dark disabled:cursor-wait">{page}</button>
        ))}
        <button type="button" aria-label="Próxima página" disabled={disabled || currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="grid size-9 cursor-pointer place-items-center disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight size={17} aria-hidden="true" /></button>
      </div>
    </nav>
  );
}
