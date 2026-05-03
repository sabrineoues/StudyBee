from pathlib import Path
import os
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-mcq3zxozoaq6vide-9)@9)9gx%rxio33_344c6w@i+_m1a#8ms'

DEBUG = True

ALLOWED_HOSTS = [
'localhost',
'127.0.0.1',
'testserver',
]

# -------------------------

# INSTALLED APPS

# -------------------------

INSTALLED_APPS = [
'django.contrib.admin',
'django.contrib.auth',
'django.contrib.contenttypes',
'django.contrib.sessions',
'django.contrib.messages',
'django.contrib.staticfiles',


# your apps
'users',
'journal',
'studysessions',
#'todolist',

# teammate apps
'ratings',
'vision',

# third-party
'corsheaders',
'rest_framework',


]

# -------------------------

# MIDDLEWARE

# -------------------------

MIDDLEWARE = [
"corsheaders.middleware.CorsMiddleware",  # MUST be first
'django.middleware.security.SecurityMiddleware',
'django.contrib.sessions.middleware.SessionMiddleware',
'django.middleware.common.CommonMiddleware',
'django.middleware.csrf.CsrfViewMiddleware',
'django.contrib.auth.middleware.AuthenticationMiddleware',
'django.contrib.messages.middleware.MessageMiddleware',
'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# -------------------------

# TEMPLATES

# -------------------------

TEMPLATES = [
{
'BACKEND': 'django.template.backends.django.DjangoTemplates',
'DIRS': [],
'APP_DIRS': True,
'OPTIONS': {
'context_processors': [
'django.template.context_processors.request',
'django.contrib.auth.context_processors.auth',
'django.contrib.messages.context_processors.messages',
],
},
},
]

WSGI_APPLICATION = 'config.wsgi.application'

# -------------------------

# DATABASE

# -------------------------

DATABASES = {
'default': {
'ENGINE': 'django.db.backends.postgresql',
'NAME': 'studybee',
'USER': 'postgres',
'PASSWORD': '0000',
'HOST': '127.0.0.1',
'PORT': '5432',
'OPTIONS': {
'client_encoding': 'UTF8',
},
}
}

# -------------------------

# PASSWORD VALIDATION

# -------------------------

AUTH_PASSWORD_VALIDATORS = [
{'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
{'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
{'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
{'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# -------------------------

# INTERNATIONALIZATION

# -------------------------

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# -------------------------

# STATIC / MEDIA

# -------------------------

STATIC_URL = 'static/'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# -------------------------

# EMAIL CONFIG

# -------------------------

EMAIL_BACKEND = os.getenv(
"DJANGO_EMAIL_BACKEND",
"django.core.mail.backends.console.EmailBackend"
if DEBUG
else "django.core.mail.backends.smtp.EmailBackend",
)

_email_backend_is_smtp = EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend"

EMAIL_HOST = os.getenv("DJANGO_EMAIL_HOST", "smtp.sendgrid.net" if _email_backend_is_smtp else "")
EMAIL_PORT = int(os.getenv("DJANGO_EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("DJANGO_EMAIL_USE_TLS", "1") == "1"
EMAIL_HOST_USER = os.getenv("DJANGO_EMAIL_HOST_USER", "apikey" if _email_backend_is_smtp else "")
EMAIL_HOST_PASSWORD = os.getenv("DJANGO_EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DJANGO_DEFAULT_FROM_EMAIL", "StudyBee [youraddress@gmail.com](mailto:youraddress@gmail.com)")

FRONTEND_URL = os.getenv("STUDYBEE_FRONTEND_URL", "http://localhost:5173")

PASSWORD_RESET_TIMEOUT = int(os.getenv("DJANGO_PASSWORD_RESET_TIMEOUT", str(60 * 60 * 24)))

# -------------------------

# CORS (FROM YOUR VERSION)

# -------------------------

CORS_ALLOW_ALL_ORIGINS = True

# -------------------------

# DRF + JWT (THEIR VERSION)

# -------------------------

REST_FRAMEWORK = {
'DEFAULT_AUTHENTICATION_CLASSES': (
'rest_framework_simplejwt.authentication.JWTAuthentication',
),
}

SIMPLE_JWT = {
'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
}

# -------------------------

# DEFAULT PK

# -------------------------

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
