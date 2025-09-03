# 👗 Outfit Try-On API (FastAPI + AI)

An API-first project to let users **try on outfits virtually** using AI.  
Users upload their own photo + an outfit image, and the backend generates a result image of the person wearing that outfit.

This repo is built with **FastAPI**, **Redis Queue (RQ)** for async jobs, and a pluggable inference layer where you can connect a model like Google’s Nano-Banana, Stable Diffusion, or other try-on pipelines.

---

## 🚀 Features
- Upload **user photo + outfit photo**
- Queue job for async processing
- (Stub) Inference layer — replace with real model call
- Local storage for dev, S3-ready for production
- REST endpoints for:
  - Create try-on job
  - Poll job status
- Ready for Docker deployment

---

## 🏗 Project Structure
outfit-tryon-api/
│── app/
│ ├── main.py # FastAPI entrypoint
│ ├── config.py # Environment settings
│ ├── schemas.py # Pydantic schemas
│ ├── routes/tryon.py # Routes for upload + job status
│ └── services/
│ ├── storage.py # Local/S3 storage adapter
│ ├── queue.py # Redis Queue setup
│ └── inference.py # Stub inference function
│── .env.example # Example environment vars
│── requirements.txt # Python dependencies
│── Dockerfile # Container setup
│── README.md # You’re here

---

## ⚙️ Quickstart (Dev)

### Prerequisites
- Python 3.10+
- [Docker](https://docs.docker.com/get-docker/) (for Redis)
- Git

### Setup
```bash
# clone repo
git clone https://github.com/<your-username>/outfit-tryon-api.git
cd outfit-tryon-api

# setup venv
python -m venv .venv
source .venv/bin/activate

# install dependencies
pip install -r requirements.txt

# run redis
docker run -p 6379:6379 -d redis:7
