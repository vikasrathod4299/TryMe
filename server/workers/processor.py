import time
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)

BUCKET_NAME = os.getenv('S3_BUCKET_NAME')

def process_job(jon_data):
    avatar_key = jon_data['avatar_key']
    outfit_key = jon_data['outfit_key']

    job_id = jon_data['job_id']

    print(f"Processing job {job_id} with avatar {avatar_key} and outfit {outfit_key}")

    avatar_file = f"/tmp/{os.path.basename(avatar_key)}"
    outfit_file = f"/tmp/{os.path.basename(outfit_key)}"

    s3.download_file(BUCKET_NAME, avatar_key, avatar_file)
    s3.download_file(BUCKET_NAME, outfit_key, outfit_file)

    print(f"Downloaded files for job {job_id}. Simulating processing...")

    time.sleep(5)

    with open(avatar_file, 'rb') as f_in:
        with open(f"/tmp/processed_{os.path.basename(avatar_key)}", 'wb') as f_out:
            f_out.write(f_in.read())

    result_key = f"processed/{job_id}/processed_{os.path.basename(avatar_key)}"

    s3.upload_file(f"/tmp/processed_{os.path.basename(avatar_key)}", BUCKET_NAME, result_key)

    print(f"Uploaded processed file to {result_key} for job {job_id}")

    return result_key