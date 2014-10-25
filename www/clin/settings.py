# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
BASE_DIR = os.path.dirname(os.path.dirname(__file__))


SECRET_KEY = os.environ.get('django_secret_key', 'gfaqpd=2n+@3r%at+g+006_4)f*f%*=kz7u8n-o*&4r)evbbd-')
TEMPLATE_DEBUG = DEBUG = os.environ.get('buildenv', 'local') != 'prod'
ALLOWED_HOSTS = ['clin', 'clin.elasticbeanstalk.com']


INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'django_extensions',

    'clin.card',
)


MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)


ROOT_URLCONF = 'clin.urls'
WSGI_APPLICATION = 'clin.wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('db_name', 'clin'),
        'HOST': os.environ.get('db_host', '127.0.0.1'),
        'USER': os.environ.get('db_user', 'clin'),
        'PASSWORD': os.environ.get('db_pass', 'clin'),
    }
}


TEMPLATE_DIRS = (
    os.path.join(BASE_DIR, "templates"),
)


STATIC_URL = '/static/'
STATICFILES_DIRS = (
    os.path.join(BASE_DIR, "static"),
)
STATIC_ROOT = "/var/www/public/static/"
