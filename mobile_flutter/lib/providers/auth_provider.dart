import 'package:flutter/material.dart';
import '../models/auth_response.dart';
import '../models/parent.dart';
import '../models/child.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isLoading = false;
  bool _isLoggedIn = false;
  ParentData? _parentData;
  List<ChildData> _children = [];
  String? _errorMessage;

  bool get isLoading => _isLoading;
  bool get isLoggedIn => _isLoggedIn;
  ParentData? get parentData => _parentData;
  List<ChildData> get children => List.unmodifiable(_children);
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    checkLoginStatus();
  }

  Future<void> checkLoginStatus() async {
    _isLoggedIn = await ApiService.isLoggedIn();
    if (_isLoggedIn) {
      await loadParentProfile();
    }
    notifyListeners();
  }

  Future<bool> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.parentSignUp(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      );

      if (response.success) {
        _isLoggedIn = true;
        _parentData = response.parent;
        // load children after successful sign in
        await loadParentProfile();
        _errorMessage = null;
        notifyListeners();
        return true;
      } else {
        _errorMessage = response.message ?? 'Sign up failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'An error occurred: ${e.toString()}';
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.parentSignIn(
        email: email,
        password: password,
      );

      if (response.success) {
        _isLoggedIn = true;
        _parentData = response.parent;
        await loadParentProfile();
        _errorMessage = null;
        notifyListeners();
        return true;
      } else {
        _errorMessage = response.message ?? 'Sign in failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'An error occurred: ${e.toString()}';
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ─── Student Authentication Methods ────────────────────────────────────
  Future<bool> studentSignUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.studentSignUp(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      );

      if (response.success) {
        _isLoggedIn = true;
        _errorMessage = null;
        notifyListeners();
        return true;
      } else {
        _errorMessage = response.message ?? 'Sign up failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'An error occurred: ${e.toString()}';
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> studentSignIn({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.studentSignIn(
        email: email,
        password: password,
      );

      if (response.success) {
        _isLoggedIn = true;
        _errorMessage = null;
        notifyListeners();
        return true;
      } else {
        _errorMessage = response.message ?? 'Sign in failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'An error occurred: ${e.toString()}';
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await ApiService.clearTokens();
    _isLoggedIn = false;
    _parentData = null;
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> loadParentProfile() async {
    try {
      final data = await ApiService.getParentProfile();
      if (data['success'] == true && data['parent'] != null) {
        final p = data['parent'] as Map<String, dynamic>;
        _parentData = ParentData.fromJson(p);

        final rawChildren = p['children'] as List<dynamic>?;
        if (rawChildren != null) {
          _children = rawChildren.map((c) => ChildData.fromJson(c as Map<String, dynamic>)).toList();
        } else {
          _children = [];
        }
      }
    } catch (e) {
      // ignore errors for now
    }
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
