import OpenAI from 'openai';
import { VisionResponse } from '../types';

export class VisionService {
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
   * Analyze an image to identify dish and ingredients
   */
  async analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<VisionResponse> {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      const prompt = this.createImageAnalysisPrompt();
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a culinary expert specializing in food image analysis for carbon footprint estimation. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from Vision API');
      }

      // Parse the JSON response
      const parsedResponse = JSON.parse(response) as VisionResponse;
      
      // Validate the response structure
      this.validateVisionResponse(parsedResponse);
      
      return parsedResponse;
    } catch (error) {
      console.error('Vision Service Error:', error);
      
      // Return fallback response
      return this.getFallbackVisionResponse();
    }
  }

  /**
   * Create a detailed prompt for image analysis
   */
  private createImageAnalysisPrompt(): string {
    return `
Analyze this food image and identify the dish name and its visible ingredients.

Please respond with ONLY a JSON object in this exact format:
{
  "dish_name": "name of the dish",
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
- Identify the main dish name if recognizable
- List all visible ingredients you can identify
- Include estimated quantities based on visual portion sizes
- Include likely hidden ingredients (oils, seasonings) that would typically be used
- Use specific ingredient names when possible
- Confidence should reflect how clearly you can identify the dish and ingredients (0.3-0.95)
- If the image is unclear or not food, set confidence to 0.2-0.4
- Include 3-15 ingredients typically

Focus on ingredients that would significantly impact carbon footprint (proteins, dairy, grains).
`;
  }

  /**
   * Validate vision response structure
   */
  private validateVisionResponse(response: any): void {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format');
    }

    if (!response.dish_name || typeof response.dish_name !== 'string') {
      throw new Error('dish_name must be a string');
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
   * Provide fallback response when vision analysis fails
   */
  private getFallbackVisionResponse(): VisionResponse {
    return {
      dish_name: "Unknown Dish",
      ingredients: [
        { name: 'mixed ingredients', estimated_quantity: '200g', category: 'unknown' },
        { name: 'cooking oil', estimated_quantity: '10g', category: 'oils' },
        { name: 'seasonings', estimated_quantity: '5g', category: 'seasonings' }
      ],
      confidence: 0.3
    };
  }

  /**
   * Validate image file
   */
  validateImageFile(file: any): { isValid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size too large. Maximum 10MB allowed.' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return { isValid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
    }

    return { isValid: true };
  }

  /**
   * Test vision API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      // Create a simple test image (1x1 pixel white PNG)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const dataUrl = `data:image/png;base64,${testImageBase64}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "What do you see in this image? Respond with just 'test successful'"
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                  detail: "low"
                }
              }
            ]
          }
        ],
        max_tokens: 10,
      });
      
      return !!completion.choices[0]?.message?.content;
    } catch (error) {
      console.error('Vision API connection test failed:', error);
      return false;
    }
  }
}