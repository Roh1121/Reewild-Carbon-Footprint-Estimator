# Carbon Footprint Estimator Backend - MVP Implementation

## Project Structure
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `src/index.ts` - Main server entry point
- `src/types.ts` - TypeScript interfaces and types
- `src/services/llmService.ts` - LLM integration for ingredient inference
- `src/services/visionService.ts` - Vision model integration for image analysis
- `src/services/carbonService.ts` - Carbon footprint calculation logic
- `src/routes/estimate.ts` - API routes for estimation endpoints
- `src/middleware/errorHandler.ts` - Error handling middleware
- `Dockerfile` - Docker containerization
- `README.md` - Documentation and setup instructions

## Core Features
1. POST /estimate - Text-based dish analysis
2. POST /estimate/image - Image-based dish analysis
3. LLM integration for ingredient inference
4. Vision model integration for image analysis
5. Carbon footprint calculation with breakdown
6. Error handling and validation
7. TypeScript for type safety
8. Docker support

## Implementation Plan
1. Set up basic Express server with TypeScript
2. Implement core types and interfaces
3. Create LLM service for text analysis
4. Create vision service for image analysis
5. Implement carbon calculation logic
6. Set up API routes with proper validation
7. Add error handling middleware
8. Create Docker configuration
9. Write comprehensive README