
import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [jumpPage, setJumpPage] = useState('');
  
  if (totalItems === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
        onPageChange(page);
        setJumpPage('');
    } else if (jumpPage !== '') {
        setJumpPage(''); // Reset invalid input
    }
  };

  // Logic to determine which page numbers to show
  const getPageNumbers = () => {
      const pages = [];
      // Show at most 5 numbers + ellipses

      if (totalPages <= 7) {
          // If few pages, show all
          for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
          // Always show first page
          pages.push(1);

          // Logic for middle pages
          if (currentPage > 3) {
              pages.push('...');
          }

          let start = Math.max(2, currentPage - 1);
          let end = Math.min(totalPages - 1, currentPage + 1);

          // Adjust if near start or end
          if (currentPage <= 3) {
              end = 4;
          }
          if (currentPage >= totalPages - 2) {
              start = totalPages - 3;
          }

          for (let i = start; i <= end; i++) {
              pages.push(i);
          }

          if (currentPage < totalPages - 2) {
              pages.push('...');
          }

          // Always show last page
          pages.push(totalPages);
      }
      return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const pageSizeOptions = [10, 20, 50, 100];
  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
      {/* Left Side: Info & Page Size */}
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-700">{startItem}-{endItem}</span> trong <span className="font-bold text-slate-800">{totalItems}</span> kết quả
        </p>
        
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 pl-3 border border-slate-200">
            <label htmlFor="pageSize" className="text-xs text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">Hiển thị:</label>
            <select
                id="pageSize"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="block w-full rounded-md border-none py-1 pl-2 pr-8 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 bg-white shadow-sm cursor-pointer"
            >
                {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Right Side: Navigation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
            <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed transition-all active:scale-95"
            title="Trang trước"
            >
            <ChevronLeftIcon className="h-4 w-4" />
            </button>

            <div className="hidden sm:flex items-center gap-1">
                {pageNumbers.map((page, index) => (
                    <React.Fragment key={index}>
                        {page === '...' ? (
                            <span className="px-2 text-slate-400 text-xs">...</span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page as number)}
                                className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all active:scale-95 ${
                                    currentPage === page 
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 border border-blue-600' 
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Mobile Simple View */}
            <span className="sm:hidden text-sm font-bold text-slate-700 px-2">
                {currentPage} / {totalPages}
            </span>

            <button
            onClick={handleNext}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed transition-all active:scale-95"
            title="Trang sau"
            >
            <ChevronRightIcon className="h-4 w-4" />
            </button>
        </div>

        {/* Jump To Page Input */}
        {totalPages > 1 && (
            <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 border-l border-slate-200 pl-3">
                <span className="text-xs font-bold text-slate-400 uppercase hidden sm:inline">Đến trang</span>
                <input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    placeholder="#"
                    className="w-10 h-8 rounded-lg border border-slate-200 text-center text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm hover:border-blue-300 transition-colors"
                />
            </form>
        )}
      </div>
    </div>
  );
};

const MemoizedPagination = React.memo(Pagination);
export default MemoizedPagination;
