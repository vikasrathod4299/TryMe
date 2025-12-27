# TryMe AWS ECS Deployment Guide

## Overview

This document describes the complete deployment of the TryMe virtual try-on application to AWS ECS Fargate.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  Frontend   │    │  API Server │    │   Worker    │          │
│  │  (Nginx)    │───▶│  (FastAPI)  │───▶│  (Python)   │          │
│  │  Port 80    │    │  Port 8000  │    │             │          │
│  └─────────────┘    └──────┬──────┘    └──────┬──────┘          │
│         │                  │                   │                 │
│         │           ┌──────┴──────┐     ┌──────┴──────┐          │
│         │           │     RDS     │     │     SQS     │          │
│         │           │ PostgreSQL  │     │   Queue     │          │
│         │           └─────────────┘     └─────────────┘          │
│         │                                      │                 │
│         │           ┌─────────────┐     ┌──────┴──────┐          │
│         └──────────▶│     S3      │◀────│   Gemini    │          │
│                     │   Bucket    │     │   OpenAI    │          │
│                     └─────────────┘     └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## AWS Resources Created

| Resource | Name/ID | Purpose |
|----------|---------|---------|
| **ECS Cluster** | `vogueai-cluster` | Container orchestration |
| **ECR Repositories** | `vogueai-api`, `vogueai-worker`, `vogueai-frontend` | Docker image storage |
| **RDS PostgreSQL** | `vogueai-db` | Database |
| **S3 Bucket** | `outfit-checker-dev` | Image storage |
| **SQS Queue** | `outfit-checker-jobs` | Job queue |
| **Secrets Manager** | 6 secrets | Sensitive credentials |
| **IAM Roles** | `ecsTaskExecutionRole`, `ecsTaskRole` | Permissions |
| **Security Groups** | `sg-008851b731eda7c49` (ECS), `sg-0493f820b105b54d2` (RDS) | Network security |
| **VPC/Subnets** | Default VPC with 2 subnets | Networking |

---

## Step-by-Step Deployment Process

### Step 1: Create ECR Repositories

ECR (Elastic Container Registry) stores your Docker images.

```bash
# Create repositories for each service
aws ecr create-repository --repository-name vogueai-api --region ap-south-1
aws ecr create-repository --repository-name vogueai-worker --region ap-south-1
aws ecr create-repository --repository-name vogueai-frontend --region ap-south-1
```

**Verify:**
```bash
aws ecr describe-repositories --region ap-south-1
```

---

### Step 2: Create RDS PostgreSQL Database

Create the database via AWS Console:

1. Go to **AWS Console → RDS → Create database**
2. Settings:
   - Engine: PostgreSQL 15
   - Template: Free tier
   - DB identifier: `vogueai-db`
   - Master username: `postgres`
   - Master password: (choose secure password)
   - Instance: `db.t3.micro`
   - Storage: 20 GB
   - **Public access: Yes**
   - **Initial database name: `vogueai`** (Important!)

**Get endpoint after creation:**
```bash
aws rds describe-db-instances --db-instance-identifier vogueai-db \
  --query 'DBInstances[0].Endpoint.Address' --output text --region ap-south-1
```

---

### Step 3: Create Secrets in AWS Secrets Manager

Store sensitive credentials securely.

```bash
# Database connection string (replace PASSWORD and ENDPOINT)
aws secretsmanager create-secret --name vogueai/database-url \
  --secret-string "postgresql://postgres:PASSWORD@ENDPOINT:5432/vogueai" \
  --region ap-south-1

# JWT secret for authentication
aws secretsmanager create-secret --name vogueai/jwt-secret \
  --secret-string "your-256-bit-secret-key" \
  --region ap-south-1

# Gemini API key
aws secretsmanager create-secret --name vogueai/google-api-key \
  --secret-string "your-gemini-api-key" \
  --region ap-south-1

# OpenAI API key
aws secretsmanager create-secret --name vogueai/openai-api-key \
  --secret-string "your-openai-api-key" \
  --region ap-south-1

# Razorpay keys
aws secretsmanager create-secret --name vogueai/razorpay-key-id \
  --secret-string "rzp_xxx" \
  --region ap-south-1

aws secretsmanager create-secret --name vogueai/razorpay-key-secret \
  --secret-string "xxx" \
  --region ap-south-1
```

**Verify and get ARNs:**
```bash
aws secretsmanager list-secrets \
  --query "SecretList[?contains(Name, 'vogueai')].[Name, ARN]" \
  --output table --region ap-south-1
```

---

### Step 4: Create IAM Roles

Create via AWS Console (IAM → Roles → Create role):

#### Role 1: ecsTaskExecutionRole

