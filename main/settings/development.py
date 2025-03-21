from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# This is what you need for development
STATICFILES_DIRS = [
    BASE_DIR / 'app' / 'static',
]

# Don't set STATIC_ROOT in development
STATIC_ROOT = None
