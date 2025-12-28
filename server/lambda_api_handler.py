"""
Lambda handler for the FastAPI application.
Uses Mangum to adapt FastAPI/ASGI to AWS Lambda.
"""
import os
from mangum import Mangum
from app.main import app

# Get the stage name from environment (e.g., "development", "production")
# This is used to strip the stage prefix from the path
stage = os.environ.get("ENVIRONMENT", "development")

# Create the Lambda handler
# Mangum wraps the FastAPI app and handles:
# - API Gateway events (REST API or HTTP API)
# - ALB events
# - Lambda Function URLs
# 
# api_gateway_base_path strips the stage name prefix from the path
# so /development/health becomes /health
handler = Mangum(app, lifespan="off", api_gateway_base_path=f"/{stage}")
