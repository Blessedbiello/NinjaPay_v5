'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Package,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Mock data
const mockProducts = [
  {
    id: 'prod_abc123',
    name: 'Web3 Development Course',
    description: 'Complete course on Solana smart contract development',
    price: 299.99,
    currency: 'USDC',
    images: ['https://via.placeholder.com/150'],
    active: true,
    sales: 45,
    revenue: 13499.55,
  },
  {
    id: 'prod_def456',
    name: 'NFT Marketplace Template',
    description: 'Ready-to-deploy NFT marketplace on Solana',
    price: 499.99,
    currency: 'USDC',
    images: ['https://via.placeholder.com/150'],
    active: true,
    sales: 23,
    revenue: 11499.77,
  },
  {
    id: 'prod_ghi789',
    name: 'DeFi Protocol Audit',
    description: 'Professional security audit for your DeFi protocol',
    price: 2999.99,
    currency: 'USDC',
    images: ['https://via.placeholder.com/150'],
    active: true,
    sales: 8,
    revenue: 23999.92,
  },
  {
    id: 'prod_jkl012',
    name: 'Crypto Trading Bot',
    description: 'Automated trading bot with ML strategies',
    price: 149.99,
    currency: 'USDC',
    images: ['https://via.placeholder.com/150'],
    active: false,
    sales: 12,
    revenue: 1799.88,
  },
];

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = showInactive || product.active;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog and pricing
          </p>
        </div>
        <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{mockProducts.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">
                {mockProducts.filter((p) => p.active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center">
              <span className="text-lg font-bold text-secondary-400">$</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">
                {mockProducts.reduce((acc, p) => acc + p.sales, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
              <span className="text-lg font-bold text-accent-400">$</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  mockProducts.reduce((acc, p) => acc + p.revenue, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-dark-card border border-dark-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* Show Inactive Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 rounded border-dark-border bg-dark-card text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-muted-foreground">
              Show inactive
            </span>
          </label>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="glass-card card-hover overflow-hidden group"
          >
            {/* Product Image */}
            <div className="aspect-video bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
              <Package className="w-16 h-16 text-primary-400/50" />
            </div>

            {/* Product Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate group-hover:text-primary-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {product.description}
                  </p>
                </div>
                <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between py-3 border-t border-dark-border">
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.currency}
                  </p>
                </div>
                {product.active ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                    Inactive
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-muted-foreground">Sales</p>
                  <p className="font-semibold">{product.sales}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Revenue</p>
                  <p className="font-semibold">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <button className="flex-1 px-4 py-2 bg-primary-600/10 hover:bg-primary-600/20 text-primary-400 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex-1 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="glass-card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
            <Package className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Get started by adding your first product'}
          </p>
          {!searchQuery && (
            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all btn-glow">
              Add Product
            </button>
          )}
        </div>
      )}
    </div>
  );
}
