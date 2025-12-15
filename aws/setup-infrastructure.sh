#!/bin/bash
# ============================================
# VogueAI Infrastructure Setup Script
# ============================================
# Creates the necessary AWS infrastructure
# ============================================

set -e

AWS_REGION="ap-south-1"
PROJECT_NAME="vogueai"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "\n${GREEN}==>${NC} $1"
}

# ============================================
# Create Secrets in AWS Secrets Manager
# ============================================
print_step "Creating secrets in AWS Secrets Manager..."

echo "You need to create the following secrets in AWS Secrets Manager:"
echo ""
echo "1. Go to AWS Console → Secrets Manager → Store a new secret"
echo ""
echo "2. Create these secrets (choose 'Other type of secret'):"
echo "   - Name: vogueai/db-password"
echo "     Value: Your database password"
echo ""
echo "   - Name: vogueai/jwt-secret"
echo "     Value: A random 32+ character string for JWT signing"
echo ""
echo "   - Name: vogueai/google-api-key"
echo "     Value: Your Google Gemini API key"
echo ""

# ============================================
# Create IAM Roles
# ============================================
print_step "Creating IAM roles..."

echo "You need to create two IAM roles:"
echo ""
echo "1. ecsTaskExecutionRole (for ECS to pull images and write logs)"
echo "   - Attach policy: AmazonECSTaskExecutionRolePolicy"
echo "   - Attach policy: SecretsManagerReadWrite (for secrets access)"
echo ""
echo "2. ecsTaskRole (for your containers to access AWS services)"
echo "   - Attach policies:"
echo "     - AmazonS3FullAccess (for image uploads)"
echo "     - AmazonSQSFullAccess (for job queue)"
echo ""

# ============================================
# Create VPC and Security Groups (simplified)
# ============================================
print_step "Network setup..."

echo "For simplicity, you can use the default VPC."
echo "Make sure you have:"
echo ""
echo "1. Security Group for ECS tasks:"
echo "   - Inbound: 8000 (API), 80 (Frontend) from ALB"
echo "   - Outbound: All traffic"
echo ""
echo "2. Security Group for RDS:"
echo "   - Inbound: 5432 from ECS security group"
echo ""

# ============================================
# Database Setup Instructions
# ============================================
print_step "Database setup..."

echo "Create RDS PostgreSQL:"
echo "1. Go to AWS Console → RDS → Create database"
echo "2. Choose PostgreSQL"
echo "3. Template: Free tier (for testing) or Production"
echo "4. Settings:"
echo "   - DB instance identifier: vogueai-db"
echo "   - Master username: postgres"
echo "   - Master password: (save this securely!)"
echo "5. Instance: db.t3.micro (cheapest)"
echo "6. Storage: 20 GB"
echo "7. Connectivity: Same VPC as ECS"
echo ""

# ============================================
# Summary
# ============================================
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}Infrastructure Checklist${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "□ ECR repositories created"
echo "□ Secrets stored in Secrets Manager"
echo "□ IAM roles created (ecsTaskExecutionRole, ecsTaskRole)"
echo "□ RDS PostgreSQL created"
echo "□ Security groups configured"
echo "□ CloudWatch log groups created"
echo ""
echo "After completing these steps, run: ./deploy.sh"
