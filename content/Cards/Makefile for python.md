---
title:
draft: false
tags:
  - area/rd/系统设计
  - kind/note
  - state/draft
date: 2025-05-27
---
### docker

```makefile
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
```

### db script

```makefile
HOSTNAME := $(shell hostname)
.PHONY: celery-worker-beat
celery-worker-beat: ## 启动 Celery worker 和 beat 调度器
	$(ENV_VARS) cd src && uv run celery -A one_task.modules.celery.celery.celery_app worker -Q $(HOSTNAME)  --loglevel=info --beat

.PHONY: celery-flower
celery-flower: ## 启动 Celery flower
	$(ENV_VARS) cd src && uv run celery -A one_task.modules.celery.celery.celery_app flower --port=5566

.PHONY: aerich_init_project
aerich_init_project: ## Initialize aerich
	$(ENV_VARS) uv run aerich init -t one_task.config.tortoise_orm.TORTOISE_ORM

.PHONY: aerich_init_db
aerich_init_db: ## Initialize aerich database
	$(ENV_VARS) uv run aerich init-db

.PHONY: aerich_migrate
aerich_migrate: ## Migrate aerich
	$(ENV_VARS) uv run aerich migrate

.PHONY: aerich_upgrade
aerich_upgrade: ## Upgrade aerich
	$(ENV_VARS) uv run aerich upgrade

.PHONY: aerich_heads
aerich_heads: ## Show aerich heads
	$(ENV_VARS) uv run aerich heads

.PHONY: aerich_downgrade
aerich_downgrade: ## Downgrade aerich
	$(ENV_VARS) uv run aerich downgrade

.PHONY: alembic_downgrade
alembic_downgrade:  ## Downgrade alembic database/schema by one step
	$(ENV_VARS) uv run alembic downgrade -1

.PHONY: alembic_revision
alembic_revision:  ## Create new alembic database migration aka database revision. m=xx is needed
	$(ENV_VARS) uv run alembic revision --autogenerate -m "$(shell date +%Y%m%d_%H%M%S)"

.PHONY: alembic_upgrade
alembic_upgrade: ## apply alembic migrations to database/schema
	$(ENV_VARS) uv run alembic upgrade head

.PHONY: alembic_init
alembic_init: ## Initialize alembic
	$(ENV_VARS) uv run alembic init alembic
```