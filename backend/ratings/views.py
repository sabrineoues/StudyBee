from django.db.models import Avg, Count
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiteRating
from .serializers import SiteRatingSetSerializer


class RatingsAPIView(APIView):
    def get_permissions(self):
        if self.request.method in {"POST", "PUT", "PATCH"}:
            return [IsAuthenticated()]
        return [AllowAny()]

    def _summary_payload(self, request):
        agg = SiteRating.objects.aggregate(avg=Avg("rating"), count=Count("id"))
        average = float(agg.get("avg") or 0.0)
        count = int(agg.get("count") or 0)

        payload = {
            "average": round(average, 2),
            "count": count,
            "my_rating": None,
        }

        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            payload["my_rating"] = (
                SiteRating.objects.filter(user=user).values_list("rating", flat=True).first()
            )

        return payload

    def get(self, request):
        return Response(self._summary_payload(request))

    def post(self, request):
        serializer = SiteRatingSetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rating = int(serializer.validated_data["rating"])

        obj, created = SiteRating.objects.get_or_create(user=request.user, defaults={"rating": rating})
        if not created and obj.rating != rating:
            obj.rating = rating
            obj.save(update_fields=["rating", "updated_at"])

        return Response(self._summary_payload(request))

    patch = post
    put = post
