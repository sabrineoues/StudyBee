from django.urls import path

from .views import RatingsAPIView

urlpatterns = [
    path("ratings/", RatingsAPIView.as_view(), name="api_ratings"),
]
