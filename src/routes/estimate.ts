import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { LLMService } from '../services/llmService';
import { VisionService } from '../services/visionService';
import { CarbonService } from '../services/carbonService';
import { CarbonEstimate, HealthCheck } from '../types';
import { asyncHandler, AppError, validateRequest } from '../middleware/errorHandler';

const router = Router();

// Initialize services
const llmService = new LLMService();
const visionService = new VisionService();
const carbonService = new CarbonService();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP are allowed.', 400));
    }
  },
});

// Validation schemas
const estimateRequestSchema = z.object({
  dish: z.string().min(1, 'Dish name is required').max(200, 'Dish name too long'),
});

/**
 * POST /estimate
 * Estimate carbon footprint from dish name
 */
router.post('/estimate', 
  validateRequest(estimateRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { dish } = req.body;

    // Sanitize input
    const sanitizedDish = dish.trim();
    if (!sanitizedDish) {
      throw new AppError('Dish name cannot be empty', 400);
    }

    // Analyze dish with LLM
    const llmResponse = await llmService.analyzeDish(sanitizedDish);
    
    // Calculate carbon footprint
    const ingredients = carbonService.calculateCarbonFootprint(llmResponse.ingredients);
    const totalCarbon = carbonService.getTotalCarbonFootprint(ingredients);

    // Create response
    const response: CarbonEstimate = {
      dish: sanitizedDish,
      estimated_carbon_kg: totalCarbon,
      ingredients,
      confidence: llmResponse.confidence,
      methodology: 'LLM ingredient inference + carbon database lookup'
    };

    res.json(response);
  })
);

/**
 * POST /estimate/image
 * Estimate carbon footprint from image
 */
router.post('/estimate/image',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('Image file is required', 400);
    }

    // Validate image file
    const validation = visionService.validateImageFile(req.file);
    if (!validation.isValid) {
      throw new AppError(validation.error || 'Invalid image file', 400);
    }

    // Analyze image with vision model
    const visionResponse = await visionService.analyzeImage(req.file.buffer, req.file.mimetype);
    
    // Calculate carbon footprint
    const ingredients = carbonService.calculateCarbonFootprint(visionResponse.ingredients);
    const totalCarbon = carbonService.getTotalCarbonFootprint(ingredients);

    // Create response
    const response: CarbonEstimate = {
      dish: visionResponse.dish_name,
      estimated_carbon_kg: totalCarbon,
      ingredients,
      confidence: visionResponse.confidence,
      methodology: 'Computer vision analysis + carbon database lookup'
    };

    res.json(response);
  })
);

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const [llmHealthy, visionHealthy] = await Promise.allSettled([
    llmService.testConnection(),
    visionService.testConnection()
  ]);

  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      llm: llmHealthy.status === 'fulfilled' && llmHealthy.value,
      vision: visionHealthy.status === 'fulfilled' && visionHealthy.value
    }
  };

  // Set status to unhealthy if any critical service is down
  if (!healthCheck.services.llm || !healthCheck.services.vision) {
    healthCheck.status = 'unhealthy';
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
}));

/**
 * GET /carbon-data/stats
 * Get carbon data statistics (for debugging)
 */
router.get('/carbon-data/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = carbonService.getCarbonDataStats();
  res.json(stats);
}));

/**
 * POST /estimate/batch
 * Batch estimate multiple dishes (bonus feature)
 */
router.post('/estimate/batch',
  asyncHandler(async (req: Request, res: Response) => {
    const { dishes } = req.body;

    if (!Array.isArray(dishes) || dishes.length === 0) {
      throw new AppError('Dishes array is required and cannot be empty', 400);
    }

    if (dishes.length > 10) {
      throw new AppError('Maximum 10 dishes allowed per batch request', 400);
    }

    // Validate each dish
    for (const dish of dishes) {
      if (!dish || typeof dish !== 'string' || dish.trim().length === 0) {
        throw new AppError('Each dish must be a non-empty string', 400);
      }
    }

    // Process all dishes in parallel
    const results = await Promise.allSettled(
      dishes.map(async (dish: string) => {
        const sanitizedDish = dish.trim();
        const llmResponse = await llmService.analyzeDish(sanitizedDish);
        const ingredients = carbonService.calculateCarbonFootprint(llmResponse.ingredients);
        const totalCarbon = carbonService.getTotalCarbonFootprint(ingredients);

        return {
          dish: sanitizedDish,
          estimated_carbon_kg: totalCarbon,
          ingredients,
          confidence: llmResponse.confidence,
          methodology: 'LLM ingredient inference + carbon database lookup'
        };
      })
    );

    // Format results
    const estimates = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          dish: dishes[index],
          error: 'Failed to process dish',
          estimated_carbon_kg: 0,
          ingredients: [],
          confidence: 0
        };
      }
    });

    res.json({ estimates });
  })
);

export default router;