1. Trusted entity: **AWS Service → Elastic Container Service → Elastic Container Service Task**
2. Attach policies:
   - `AmazonECSTaskExecutionRolePolicy`
   - `SecretsManagerReadWrite`
3. Role name: `ecsTaskExecutionRole`

#### Role 2: ecsTaskRole

1. Trusted entity: **AWS Service → Elastic Container Service → Elastic Container Service Task**
2. Create inline policy with this JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::outfit-checker-dev/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:ap-south-1:ACCOUNT_ID:outfit-checker-jobs"
    }
  ]
}
```

3. Role name: `ecsTaskRole`

---

### Step 5: Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name vogueai-cluster --region ap-south-1
```

---

### Step 6: Create Security Groups

```bash
# Get VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" \
  --query "Vpcs[0].VpcId" --output text --region ap-south-1)

# Create ECS security group
aws ec2 create-security-group \
  --group-name vogueai-ecs-sg \
  --description "Security group for VogueAI ECS tasks" \
  --vpc-id $VPC_ID \
  --region ap-south-1

# Allow inbound on port 8000 (API)
aws ec2 authorize-security-group-ingress \
  --group-id sg-ECS_GROUP_ID \
  --protocol tcp --port 8000 --cidr 0.0.0.0/0 \
  --region ap-south-1

# Allow inbound on port 80 (Frontend)
aws ec2 authorize-security-group-ingress \
  --group-id sg-ECS_GROUP_ID \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 \
  --region ap-south-1

# Allow ECS to connect to RDS (port 5432)
aws ec2 authorize-security-group-ingress \
  --group-id sg-RDS_GROUP_ID \
  --protocol tcp --port 5432 \
  --source-group sg-ECS_GROUP_ID \
  --region ap-south-1
```

---

### Step 7: Create CloudWatch Log Groups

```bash
aws logs create-log-group --log-group-name /ecs/vogueai-api --region ap-south-1
aws logs create-log-group --log-group-name /ecs/vogueai-worker --region ap-south-1
aws logs create-log-group --log-group-name /ecs/vogueai-frontend --region ap-south-1
```

---

### Step 8: Run Database Migrations

```bash
cd server

# Temporarily update alembic.ini with RDS URL
sed -i 's|sqlalchemy.url = postgresql://.*|sqlalchemy.url = postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/vogueai|' alembic.ini

# Run migrations
uv run alembic upgrade head

# Restore original URL
sed -i 's|sqlalchemy.url = postgresql://.*|sqlalchemy.url = postgresql://postgres:PASSWORD@localhost:5433/try_me|' alembic.ini
```

---

### Step 9: Build and Push Docker Images

#### Login to ECR

```bash
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com
```

#### API Server

```bash
cd server

docker build -t vogueai-api .
docker tag vogueai-api:latest ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/vogueai-api:latest
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/vogueai-api:latest
```

#### Worker

```bash
cd server

docker build -f Dockerfile.worker -t vogueai-worker .
docker tag vogueai-worker:latest ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/vogueai-worker:latest
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/vogueai-worker:latest
```

#### Frontend

```bash
cd vogueai

# IMPORTANT: Pass API URL as build argument
docker build --build-arg VITE_API_URL=http://API_IP:8000/api/v1 -t vogueai-frontend .
docker tag vogueai-frontend:latest ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/vogueai-frontend:latest
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/vogueai-frontend:latest
```

---

### Step 10: Register Task Definitions

Update the secret ARNs in task definition files, then register:

```bash
cd aws/task-definitions

aws ecs register-task-definition --cli-input-json file://api-server.json --region ap-south-1
aws ecs register-task-definition --cli-input-json file://worker.json --region ap-south-1
aws ecs register-task-definition --cli-input-json file://frontend.json --region ap-south-1
```

---

### Step 11: Create ECS Services

```bash
# Get subnet IDs
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
  --query "Subnets[*].[SubnetId]" --output text --region ap-south-1

# Create API service
aws ecs create-service \
  --cluster vogueai-cluster \
  --service-name vogueai-api \
  --task-definition vogueai-api:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region ap-south-1

# Create Worker service
aws ecs create-service \
  --cluster vogueai-cluster \
  --service-name vogueai-worker \
  --task-definition vogueai-worker:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region ap-south-1

# Create Frontend service
aws ecs create-service \
  --cluster vogueai-cluster \
  --service-name vogueai-frontend \
  --task-definition vogueai-frontend:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region ap-south-1
```

---

## Key Code Changes for Production

### 1. S3/SQS Client - Use IAM Role in Production

**File:** `server/app/upload/service.py`

```python
# Use IAM role credentials in production, explicit credentials in development
if settings.ENVIRONMENT == "production":
    s3_client = boto3.client("s3", region_name=settings.AWS_REGION)
    sqs_client = boto3.client("sqs", region_name=settings.AWS_REGION)
else:
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    sqs_client = boto3.client(
        "sqs",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
```

