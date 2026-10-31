export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  summary?: string | null;
  description: string;
  price: number;
  original_price: number | null;
  category_id: string;
  images: string[];
  specifications: string;
  availability: "available" | "out_of_stock";
  is_new: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  key: string;
  value: string;
}

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Partial<Category> & { name: string; slug: string };
        Update: Partial<Category>;
      };
      products: {
        Row: Product;
        Insert: Partial<Product> & {
          name: string;
          slug: string;
          price: number;
        };
        Update: Partial<Product>;
      };
      site_settings: {
        Row: SiteSetting;
        Insert: SiteSetting;
        Update: Partial<SiteSetting>;
      };
    };
  };
};
