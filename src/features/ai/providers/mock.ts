import type { AIProvider, ParsedMenuResult, MarketingCopyResult } from '../types';

export class MockAIProvider implements AIProvider {
  async extractMenuFromImage(_imageBase64: string): Promise<ParsedMenuResult> {
    // Simulación inteligente para pruebas sin consumir cuota
    return {
      categories: [
        {
          name: 'Hamburguesas Especiales',
          products: [
            {
              name: 'Burger Doble Cheddar Bacon',
              description: 'Doble medallón smash de 120g, triple queso cheddar, panceta crocante y salsa mil islas.',
              price: 8900,
              categoryName: 'Hamburguesas Especiales',
            },
            {
              name: 'Smash Criolla',
              description: 'Medallón artesanal con provoleta derretida, chimichurri fresco y cebolla caramelizada.',
              price: 8400,
              categoryName: 'Hamburguesas Especiales',
            },
          ],
        },
        {
          name: 'Papas & Acompañamientos',
          products: [
            {
              name: 'Papas Rústicas con Cheddar y Verdeo',
              description: 'Porción generosa de papas con piel, salsa cheddar fundida y verdeo picado.',
              price: 5200,
              categoryName: 'Papas & Acompañamientos',
            },
          ],
        },
        {
          name: 'Bebidas',
          products: [
            {
              name: 'Cerveza Artesanal IPA 500ml',
              description: 'Lupulada, aromática y bien fría.',
              price: 4500,
              categoryName: 'Bebidas',
            },
          ],
        },
      ],
    };
  }

  async generateProductDescription(
    productName: string,
    categoryName?: string,
    ingredients?: string
  ): Promise<string[]> {
    return [
      `Irresistible ${productName.toLowerCase()}, preparado al momento con ${ingredients || 'los mejores ingredientes'} para una explosión de sabor en cada bocado.`,
      `El favorito de la casa: ${productName} con textura crujiente y jugosa, acompañado por nuestra receta secreta.`,
      `Una combinación perfecta para los fanáticos de ${categoryName || 'la buena comida'}: ${productName} elaborado con dedicación artesanal.`,
    ];
  }

  async generateMarketingCopy(
    businessName: string,
    specialty: string,
    tone: 'fun' | 'serious' | 'promotional'
  ): Promise<MarketingCopyResult> {
    if (tone === 'fun') {
      return {
        headline: `¿Hambre? ¡Saltate la fila en ${businessName}! 🍔`,
        body: 'Escaneá el código QR con la cámara de tu celular, armá tu comanda como más te guste y te avisamos por WhatsApp apenas esté lista.',
        callToAction: '¡Escaneá, pedí y disfrutá!',
      };
    }

    if (tone === 'promotional') {
      return {
        headline: `Pedí directo desde tu mesa o en la fila ⚡`,
        body: `Disfrutá del auténtico sabor de ${specialty}. Pagá con Mercado Pago o en efectivo y seguí la preparación de tu pedido en tiempo real.`,
        callToAction: 'Escaneá el código QR ahora',
      };
    }

    return {
      headline: `${businessName} — Pedidos Digitales`,
      body: 'Consultá nuestra carta completa actualizada, seleccioná tus productos y retirá cómodamente por el mostrador.',
      callToAction: 'Escanear para ordenar',
    };
  }
}
