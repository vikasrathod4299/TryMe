# VogueAI Lambda Deployment Guide

## Architecture Overview

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                         AWS Cloud                           │
                                    │                                                             │
┌──────────┐                        │  ┌─────────────┐      ┌─────────────────────────────────┐  │
│          │     HTTPS              │  │             │      │            VPC                  │  │
│  Users   │◄──────────────────────►│  │ CloudFront  │      │                                 │  │
│          │                        │  │   (CDN)     │      │  ┌─────────────────────────┐   │  │
└──────────┘                        │  └──────┬──────┘      │  │     API Lambda          │   │  │
                                    │         │             │  │   (FastAPI + Mangum)    │   │  │
                                    │         ▼             │  │                         │   │  │
                                    │  ┌─────────────┐      │  │  • Handles HTTP requests│   │  │
                                    │  │     S3      │      │  │  • Auth, Upload, User   │   │  │
                                    │  │  (Frontend) │      │  │  • Credits management   │   │  │
                                    │  └─────────────┘      │  └───────────┬─────────────┘   │  │
                                    │                       │              │                  │  │
                                    │  ┌─────────────┐      │              │ VPC Endpoints    │  │
                                    │  │ API Gateway │◄─────┼──────────────┤  • S3 (Gateway)  │  │
                                    │  │  (HTTP API) │      │              │  • SQS (Interface)│ │
                                    │  └──────┬──────┘      │              │                  │  │
                                    │         │             │  ┌───────────▼─────────────┐   │  │
                                    │         │             │  │      RDS PostgreSQL     │   │  │
                                    │         │             │  │   (Publicly Accessible) │   │  │
                                    │         │             │  └─────────────────────────┘   │  │
                                    │         │             │                                 │  │
                                    │         │             └─────────────────────────────────┘  │
                                    │         │                                                  │
                                    │         ▼                                                  │
                                    │  ┌─────────────┐      ┌─────────────┐      ┌───────────┐  │
                                    │  │ API Lambda  │─────►│  SQS Queue  │─────►│  Worker   │  │
                                    │  │ (in VPC)    │      │             │      │  Lambda   │  │
                                    │  └─────────────┘      └─────────────┘      │(outside   │  │
                                    │                                            │   VPC)    │  │
                                    │                                            └─────┬─────┘  │
                                    │                                                  │        │
                                    │  ┌─────────────┐      ┌─────────────┐            │        │
                                    │  │     S3      │◄─────┤   Gemini    │◄───────────┘        │
                                    │  │  (Images)   │      │     API     │                     │
                                    │  └─────────────┘      └─────────────┘                     │
                                    │                                                           │
                                    └───────────────────────────────────────────────────────────┘
```

## Components

### 1. Frontend
- **CloudFront Distribution**: `d1vq3j4injpshr.cloudfront.net`
- **S3 Bucket**: Static React app built with Vite
- **HTTPS**: Enabled via CloudFront

### 2. API Lambda (Inside VPC)
- **Runtime**: Python 3.12
- **Handler**: Mangum wrapping FastAPI
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **VPC**: Required for RDS access
- **VPC Endpoints**: 
  - S3 Gateway Endpoint (free)
  - SQS Interface Endpoint (~$7.30/month)

### 3. Worker Lambda (Outside VPC)
- **Runtime**: Python 3.12
- **Trigger**: SQS Queue
- **Memory**: 2048 MB (for image processing)
- **Timeout**: 120 seconds
- **Ephemeral Storage**: 1024 MB
- **Outside VPC**: Required for Gemini API access (no NAT Gateway needed)

### 4. Database
- **RDS PostgreSQL**: `vogueai-db.cxe6yuu4mlxw.ap-south-1.rds.amazonaws.com`
- **Publicly Accessible**: Yes (for Worker Lambda access)
- **Security Group**: Allows inbound on port 5432

### 5. Storage
- **S3 Bucket**: `vogueai-images-production-864624564506`
- **Purpose**: User uploads (avatars, outfits) and generated images

### 6. Queue
- **SQS Queue**: `vogueai-jobs-production`
- **Purpose**: Async job processing for try-on requests

---

## Deployment Steps

### Prerequisites
- AWS CLI configured
- AWS SAM CLI installed
- Docker installed (for building Lambda layers)
- Python 3.12

### Step 1: Create S3 Bucket for SAM Artifacts
```bash
aws s3 mb s3://vogueai-sam-deployments-864624564506 --region ap-south-1
```

### Step 2: Create VPC and Subnets (if not exists)
```bash
# Note your VPC ID and private subnet IDs
aws ec2 describe-vpcs --region ap-south-1
aws ec2 describe-subnets --region ap-south-1
```

### Step 3: Create Security Group for Lambda
```bash
aws ec2 create-security-group \
  --group-name vogueai-lambda-sg-production \
  --description "Security group for VogueAI Lambda functions" \
  --vpc-id vpc-XXXXXXXX \
  --region ap-south-1
