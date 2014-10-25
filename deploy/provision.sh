#!/bin/bash
# yeah I know, reinventing the wheel blah blah but this is a no-brainer of a provision so bite me

apt-get update -y
apt-get build-dep -y python-mysqldb
apt-get install -y mysql-client python-pip supervisor nginx

mkdir -p /var/www/          && chown root:www-data /var/www         && chmod 774 /var/www
mkdir -p /var/log/clin/     && chown root:www-data /var/log/clin    && chmod 774 /var/log/clin
usermod -G www-data ubuntu

echo date > /var/www/provisioned
