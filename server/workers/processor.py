import boto3
import os
from dotenv import load_dotenv
from pathlib import Path
from app import logger
from Agent.nodes import try_on_me
from Agent.state import AgentState
from app.config.database import SessionLocal
from app.upload.model import UserUpload, UploadStatus

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
    user_id = jon_data['user_id']

    print(f"Processing job {job_id} with avatar {avatar_key} and outfit {outfit_key}")

    # Create temp directory for job
    temp_dir = Path(f"/tmp/job_{job_id}")
    temp_dir.mkdir(parents=True, exist_ok=True)

    # Download files from S3
    avatar_file = temp_dir / os.path.basename(avatar_key)
    outfit_file = temp_dir / os.path.basename(outfit_key)

    s3.download_file(BUCKET_NAME, avatar_key, str(avatar_file))
    s3.download_file(BUCKET_NAME, outfit_key, str(outfit_file))

    print(f"Downloaded files for job {job_id}")

    try:
        # --------------------------------------------
        # 🚫 REAL GENERATION DISABLED (Dev Mode)
        # --------------------------------------------
        # agent_state: AgentState = {
        #     "person_img": str(avatar_file),
        #     "garment_img": str(outfit_file),
        #     "garment_description": "",
        #     "generated_image": "",
        #     "is_outfit_worn": False
        # }

        # print(f"Running Agent workflow for job {job_id}...")
        # result_state = try_on_me(agent_state)
        # generated_image_name = result_state.get("generated_image")
        # --------------------------------------------

        print("[DEV MODE] Skipping AI try-on — using outfit image as generated output")

        # Mock result
        generated_file = outfit_file
        generated_image_name = f"mock_generated_{generated_file.name}"

        # Upload mock file
        result_key = f"user_{user_id}/job_{job_id}/processed/{generated_image_name}"
        s3.upload_file(str(generated_file), BUCKET_NAME, result_key)

        print(f"[DEV MODE] Uploaded mock generated file to S3: {result_key}")

        # Update database
        with SessionLocal() as db:
            upload_record = db.query(UserUpload).filter(UserUpload.id == job_id).first()
            if upload_record:
                upload_record.result_key = result_key
                upload_record.status = UploadStatus.COMPLETED.value
                db.commit()
                db.refresh(upload_record)

                print(f"Database updated for job {job_id}: COMPLETED")
            else:
                logger.error(f"Upload record not found for job {job_id}")

        return result_key

    except Exception as e:
        logger.error(f"Error processing job {job_id}: {e}")

        # Update db → FAILED
        try:
            with SessionLocal() as db:
                upload_record = db.query(UserUpload).filter(UserUpload.id == job_id).first()
                if upload_record:
                    upload_record.status = UploadStatus.FAILED.value
                    db.commit()
                    print(f"Database updated for job {job_id}: FAILED")
        except Exception as db_error:
            logger.error(f"DB update error for FAILED: {db_error}")

        raise

    finally:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
