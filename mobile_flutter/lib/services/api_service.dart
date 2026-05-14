import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/auth_response.dart';
import '../models/home_stats.dart';
import '../models/study_session_stats.dart';
import '../models/study_session_summary.dart';
import '../utils/constants.dart';

class ApiService {
  static const storage = FlutterSecureStorage();
  
  static Future<void> saveTokens(String? access, String? refresh) async {
    if (access != null) {
      await storage.write(key: 'access_token', value: access);
    }
    if (refresh != null) {
      await storage.write(key: 'refresh_token', value: refresh);
    }
  }

  static Future<String?> getAccessToken() async {
    return await storage.read(key: 'access_token');
  }

  static Future<String?> getRefreshToken() async {
    return await storage.read(key: 'refresh_token');
  }

  static Future<void> clearTokens() async {
    await storage.delete(key: 'access_token');
    await storage.delete(key: 'refresh_token');
  }

  static String _extractErrorMessage(http.Response response, {String fallback = 'Registration failed'}) {
    try {
      final data = jsonDecode(response.body);
      if (data is Map<String, dynamic>) {
        final errors = data['errors'];
        if (errors is Map<String, dynamic> && errors.isNotEmpty) {
          final firstError = errors.values.first;
          if (firstError is List && firstError.isNotEmpty) {
            return firstError.first.toString();
          }
          if (firstError is Map && firstError.isNotEmpty) {
            final nestedFirstError = firstError.values.first;
            if (nestedFirstError is List && nestedFirstError.isNotEmpty) {
              return nestedFirstError.first.toString();
            }
            return nestedFirstError.toString();
          }
          return firstError.toString();
        }

        final message = data['message'];
        if (message is String && message.isNotEmpty) {
          return message;
        }

        if (data['detail'] is String) {
          return data['detail'] as String;
        }
      }
    } catch (_) {
      // Fall back to the default message below.
    }
    return fallback;
  }

  static Future<AuthResponse> parentSignUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.parentSignUp}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'password_confirm': password,
          'first_name': firstName,
          'last_name': lastName,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final authResponse = AuthResponse.fromJson(data);
        if (authResponse.access != null && authResponse.refresh != null) {
          await saveTokens(authResponse.access, authResponse.refresh);
        }
        return authResponse;
      } else if (response.statusCode == 400) {
        return AuthResponse(
          success: false,
          message: _extractErrorMessage(response),
        );
      } else {
        return AuthResponse(
          success: false,
          message: 'Server error: ${response.statusCode}',
        );
      }
    } catch (e) {
      return AuthResponse(
        success: false,
        message: 'Error: ${e.toString()}',
      );
    }
  }

  static Future<AuthResponse> parentSignIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.parentSignIn}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final authResponse = AuthResponse.fromJson(data);
        if (authResponse.access != null && authResponse.refresh != null) {
          await saveTokens(authResponse.access, authResponse.refresh);
        }
        return authResponse;
      } else if (response.statusCode == 401) {
        return AuthResponse(
          success: false,
          message: 'Invalid email or password',
        );
      } else {
        return AuthResponse(
          success: false,
          message: 'Server error: ${response.statusCode}',
        );
      }
    } catch (e) {
      return AuthResponse(
        success: false,
        message: 'Error: ${e.toString()}',
      );
    }
  }

  static Future<Map<String, dynamic>> getParentProfile() async {
    try {
      final token = await getAccessToken();
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.parentProfile}'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return data;
      } else {
        return {'success': false, 'status': response.statusCode, 'body': response.body};
      }
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<HomeStats> getHomeStats() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/home-stats/'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return HomeStats.fromJson(data);
      }
      throw Exception('Server error: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error: ${e.toString()}');
    }
  }

  static Future<StudySessionStats> getMyStudySessionStats() async {
    try {
      final token = await getAccessToken();
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/sessions/stats/'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return StudySessionStats.fromJson(data);
      }
      throw Exception('Server error: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error: ${e.toString()}');
    }
  }

  static Future<List<StudySessionSummary>> listMyStudySessions() async {
    try {
      final token = await getAccessToken();
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/sessions/'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as List<dynamic>;
        return data
            .whereType<Map<String, dynamic>>()
            .map(StudySessionSummary.fromJson)
            .toList();
      }
      throw Exception('Server error: ${response.statusCode}');
    } catch (e) {
      throw Exception('Error: ${e.toString()}');
    }
  }

  static Future<List<StudySessionSummary>> listMyStudySessionsSafe() async {
    try {
      return await listMyStudySessions();
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> uploadProfileAvatar(String filePath) async {
    try {
      final token = await getAccessToken();
      final uri = Uri.parse('${AppConstants.baseUrl}${AppConstants.profileAvatar}');
      final request = http.MultipartRequest('PATCH', uri);
      if (token != null) request.headers['Authorization'] = 'Bearer $token';
      request.files.add(await http.MultipartFile.fromPath('avatar', filePath));

      final streamed = await request.send().timeout(const Duration(seconds: 30));
      final response = await http.Response.fromStream(streamed);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return data;
      } else {
        return {'success': false, 'status': response.statusCode, 'body': response.body};
      }
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  // ─── Student Authentication ────────────────────────────────────────────
  static Future<AuthResponse> studentSignUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.studentSignUp}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'password_confirm': password,
          'first_name': firstName,
          'last_name': lastName,
          'class_level': 'Not specified',
          'speciality': 'Not specified',
          'parent_email': email,
          'parent_phone': '+216XXXXXXXX',
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final authResponse = AuthResponse.fromJson(data);
        if (authResponse.access != null && authResponse.refresh != null) {
          await saveTokens(authResponse.access, authResponse.refresh);
        }
        return authResponse;
      } else if (response.statusCode == 400) {
        return AuthResponse(
          success: false,
          message: _extractErrorMessage(response),
        );
      } else {
        return AuthResponse(
          success: false,
          message: 'Server error: ${response.statusCode}',
        );
      }
    } catch (e) {
      return AuthResponse(
        success: false,
        message: 'Error: ${e.toString()}',
      );
    }
  }

  static Future<AuthResponse> studentSignIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.studentSignIn}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final authResponse = AuthResponse.fromJson(data);
        if (authResponse.access != null && authResponse.refresh != null) {
          await saveTokens(authResponse.access, authResponse.refresh);
        }
        return authResponse;
      } else if (response.statusCode == 401) {
        return AuthResponse(
          success: false,
          message: 'Invalid email or password',
        );
      } else {
        return AuthResponse(
          success: false,
          message: 'Server error: ${response.statusCode}',
        );
      }
    } catch (e) {
      return AuthResponse(
        success: false,
        message: 'Error: ${e.toString()}',
      );
    }
  }
}
