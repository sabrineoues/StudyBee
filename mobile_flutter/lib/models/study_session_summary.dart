class StudySessionSummary {
  final int id;
  final String title;
  final int studyDuration;
  final int breakDuration;
  final String subject;
  final String status;
  final bool pinned;
  final int focusScore;
  final int streakScore;
  final String date;
  final String createdAt;
  final String updatedAt;

  StudySessionSummary({
    required this.id,
    required this.title,
    required this.studyDuration,
    required this.breakDuration,
    required this.subject,
    required this.status,
    required this.pinned,
    required this.focusScore,
    required this.streakScore,
    required this.date,
    required this.createdAt,
    required this.updatedAt,
  });

  factory StudySessionSummary.fromJson(Map<String, dynamic> json) {
    return StudySessionSummary(
      id: (json['id'] as num?)?.toInt() ?? 0,
      title: json['title']?.toString() ?? '',
      studyDuration: (json['study_duration'] as num?)?.toInt() ?? 0,
      breakDuration: (json['break_duration'] as num?)?.toInt() ?? 0,
      subject: json['subject']?.toString() ?? '',
      status: json['status']?.toString() ?? 'in_progress',
      pinned: json['pinned'] == true,
      focusScore: (json['focusScore'] as num?)?.toInt() ?? 0,
      streakScore: (json['streakscore'] as num?)?.toInt() ?? 0,
      date: json['date']?.toString() ?? '',
      createdAt: json['created_at']?.toString() ?? '',
      updatedAt: json['updated_at']?.toString() ?? '',
    );
  }
}