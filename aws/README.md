# AWS Deployment Guide for VogueAI 🚀

This guide will help you deploy VogueAI on AWS using **ECS (Elastic Container Service)** - AWS's managed container service.

## 📚 Why ECS Instead of Kubernetes?

- **Simpler**: No need to manage Kubernetes cluster
- **AWS Native**: Integrates well with other AWS services (RDS, ElastiCache, etc.)
- **Cost Effective**: Pay only for containers you run
- **Managed**: AWS handles the infrastructure

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Frontend  │    │  API Server │    │   Worker    │         │
│  │   (Fargate) │    │  (Fargate)  │    │  (Fargate)  │         │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│         │                  │                  │                 │
│         └────────┬─────────┴─────────┬────────┘                 │
│                  │                   │                          │
│           ┌──────▼──────┐    ┌───────▼───────┐                  │
│           │     RDS     │    │      S3       │                  │
│           │ (PostgreSQL)│    │   (Images)    │                  │
│           └─────────────┘    └───────────────┘                  │
│                                                                  │
│                              ┌───────────────┐                  │
│                              │     SQS       │                  │
│                              │   (Queue)     │                  │
│                              └───────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

1. **AWS Account** with admin access
2. **AWS CLI** installed and configured
3. **Docker** installed locally

### Install AWS CLI
```bash
# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure with your credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (e.g., ap-south-1)
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Create ECR Repositories (Container Registry)

ECR is AWS's Docker Hub - it stores your Docker images.

```bash
# Create repositories for each service
aws ecr create-repository --repository-name vogueai-api --region ap-south-1
aws ecr create-repository --repository-name vogueai-worker --region ap-south-1
aws ecr create-repository --repository-name vogueai-frontend --region ap-south-1
```

### Step 2: Build and Push Docker Images

```bash
# Login to ECR (replace YOUR_ACCOUNT_ID with your AWS account ID)
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com

# Build and push API server
cd server
docker build -t vogueai-api:latest -f Dockerfile .
docker tag vogueai-api:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/vogueai-api:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/vogueai-api:latest

# Build and push Worker
docker build -t vogueai-worker:latest -f Dockerfile.worker .
docker tag vogueai-worker:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/vogueai-worker:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/vogueai-worker:latest

# Build and push Frontend
cd ../vogueai
docker build -t vogueai-frontend:latest --build-arg VITE_API_URL=https://api.yourdomain.com .
docker tag vogueai-frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/vogueai-frontend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/vogueai-frontend:latest
```

### Step 3: Create Supporting Infrastructure

Run the provided script or create manually in AWS Console:

```bash
# Run the setup script
chmod +x aws/setup-infrastructure.sh
./aws/setup-infrastructure.sh
```

Or create manually in AWS Console:
1. **RDS PostgreSQL** - Database
2. **S3 Bucket** - Image storage (you already have this)
3. **SQS Queue** - Job queue (you already have this)

### Step 4: Create ECS Cluster

```bash
# Create an ECS cluster
aws ecs create-cluster --cluster-name vogueai-cluster --region ap-south-1
```

### Step 5: Create Task Definitions

Task definitions tell ECS how to run your containers. Use the files in `aws/task-definitions/`.

```bash
# Register task definitions
aws ecs register-task-definition --cli-input-json file://aws/task-definitions/api-server.json
aws ecs register-task-definition --cli-input-json file://aws/task-definitions/worker.json
aws ecs register-task-definition --cli-input-json file://aws/task-definitions/frontend.json
```

### Step 6: Create ECS Services

```bash
# Create API service
aws ecs create-service \
  --cluster vogueai-cluster \
  --service-name api-server \
  --task-definition vogueai-api \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"

# Create Worker service
aws ecs create-service \
  --cluster vogueai-cluster \
  --service-name worker \
  --task-definition vogueai-worker \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"

# Create Frontend service
aws ecs create-service \
  --cluster vogueai-cluster \
  --service-name frontend \
  --task-definition vogueai-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Step 7: Set Up Load Balancer (ALB)

Create an Application Load Balancer to route traffic to your services.

```bash
# This is easier to do in AWS Console:
# 1. Go to EC2 → Load Balancers → Create
# 2. Choose Application Load Balancer
# 3. Configure listeners and target groups
```

---

## 💰 Estimated Costs (ap-south-1 region)

| Service | Specification | Monthly Cost |
|---------|--------------|--------------|
| ECS Fargate (API) | 0.5 vCPU, 1GB RAM | ~$15 |
| ECS Fargate (Worker) | 0.5 vCPU, 1GB RAM | ~$15 |
| ECS Fargate (Frontend) | 0.25 vCPU, 0.5GB RAM | ~$8 |
| RDS PostgreSQL | db.t3.micro | ~$15 |
| ALB | Load Balancer | ~$18 |
| **Total** | | **~$71/month** |

*Note: Prices are approximate and may vary.*

---

## 🔧 Useful Commands

```bash
# View running services
aws ecs list-services --cluster vogueai-cluster

# View running tasks
aws ecs list-tasks --cluster vogueai-cluster

# View logs (after setting up CloudWatch)
aws logs tail /ecs/vogueai-api --follow

# Update a service (after pushing new image)
aws ecs update-service --cluster vogueai-cluster --service api-server --force-new-deployment

# Scale a service
aws ecs update-service --cluster vogueai-cluster --service api-server --desired-count 2
```

---

## 🐛 Troubleshooting

### Container won't start
```bash
# Check task status
aws ecs describe-tasks --cluster vogueai-cluster --tasks TASK_ARN

# Check CloudWatch logs
aws logs tail /ecs/vogueai-api
```

### Can't connect to database
- Check security groups allow traffic on port 5432
- Verify RDS is in the same VPC as ECS tasks

### Images not uploading
- Check S3 bucket permissions
- Verify IAM role has S3 access

---

## 📁 Files Created

```
aws/
├── README.md                    ← This file
├── setup-infrastructure.sh      ← Creates RDS, ElastiCache, etc.
├── deploy.sh                    ← Main deployment script
└── task-definitions/
    ├── api-server.json          ← ECS task for API
    ├── worker.json              ← ECS task for Worker
    └── frontend.json            ← ECS task for Frontend
```

Good luck with your deployment! 🎉
