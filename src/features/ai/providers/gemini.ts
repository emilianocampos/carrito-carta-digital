import type { AIProvider, ParsedMenuResult, MarketingCopyResult } from '../types';

export class GeminiAIProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async callGemini(contents: unknown[]): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  }

  async extractMenuFromImage(imageBase64: string): Promise<ParsedMenuResult> {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const prompt = `Analiza esta imagen de una carta, pizarra o menú gastronómico de un food truck / carrito de comida.
Extrae todas las categorías y productos con sus precios. Devuelve un JSON estructurado con el siguiente formato exacto:
{
  "categories": [
    {
      "name": "Hamburguesas",
      "products": [
        {
          "name": "Doble Cuarto",
          "description": "Doble medallón con queso cheddar",
          "price": 8500,
          "categoryName": "Hamburguesas"
        }
      ]
    }
  ]
}`;

    const contents = [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: cleanBase64,
            },
          },
        ],
      },
    ];

    const rawJson = await this.callGemini(contents);
    try {
      const parsed = JSON.parse(rawJson);
      return { categories: parsed.categories || [] };
    } catch {
      throw new Error('No se pudo estructurar el menú desde la imagen');
    }
  }

  async generateProductDescription(
    productName: string,
    categoryName?: string,
    ingredients?: string
  ): Promise<string[]> {
    const prompt = `Eres un redactor publicitario gastronómico senior especializado en cartas digitales de food trucks.
Escribe 3 opciones de descripciones apetitosas, persuasivas y de 1 a 2 oraciones para el producto:
Producto: "${productName}"
Categoría: "${categoryName || 'General'}"
Ingredientes / Notas: "${ingredients || 'Elaboración artesanal'}"

Devuelve un JSON con el formato:
{
  "descriptions": [
    "Opción 1 apetitosa...",
    "Opción 2 con énfasis en sabor...",
    "Opción 3 irresistible..."
  ]
}`;

    const contents = [{ parts: [{ text: prompt }] }];
    const rawJson = await this.callGemini(contents);
    try {
      const parsed = JSON.parse(rawJson);
      return parsed.descriptions || [];
    } catch {
      return [
        `${productName} preparado con ingredientes frescos y el toque artesanal característico de nuestro carrito.`,
      ];
    }
  }

  async generateMarketingCopy(
    businessName: string,
    specialty: string,
    tone: 'fun' | 'serious' | 'promotional'
  ): Promise<MarketingCopyResult> {
    const prompt = `Genera un copy publicitario para colocar en el cartel con el código QR del mostrador de un carrito gastronómico.
Negocio: "${businessName}"
Especialidad: "${specialty}"
Tono: "${tone}"

El objetivo es que el cliente escanee el QR con su celular y pida sin hacer fila.
Devuelve un JSON con el formato:
{
  "headline": "Título llamativo",
  "body": "Texto breve y persuasivo",
  "callToAction": "Llamado a la acción"
}`;

    const contents = [{ parts: [{ text: prompt }] }];
    const rawJson = await this.callGemini(contents);
    try {
      const parsed = JSON.parse(rawJson);
      return {
        headline: parsed.headline || '¡Pedí desde tu celular!',
        body: parsed.body || 'Escaneá el código QR, elegí tus productos favoritos y te avisamos cuando esté listo.',
        callToAction: parsed.callToAction || 'Escaneá y retirá sin fila',
      };
    } catch {
      return {
        headline: '¡Pedí más rápido desde tu celular!',
        body: 'Escaneá el código QR, armá tu pedido a tu gusto y recibí un aviso cuando esté listo en el mostrador.',
        callToAction: 'Escaneá el código QR ahora',
      };
    }
  }
}
