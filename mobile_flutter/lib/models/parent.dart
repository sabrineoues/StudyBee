class ParentProfile {
  final int id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;
  final String? avatar;
  final List<int>? childrenIds;

  ParentProfile({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    this.avatar,
    this.childrenIds,
  });

  factory ParentProfile.fromJson(Map<String, dynamic> json) {
    return ParentProfile(
      id: json['id'] ?? 0,
      email: json['email'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      phone: json['phone'],
      avatar: json['avatar'],
      childrenIds: json['children_ids'] != null
          ? List<int>.from(json['children_ids'])
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'email': email,
        'first_name': firstName,
        'last_name': lastName,
        'phone': phone,
      };
}
