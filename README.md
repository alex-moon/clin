Clin
====

Clin is a very simple flash card app built on Django 1.7 using jQuery 2.1.1, Bootstrap 3.2.0, Underscore 1.7.0 and Backbone 1.1.2.

The backend consists of a single template view which loads our master JS object which communicates with Django via JSON over AJAX.
This Javascript is responsible for loading cards from the server, rendering the card templates, registering user actions (either add a
card or answer a card) and persisting, first in a cookie on the client side, and then, if the server is available, with a MySQL database on the server side.

It's designed to be front-end heavy so that the user can load the home page (before, e.g. going underground) and then answer a certain number of
cards without needing an Internet connection.
