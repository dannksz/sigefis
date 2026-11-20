type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="flex justify-center pb-8">
      <div className="flex gap-2">
        {/* Botão anterior */}
        {currentPage > 1 && (
          <button
            onClick={() => onPageChange(currentPage - 1)}
            className="w-8 h-8 rounded border hover:bg-gray-100 flex items-center justify-center"
          >
            ←
          </button>
        )}
        
        {/* Páginas visíveis */}
        {getVisiblePages().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded flex items-center justify-center ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "border hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}
        
        {/* Elipses se necessário */}
        {totalPages > 5 && currentPage < totalPages - 2 && (
          <span className="px-2 flex items-center">...</span>
        )}
        
        {/* Próxima página */}
        {currentPage < totalPages && (
          <button
            onClick={() => onPageChange(currentPage + 1)}
            className="w-8 h-8 rounded border hover:bg-gray-100 flex items-center justify-center"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}