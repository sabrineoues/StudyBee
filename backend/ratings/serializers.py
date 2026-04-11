from rest_framework import serializers


class SiteRatingSetSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
