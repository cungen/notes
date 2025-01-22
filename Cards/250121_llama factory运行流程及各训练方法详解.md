#Inbox




```mermaid
flowchart TB

eval -->|Chat| M[model_api]

mm[model management] --> oneapi

M --> oneapi
arena --> oneapi

oneapi --> sglang
oneapi --> o_api[open api]


```
















