```

### Step 4: Create VPC Endpoints

#### S3 Gateway Endpoint (Free)
```bash
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-XXXXXXXX \
  --service-name com.amazonaws.ap-south-1.s3 \
  --vpc-endpoint-type Gateway \
  --route-table-ids rtb-XXXXXXXX \
  --region ap-south-1
```

#### SQS Interface Endpoint (~$7.30/month)
```bash
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-XXXXXXXX \
  --service-name com.amazonaws.ap-south-1.sqs \
  --vpc-endpoint-type Interface \
  --subnet-ids subnet-XXXXX subnet-XXXXX subnet-XXXXX \
  --security-group-ids sg-XXXXXXXX \
  --private-dns-enabled \
  --region ap-south-1
```

### Step 5: Build and Deploy with SAM

```bash
cd server

# Build the application
sam build --use-container

# Deploy
sam deploy \
  --stack-name vogueai-serverless \
  --s3-bucket vogueai-sam-deployments-864624564506 \
  --capabilities CAPABILITY_IAM \
  --region ap-south-1 \
  --parameter-overrides \
    Environment=production \
    DatabaseUrl="postgresql://user:pass@host:5432/db" \
    JwtSecret="your-secret" \
    GeminiApiKey="your-gemini-key" \
    S3BucketName="vogueai-images-production-864624564506" \
    SqsQueueName="vogueai-jobs-production" \
    VpcId="vpc-XXXXXXXX" \
    SubnetIds="subnet-XXX,subnet-XXX,subnet-XXX" \
    SecurityGroupId="sg-XXXXXXXX"
```

### Step 6: Deploy Frontend to CloudFront

```bash
cd vogueai

# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://vogueai-frontend-production-864624564506 --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id EXXXXXXXX \
  --paths "/*"
```

---

## SAM Template (template.yaml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: VogueAI Serverless Application

Parameters:
  Environment:
    Type: String
    Default: production
  DatabaseUrl:
    Type: String
    NoEcho: true
  JwtSecret:
    Type: String
    NoEcho: true
  GeminiApiKey:
    Type: String
    NoEcho: true
  S3BucketName:
    Type: String
  SqsQueueName:
    Type: String
  VpcId:
    Type: String
  SubnetIds:
    Type: CommaDelimitedList
  SecurityGroupId:
    Type: String

Globals:
  Function:
    Runtime: python3.12
    Environment:
      Variables:
        ENVIRONMENT: !Ref Environment
        DATABASE_URL: !Ref DatabaseUrl

Resources:
  # API Lambda - Inside VPC
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "vogueai-api-${Environment}"
      CodeUri: .
      Handler: app.main.handler
      MemorySize: 512
      Timeout: 30
      VpcConfig:
        SecurityGroupIds:
          - !Ref SecurityGroupId
        SubnetIds: !Ref SubnetIds
      Environment:
        Variables:
          JWT_SECRET: !Ref JwtSecret
          GEMINI_API_KEY: !Ref GeminiApiKey
          S3_BUCKET_NAME: !Ref S3BucketName
          SQS_QUEUE_NAME: !Ref SqsQueueName
      Policies:
        - S3FullAccessPolicy:
            BucketName: !Ref S3BucketName
        - SQSSendMessagePolicy:
            QueueName: !Ref SqsQueueName
        - VPCAccessPolicy: {}
      Events:
        Api:
          Type: HttpApi
          Properties:
            ApiId: !Ref HttpApi

  # Worker Lambda - Outside VPC (for Gemini API access)
  WorkerFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "vogueai-worker-${Environment}"
      CodeUri: .
      Handler: workers.processor.lambda_handler
      MemorySize: 2048
      Timeout: 120
      EphemeralStorage:
        Size: 1024
      # NO VpcConfig - Worker is outside VPC for internet access
      Environment:
        Variables:
          JWT_SECRET: !Ref JwtSecret
          GEMINI_API_KEY: !Ref GeminiApiKey
          S3_BUCKET_NAME: !Ref S3BucketName
          SQS_QUEUE_NAME: !Ref SqsQueueName
      Policies:
        - S3FullAccessPolicy:
            BucketName: !Ref S3BucketName
        - SQSPollerPolicy:
            QueueName: !Ref SqsQueueName
      Events:
        SQSEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt JobQueue.Arn
            BatchSize: 1

  # HTTP API Gateway
  HttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      StageName: !Ref Environment
      CorsConfiguration:
        AllowOrigins:
          - "https://d1vq3j4injpshr.cloudfront.net"
        AllowMethods:
          - GET
          - POST
          - PUT
          - DELETE
          - OPTIONS
        AllowHeaders:
          - "*"
        AllowCredentials: true

  # SQS Queue
  JobQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Ref SqsQueueName
      VisibilityTimeout: 180

Outputs:
  ApiUrl:
    Description: API Gateway URL
    Value: !Sub "https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}"
```

