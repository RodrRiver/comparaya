export interface MockProduct {
  id: number;
  name: string;
  brand: string;
  model: string;
  slug: string;
  imageUrl: string;
  category: string;
  lowestPrice: number;
  highestPrice: number;
  lowestPriceEver: number;
  storeCount: number;
  discount: number | null;
  stores: {
    name: string;
    slug: string;
    price: number;
    originalPrice: number | null;
    url: string;
    isAvailable: boolean;
  }[];
  priceHistory: { date: string; price: number; store: string }[];
}

export const mockProducts: MockProduct[] = [
  {
    id: 1,
    name: "Samsung Galaxy S24 Ultra 256GB",
    brand: "Samsung",
    model: "Galaxy S24 Ultra",
    slug: "samsung-galaxy-s24-ultra-256gb",
    imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=Galaxy+S24",
    category: "celulares",
    lowestPrice: 1099.0,
    highestPrice: 1349.0,
    lowestPriceEver: 999.0,
    storeCount: 5,
    discount: 15,
    stores: [
      { name: "Siman", slug: "siman", price: 1099.0, originalPrice: 1299.0, url: "#", isAvailable: true },
      { name: "RadioShack", slug: "radioshack", price: 1149.0, originalPrice: 1299.0, url: "#", isAvailable: true },
      { name: "Omnisport", slug: "omnisport", price: 1199.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "La Curacao", slug: "la-curacao", price: 1249.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Office Depot", slug: "office-depot", price: 1349.0, originalPrice: null, url: "#", isAvailable: false },
    ],
    priceHistory: [
      { date: "2026-06-01", price: 1299, store: "Siman" },
      { date: "2026-06-15", price: 1249, store: "Siman" },
      { date: "2026-07-01", price: 1199, store: "Siman" },
      { date: "2026-07-15", price: 1149, store: "Siman" },
      { date: "2026-08-01", price: 1099, store: "Siman" },
      { date: "2026-06-01", price: 1299, store: "RadioShack" },
      { date: "2026-06-15", price: 1299, store: "RadioShack" },
      { date: "2026-07-01", price: 1249, store: "RadioShack" },
      { date: "2026-07-15", price: 1199, store: "RadioShack" },
      { date: "2026-08-01", price: 1149, store: "RadioShack" },
    ],
  },
  {
    id: 2,
    name: 'MacBook Air M3 13" 256GB',
    brand: "Apple",
    model: "MacBook Air M3",
    slug: "macbook-air-m3-13-256gb",
    imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=MacBook+Air",
    category: "laptops",
    lowestPrice: 999.0,
    highestPrice: 1149.0,
    lowestPriceEver: 949.0,
    storeCount: 4,
    discount: 10,
    stores: [
      { name: "Intelmax", slug: "intelmax", price: 999.0, originalPrice: 1099.0, url: "#", isAvailable: true },
      { name: "Aeon Computers", slug: "aeon", price: 1029.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Siman", slug: "siman", price: 1099.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Office Depot", slug: "office-depot", price: 1149.0, originalPrice: null, url: "#", isAvailable: true },
    ],
    priceHistory: [
      { date: "2026-06-01", price: 1099, store: "Intelmax" },
      { date: "2026-06-15", price: 1049, store: "Intelmax" },
      { date: "2026-07-01", price: 999, store: "Intelmax" },
      { date: "2026-07-15", price: 999, store: "Intelmax" },
      { date: "2026-08-01", price: 999, store: "Intelmax" },
    ],
  },
  {
    id: 3,
    name: 'Samsung Smart TV 55" Crystal UHD 4K',
    brand: "Samsung",
    model: "CU7000",
    slug: "samsung-smart-tv-55-crystal-uhd-4k",
    imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=TV+55",
    category: "televisores",
    lowestPrice: 449.0,
    highestPrice: 599.0,
    lowestPriceEver: 399.0,
    storeCount: 6,
    discount: 25,
    stores: [
      { name: "Omnisport", slug: "omnisport", price: 449.0, originalPrice: 599.0, url: "#", isAvailable: true },
      { name: "La Curacao", slug: "la-curacao", price: 479.0, originalPrice: 599.0, url: "#", isAvailable: true },
      { name: "Siman", slug: "siman", price: 499.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "RadioShack", slug: "radioshack", price: 529.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Office Depot", slug: "office-depot", price: 549.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Intelmax", slug: "intelmax", price: 599.0, originalPrice: null, url: "#", isAvailable: false },
    ],
    priceHistory: [
      { date: "2026-06-01", price: 599, store: "Omnisport" },
      { date: "2026-06-15", price: 549, store: "Omnisport" },
      { date: "2026-07-01", price: 499, store: "Omnisport" },
      { date: "2026-07-15", price: 449, store: "Omnisport" },
      { date: "2026-08-01", price: 449, store: "Omnisport" },
    ],
  },
  {
    id: 4,
    name: "AirPods Pro 2da Generación USB-C",
    brand: "Apple",
    model: "AirPods Pro 2",
    slug: "airpods-pro-2da-generacion-usb-c",
    imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=AirPods+Pro",
    category: "audio",
    lowestPrice: 199.0,
    highestPrice: 269.0,
    lowestPriceEver: 179.0,
    storeCount: 5,
    discount: 20,
    stores: [
      { name: "RadioShack", slug: "radioshack", price: 199.0, originalPrice: 249.0, url: "#", isAvailable: true },
      { name: "Siman", slug: "siman", price: 219.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Omnisport", slug: "omnisport", price: 229.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Intelmax", slug: "intelmax", price: 249.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "La Curacao", slug: "la-curacao", price: 269.0, originalPrice: null, url: "#", isAvailable: true },
    ],
    priceHistory: [
      { date: "2026-06-01", price: 249, store: "RadioShack" },
      { date: "2026-06-15", price: 229, store: "RadioShack" },
      { date: "2026-07-01", price: 219, store: "RadioShack" },
      { date: "2026-07-15", price: 199, store: "RadioShack" },
      { date: "2026-08-01", price: 199, store: "RadioShack" },
    ],
  },
  {
    id: 5,
    name: "iPad 10ma Generación 64GB WiFi",
    brand: "Apple",
    model: "iPad 10th Gen",
    slug: "ipad-10ma-generacion-64gb-wifi",
    imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=iPad+10",
    category: "tablets",
    lowestPrice: 329.0,
    highestPrice: 399.0,
    lowestPriceEver: 299.0,
    storeCount: 4,
    discount: null,
    stores: [
      { name: "Siman", slug: "siman", price: 329.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "RadioShack", slug: "radioshack", price: 349.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Office Depot", slug: "office-depot", price: 369.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Omnisport", slug: "omnisport", price: 399.0, originalPrice: null, url: "#", isAvailable: true },
    ],
    priceHistory: [
      { date: "2026-06-01", price: 349, store: "Siman" },
      { date: "2026-06-15", price: 349, store: "Siman" },
      { date: "2026-07-01", price: 339, store: "Siman" },
      { date: "2026-07-15", price: 329, store: "Siman" },
      { date: "2026-08-01", price: 329, store: "Siman" },
    ],
  },
  {
    id: 6,
    name: "PlayStation 5 Slim Digital Edition",
    brand: "Sony",
    model: "PS5 Slim Digital",
    slug: "playstation-5-slim-digital-edition",
    imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=PS5+Slim",
    category: "gaming",
    lowestPrice: 399.0,
    highestPrice: 499.0,
    lowestPriceEver: 379.0,
    storeCount: 4,
    discount: 12,
    stores: [
      { name: "Omnisport", slug: "omnisport", price: 399.0, originalPrice: 449.0, url: "#", isAvailable: true },
      { name: "RadioShack", slug: "radioshack", price: 429.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Siman", slug: "siman", price: 449.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "La Curacao", slug: "la-curacao", price: 499.0, originalPrice: null, url: "#", isAvailable: true },
    ],
    priceHistory: [
      { date: "2026-06-01", price: 449, store: "Omnisport" },
      { date: "2026-06-15", price: 449, store: "Omnisport" },
      { date: "2026-07-01", price: 429, store: "Omnisport" },
      { date: "2026-07-15", price: 399, store: "Omnisport" },
      { date: "2026-08-01", price: 399, store: "Omnisport" },
    ],
  },
  {
    id: 7,
    name: "Logitech MX Master 3S",
    brand: "Logitech",
    model: "MX Master 3S",
    slug: "logitech-mx-master-3s",
    imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=MX+Master",
    category: "accesorios",
    lowestPrice: 79.0,
    highestPrice: 109.0,
    lowestPriceEver: 69.0,
    storeCount: 3,
    discount: null,
    stores: [
      { name: "Aeon Computers", slug: "aeon", price: 79.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Intelmax", slug: "intelmax", price: 89.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Office Depot", slug: "office-depot", price: 109.0, originalPrice: null, url: "#", isAvailable: true },
    ],
    priceHistory: [
      { date: "2026-06-01", price: 99, store: "Aeon Computers" },
      { date: "2026-06-15", price: 89, store: "Aeon Computers" },
      { date: "2026-07-01", price: 79, store: "Aeon Computers" },
      { date: "2026-07-15", price: 79, store: "Aeon Computers" },
      { date: "2026-08-01", price: 79, store: "Aeon Computers" },
    ],
  },
  {
    id: 8,
    name: "ASUS ROG Strix G16 RTX 4060",
    brand: "ASUS",
    model: "ROG Strix G16",
    slug: "asus-rog-strix-g16-rtx-4060",
    imageUrl: "https://placehold.co/400x400/e2e8f0/475569?text=ROG+Strix",
    category: "laptops",
    lowestPrice: 1299.0,
    highestPrice: 1549.0,
    lowestPriceEver: 1199.0,
    storeCount: 3,
    discount: 10,
    stores: [
      { name: "Aeon Computers", slug: "aeon", price: 1299.0, originalPrice: 1449.0, url: "#", isAvailable: true },
      { name: "Intelmax", slug: "intelmax", price: 1399.0, originalPrice: null, url: "#", isAvailable: true },
      { name: "Siman", slug: "siman", price: 1549.0, originalPrice: null, url: "#", isAvailable: true },
    ],
    priceHistory: [
      { date: "2026-06-01", price: 1449, store: "Aeon Computers" },
      { date: "2026-06-15", price: 1399, store: "Aeon Computers" },
      { date: "2026-07-01", price: 1349, store: "Aeon Computers" },
      { date: "2026-07-15", price: 1299, store: "Aeon Computers" },
      { date: "2026-08-01", price: 1299, store: "Aeon Computers" },
    ],
  },
];

export const categories = [
  { name: "Celulares", slug: "celulares", icon: "Smartphone", count: 245 },
  { name: "Laptops", slug: "laptops", icon: "Laptop", count: 189 },
  { name: "Tablets", slug: "tablets", icon: "Tablet", count: 67 },
  { name: "Televisores", slug: "televisores", icon: "Tv", count: 156 },
  { name: "Audio", slug: "audio", icon: "Headphones", count: 312 },
  { name: "Gaming", slug: "gaming", icon: "Gamepad2", count: 98 },
  { name: "Accesorios", slug: "accesorios", icon: "Mouse", count: 423 },
  { name: "Componentes", slug: "componentes", icon: "Cpu", count: 134 },
];
