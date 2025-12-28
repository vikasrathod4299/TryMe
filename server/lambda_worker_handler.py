"""
Lambda handler for the SQS Worker.
This Lambda is triggered by SQS messages and processes try-on jobs.
"""
import json
import os
from workers.processor import process_job
from app import logger


def handler(event, context):
    """
    AWS Lambda handler for SQS events.
    
    Event structure:
    {
        "Records": [
            {
                "messageId": "...",
                "body": "{\"job_id\": \"...\", \"user_id\": \"...\", ...}",
                "receiptHandle": "...",
                ...
            }
        ]
    }
    """
    logger.info(f"Received {len(event.get('Records', []))} messages")
    
    # Process each message in the batch
    failed_message_ids = []
    
    for record in event.get('Records', []):
        message_id = record.get('messageId')
        
        try:
            # Parse the message body
            body = json.loads(record['body'])
            job_id = body.get('job_id')
            
            logger.info(f"Processing job {job_id} (message: {message_id})")
            
            # Process the job
            result_key = process_job(body)
            
            logger.info(f"Job {job_id} completed successfully. Result: {result_key}")
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse message {message_id}: {e}")
            failed_message_ids.append(message_id)
            
        except Exception as e:
            logger.error(f"Failed to process message {message_id}: {e}")
            failed_message_ids.append(message_id)
    
    # Return batch item failures for partial batch response
    # This allows successfully processed messages to be deleted
    # while failed ones are retried
    if failed_message_ids:
        return {
            "batchItemFailures": [
                {"itemIdentifier": msg_id} for msg_id in failed_message_ids
            ]
        }
    
    return {"statusCode": 200, "body": "All messages processed successfully"}
