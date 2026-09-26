from pymongo import MongoClient
from app.config import settings

class Database:
    client: MongoClient = None
    db = None

db_instance = Database()

def get_database():
    if db_instance.db is None:
        try:
            db_instance.client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=3000)
            db_instance.db = db_instance.client[settings.DATABASE_NAME]
            # Ping connection
            db_instance.client.admin.command('ping')
            print(f"✓ Connected to MongoDB database '{settings.DATABASE_NAME}' successfully.")
        except Exception as e:
            print(f"⚠ Warning: MongoDB connection notice ({e}). Operating in memory-backed mode.")
            db_instance.db = None
    return db_instance.db

def get_collection(name: str):
    db = get_database()
    if db is not None:
        return db[name]
    return None
