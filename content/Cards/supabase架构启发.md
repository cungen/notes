---
title: 
draft: false
tags:
  - Area/RD/架构
---

## [Supabase](https://github.com/supabase/supabase)的技术栈

- [Postgrest](https://docs.postgrest.org/en/v13/)：Restful API
	- [prest](https://github.com/prest/prest)：alternative， 据说more simpler
- [Kong](https://docs.konghq.com/)：Gateway
- [Postgres-meta](https://github.com/supabase/postgres-meta)：管理pg库
- Logflare日志管理解决方案
- [Vector](https://github.com/vectordotdev/vector) 日志与指标采集


### Selfhost 限制

- 没有API管理相关内容
- 没有Edge Function相关内容
- 2G内存下无法使用

## 类似 #Baas

- [pigsty](pigsty.io)
	- [Minio](https://github.com/minio/minio)： #对象存储 S3
	- [Postgres-meta](https://github.com/supabase/postgres-meta)：管理pg库
	- Loki：日志
- [fireboom](https://github.com/fireboomio/fireboom)
	- 优：资源要求低，响应快，以GraphQL为主，支持集成不同db与s3存储
	- 缺：bug太多了