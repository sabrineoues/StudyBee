class ChildData {
  final int? id;
  final String firstName;
  final String lastName;
  final String? email;
  final String? classLevel;
  final String? avatarUrl;

  ChildData({
    this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    this.classLevel,
    this.avatarUrl,
  });

  factory ChildData.fromJson(Map<String, dynamic> json) {
    return ChildData(
      id: json['id'],
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      email: json['email'],
      classLevel: json['class_level'] ?? '',
      avatarUrl: json['avatar_url'],
    );
  }
}
