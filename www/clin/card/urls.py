from django.conf.urls import patterns, url

from clin.card import views

urlpatterns = patterns('',
    url(r'^get/$', views.GetCardsView.as_view(), name='get-cards'),
    url(r'^add/$', views.AddCardsView.as_view(), name='add-cards'),
    url(r'^answer/$', views.AnswerCardsView.as_view(), name='answer-cards'),
)