---

## Key Configuration Details

### API Lambda (In VPC)
The API Lambda needs to be in VPC to access RDS. However, being in VPC means it cannot access AWS services directly. Solution:
- **S3**: Gateway VPC Endpoint (FREE)
- **SQS**: Interface VPC Endpoint (~$7.30/month)

### Worker Lambda (Outside VPC)
The Worker Lambda needs internet access to call Gemini API. Options:
1. ❌ NAT Gateway: ~$32-45/month - Too expensive
2. ✅ Move Worker outside VPC: FREE

Since RDS is publicly accessible, Worker can still connect to it from outside the VPC.

### Security Group Rules
```bash
# Lambda Security Group (for API Lambda)
# Outbound: All traffic (default)
# Inbound: Not required for Lambda

# RDS Security Group
# Inbound: PostgreSQL (5432) from 0.0.0.0/0 (for Worker access)
# Inbound: PostgreSQL (5432) from Lambda Security Group
```

---

## Cost Breakdown (Estimated)

| Service | Monthly Cost |
|---------|-------------|
| RDS PostgreSQL (db.t3.micro) | ~$12.50 |
| SQS VPC Endpoint (Interface) | ~$7.30 |
| Lambda (30-50 requests) | ~$0.01 |
| API Gateway | ~$0.01 |
| S3 Storage | ~$0.50 |
| CloudFront | ~$1.00 |
| S3 VPC Endpoint (Gateway) | FREE |
| **Total** | **~$21-25/month** |

### Comparison with ECS Fargate
| Setup | Monthly Cost |
|-------|-------------|
| ECS Fargate (3 services) | $60-100+ |
| Lambda + VPC Endpoints | $21-25 |
| **Savings** | **~60-75%** |

---

## Troubleshooting

### API Lambda Timeout (30s)
**Symptom**: 503 Service Unavailable
**Cause**: Lambda in VPC cannot reach SQS
**Solution**: Create SQS Interface VPC Endpoint

### Worker Lambda Cannot Access Gemini API
**Symptom**: Connection timeout to generativelanguage.googleapis.com
**Cause**: Lambda in VPC has no internet access
**Solution**: Remove Worker from VPC (no VpcConfig)

### Worker Lambda S3 403 Forbidden
**Symptom**: Access Denied when accessing S3
**Cause**: Using hardcoded credentials instead of IAM role
**Solution**: Use boto3 without credentials (IAM role)
```python
s3 = boto3.client("s3", region_name="ap-south-1")  # No credentials needed
```

### SQLAlchemy Mapper Error
**Symptom**: `sqlalchemy.orm.exc.UnmappedClassError`
**Cause**: Models not imported before use
**Solution**: Import all models in processor.py
```python
from app.models import RefreshToken, User, UserUpload, UserCredits, CreditTransaction
```

---

## Monitoring

### View API Lambda Logs
```bash
sam logs -n ApiFunction --stack-name vogueai-serverless --region ap-south-1 --tail
```

### View Worker Lambda Logs
```bash
sam logs -n WorkerFunction --stack-name vogueai-serverless --region ap-south-1 --tail
```

### Check SQS Queue
```bash
aws sqs get-queue-attributes \
  --queue-url https://sqs.ap-south-1.amazonaws.com/864624564506/vogueai-jobs-production \
  --attribute-names All \
  --region ap-south-1
```

---

## URLs

| Resource | URL |
|----------|-----|
| Frontend | https://d1vq3j4injpshr.cloudfront.net |
| API | https://bujyxn1oa0.execute-api.ap-south-1.amazonaws.com/production |
| API Health | https://bujyxn1oa0.execute-api.ap-south-1.amazonaws.com/production/health |

---

## Deployment Script

A convenience script `deploy-lambda.sh` is provided:

```bash
#!/bin/bash
set -e

echo "Building SAM application..."
sam build --use-container

echo "Deploying to AWS..."
sam deploy --config-file samconfig.toml

echo "Deployment complete!"
echo "API URL: $(aws cloudformation describe-stacks --stack-name vogueai-serverless --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text --region ap-south-1)"
```

Run with:
```bash
cd server
./deploy-lambda.sh
```
