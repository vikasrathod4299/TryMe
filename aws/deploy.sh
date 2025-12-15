#!/bin/bash
# ============================================
# VogueAI AWS Deployment Script
# ============================================
# This script deploys VogueAI to AWS ECS
# 
# Usage: ./deploy.sh
# ============================================

set -e  # Exit on error

# Disable AWS CLI pager to prevent output getting stuck
export AWS_PAGER=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE VALUES!
AWS_REGION="ap-south-1"
AWS_ACCOUNT_ID=""  # Will be auto-detected
ECR_REGISTRY=""    # Will be set after account ID detection
CLUSTER_NAME="vogueai-cluster"

# ============================================
# Helper Functions
# ============================================
print_step() {
    echo -e "\n${GREEN}==>${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}Warning:${NC} $1"
}

print_error() {
    echo -e "${RED}Error:${NC} $1"
}

# ============================================
# Pre-flight Checks
# ============================================
print_step "Running pre-flight checks..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    echo "Run: curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip' && unzip awscliv2.zip && sudo ./aws/install"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo "ECR Registry: $ECR_REGISTRY"

# ============================================
# Step 1: Create ECR Repositories
# ============================================
print_step "Creating ECR repositories..."

for repo in vogueai-api vogueai-worker vogueai-frontend; do
    if aws ecr describe-repositories --repository-names $repo --region $AWS_REGION &> /dev/null; then
        echo "Repository $repo already exists"
    else
        aws ecr create-repository --repository-name $repo --region $AWS_REGION
        echo "Created repository: $repo"
    fi
done

# ============================================
# Step 2: Login to ECR
# ============================================
print_step "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# ============================================
# Step 3: Build and Push Docker Images
# ============================================
print_step "Building and pushing Docker images..."

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Build and push API server
echo "Building API server..."
cd "$PROJECT_ROOT/server"
docker build -t vogueai-api:latest -f Dockerfile .
docker tag vogueai-api:latest $ECR_REGISTRY/vogueai-api:latest
docker push $ECR_REGISTRY/vogueai-api:latest

# Build and push Worker
echo "Building Worker..."
docker build -t vogueai-worker:latest -f Dockerfile.worker .
docker tag vogueai-worker:latest $ECR_REGISTRY/vogueai-worker:latest
docker push $ECR_REGISTRY/vogueai-worker:latest

# Build and push Frontend
echo "Building Frontend..."
cd "$PROJECT_ROOT/vogueai"
# Note: You'll need to set the correct API URL
docker build -t vogueai-frontend:latest --build-arg VITE_API_URL=https://api.yourdomain.com .
docker tag vogueai-frontend:latest $ECR_REGISTRY/vogueai-frontend:latest
docker push $ECR_REGISTRY/vogueai-frontend:latest

# ============================================
# Step 4: Create CloudWatch Log Groups
# ============================================
print_step "Creating CloudWatch log groups..."

for log_group in /ecs/vogueai-api /ecs/vogueai-worker /ecs/vogueai-frontend; do
    if aws logs describe-log-groups --log-group-name-prefix $log_group --region $AWS_REGION | grep -q $log_group; then
        echo "Log group $log_group already exists"
    else
        aws logs create-log-group --log-group-name $log_group --region $AWS_REGION
        echo "Created log group: $log_group"
    fi
done

# ============================================
# Step 5: Create ECS Cluster
# ============================================
print_step "Creating ECS cluster..."

if aws ecs describe-clusters --clusters $CLUSTER_NAME --region $AWS_REGION | grep -q "ACTIVE"; then
    echo "Cluster $CLUSTER_NAME already exists"
else
    aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION
    echo "Created cluster: $CLUSTER_NAME"
fi

# ============================================
# Step 6: Update Task Definitions with Account ID
# ============================================
print_step "Updating task definitions..."

cd "$SCRIPT_DIR/task-definitions"

for file in api-server.json worker.json frontend.json; do
    sed -i "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" $file
    echo "Updated $file with account ID"
done

# ============================================
# Done!
# ============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Docker images built and pushed successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo "1. Create RDS PostgreSQL database in AWS Console"
echo "2. Store secrets in AWS Secrets Manager:"
echo "   - vogueai/db-password"
echo "   - vogueai/jwt-secret"
echo "   - vogueai/google-api-key"
echo "3. Update task definitions with your RDS endpoint"
echo "4. Create IAM roles (ecsTaskExecutionRole, ecsTaskRole)"
echo "5. Register task definitions:"
echo "   aws ecs register-task-definition --cli-input-json file://aws/task-definitions/api-server.json"
echo "6. Create ECS services"
echo ""
echo "See aws/README.md for detailed instructions."
