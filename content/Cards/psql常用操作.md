---
title:
draft: false
tags:
  - resource/学习笔记
  - kind/note
  - state/draft
  - inbox
date: 2025-05-27
---

```bash
# 导出数据
pg_dump -U postgres -t public.customers -f customers_backup.sql mydatabase

# 导入数据
psql -U postgres -d mydatabase -f customers_backup.sql

```

```sql
-- 修改owner
ALTER TABLE [schema_name.]table_name OWNER TO new_owner;
```