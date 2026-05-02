from django.urls import path

from .views import (
    AdminStatsAPIView,
    AdminUserDetailAPIView,
    AdminUsersAPIView,
    MeAPIView,
    ProfileAPIView,
    StudentSignInAPIView,
    StudentSignUpAPIView,
)

urlpatterns = [
    path('sign-up/', StudentSignUpAPIView.as_view(), name='api_sign_up'),
    path('sign-in/', StudentSignInAPIView.as_view(), name='api_sign_in'),
    path('me/', MeAPIView.as_view(), name='api_me'),
    path('profile/', ProfileAPIView.as_view(), name='api_profile'),
    path('admin/stats/', AdminStatsAPIView.as_view(), name='api_admin_stats'),
    path('admin/users/', AdminUsersAPIView.as_view(), name='api_admin_users'),
    path('admin/users/<int:user_id>/', AdminUserDetailAPIView.as_view(), name='api_admin_user_detail'),
]
