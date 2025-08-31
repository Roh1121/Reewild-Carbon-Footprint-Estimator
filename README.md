# Carbon Foodprint Estimator Backend

A TypeScript/Node.js backend API that estimates the carbon footprint of dishes using AI-powered ingredient analysis. This system supports both text-based dish name input and image-based food recognition.

## 🚀 Features

- **Text Analysis**: Input dish names and get ingredient breakdowns using LLM
- **Image Analysis**: Upload food images for computer vision-based ingredient detection
- **Carbon Calculation**: Comprehensive carbon footprint estimation with ingredient-level breakdown
- **Batch Processing**: Process multiple dishes in a single request
- **Type Safety**: Full TypeScript implementation with strict typing
- **Error Handling**: Robust error handling with detailed error responses
- **Health Monitoring**: Built-in health checks and service monitoring
- **Docker Support**: Containerized deployment ready

## 📋 API Endpoints

### POST /api/estimate
Estimate carbon footprint from dish name.

**Request:**
```json
{
  "dish": "Chicken Biryani"
}
```

**Response:**
```json
{
  "dish": "Chicken Biryani",
  "estimated_carbon_kg": 4.2,
  "ingredients": [
    { "name": "Rice", "carbon_kg": 1.1, "quantity": "200g", "category": "grains" },
    { "name": "Chicken", "carbon_kg": 2.5, "quantity": "150g", "category": "meat" },
    { "name": "Spices", "carbon_kg": 0.2, "quantity": "10g", "category": "seasonings" },
    { "name": "Oil", "carbon_kg": 0.4, "quantity": "15g", "category": "oils" }
  ],
  "confidence": 0.85,
  "methodology": "LLM ingredient inference + carbon database lookup"
}
```

### POST /api/estimate/image
Estimate carbon footprint from uploaded image.

**Request:** Multipart form data with `image` field
**Supported formats:** JPEG, PNG, WebP (max 10MB)

**Response:** Same format as text estimation

### POST /api/estimate/batch
Process multiple dishes in one request (max 10 dishes).

**Request:**
```json
{
  "dishes": ["Pizza Margherita", "Caesar Salad", "Beef Burger"]
}
```

### GET /api/health
Health check endpoint for monitoring service status.

### GET /api/carbon-data/stats
Get statistics about the carbon footprint database.

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Local Development

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd carbon-foodprint-estimator
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

3. **Run in development mode:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
npm start
```

### Docker Deployment

1. **Build Docker image:**
```bash
docker build -t carbon-foodprint-api .
```

2. **Run container:**
```bash
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key_here carbon-foodprint-api
```

3. **Using Docker Compose:**
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=your_key_here
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🧪 Testing

### Manual Testing

**Test text estimation:**
```bash
curl -X POST http://localhost:3000/api/estimate \
  -H "Content-Type: application/json" \
  -d '{"dish": "Margherita Pizza"}'
```

**Test image estimation:**
```bash
curl -X POST http://localhost:3000/api/estimate/image \
  -F "/images/foodimage.jpg"
