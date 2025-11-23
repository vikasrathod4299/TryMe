import json
import time
from app.config.database import SessionLocal
from workers.processor import process_job
from app.upload.model import UserUpload as UserUploadModel
from app.user.model import User  # Import User model to resolve relationship
from app.auth.model import RefreshToken
from workers.consumer import poll_messages, delete_message

def run_worker():
    print('Worker started, polling for messages...')

    while True:
        messages = poll_messages()

        if not messages:
            print("No messages in queue, waiting...")
            time.sleep(5)
            continue

        for msg in messages:
            try:
                # Parse JSON message body
                body = json.loads(msg['Body'])
                job_id = body.get('job_id')

                print(f"Processing job {job_id}...")
                result_key = process_job(body)
                print(f"Job {job_id} completed.")

            except json.JSONDecodeError as e:
                print(f"Error parsing message JSON: {e}")
                print(f"Message body: {msg['Body']}")
            except Exception as e:
                print(f"Error processing job: {e}")
            finally:    
                # Delete message from queue after processing
                delete_message(msg['ReceiptHandle'])
                print(f"Message deleted from queue.")

if __name__ == "__main__":
    run_worker()