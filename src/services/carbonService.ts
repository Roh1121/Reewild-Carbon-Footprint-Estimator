import { Ingredient, CarbonData } from '../types';

// Mock carbon footprint data (kg CO2 per kg of ingredient)
// In production, this would come from a comprehensive database
const CARBON_DATA: CarbonData = {
  // Proteins
  'beef': { carbon_per_kg: 60.0, category: 'meat' },
  'lamb': { carbon_per_kg: 39.2, category: 'meat' },
  'pork': { carbon_per_kg: 12.1, category: 'meat' },
  'chicken': { carbon_per_kg: 6.9, category: 'meat' },
  'turkey': { carbon_per_kg: 10.9, category: 'meat' },
  'fish': { carbon_per_kg: 6.1, category: 'seafood' },
  'salmon': { carbon_per_kg: 11.9, category: 'seafood' },
  'tuna': { carbon_per_kg: 6.1, category: 'seafood' },
  'shrimp': { carbon_per_kg: 18.2, category: 'seafood' },
  'eggs': { carbon_per_kg: 4.2, category: 'dairy' },
  'cheese': { carbon_per_kg: 13.5, category: 'dairy' },
  'milk': { carbon_per_kg: 3.2, category: 'dairy' },
  'yogurt': { carbon_per_kg: 2.2, category: 'dairy' },
  'butter': { carbon_per_kg: 23.8, category: 'dairy' },
  
  // Grains & Starches
  'rice': { carbon_per_kg: 2.7, category: 'grains' },
  'wheat': { carbon_per_kg: 1.4, category: 'grains' },
  'bread': { carbon_per_kg: 1.6, category: 'grains' },
  'pasta': { carbon_per_kg: 1.4, category: 'grains' },
  'potatoes': { carbon_per_kg: 0.5, category: 'vegetables' },
  'quinoa': { carbon_per_kg: 1.8, category: 'grains' },
  'oats': { carbon_per_kg: 1.6, category: 'grains' },
  
  // Vegetables
  'tomatoes': { carbon_per_kg: 2.1, category: 'vegetables' },
  'onions': { carbon_per_kg: 0.5, category: 'vegetables' },
  'carrots': { carbon_per_kg: 0.4, category: 'vegetables' },
  'broccoli': { carbon_per_kg: 4.0, category: 'vegetables' },
  'spinach': { carbon_per_kg: 2.0, category: 'vegetables' },
  'lettuce': { carbon_per_kg: 1.3, category: 'vegetables' },
  'bell peppers': { carbon_per_kg: 2.8, category: 'vegetables' },
  'mushrooms': { carbon_per_kg: 3.3, category: 'vegetables' },
  
  // Legumes & Nuts
  'beans': { carbon_per_kg: 2.0, category: 'legumes' },
  'lentils': { carbon_per_kg: 0.9, category: 'legumes' },
  'chickpeas': { carbon_per_kg: 1.0, category: 'legumes' },
  'almonds': { carbon_per_kg: 8.8, category: 'nuts' },
  'peanuts': { carbon_per_kg: 3.2, category: 'nuts' },
  
  // Oils & Fats
  'olive oil': { carbon_per_kg: 5.4, category: 'oils' },
  'vegetable oil': { carbon_per_kg: 3.8, category: 'oils' },
  'coconut oil': { carbon_per_kg: 6.4, category: 'oils' },
  
  // Spices & Others
  'spices': { carbon_per_kg: 2.0, category: 'seasonings' },
  'herbs': { carbon_per_kg: 1.5, category: 'seasonings' },
  'garlic': { carbon_per_kg: 0.6, category: 'seasonings' },
  'ginger': { carbon_per_kg: 0.8, category: 'seasonings' },
  'sugar': { carbon_per_kg: 1.8, category: 'sweeteners' },
  'honey': { carbon_per_kg: 1.4, category: 'sweeteners' },
  
  // Fruits
  'apples': { carbon_per_kg: 0.4, category: 'fruits' },
  'bananas': { carbon_per_kg: 0.7, category: 'fruits' },
  'oranges': { carbon_per_kg: 0.4, category: 'fruits' },
  'lemons': { carbon_per_kg: 0.5, category: 'fruits' },
  'coconut': { carbon_per_kg: 1.7, category: 'fruits' }
};

export class CarbonService {
  /**
   * Calculate carbon footprint for a list of ingredients
   */
  calculateCarbonFootprint(ingredientNames: Array<{ name: string; estimated_quantity: string; category: string }>): Ingredient[] {
    return ingredientNames.map(ingredient => {
      const normalizedName = this.normalizeIngredientName(ingredient.name);
      const carbonData = this.findCarbonData(normalizedName);
      const estimatedWeight = this.parseQuantityToKg(ingredient.estimated_quantity);
      
      return {
        name: ingredient.name,
        carbon_kg: Math.round((carbonData.carbon_per_kg * estimatedWeight) * 100) / 100,
        quantity: ingredient.estimated_quantity,
        category: carbonData.category
      };
    });
  }

  /**
   * Normalize ingredient names for lookup
   */
  private normalizeIngredientName(name: string): string {
    return name.toLowerCase()
      .replace(/s$/, '') // Remove plural 's'
      .replace(/[^a-z\s]/g, '') // Remove special characters
      .trim();
  }