### 2. Dockerfile - Added curl for Health Checks

**File:** `server/Dockerfile`

```dockerfile
# Added to production image
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*
```

---

## Useful Commands Reference

### Check Service Status

```bash
aws ecs describe-services --cluster vogueai-cluster --services vogueai-api \
  --query 'services[0].{status:status,running:runningCount,desired:desiredCount}' \
  --region ap-south-1
```

### View Logs

```bash
# Last 10 minutes
aws logs tail /ecs/vogueai-api --since 10m --region ap-south-1

# Stream live logs
aws logs tail /ecs/vogueai-api --follow --region ap-south-1
```

### Get Service Public IP

```bash
# For API
aws ecs list-tasks --cluster vogueai-cluster --service-name vogueai-api \
  --query 'taskArns[0]' --output text --region ap-south-1 | \
  xargs -I {} aws ecs describe-tasks --cluster vogueai-cluster --tasks {} \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text --region ap-south-1 | \
  xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} \
  --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region ap-south-1
```

### Force Redeploy (after pushing new image)

```bash
aws ecs update-service --cluster vogueai-cluster --service vogueai-api \
  --force-new-deployment --region ap-south-1
```

### Scale Services

```bash
# Stop all services (scale to 0)
aws ecs update-service --cluster vogueai-cluster --service vogueai-api --desired-count 0 --region ap-south-1
aws ecs update-service --cluster vogueai-cluster --service vogueai-worker --desired-count 0 --region ap-south-1
aws ecs update-service --cluster vogueai-cluster --service vogueai-frontend --desired-count 0 --region ap-south-1

# Start all services (scale to 1)
aws ecs update-service --cluster vogueai-cluster --service vogueai-api --desired-count 1 --region ap-south-1
aws ecs update-service --cluster vogueai-cluster --service vogueai-worker --desired-count 1 --region ap-south-1
aws ecs update-service --cluster vogueai-cluster --service vogueai-frontend --desired-count 1 --region ap-south-1
```

---

## Troubleshooting

### Task Keeps Restarting

1. Check logs: `aws logs tail /ecs/vogueai-api --since 30m`
2. Check task status: `aws ecs describe-tasks --cluster vogueai-cluster --tasks TASK_ARN`
3. Common issues:
   - Health check failing (ensure curl is installed)
   - Database connection issues (check security groups)
   - Missing environment variables

### Cannot Connect to Database

1. Verify RDS security group allows ECS security group
2. Check RDS is publicly accessible
3. Verify DATABASE_URL secret is correct

### S3 Access Denied

1. Verify ecsTaskRole has S3 permissions
2. Check bucket name is correct
3. Ensure ENVIRONMENT=production in task definition

---

## Estimated Monthly Cost

| Service | Specification | Cost |
|---------|--------------|------|
| ECS Fargate - API | 0.5 vCPU, 1GB RAM | ~$15 |
| ECS Fargate - Worker | 1 vCPU, 2GB RAM | ~$30 |
| ECS Fargate - Frontend | 0.25 vCPU, 0.5GB RAM | ~$8 |
| RDS PostgreSQL | db.t3.micro | $0-15 |
| S3 Storage | ~1GB | ~$0.50 |
| SQS | ~300 messages | Free |
| ECR | ~2GB images | ~$0.20 |
| CloudWatch Logs | ~1GB | ~$0.50 |
| **Total** | | **~$55-70/month** |

### Cost Optimization

- **Scale to zero at night** - Save ~50%
- **Use Fargate Spot** - Save up to 70%
- **Combine API + Worker** - Save ~$30/month
- **Use smaller instances** - API can use 0.25 vCPU

---

## Next Steps (Recommended)

1. **Add Application Load Balancer** - Stable URLs, HTTPS support
2. **Add Custom Domain** - Route 53 + ACM SSL certificate
3. **Set up CI/CD** - GitHub Actions for automated deployments
4. **Add Monitoring** - CloudWatch alarms for errors/latency
5. **Enable Auto-scaling** - Scale based on CPU/memory usage

---

## Quick Reference

| Resource | Value |
|----------|-------|
| AWS Region | `ap-south-1` |
| Account ID | `864624564506` |
| ECS Cluster | `vogueai-cluster` |
| RDS Endpoint | `vogueai-db.cxe6yuu4mlxw.ap-south-1.rds.amazonaws.com` |
| S3 Bucket | `outfit-checker-dev` |
| SQS Queue | `outfit-checker-jobs` |
| ECS Security Group | `sg-008851b731eda7c49` |
| RDS Security Group | `sg-0493f820b105b54d2` |

---

*Last Updated: December 28, 2025*
