class StudySessionStats {
  final int totalSessions;
  final int completedSessions;
  final int inProgressSessions;
  final int totalStudyMinutes;
  final double totalStudyHours;

  StudySessionStats({
    required this.totalSessions,
    required this.completedSessions,
    required this.inProgressSessions,
    required this.totalStudyMinutes,
    required this.totalStudyHours,
  });

  factory StudySessionStats.fromJson(Map<String, dynamic> json) {
    return StudySessionStats(
      totalSessions: (json['total_sessions'] as num?)?.toInt() ?? 0,
      completedSessions: (json['completed_sessions'] as num?)?.toInt() ?? 0,
      inProgressSessions: (json['in_progress_sessions'] as num?)?.toInt() ?? 0,
      totalStudyMinutes: (json['total_study_minutes'] as num?)?.toInt() ?? 0,
      totalStudyHours: (json['total_study_hours'] as num?)?.toDouble() ?? 0,
    );
  }
}