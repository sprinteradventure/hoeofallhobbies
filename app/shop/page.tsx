'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Subcategory {
  id: number;
  name: string;
  slug: string;
  category_id: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category_id?: number;
  seller_id: string;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category');

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    selectedCategory
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedCategory) {
        setSubcategories([]);
        return;
      }

      try {
        const response = await fetch(`/api/categories/${selectedCategory}`);
        const data = await response.json();
        setSubcategories(data.subcategories || []);
      } catch (error) {
        console.error('Failed to fetch subcategories:', error);
      }
    };

    fetchSubcategories();
  }, [selectedCategory]);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-ivory to-blush py-12 px-4 sm:px-6 lg:px-8 border-b border-ivory">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-cormorant text-5xl font-bold text-charcoal mb-2">
            Shop Our Collections
          </h1>
          <p className="text-taupe">
            {selectedCategory
              ? `Browse ${categories.find(c => c.slug === selectedCategory)?.name}`
              : 'Browse all craft and hobby supplies'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-ivory rounded-lg p-6 sticky top-20">
              <h3 className="font-cormorant text-2xl font-bold text-charcoal mb-4">
                Categories
              </h3>

              <div className="space-y-2">
                <Link href="/shop" className="block">
                  <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-blush transition-colors text-charcoal font-lora">
                    All Products
                  </button>
                </Link>

                {categories.map((category) => (
                  <div key={category.id}>
                    <button
                      onClick={() =>
                        setExpandedCategory(
                          expandedCategory === category.slug ? null : category.slug
                        )
                      }
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-blush transition-colors text-charcoal font-lora flex items-center justify-between"
                    >
                      {category.name}
                      {expandedCategory === category.slug && (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {expandedCategory === category.slug && (
                      <div className="pl-4 space-y-1 mt-1">
                        {subcategories.map((sub) => (
                          <Link key={sub.id} href={`/shop?category=${category.slug}`}>
                            <button className="w-full text-left px-3 py-2 text-taupe text-sm hover:text-gold hover:bg-white rounded transition-colors">
                              {sub.name}
                            </button>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Products */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-taupe">Loading products...</p>
              </div>
            ) : (
              <div>
                <p className="text-taupe mb-8">
                  Showing products for selected category. Browse and find treasures!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <Link key={product.id} href={`/product/${product.id}`}>
                        <div className="bg-white border-2 border-ivory rounded-lg overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                          <div className="aspect-square bg-ivory overflow-hidden">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-4xl">📦</span>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="font-cormorant text-lg font-bold text-charcoal mb-2 line-clamp-2">
                              {product.title}
                            </h4>
                            <p className="text-taupe text-sm mb-4 line-clamp-2">
                              {product.description}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gold text-lg">
                                ${product.price.toFixed(2)}
                              </span>
                              <button className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-semibold">
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-taupe text-lg">
                        No products found in this category yet. Check back soon!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
