class AuthResponse {
  final String? access;
  final String? refresh;
  final ParentData? parent;
  final String? message;
  final bool success;

  AuthResponse({
    this.access,
    this.refresh,
    this.parent,
    this.message,
    required this.success,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      access: json['access'],
      refresh: json['refresh'],
      parent: json['parent'] != null
          ? ParentData.fromJson(json['parent'])
          : null,
      message: json['message'],
      success: json['success'] ?? false,
    );
  }
}

class ParentData {
  final int id;
  final String email;
  final String firstName;
  final String lastName;
  final String? avatar;

  ParentData({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.avatar,
  });

  factory ParentData.fromJson(Map<String, dynamic> json) {
    return ParentData(
      id: json['id'] ?? 0,
      email: json['email'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      avatar: json['avatar'] as String?,
    );
  }
}
