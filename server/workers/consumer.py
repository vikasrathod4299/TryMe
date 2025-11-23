import boto3
import os
import json
from dotenv import load_dotenv

load_dotenv()

sqs = boto3.client(
    'sqs', 
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)

queue_url = os.getenv('SQS_QUEUE_URL')


def poll_messages():
    
    response = sqs.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=1,
        WaitTimeSeconds=20
    )
    print(response)

    return response.get('Messages', [])

def delete_message(receipt_handle):
    sqs.delete_message(
        QueueUrl=queue_url,
        ReceiptHandle=receipt_handle
    )