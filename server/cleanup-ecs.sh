#!/bin/bash
set -e

# ============================================
# VogueAI - Cleanup ECS Resources
# Run this AFTER successful Lambda deployment
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  VogueAI ECS Cleanup${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "${RED}WARNING: This will delete ECS resources to save costs!${NC}"
echo ""

AWS_REGION="${AWS_REGION:-ap-south-1}"
ECS_CLUSTER="${ECS_CLUSTER:-vogueai-cluster}"

read -p "Are you sure you want to proceed? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${YELLOW}Scaling down ECS services to 0...${NC}"

# Scale down API service
echo "Scaling down vogueai-api service..."
aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service vogueai-api \
    --desired-count 0 \
    --region "$AWS_REGION" \
    2>/dev/null || echo "  (Service may not exist)"

# Scale down Worker service
echo "Scaling down vogueai-worker service..."
aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service vogueai-worker \
    --desired-count 0 \
    --region "$AWS_REGION" \
    2>/dev/null || echo "  (Service may not exist)"

echo ""
echo -e "${GREEN}ECS services scaled to 0!${NC}"
echo ""
echo "Your Fargate costs should now be $0/month for these services."
echo ""
echo -e "${YELLOW}Optional: To fully delete ECS resources, run:${NC}"
echo "  aws ecs delete-service --cluster $ECS_CLUSTER --service vogueai-api --force --region $AWS_REGION"
echo "  aws ecs delete-service --cluster $ECS_CLUSTER --service vogueai-worker --force --region $AWS_REGION"
echo "  aws ecs delete-cluster --cluster $ECS_CLUSTER --region $AWS_REGION"
