from .base import *

from dotenv import load_dotenv
import os

load_dotenv()

DEBUG = True

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")