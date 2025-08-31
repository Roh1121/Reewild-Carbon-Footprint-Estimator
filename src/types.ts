export interface Ingredient {
  name: string;
  carbon_kg: number;
  quantity?: string;
  category?: string;
}

export interface CarbonEstimate {
  dish: string;
  estimated_carbon_kg: number;
  ingredients: Ingredient[];
  confidence?: number;
  methodology?: string;
}

export interface EstimateRequest {
  dish: string;
}

export interface LLMResponse {
  ingredients: Array<{
    name: string;
    estimated_quantity: string;
    category: string;
  }>;
  confidence: number;
}

export interface VisionResponse {
  dish_name: string;
  ingredients: Array<{
    name: string;
    estimated_quantity: string;
    category: string;
  }>;
  confidence: number;
}

export interface CarbonData {
  [key: string]: {
    carbon_per_kg: number;
    category: string;
    source?: string;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    llm: boolean;
    vision: boolean;
  };
}