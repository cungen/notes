---
title: "memo_python-logging"
draft: false
tags:
  - area/rd/python
  - kind/memo
  - state/verified
create_at: 2023-07-26T20:29:00
---

python, logging
```python
import os
import logging
import colorama
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logging_level = logging.DEBUG if os.getenv("ENV") == "dev" else logging.INFO

# Initialize colorama for Windows support
colorama.init()

# Define ANSI escape codes for different colors
COLORS = {
    "RESET": colorama.Style.RESET_ALL,
    "RED": colorama.Fore.RED,
    "GREEN": colorama.Fore.GREEN,
    "YELLOW": colorama.Fore.YELLOW,
    "BLUE": colorama.Fore.BLUE,
    "MAGENTA": colorama.Fore.MAGENTA,
    "CYAN": colorama.Fore.CYAN,
    "WHITE": colorama.Fore.WHITE,
    "BOLD": colorama.Style.BRIGHT,
    "FAINT": colorama.Style.DIM,
    "ITALIC": colorama.Style.NORMAL,
    "UNDERLINE": colorama.Style.NORMAL,
}

# Define a dictionary that maps log levels to color codes
color_map = {
    logging.DEBUG: COLORS["CYAN"],
    logging.INFO: COLORS["GREEN"],
    logging.WARNING: COLORS["YELLOW"],
    logging.ERROR: COLORS["RED"],
    logging.CRITICAL: COLORS["RED"] + COLORS["BOLD"],
}


# Define a custom logging class that overrides the `format` method to add colors
class ColoredFormatter(logging.Formatter):
    def format(self, record):
        # Get the log level's color code from the color_map
        color = color_map.get(record.levelno, COLORS["RESET"])
        # Add the color code to the log level name and square brackets
        levelname = f"{color}{record.levelname}{COLORS['RESET']}"
        # Set the log record's levelname to the colored name
        record.levelname = levelname
        # Call the parent class's format method to format the log message
        msg = super().format(record)
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S,%03d")
        created = f"{COLORS['FAINT']}{now}{COLORS['RESET']}"
        # Add the color code to the log message
        return f"[{created}][{record.name}:{record.lineno}][{levelname}] {msg}"


# Create a console handler and set its formatter to the custom formatter
console_handler = logging.StreamHandler()
console_handler.setFormatter(ColoredFormatter())
```

```python
from .utils.logging import logging_level, console_handler

# set global config in main.py
logging.basicConfig(
    level=logging_level,
    handlers=[console_handler],
)
```

```python
import logging

# use logger
logger = logging.getLogger(__name__)
```