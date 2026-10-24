"""Document store: MongoDB when MONGO_URL is set (Emergent), otherwise in memory (local dev)."""

import copy
import os


class MemoryStore:
    def __init__(self):
        self._data: dict[str, dict[str, dict]] = {}

    async def get(self, coll: str, doc_id: str) -> dict | None:
        doc = self._data.get(coll, {}).get(doc_id)
        return copy.deepcopy(doc) if doc else None

    async def put(self, coll: str, doc: dict) -> dict:
        self._data.setdefault(coll, {})[doc["id"]] = copy.deepcopy(doc)
        return doc

    async def all(self, coll: str, **eq) -> list[dict]:
        docs = self._data.get(coll, {}).values()
        return [copy.deepcopy(d) for d in docs if all(d.get(k) == v for k, v in eq.items())]

    async def clear(self, coll: str) -> None:
        self._data.pop(coll, None)


class MongoStore:
    def __init__(self, url: str, db_name: str):
        from motor.motor_asyncio import AsyncIOMotorClient

        self._db = AsyncIOMotorClient(url)[db_name]

    async def get(self, coll: str, doc_id: str) -> dict | None:
        return await self._db[coll].find_one({"id": doc_id}, {"_id": 0})

    async def put(self, coll: str, doc: dict) -> dict:
        await self._db[coll].replace_one({"id": doc["id"]}, doc, upsert=True)
        return doc

    async def all(self, coll: str, **eq) -> list[dict]:
        return await self._db[coll].find(eq, {"_id": 0}).to_list(None)

    async def clear(self, coll: str) -> None:
        await self._db[coll].delete_many({})


def make_store():
    url = os.environ.get("MONGO_URL")
    if url:
        return MongoStore(url, os.environ.get("DB_NAME", "pip"))
    return MemoryStore()
