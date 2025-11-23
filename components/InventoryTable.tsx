import React, { useState } from 'react';
import { Product, Category } from '../types';
import { Edit, Trash2, AlertCircle, ChevronDown, X, ArrowDownToLine, Download } from 'lucide-react';

interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchLowStock: (ids: string[]) => void;
}

// Lightweight Sparkline Component
const Sparkline = ({ data }: { data: number[] }) => {
  if (!data || data.length < 2) {
    return <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800/50 rounded flex items-center justify-center text-[10px] text-slate-400">No History</div>;
  }
  
  const height = 28;
  const width = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Determine color based on trend
  const first = data[0];
  const last = data[data.length - 1];
  let color = "#64748b"; // Slate-500
  if (last > first) color = "#10b981"; // Emerald-500
  if (last < first) color = "#f43f5e"; // Rose-500

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2; // padding
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex items-center gap-2">
        <svg width={width} height={height} className="overflow-visible">
        <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle 
            cx={width} 
            cy={height - ((last - min) / range) * (height - 4) - 2} 
            r="2.5" 
            fill={color} 
        />
        </svg>
    </div>
  );
};

export const InventoryTable: React.FC<InventoryTableProps> = ({ 
  products, 
  onEdit, 
  onDelete,
  onBatchDelete,
  onBatchLowStock
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchMenuOpen, setIsBatchMenuOpen] = useState(false);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'In Stock') {
        matchesStock = product.quantity >= 10;
    } else if (stockFilter === 'Low Stock') {
        matchesStock = product.quantity > 0 && product.quantity < 10;
    } else if (stockFilter === 'Out of Stock') {
        matchesStock = product.quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Selection Logic
  const handleSelectAll = () => {
    const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id));
    const newSelected = new Set(selectedIds);
    
    if (allFilteredSelected) {
      // Deselect all visible
      filteredProducts.forEach(p => newSelected.delete(p.id));
    } else {
      // Select all visible
      filteredProducts.forEach(p => newSelected.add(p.id));
    }
    setSelectedIds(newSelected);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setIsBatchMenuOpen(false);
  };

  const handleBatchDeleteClick = () => {
    onBatchDelete(Array.from(selectedIds));
    clearSelection();
  };

  const handleBatchLowStockClick = () => {
    onBatchLowStock(Array.from(selectedIds));
    clearSelection();
  };

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) return;

    const headers = ['ID', 'Name', 'SKU', 'Category', 'Price', 'Quantity', 'Description', 'Last Updated'];
    const csvContent = [
      headers.join(','),
      ...filteredProducts.map(p => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`, // Escape double quotes
        p.sku,
        p.category,
        p.price,
        p.quantity,
        `"${p.description.replace(/"/g, '""')}"`,
        p.lastUpdated
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lumina_inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id));
  const isIndeterminate = selectedIds.size > 0 && !allFilteredSelected;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-visible transition-colors">
      {/* Toolbar */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-slate-50/50 dark:bg-slate-900 min-h-[80px]">
        {selectedIds.size > 0 ? (
          <div className="w-full flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg border border-indigo-100 dark:border-indigo-900/30 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <span className="font-bold text-indigo-900 dark:text-indigo-300">{selectedIds.size} selected</span>
              <button onClick={clearSelection} className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsBatchMenuOpen(!isBatchMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-lg border border-indigo-200 dark:border-indigo-900/50 shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all"
              >
                Batch Actions
                <ChevronDown className={`w-4 h-4 transition-transform ${isBatchMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBatchMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150">
                  <div className="py-1">
                    <button
                      onClick={handleBatchLowStockClick}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <ArrowDownToLine className="w-4 h-4 text-amber-500" />
                      Mark as Low Stock
                    </button>
                    <button
                      onClick={handleBatchDeleteClick}
                      className="w-full text-left px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="relative flex-grow sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by Name or SKU..."
                  className="pl-10 pr-4 py-2 w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <select
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-sm bg-white text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-sm bg-white text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="All">All Stock Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock (&lt; 10)</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>

                <button 
                  onClick={handleExportCSV}
                  className="px-4 py-2 flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Export filtered data to CSV"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-4 w-12 text-center">
                <div className="flex items-center justify-center">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-700 cursor-pointer"
                    checked={allFilteredSelected && filteredProducts.length > 0}
                    ref={input => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                  />
                </div>
              </th>
              <th className="px-6 py-4 tracking-wider">Product Info</th>
              <th className="px-6 py-4 tracking-wider">SKU</th>
              <th className="px-6 py-4 tracking-wider">Category</th>
              <th className="px-6 py-4 tracking-wider">Price</th>
              <th className="px-6 py-4 tracking-wider">Stock</th>
              <th className="px-6 py-4 tracking-wider">Trend</th>
              <th className="px-6 py-4 tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  No products found matching your filters.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = selectedIds.has(product.id);
                return (
                  <tr 
                    key={product.id} 
                    className={`transition-colors ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-900/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'}`}
                  >
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-700 cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelection(product.id)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-slate-200">{product.name}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{product.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{product.sku}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          <span className={`font-bold ${product.quantity < 10 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                              {product.quantity}
                          </span>
                          {product.quantity < 10 && (
                              <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                          )}
                      </div>
                    </td>
                     <td className="px-6 py-4">
                      <Sparkline data={product.history || []} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => onEdit(product)}
                        className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(product.id)}
                        className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400 text-center rounded-b-xl">
        Showing {filteredProducts.length} of {products.length} products
      </div>
    </div>
  );
};