import { ChevronLeft, ChevronRight } from "lucide-react";

const PaginationControls = ({ page, totalPages, onPageChange }) => {
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const safePage = Math.min(Math.max(page || 1, 1), safeTotalPages);

  const pages = Array.from({ length: safeTotalPages }, (_, index) => index + 1).filter((pageNumber) => {
    return pageNumber === 1 || pageNumber === safeTotalPages || Math.abs(pageNumber - safePage) <= 1;
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600">
        Page <span className="font-medium text-ink">{safePage}</span> of <span className="font-medium text-ink">{safeTotalPages}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((pageNumber, index) => {
          const previousPage = pages[index - 1];
          const showGap = previousPage && pageNumber - previousPage > 1;

          return (
            <span key={pageNumber} className="flex items-center gap-1">
              {showGap ? <span className="px-2 text-slate-400">...</span> : null}
              <button
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`focus-ring h-9 min-w-9 rounded-md border px-3 text-sm font-medium ${
                  pageNumber === safePage ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:bg-slate-50"
                }`}
              >
                {pageNumber}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          aria-label="Next page"
          disabled={safePage >= safeTotalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
