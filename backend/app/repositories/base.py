from typing import Any, Dict, List, Optional
from app.database import get_collection

class BaseRepository:
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    @property
    def collection(self):
        return get_collection(self.collection_name)

    def clean_doc(self, doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not doc:
            return None
        d = dict(doc)
        if "_id" in d:
            if "id" not in d:
                d["id"] = str(d["_id"])
            del d["_id"]
        return d
