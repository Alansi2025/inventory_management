import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  BrainCircuit, 
  Plus, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Box,
  ArrowRight,
  Moon,
  Sun
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Components
import { StatCard } from './components/StatCard.tsx';
import { InventoryTable } from './components/InventoryTable.tsx';
import { ProductModal } from './components/ProductModal.tsx';

// Types & Services
import { Product, Category, ViewState, DashboardStats } from './types.ts';
import { analyzeInventoryRisks } from './services/geminiService.ts';

// Mock Data
const INITIAL_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Ergo Chair Ultra', 
    sku: 'FUR-001', 
    category: Category.FURNITURE, 
    price: 349.99, 
    quantity: 15, 
    description: 'High-end ergonomic office chair with lumbar support.', 
    lastUpdated: new Date().toISOString(),
    history: [12, 15, 13, 18, 15, 20, 15]
  },
  { 
    id: '2', 
    name: 'Wireless Mech Keyboard', 
    sku: 'ELE-045', 
    category: Category.ELECTRONICS, 
    price: 129.50, 
    quantity: 4, 
    description: 'Mechanical keyboard with RGB and brown switches.', 
    lastUpdated: new Date().toISOString(),
    history: [8, 6, 5, 7, 5, 4, 4]
  },
  { 
    id: '3', 
    name: 'Standing Desk Frame', 
    sku: 'FUR-022', 
    category: Category.FURNITURE, 
    price: 299.00, 
    quantity: 8, 
    description: 'Dual motor electric standing desk frame.', 
    lastUpdated: new Date().toISOString(),
    history: [5, 8, 12, 10, 9, 8, 8]
  },
  { 
    id: '4', 
    name: 'USB-C Docking Station', 
    sku: 'ELE-102', 
    category: Category.ELECTRONICS, 
    price: 89.99, 
    quantity: 42, 
    description: '12-in-1 docking station for laptops.', 
    lastUpdated: new Date().toISOString(),
    history: [30, 35, 32, 40, 45, 42, 42]
  },
  { 
    id: '5', 
    name: 'Cotton Hoodie', 
    sku: 'CLO-552', 
    category: Category.CLOTHING, 
    price: 45.00, 
    quantity: 120, 
    description: 'Premium heavyweight cotton hoodie.', 
    lastUpdated: new Date().toISOString(),
    history: [150, 140, 135, 130, 125, 120, 120]
  },
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
const LOW_STOCK_THRESHOLD = 1; // Display alert if more than 1 item is low stock

