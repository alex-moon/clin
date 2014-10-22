from django.conf.urls import patterns, include, url
from django.contrib import admin

from clin.card import urls as card_urls
from clin.core import urls as core_urls

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^cards/', include(card_urls)),
    url(r'', include(core_urls)),
)
