#!/bin/bash
set -e

# ============================================
# VogueAI Lambda Deployment Script
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  VogueAI Lambda Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Configuration
STACK_NAME="${STACK_NAME:-vogueai-serverless}"
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-ap-south-1}"

# Check for required tools
command -v sam >/dev/null 2>&1 || { echo -e "${RED}Error: AWS SAM CLI is required but not installed.${NC}" >&2; echo "Install: pip install aws-sam-cli"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo -e "${RED}Error: AWS CLI is required but not installed.${NC}" >&2; exit 1; }

# ============================================
# Load environment variables from .env file
# (Exclude AWS credentials and ENVIRONMENT - those are for local dev, not deployment)
# ============================================
if [ -f .env ]; then
    echo -e "${BLUE}Loading environment from .env file...${NC}"
    # Load all env vars EXCEPT AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and ENVIRONMENT
    # Those are for local dev, deployment uses AWS CLI credentials and production environment
    export $(grep -v '^#' .env | grep -v '^AWS_ACCESS_KEY_ID' | grep -v '^AWS_SECRET_ACCESS_KEY' | grep -v '^ENVIRONMENT' | xargs)
else
    echo -e "${YELLOW}No .env file found. Using environment variables.${NC}"
fi

# ============================================
# Validate required environment variables
# ============================================
echo -e "${YELLOW}Validating required environment variables...${NC}"

REQUIRED_VARS=(
    "DATABASE_URL"
    "GEMINI_API_KEY"
    "OPENAI_API_KEY"
    "SECRET_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}Error: Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "  - $var"
    done
    echo ""
    echo "Please set these in your .env file or export them."
    exit 1
fi

echo -e "${GREEN}✓ All required variables found${NC}"

# ============================================
# Display configuration
# ============================================
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Stack Name:  $STACK_NAME"
echo "  Environment: $ENVIRONMENT"
echo "  Region:      $AWS_REGION"
echo "  Database:    ${DATABASE_URL:0:30}..."
echo ""

# ============================================
# Build the SAM application
# ============================================
echo -e "${YELLOW}Building SAM application...${NC}"
echo "(This may take a few minutes on first build)"
echo ""

sam build --use-container

# ============================================
# Deploy the SAM application
# ============================================
echo ""
echo -e "${YELLOW}Deploying to AWS Lambda...${NC}"
echo ""

sam deploy \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --capabilities CAPABILITY_IAM \
    --resolve-s3 \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        DatabaseUrl="$DATABASE_URL" \
        GeminiApiKey="$GEMINI_API_KEY" \
        OpenAIApiKey="$OPENAI_API_KEY" \
        SecretKey="$SECRET_KEY" \
        RazorpayKeyId="${RAZORPAY_KEY_ID:-}" \
        RazorpayKeySecret="${RAZORPAY_KEY_SECRET:-}" \
        FreeCreditsOnSignup="${FREE_CREDITS_ON_SIGNUP:-3}" \
        CorsOrigins="https://d1vq3j4injpshr.cloudfront.net,http://localhost:3000,http://localhost:5173" \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset

# ============================================
# Get and display outputs
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete! 🚀${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text \
    --region "$AWS_REGION")

S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ImagesBucketName`].OutputValue' \
    --output text \
    --region "$AWS_REGION")

SQS_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`JobsQueueUrl`].OutputValue' \
    --output text \
    --region "$AWS_REGION")

echo -e "${GREEN}API URL:${NC}     $API_URL"
echo -e "${GREEN}S3 Bucket:${NC}   $S3_BUCKET"
echo -e "${GREEN}SQS Queue:${NC}   $SQS_URL"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update your frontend API_URL to: $API_URL"
echo "2. Test health: curl $API_URL/health"
echo "3. Test API:    curl $API_URL/api/v1/"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "  sam logs -n vogueai-api-$ENVIRONMENT --stack-name $STACK_NAME --tail"
echo ""
echo -e "${YELLOW}To cleanup ECS (save costs):${NC}"
echo "  ./cleanup-ecs.sh"
