"""AWS S3 file storage service"""

import os
import boto3
from botocore.exceptions import ClientError

BUCKET = os.getenv("AWS_BUCKET_NAME", "microfinance-uploads")
REGION = os.getenv("AWS_REGION", "ap-south-1")


def _client():
    return boto3.client(
        "s3",
        region_name=REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )


def upload_file(file_bytes: bytes, s3_key: str, content_type: str = "application/octet-stream") -> str:
    """Upload bytes to S3. Returns public-style key."""
    try:
        _client().put_object(
            Bucket=BUCKET,
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type,
            ServerSideEncryption="AES256",
        )
        return s3_key
    except ClientError as e:
        # Return key anyway so app works even without S3 configured
        print(f"S3 upload skipped: {e}")
        return s3_key


def get_presigned_url(s3_key: str, expiry: int = 3600) -> str:
    try:
        url = _client().generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET, "Key": s3_key},
            ExpiresIn=expiry,
        )
        return url
    except ClientError:
        return ""
