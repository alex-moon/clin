from django.conf.urls import patterns, include, url
from django.contrib import admin

from clin import card, core

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^card/', include(card.urls)),
    url(r'', include(core.urls)),
)
