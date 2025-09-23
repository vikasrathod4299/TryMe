import ast
import time
from workers.processor import process_job
from app.upload.model import UserUpload  
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
            body = ast.literal_eval(msg['Body'])
            job_id = body.get('job_id')

            try:
                print(f"Processing job {job_id}...")
                result_key = process_job(body)
                print(f"Job {job_id} completed.")

                # Update database record
                upload_record = UserUpload.objects(job_id=job_id).first()
                if upload_record:
                    upload_record.result_key= result_key
                    upload_record.status = 'completed'
                    upload_record.save()

                    print(f"Database updated for job {job_id}.")

            except Exception as e:
                print(f"Error processing job {job_id}: {e}")
            finally:    
                # Delete message from queue after processing
                delete_message(msg['ReceiptHandle'])
                print(f"Job {job_id} message deleted from queue.")

if __name__ == "__main__":
    run_worker()