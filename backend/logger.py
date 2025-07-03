import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logger():
    log_level = os.getenv("LOG_LEVEL", "INFO")
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level),
        format=log_format
    )
    
    # Add file handler if LOG_FILE is specified
    log_file = os.getenv("LOG_FILE")
    if log_file:
        file_handler = RotatingFileHandler(
            log_file, 
            maxBytes=10485760,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(logging.Formatter(log_format))
        logging.getLogger().addHandler(file_handler)
    
    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

# Get logger for a specific module
def get_logger(name):
    return logging.getLogger(name)