```

**Test health endpoint:**
```bash
curl http://localhost:3000/api/health
```

### Edge Cases & Funky Inputs 🥾👀

The system is designed to handle various edge cases:

- **Empty/invalid inputs**: Proper validation and error messages
- **Unusual dish names**: "Unicorn tears with dragon scales" → Fallback responses
- **Non-food images**: Low confidence scores and generic estimates  
- **Corrupted files**: File validation and error handling
- **Large files**: Size limits and proper error responses
- **Rate limiting**: Built-in protection against abuse
- **Service failures**: Graceful degradation with fallback responses

## 🏗️ Architecture & Design Decisions

### Service Architecture
- **Modular Design**: Separate services for LLM, Vision, and Carbon calculations
- **Type Safety**: Comprehensive TypeScript interfaces and validation
- **Error Handling**: Centralized error handling with detailed logging
- **Separation of Concerns**: Clear boundaries between API, business logic, and data

### Key Design Choices

1. **OpenAI Integration**: Using GPT-4o-mini for text and GPT-4o for vision
   - Cost-effective for text analysis
   - High accuracy for image recognition
   - Structured JSON responses for reliability

2. **Carbon Database**: Mock data with comprehensive ingredient coverage
   - 60+ common ingredients with real carbon footprint values
   - Category-based fallbacks for unknown ingredients
   - Quantity parsing for accurate calculations

3. **Validation Strategy**: Multi-layer validation
   - Zod schemas for request validation
   - File type/size validation for uploads
   - Response structure validation for AI services

4. **Error Resilience**: Multiple fallback mechanisms
   - Fallback responses when AI services fail
   - Generic carbon estimates for unknown ingredients
   - Graceful degradation without service interruption

## 🚀 Production Considerations

### What I'd Change for Production

#### Infrastructure & Scalability
- **Database Integration**: Replace mock data with PostgreSQL/MongoDB
  - Comprehensive ingredient database with regional variations
  - User analytics and usage tracking
  - Caching layer (Redis) for frequent requests

- **Microservices Architecture**: Split into focused services
  - Separate LLM service with connection pooling
  - Dedicated image processing service
  - Carbon calculation service with database optimization

- **Load Balancing**: Horizontal scaling capabilities
  - Multiple API instances behind load balancer
  - Auto-scaling based on demand
  - Circuit breakers for external service failures

#### Security & Compliance
- **Authentication & Authorization**: 
  - JWT-based API authentication
  - Rate limiting per user/API key
  - Role-based access control

- **Data Privacy**: 
  - Image processing without storage
  - GDPR compliance for EU users
  - Audit logging for sensitive operations

- **Security Hardening**:
  - Input sanitization and validation
  - SQL injection prevention
  - HTTPS enforcement
  - Security headers and CSP

#### Monitoring & Observability
- **Comprehensive Logging**: Structured logging with correlation IDs
- **Metrics & Monitoring**: Prometheus/Grafana dashboards
- **Alerting**: Critical error notifications
- **Performance Monitoring**: APM tools (New Relic, DataDog)
- **Health Checks**: Deep health checks for all dependencies

#### Performance Optimization
- **Caching Strategy**: 
  - Response caching for common dishes
  - CDN for static assets
  - Database query optimization

- **Image Processing**: 
  - Image compression and optimization
  - Async processing for large files
  - Multiple image format support

- **API Optimization**:
  - Response compression (gzip)
  - Connection pooling
  - Request/response size limits

#### Data & Analytics
- **Enhanced Carbon Database**:
  - Regional carbon footprint variations
  - Seasonal ingredient adjustments
  - Supply chain impact factors
  - Nutritional data integration

- **Machine Learning Improvements**:
  - Custom trained models for food recognition
  - Ingredient quantity estimation improvements
  - User feedback integration for model training

- **Analytics Dashboard**:
  - Usage patterns and popular dishes
  - Carbon footprint trends
  - API performance metrics

#### DevOps & Deployment
- **CI/CD Pipeline**: Automated testing and deployment
- **Infrastructure as Code**: Terraform/CloudFormation
- **Multi-environment Setup**: Dev/Staging/Production
- **Backup & Disaster Recovery**: Automated backups and recovery procedures
- **Blue-Green Deployments**: Zero-downtime deployments

### Estimated Production Timeline
- **Phase 1** (2-3 weeks): Security, authentication, basic monitoring
- **Phase 2** (3-4 weeks): Database integration, caching, performance optimization  
- **Phase 3** (4-6 weeks): Microservices architecture, advanced monitoring
- **Phase 4** (2-3 weeks): ML improvements and analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the AI models
- The sustainability community for carbon footprint data
- Reewild team for the inspiring project vision

---

**Built with ❤️ for a more sustainable future** 🌱