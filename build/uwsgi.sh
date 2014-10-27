#!/bin/bash
export buildenv=prod
source /var/www/rds.conf && uwsgi \
    --socket 0.0.0.0:8765 \
    --chdir /var/www/clin \
    --module clin.wsgi \
    --callable application \
    --uid www-data \
    --gid www-data \
    --master \
    --processes 4 \
    --threads 1 \
    --pidfile /var/run/uwsgi.pid
