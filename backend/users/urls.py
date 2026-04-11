from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminStatsAPIView,
    AdminUserDetailAPIView,
    AdminUsersAPIView,
    HomeStatsAPIView,
    MeAPIView,
    PasswordResetConfirmAPIView,
    PasswordResetRequestAPIView,
    ProfileAPIView,
    ProfileAvatarAPIView,
    StudentSignInAPIView,
    StudentSignUpAPIView,
)

urlpatterns = [
    path('sign-up/', StudentSignUpAPIView.as_view(), name='api_sign_up'),
    path('sign-in/', StudentSignInAPIView.as_view(), name='api_sign_in'),
    path('token/refresh/', TokenRefreshView.as_view(), name='api_token_refresh'),
    path('home-stats/', HomeStatsAPIView.as_view(), name='api_home_stats'),
    path('password-reset/', PasswordResetRequestAPIView.as_view(), name='api_password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmAPIView.as_view(), name='api_password_reset_confirm'),
    path('me/', MeAPIView.as_view(), name='api_me'),
    path('profile/', ProfileAPIView.as_view(), name='api_profile'),
    path('profile/avatar/', ProfileAvatarAPIView.as_view(), name='api_profile_avatar'),
    path('admin/stats/', AdminStatsAPIView.as_view(), name='api_admin_stats'),
    path('admin/users/', AdminUsersAPIView.as_view(), name='api_admin_users'),
    path('admin/users/<int:user_id>/', AdminUserDetailAPIView.as_view(), name='api_admin_user_detail'),
]
