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
from .parent_views import (
    ParentProfileAPIView,
    ParentSignInAPIView,
    ParentSignUpAPIView,
)

urlpatterns = [
    path('sign-up/', StudentSignUpAPIView.as_view(), name='api_sign_up'),
    path('sign-in/', StudentSignInAPIView.as_view(), name='api_sign_in'),
    path('parents/sign-up/', ParentSignUpAPIView.as_view(), name='api_parent_sign_up'),
    path('parents/signup/', ParentSignUpAPIView.as_view(), name='api_parent_signup_alias'),
    path('parents/sign-in/', ParentSignInAPIView.as_view(), name='api_parent_sign_in'),
    path('parents/signin/', ParentSignInAPIView.as_view(), name='api_parent_signin_alias'),
    path('parents/profile/', ParentProfileAPIView.as_view(), name='api_parent_profile'),
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
