---
title: 
draft: false
tags:
  - Inbox
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