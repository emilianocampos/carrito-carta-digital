export interface ParsedProduct {
  name: string;
  description: string;
  price: number;
  categoryName: string;
}

export interface ParsedCategory {
  name: string;
  products: ParsedProduct[];
}

export interface ParsedMenuResult {
  categories: ParsedCategory[];
}

export interface MarketingCopyResult {
  headline: string;
  body: string;
  callToAction: string;
}

export interface AIProvider {
  extractMenuFromImage(imageBase64: string): Promise<ParsedMenuResult>;
  generateProductDescription(
    productName: string,
    categoryName?: string,
    ingredients?: string
  ): Promise<string[]>;
  generateMarketingCopy(
    businessName: string,
    specialty: string,
    tone: 'fun' | 'serious' | 'promotional'
  ): Promise<MarketingCopyResult>;
}
