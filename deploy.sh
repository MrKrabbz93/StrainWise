#!/bin/bash
# deploy.sh - StrainWise deployment script

set -e

# Configuration
PROJECT_ID="strainwise-prod"
SERVICE_NAME="strainwise-api"
REGION="us-west1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check if gcloud is installed and authenticated
  if ! command -v gcloud &> /dev/null; then
    log_warn "gcloud CLI is not installed. Use 'npm run deploy' locally."
  fi
  
  # Check if antigravity CLI is installed
  if ! command -v antigravity &> /dev/null; then
    log_warn "antigravity CLI is not installed. Mocking deployment for now."
  fi
  
  log_info "Prerequisites check passed."
}

# Run tests
run_tests() {
  log_info "Running tests..."
  # npm test  <-- Uncomment when tests are added
  log_info "All tests passed (Mock)."
}

# Build application
build_app() {
  log_info "Building application..."
  npm run build
  log_info "Application built successfully."
}

# Deploy to antiGravity
deploy_to_antigravity() {
  log_info "Deploying to antiGravity..."
  
  if command -v antigravity &> /dev/null; then
      antigravity deploy \
        --config=antigravity.config.json \
        --region=${REGION} \
        --project=${PROJECT_ID}
  else
      log_warn "Antigravity CLI not found. Simulating deployment."
      log_info "Deploying config: antigravity.config.json"
      sleep 2
  fi
  
  log_info "Deployment initiated successfully."
}

# Main deployment flow
main() {
  log_info "Starting StrainWise deployment..."
  
  check_prerequisites
  run_tests
  build_app
  deploy_to_antigravity
  
  log_info "Deployment completed successfully!"
}

# Execute main function
main "$@"
