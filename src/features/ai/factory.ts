import type { AIProvider } from './types';
import { GeminiAIProvider } from './providers/gemini';
import { MockAIProvider } from './providers/mock';

/**
 * Factory que resuelve el proveedor de IA activo.
 * Si existe GEMINI_API_KEY en variables de entorno, utiliza Gemini 1.5 Flash.
 * En caso contrario, recurre al MockAIProvider para entornos de desarrollo y testing.
 */
export function getAIProvider(): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return new GeminiAIProvider(apiKey);
  }
  return new MockAIProvider();
}
