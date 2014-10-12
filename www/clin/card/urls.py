from django.conf.urls import patterns, url

from clin.card import views

urlpatterns = patterns('',
    url(r'^get/$', views.GetCardsView.as_view(), name='get-cards'),
    url(r'^add/$', views.AddCardView.as_view(), name='add-card'),
    url(r'^answer/(?P<pk>\d+)/$', views.AnswerCardView.as_view(), name='answer-card'),
)
