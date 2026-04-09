"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from pathlib import Path

from django.contrib import admin
from django.http import FileResponse, HttpResponse
from django.urls import include, path, re_path
from django.views.static import serve
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/vision/', include('vision.urls')),
    

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


# Dev convenience: if the Vite app is built (frontend/dist), serve it via Django
# so direct refreshes like /dashboard work on the Django port.
if settings.DEBUG:
    FRONTEND_DIST_DIR = Path(settings.BASE_DIR).parent / "frontend" / "dist"

    def spa_index(_request):
        index_path = FRONTEND_DIST_DIR / "index.html"
        if not index_path.exists():
            return HttpResponse(
                "Frontend not built. Run: cd frontend && npm install && npm run build (or npm run dev on :5173).",
                content_type="text/plain",
                status=404,
            )
        return FileResponse(open(index_path, "rb"), content_type="text/html")

    if FRONTEND_DIST_DIR.exists():
        urlpatterns += [
            re_path(
                r"^(?P<path>favicon\.svg|icons\.svg)$",
                serve,
                {"document_root": FRONTEND_DIST_DIR},
            ),
            re_path(
                r"^assets/(?P<path>.*)$",
                serve,
                {"document_root": FRONTEND_DIST_DIR / "assets"},
            ),
            re_path(
                r"^(?!api/|admin/|media/).*$",
                spa_index,
            ),
        ]