  /**
   * Find carbon data for an ingredient, with fallback logic
   */
  private findCarbonData(ingredientName: string): { carbon_per_kg: number; category: string } {
    // Direct match
    if (CARBON_DATA[ingredientName]) {
      return CARBON_DATA[ingredientName];
    }

    // Partial match
    for (const [key, value] of Object.entries(CARBON_DATA)) {
      if (ingredientName.includes(key) || key.includes(ingredientName)) {
        return value;
      }
    }

    // Category-based fallbacks
    const categoryFallbacks: { [key: string]: number } = {
      'meat': 15.0,
      'seafood': 8.0,
      'dairy': 8.0,
      'vegetables': 2.0,
      'fruits': 0.6,
      'grains': 1.5,
      'legumes': 1.5,
      'nuts': 6.0,
      'oils': 4.5,
      'seasonings': 1.8
    };

    // Try to infer category from ingredient name
    const inferredCategory = this.inferCategory(ingredientName);
    if (inferredCategory && categoryFallbacks[inferredCategory]) {
      return {
        carbon_per_kg: categoryFallbacks[inferredCategory],
        category: inferredCategory
      };
    }

    // Ultimate fallback
    return {
      carbon_per_kg: 2.5, // Average food carbon footprint
      category: 'unknown'
    };
  }

  /**
   * Infer ingredient category from name
   */
  private inferCategory(ingredientName: string): string | null {
    const categoryKeywords = {
      'meat': ['meat', 'beef', 'pork', 'lamb', 'chicken', 'turkey', 'duck', 'bacon', 'ham', 'sausage'],
      'seafood': ['fish', 'salmon', 'tuna', 'cod', 'shrimp', 'crab', 'lobster', 'seafood', 'anchovy'],
      'dairy': ['milk', 'cheese', 'yogurt', 'cream', 'butter', 'dairy'],
      'vegetables': ['vegetable', 'carrot', 'broccoli', 'spinach', 'lettuce', 'tomato', 'onion', 'pepper', 'cucumber'],
      'fruits': ['fruit', 'apple', 'banana', 'orange', 'berry', 'grape', 'mango', 'pineapple'],
      'grains': ['rice', 'wheat', 'bread', 'pasta', 'cereal', 'oat', 'barley', 'quinoa'],
      'legumes': ['bean', 'lentil', 'pea', 'chickpea', 'soy'],
      'nuts': ['nut', 'almond', 'walnut', 'peanut', 'cashew', 'pecan'],
      'oils': ['oil', 'fat', 'lard'],
      'seasonings': ['spice', 'herb', 'salt', 'pepper', 'garlic', 'ginger', 'seasoning']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => ingredientName.includes(keyword))) {
        return category;
      }
    }

    return null;
  }

  /**
   * Parse quantity string to estimated weight in kg
   */
  private parseQuantityToKg(quantity: string): number {
    const normalizedQuantity = quantity.toLowerCase();
    
    // Extract numbers from the quantity string
    const numberMatch = normalizedQuantity.match(/(\d+(?:\.\d+)?)/);
    const baseAmount = numberMatch ? parseFloat(numberMatch[1]) : 0.1; // Default to 100g

    // Convert based on units
    if (normalizedQuantity.includes('kg')) {
      return baseAmount;
    } else if (normalizedQuantity.includes('g') && !normalizedQuantity.includes('kg')) {
      return baseAmount / 1000;
    } else if (normalizedQuantity.includes('lb') || normalizedQuantity.includes('pound')) {
      return baseAmount * 0.453592;
    } else if (normalizedQuantity.includes('oz') || normalizedQuantity.includes('ounce')) {
      return baseAmount * 0.0283495;
    } else if (normalizedQuantity.includes('cup')) {
      return baseAmount * 0.24; // Approximate average weight of 1 cup in kg
    } else if (normalizedQuantity.includes('tbsp') || normalizedQuantity.includes('tablespoon')) {
      return baseAmount * 0.015; // Approximate weight of 1 tbsp in kg
    } else if (normalizedQuantity.includes('tsp') || normalizedQuantity.includes('teaspoon')) {
      return baseAmount * 0.005; // Approximate weight of 1 tsp in kg
    } else if (normalizedQuantity.includes('small')) {
      return 0.05; // 50g
    } else if (normalizedQuantity.includes('medium')) {
      return 0.1; // 100g
    } else if (normalizedQuantity.includes('large')) {
      return 0.2; // 200g
    } else if (normalizedQuantity.includes('piece') || normalizedQuantity.includes('item')) {
      return 0.1; // Default to 100g per piece
    }

    // If no unit specified, assume it's a reasonable serving size
    return Math.max(0.05, Math.min(baseAmount * 0.1, 0.5)); // Between 50g and 500g
  }

  /**
   * Get total carbon footprint from ingredients
   */
  getTotalCarbonFootprint(ingredients: Ingredient[]): number {
    const total = ingredients.reduce((sum, ingredient) => sum + ingredient.carbon_kg, 0);
    return Math.round(total * 100) / 100;
  }

  /**
   * Get carbon data statistics for debugging
   */
  getCarbonDataStats(): { totalIngredients: number; categories: string[] } {
    const categories = [...new Set(Object.values(CARBON_DATA).map(data => data.category))];
    return {
      totalIngredients: Object.keys(CARBON_DATA).length,
      categories
    };
  }
}