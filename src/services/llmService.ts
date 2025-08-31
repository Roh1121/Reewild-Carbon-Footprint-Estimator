import OpenAI from 'openai';
import { LLMResponse } from '../types';

export class LLMService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Analyze a dish name and extract likely ingredients
   */
  async analyzeDish(dishName: string): Promise<LLMResponse> {
    try {
      const prompt = this.createIngredientAnalysisPrompt(dishName);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a culinary expert specializing in ingredient analysis for carbon footprint estimation. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from LLM');
      }

      // Parse the JSON response
      const parsedResponse = JSON.parse(response) as LLMResponse;
      
      // Validate the response structure
      this.validateLLMResponse(parsedResponse);
      
      return parsedResponse;
    } catch (error) {
      console.error('LLM Service Error:', error);
      
      // Fallback response for common dishes
      return this.getFallbackResponse(dishName);
    }
  }

  /**
   * Create a detailed prompt for ingredient analysis
   */
  private createIngredientAnalysisPrompt(dishName: string): string {
    return `
Analyze the dish "${dishName}" and provide a detailed breakdown of its likely ingredients.

Please respond with ONLY a JSON object in this exact format:
{
  "ingredients": [
    {
      "name": "ingredient name",
      "estimated_quantity": "quantity with unit (e.g., '200g', '1 cup', '2 pieces')",
      "category": "category (meat, seafood, dairy, vegetables, fruits, grains, legumes, nuts, oils, seasonings)"
    }
  ],
  "confidence": 0.85
}

Guidelines:
- Include all major ingredients (proteins, carbs, vegetables, fats, seasonings)
- Estimate realistic serving quantities for one portion
- Use specific ingredient names when possible (e.g., "chicken breast" not just "chicken")
- Include cooking oils, spices, and seasonings
- Confidence should be 0.7-0.95 based on how well-known the dish is
- For fusion or unclear dishes, make reasonable assumptions
- Include 5-12 ingredients typically

Dish to analyze: "${dishName}"
`;
  }

  /**
   * Validate LLM response structure
   */
  private validateLLMResponse(response: any): void {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format');
    }

    if (!Array.isArray(response.ingredients)) {
      throw new Error('Ingredients must be an array');
    }

    if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 1) {
      throw new Error('Confidence must be a number between 0 and 1');
    }

    for (const ingredient of response.ingredients) {
      if (!ingredient.name || !ingredient.estimated_quantity || !ingredient.category) {
        throw new Error('Each ingredient must have name, estimated_quantity, and category');
      }
    }
  }

  /**
   * Provide fallback response for common dishes when LLM fails
   */
  private getFallbackResponse(dishName: string): LLMResponse {
    const normalizedDish = dishName.toLowerCase();
    
    // Common dish patterns
    const fallbackResponses: { [key: string]: LLMResponse } = {
      'pizza': {
        ingredients: [
          { name: 'wheat flour', estimated_quantity: '150g', category: 'grains' },
          { name: 'mozzarella cheese', estimated_quantity: '100g', category: 'dairy' },
          { name: 'tomato sauce', estimated_quantity: '80g', category: 'vegetables' },
          { name: 'olive oil', estimated_quantity: '15g', category: 'oils' },
          { name: 'herbs', estimated_quantity: '5g', category: 'seasonings' }
        ],
        confidence: 0.75
      },
      'burger': {
        ingredients: [
          { name: 'beef', estimated_quantity: '150g', category: 'meat' },
          { name: 'bread', estimated_quantity: '80g', category: 'grains' },
          { name: 'cheese', estimated_quantity: '30g', category: 'dairy' },
          { name: 'lettuce', estimated_quantity: '20g', category: 'vegetables' },
          { name: 'tomatoes', estimated_quantity: '30g', category: 'vegetables' },
          { name: 'onions', estimated_quantity: '15g', category: 'vegetables' }
        ],
        confidence: 0.8
      },
      'pasta': {
        ingredients: [
          { name: 'pasta', estimated_quantity: '100g', category: 'grains' },
          { name: 'tomato sauce', estimated_quantity: '120g', category: 'vegetables' },
          { name: 'olive oil', estimated_quantity: '15g', category: 'oils' },
          { name: 'garlic', estimated_quantity: '5g', category: 'seasonings' },
          { name: 'herbs', estimated_quantity: '3g', category: 'seasonings' }
        ],
        confidence: 0.7
      }
    };

    // Check for pattern matches
    for (const [pattern, response] of Object.entries(fallbackResponses)) {
      if (normalizedDish.includes(pattern)) {
        return response;
      }
    }

    // Ultimate fallback - generic meal
    return {
      ingredients: [
        { name: 'mixed ingredients', estimated_quantity: '200g', category: 'unknown' },
        { name: 'cooking oil', estimated_quantity: '10g', category: 'oils' },
        { name: 'seasonings', estimated_quantity: '5g', category: 'seasonings' }
      ],
      confidence: 0.5
    };
  }

  /**
   * Test LLM connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
      });
      
      return !!completion.choices[0]?.message?.content;
    } catch (error) {
      console.error('LLM connection test failed:', error);
      return false;
    }
  }
}