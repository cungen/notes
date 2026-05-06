---
title: "memo_python-fastapi"
draft: false
tags:
  - area/rd/python
  - kind/memo
  - state/verified
create_at: 2023-07-26T20:35:00
---

python, fastapi
```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.controllers.user import router as user_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router, prefix="/user")
```
```python
# controllers/user.py
import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/info")
def info():
    return {}

```