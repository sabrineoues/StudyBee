from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum

from .models import StudySession
from .serializers import AdminStudySessionSerializer, StudySessionSerializer


DEFAULT_STUDY_DURATION = 25
DEFAULT_BREAK_DURATION = 5


class StudySessionListCreateAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		sessions = StudySession.objects.filter(user=request.user).order_by("-created_at")
		return Response(StudySessionSerializer(sessions, many=True).data, status=status.HTTP_200_OK)

	def post(self, request):
		serializer = StudySessionSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		session = serializer.save(
			user=request.user,
			study_duration=DEFAULT_STUDY_DURATION,
			break_duration=DEFAULT_BREAK_DURATION,
		)
		return Response(StudySessionSerializer(session).data, status=status.HTTP_201_CREATED)


class StudySessionStatsAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		queryset = StudySession.objects.filter(user=request.user)
		total_sessions = queryset.count()
		completed_sessions = queryset.filter(status="completed").count()
		in_progress_sessions = queryset.filter(status="in_progress").count()
		total_minutes = queryset.aggregate(total=Sum("study_duration")).get("total") or 0

		return Response(
			{
				"total_sessions": total_sessions,
				"completed_sessions": completed_sessions,
				"in_progress_sessions": in_progress_sessions,
				"total_study_minutes": int(total_minutes),
				"total_study_hours": round(float(total_minutes) / 60, 1),
			},
			status=status.HTTP_200_OK,
		)


class StudySessionDetailAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get_object(self, request, session_id: int):
		return StudySession.objects.filter(id=session_id, user=request.user).first()

	def get(self, request, session_id: int):
		session = self.get_object(request, session_id)
		if not session:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
		return Response(StudySessionSerializer(session).data, status=status.HTTP_200_OK)

	def patch(self, request, session_id: int):
		session = self.get_object(request, session_id)
		if not session:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

		if "study_duration" in request.data or "break_duration" in request.data:
			return Response(
				{"detail": "Pomodoro and break durations are fixed for students."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		serializer = StudySessionSerializer(session, data=request.data, partial=True)
		serializer.is_valid(raise_exception=True)
		session = serializer.save()
		return Response(StudySessionSerializer(session).data, status=status.HTTP_200_OK)

	def delete(self, request, session_id: int):
		session = self.get_object(request, session_id)
		if not session:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

		session.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)


class AdminStudySessionListAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		if not (request.user.is_staff or request.user.is_superuser):
			return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

		sessions = StudySession.objects.all().order_by("-created_at")
		return Response(AdminStudySessionSerializer(sessions, many=True).data, status=status.HTTP_200_OK)


class AdminStudySessionDetailAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get_object(self, session_id: int):
		return StudySession.objects.filter(id=session_id).first()

	def ensure_admin(self, request):
		if not (request.user.is_staff or request.user.is_superuser):
			return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
		return None

	def patch(self, request, session_id: int):
		not_authorized = self.ensure_admin(request)
		if not_authorized:
			return not_authorized

		session = self.get_object(session_id)
		if not session:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

		serializer = AdminStudySessionSerializer(session, data=request.data, partial=True)
		serializer.is_valid(raise_exception=True)
		session = serializer.save()
		return Response(AdminStudySessionSerializer(session).data, status=status.HTTP_200_OK)

	def delete(self, request, session_id: int):
		not_authorized = self.ensure_admin(request)
		if not_authorized:
			return not_authorized

		session = self.get_object(session_id)
		if not session:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

		session.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)
