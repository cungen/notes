---
title: 
draft: false
tags:
  - Area/RD/系统设计
  - Area/RD
---
## python中常用的make命令

```cmake
.PHONY: help
help: ## Show this help
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

## Basic Script
IMAGE_NAME=foobar
BUILD_TIME_HASH=$(shell date "+%Y%m%d_%H%M")
LATEST_IMAGE=$(shell docker images --format '{{.Repository}}:{{.Tag}}' | grep "^$IMAGE_NAME:" | head -n 1 | awk -F':' '{print $$NF}')

.PHONY: dev
dev: ## Start development server
	$(DEV_ENV_VARS) ENV_FILE_PATH=.env.dev uv run python src/server.py

.PHONY: build_image
build_image:	## build the docker image for deploy
	IMAGE_TAG=$(BUILD_TIME_HASH) docker compose -f docker-compose-prod.yaml build

.PHONY: deploy
deploy: ## Deploy the application
	IMAGE_TAG=$(LATEST_IMAGE) docker compose -f docker-compose-prod.yaml up -d


## **DB Migration**
### Alembic for SQLAlchemy ORM
.PHONY: db_downgrade
db_downgrade:  ## Downgrade alembic database/schema by one step
	uv run alembic downgrade -1

.PHONY: db_create_migration
db_create_migration:  ## Create new alembic database migration aka database revision. m=xx is needed
	uv run alembic revision --autogenerate -m "$(m)"

.PHONY: db_apply_migrations
db_apply_migrations: ## apply alembic migrations to database/schema
	uv run alembic upgrade head


DEV_ENV_VARS := PYTHONPATH=$(shell pwd)/src TARGET=dev
### Aerich for TORTOISE_ORM
.PHONY: aerich_db_init
aerich_db_init: ## Initialize aerich
	$(DEV_ENV_VARS) uv run aerich init -t dm_service.common.db.TORTOISE_ORM
	$(DEV_ENV_VARS) uv run aerich init-db

.PHONY: aerich_db_migrate
aerich_db_migrate: ## Migrate aerich
	$(DEV_ENV_VARS) uv run aerich migrate

.PHONY: aerich_db_upgrade_dev
aerich_db_upgrade_dev: ## Upgrade aerich for dev
	$(DEV_ENV_VARS) ENV_FILE_PATH=.env.dev uv run aerich upgrade

.PHONY: aerich_db_upgrade
aerich_db_upgrade: ## Upgrade aerich
	$(DEV_ENV_VARS) uv run aerich upgrade

.PHONY: aerich_db_heads
aerich_db_heads: ## Show aerich heads
	$(DEV_ENV_VARS) uv run aerich heads

.PHONY: aerich_db_downgrade
aerich_db_downgrade: ## Downgrade aerich
	$(DEV_ENV_VARS) uv run aerich downgrade

```

