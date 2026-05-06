---
title: "memo_python-sqlalchemy-orm"
draft: false
tags:
  - area/rd/python/orm
  - kind/memo
  - state/verified
create_at: 2023-07-26T20:37:00
---


python, db, orm, sqlalchemy

参考：https://fastapi.tiangolo.com/zh/tutorial/sql-databases/

```python
# utils/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/test"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=5,  # 连接池中的连接数
    max_overflow=0,  # 允许的最大超出连接数
    poolclass=QueuePool,  # 连接池实现
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

```python
# main.py
from .utils.db import SessionLocal

@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    response = Response("Internal server error", status_code=500)
    try:
        request.state.db = SessionLocal()
        response = await call_next(request)
    finally:
        request.state.db.close()
    return response
```

```python
# orms
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from src.utils.db import engine, get_db

Base = declarative_base()


class Tag(Base):
    __tablename__ = "tag"

    id = Column(Integer, primary_key=True)
    name = Column(String)

    @classmethod
    def get_tags(cls):
        for db in get_db():
            return db.query(cls).all()

    @classmethod
    def add(cls, name):
        tag = cls(name=name)
        for db in get_db():
            db.add(tag)
            db.commit()
            db.refresh(tag)
        return tag


Base.metadata.create_all(engine)
```