const App: React.FC = () => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
       const saved = localStorage.getItem('lumina-theme');
       if (saved) return saved === 'dark';
       return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // App State
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Theme Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lumina-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lumina-theme', 'light');
    }
  }, [isDarkMode]);

  // Computed Stats
  const stats: DashboardStats = useMemo(() => {
    return {
      totalProducts: products.length,
      totalValue: products.reduce((acc, p) => acc + (p.price * p.quantity), 0),
      lowStockItems: products.filter(p => p.quantity < 10).length,
      outOfStockItems: products.filter(p => p.quantity === 0).length
    };
  }, [products]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [products]);

  // Chart Theme Helpers
  const chartTheme = {
    grid: isDarkMode ? '#334155' : '#e2e8f0',
    text: isDarkMode ? '#94a3b8' : '#64748b',
    tooltipBg: isDarkMode ? '#1e293b' : '#ffffff',
    tooltipBorder: isDarkMode ? '#334155' : '#e2e8f0',
    tooltipText: isDarkMode ? '#f1f5f9' : '#1e293b'
  };

  // Handlers
  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    } else {
      setProducts(prev => [...prev, product]);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleBatchDelete = (ids: string[]) => {
    if (window.confirm(`Are you sure you want to delete ${ids.length} selected products?`)) {
      setProducts(prev => prev.filter(p => !ids.includes(p.id)));
    }
  };

  const handleBatchLowStock = (ids: string[]) => {
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, quantity: 5 } : p));
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeInventoryRisks(products);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // --- Views ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Value" 
          value={`$${stats.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={DollarSign}
          colorClass="bg-white dark:bg-slate-900"
        />
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts} 
          icon={Package}
        />
        <StatCard 
          title="Low Stock" 
          value={stats.lowStockItems} 
          icon={AlertTriangle}
          trend="Needs Attention"
          trendUp={false}
          colorClass="bg-amber-50/50 dark:bg-amber-900/20"
        />
        <StatCard 
          title="Out of Stock" 
          value={stats.outOfStockItems} 
          icon={Box}
          colorClass={stats.outOfStockItems > 0 ? "bg-rose-50/50 dark:bg-rose-900/20" : "bg-white dark:bg-slate-900"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Inventory by Category</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  stroke={isDarkMode ? '#0f172a' : '#ffffff'}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartTheme.tooltipBg, 
                    borderColor: chartTheme.tooltipBorder,
                    color: chartTheme.tooltipText,
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: chartTheme.tooltipText }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-slate-600 dark:text-slate-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Stock Value Distribution</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={products.slice(0, 8)}> {/* Show top 8 for brevity */}
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid}/>
                 <XAxis dataKey="name" tick={{fontSize: 10, fill: chartTheme.text}} interval={0} angle={-45} textAnchor="end" height={60} hide />
                 <YAxis tick={{fontSize: 12, fill: chartTheme.text}} />
                 <Tooltip 
                    formatter={(value: number) => [`$${value}`, 'Price']}
                    contentStyle={{ 
                      backgroundColor: chartTheme.tooltipBg, 
                      borderColor: chartTheme.tooltipBorder,
                      color: chartTheme.tooltipText,
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                    }}
                    itemStyle={{ color: chartTheme.tooltipText }}
                 />
                 <Bar dataKey="price" fill="#6366f1" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
           <p className="text-center text-xs text-slate-400 mt-2">Sample of individual product prices</p>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Products</h2>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>
      <InventoryTable 
        products={products} 
        onEdit={openEditModal} 
        onDelete={handleDeleteProduct}
        onBatchDelete={handleBatchDelete}
        onBatchLowStock={handleBatchLowStock}
      />
    </div>
  );

  const renderAIInsights = () => (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white shadow-xl dark:shadow-indigo-900/20">
        <div className="flex items-start justify-between">
            <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <BrainCircuit className="w-8 h-8" />
                AI Inventory Analyst
                </h2>
                <p className="text-indigo-100 max-w-xl">
                Utilize Gemini Flash 2.5 to analyze your current stock levels, value distribution, and identify potential supply chain risks immediately.
                </p>
            </div>
            <button 
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg disabled:opacity-70"
            >
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
        </div>
      </div>

      {aiAnalysis && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Analysis Report</h3>
          <div className="prose prose-slate dark:prose-invert max-w-none">
             <pre className="whitespace-pre-wrap font-sans text-slate-600 dark:text-slate-300 leading-relaxed">{aiAnalysis}</pre>
          </div>
        </div>
      )}
      
      {!aiAnalysis && !isAnalyzing && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <BrainCircuit className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Click "Run Analysis" to generate insights.</p>
          </div>
      )}
    </div>
  );

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200`}>
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col shadow-2xl border-r border-transparent dark:border-slate-800 z-10">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-900/50">
            L
          </div>
          <span className="font-bold text-xl tracking-tight">Lumina</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveView(ViewState.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === ViewState.DASHBOARD ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveView(ViewState.INVENTORY)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === ViewState.INVENTORY ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800'}`}
          >
            <Package className="w-5 h-5" />
            Inventory
          </button>
          <button 
            onClick={() => setActiveView(ViewState.AI_INSIGHTS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === ViewState.AI_INSIGHTS ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800'}`}
          >
            <BrainCircuit className="w-5 h-5" />
            AI Insights
          </button>
        </nav>

        <div className="px-4 mb-2">
             <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Persistent Low Stock Banner */}
          {stats.lowStockItems > LOW_STOCK_THRESHOLD && (
            <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900 dark:text-amber-400">Inventory Alert</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-0.5">
                    Warning: <span className="font-bold">{stats.lowStockItems} products</span> are currently low on stock (below 10 units).
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveView(ViewState.INVENTORY)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium text-sm transition-colors whitespace-nowrap"
              >
                View Inventory
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <header className="flex justify-between items-end mb-8">
             <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">
                    {activeView === ViewState.DASHBOARD && 'Dashboard'}
                    {activeView === ViewState.INVENTORY && 'Inventory Management'}
                    {activeView === ViewState.AI_INSIGHTS && 'Intelligence Hub'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Welcome back, Admin
                </p>
             </div>
             <div className="text-sm text-slate-400 dark:text-slate-500">
                Last synced: {new Date().toLocaleTimeString()}
             </div>
          </header>

          {activeView === ViewState.DASHBOARD && renderDashboard()}
          {activeView === ViewState.INVENTORY && renderInventory()}
          {activeView === ViewState.AI_INSIGHTS && renderAIInsights()}
        </div>
      </main>

      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
      />
    </div>
  );
};

export default App;