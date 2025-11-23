import React from 'react';

export enum Category {
  ELECTRONICS = 'Electronics',
  FURNITURE = 'Furniture',
  CLOTHING = 'Clothing',
  OFFICE = 'Office Supplies',
  OTHER = 'Other'
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: Category;
  price: number;
  quantity: number;
  description: string;
  lastUpdated: string;
  history?: number[];
}

export interface DashboardStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  AI_INSIGHTS = 'AI_INSIGHTS'
}