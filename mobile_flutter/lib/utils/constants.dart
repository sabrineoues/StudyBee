class AppConstants {
  // API Base URL
  static const String baseUrl = 'http://127.0.0.1:8000/api';
  
  // API Endpoints - Student
  static const String studentSignUp = '/sign-up/';
  static const String studentSignIn = '/sign-in/';
  static const String studentProfile = '/profile/';
  static const String studentRefreshToken = '/token/refresh/';
  
  // API Endpoints - Parent
  static const String parentSignUp = '/parents/sign-up/';
  static const String parentSignIn = '/parents/sign-in/';
  static const String parentProfile = '/parents/profile/';
  static const String profileAvatar = '/profile/avatar/';
  static const String parentRefreshToken = '/token/refresh/';
  
  // App Strings
  static const String appName = 'StudyBee - Parent';
  static const String welcomeTitle = 'Welcome back';
  static const String joinFamilyTitle = 'Create your family account.';
  static const String joinFamilySubtitle = 'Start tracking progress and supporting your child\'s learning journey.';
  
  // Validation Messages
  static const String emailInvalid = 'Please enter a valid email address';
  static const String passwordTooShort = 'Password must be at least 8 characters';
  static const String passwordsMismatch = 'Passwords do not match';
  static const String fieldRequired = 'This field is required';
  static const String nameInvalid = 'Name must contain only letters';
  static const String phoneInvalid = 'Phone must match +216XXXXXXXX';
}
