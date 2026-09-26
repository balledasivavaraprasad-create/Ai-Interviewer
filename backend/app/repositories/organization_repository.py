from typing import List, Optional, Dict, Any
from app.repositories.base import BaseRepository

class OrganizationRepository(BaseRepository):
    def __init__(self):
        super().__init__("organizations")

    def list_all(self) -> List[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            docs = list(col.find({"status": "ACTIVE"}))
            return [self.clean_doc(d) for d in docs]
        return list(self._memory_store.values())

    def get_by_id(self, org_id: str) -> Optional[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            doc = col.find_one({"id": org_id})
            if doc:
                return self.clean_doc(doc)
        return self._memory_store.get(org_id)

    def upsert(self, org: Dict[str, Any]) -> Dict[str, Any]:
        org_id = org["id"]
        col = self.collection
        if col is not None:
            col.update_one({"id": org_id}, {"$set": org}, upsert=True)
        self._memory_store[org_id] = org
        return org

org_repo = OrganizationRepository()
