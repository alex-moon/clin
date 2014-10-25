Clin
====

Clin is a very simple flash card app built on Django 1.7 using jQuery 2.1.1, Bootstrap 3.2.0, Underscore 1.7.0 and Backbone 1.1.2.

The backend consists of a single template view which loads our master JS object which communicates with Django via JSON over AJAX.
This Javascript is responsible for loading cards from the server, rendering the card templates, registering user actions (either add a
card or answer a card) and persisting, first in a cookie on the client side, and then, if the server is available, with a MySQL database on the server side.

It's designed to be front-end heavy so that the user can load the home page (before, e.g. going underground) and then answer a certain number of
cards without needing an Internet connection.

Build
-----

Clin is designed to deploy to a fresh box so it's ideal for AWS. Handy dandy build instructions for EC2 and RDS:

1. Start an EC2 instance on Ubuntu and download the secret key to ``clin.pem`` in the root of the project.
2. Set up an EC2 security group with access to ports 22, 80 and 3306 (you should be prompted to do this when you setup your EC2 instance).
2. Start an RDS instance on MySQL and save the appropriate values in ``deploy/rds.conf`` as env ``export``s (see the example ``rds.conf.tpl`` for details).
3. Add your EC2 instance IP to your ``/etc/hosts`` as ``clin`` - this is the hostname expected by ``fabconfig.py``, ``nginx.conf`` and ``settings.py``.
4. Run ``./build.sh`` and fabric should do the rest! Isn't fabric great? I don't know *why* I tried to do this with Elastic Beanstalk.
