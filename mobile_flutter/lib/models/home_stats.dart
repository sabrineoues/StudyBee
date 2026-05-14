class HomeStats {
  final int studentsSupported;
  final int studyMinutesGuided;
  final double studyHoursGuided;

  HomeStats({
    required this.studentsSupported,
    required this.studyMinutesGuided,
    required this.studyHoursGuided,
  });

  factory HomeStats.fromJson(Map<String, dynamic> json) {
    final minutes = (json['study_minutes_guided'] as num?)?.toInt() ?? 0;
    final hours = (json['study_hours_guided'] as num?)?.toDouble() ?? (minutes / 60.0);

    return HomeStats(
      studentsSupported: (json['students_supported'] as num?)?.toInt() ?? 0,
      studyMinutesGuided: minutes,
      studyHoursGuided: hours,
    );
  }
}