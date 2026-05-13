#!/bin/bash

# Tracker Compliance Platform - Deployment Script
# This script automates the deployment process for production

set -e

echo "🚀 Starting Tracker Platform Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "docker/.env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp docker/.env.example docker/.env
        print_warning "Please edit docker/.env with your configuration before proceeding."
        exit 1
    fi
    
    # Check for critical build files
    if [ ! -f "backend/nest-cli.json" ]; then
        print_warning "backend/nest-cli.json not found. Ensuring backend is valid..."
    fi

    if [ ! -d "frontend/app" ] && [ ! -d "frontend/src" ]; then
        print_error "Frontend source directory (app or src) not found."
        exit 1
    fi

    print_status "Prerequisites check completed ✓"
}

# Generate SSL certificates (self-signed for development)
generate_ssl() {
    print_status "Generating SSL certificates..."
    
    mkdir -p docker/ssl
    
    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout docker/ssl/key.pem \
        -out docker/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Tracker/OU=IT/CN=localhost"
    
    print_status "SSL certificates generated ✓"
}

# Build and start services
deploy_services() {
    print_status "Building and deploying services..."
    
    # Change to docker directory
    cd docker
    
    # Stop any existing services
    docker-compose down
    
    # Build images
    print_status "Building Docker images..."
    docker-compose build
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose exec backend npm run prisma:migrate:deploy
    
    # Seed database (optional)
    if [ "$1" = "--seed" ]; then
        print_status "Seeding database with sample data..."
        docker-compose exec backend npm run prisma:seed
    fi
    
    cd ..
    
    print_status "Services deployed successfully ✓"
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    # Check backend health
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        print_status "Backend health check passed ✓"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend health check passed ✓"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
    
    print_status "All health checks passed ✓"
}

# Show deployment information
show_info() {
    print_status "Deployment completed successfully! 🎉"
    echo ""
    echo "📍 Application URLs:"
    echo "   Frontend: https://localhost"
    echo "   Backend API: https://localhost/api"
    echo "   API Documentation: https://localhost/api/docs"
    echo ""
    echo "🔧 Management Commands:"
    echo "   View logs: docker-compose -f docker/docker-compose.yml logs -f"
    echo "   Stop services: docker-compose -f docker/docker-compose.yml down"
    echo "   Restart services: docker-compose -f docker/docker-compose.yml restart"
    echo ""
    echo "📊 Default Login Credentials:"
    echo "   Email: admin@tracker.local"
    echo "   Password: Demo@123456"
    echo ""
    echo "⚠️  Important Notes:"
    echo "   - The SSL certificates are self-signed (for development only)"
    echo "   - For production, use proper SSL certificates"
    echo "   - Update the .env file with your secure passwords"
    echo "   - Regularly update dependencies and security patches"
}

# Main deployment flow
main() {
    echo "=========================================="
    echo "  Tracker Compliance Platform Deployment"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    generate_ssl
    deploy_services "$@"
    health_check
    show_info
}

# Handle script arguments
case "$1" in
    --help|-h)
        echo "Usage: $0 [--seed]"
        echo ""
        echo "Options:"
        echo "  --seed    Seed database with sample data"
        echo "  --help    Show this help message"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
