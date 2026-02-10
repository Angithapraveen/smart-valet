import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  String? _token;
  Map<String, dynamic>? _user;
  List<dynamic> _accessibleLocations = [];

  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  List<dynamic> get accessibleLocations => _accessibleLocations;
  bool get isAuthenticated => _token != null;

  AuthProvider() {
    _loadStoredAuth();
  }

  Future<void> _loadStoredAuth() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    final userStr = prefs.getString('user');
    if (userStr != null) {
      _user = jsonDecode(userStr);
    }
    final locationsStr = prefs.getString('accessibleLocations');
    if (locationsStr != null) {
      _accessibleLocations = jsonDecode(locationsStr);
    }
    notifyListeners();
  }

  Future<Map<String, dynamic>> login(String emailOrPhone, String password) async {
    try {
      final response = await ApiService.login(emailOrPhone, password);
      
      if (response['success'] == true) {
        _token = response['data']['token'];
        _user = response['data']['user'];
        _accessibleLocations = response['data']['accessibleLocations'] ?? [];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('user', jsonEncode(_user));
        await prefs.setString('accessibleLocations', jsonEncode(_accessibleLocations));

        notifyListeners();
        return {'success': true};
      } else {
        return {'success': false, 'message': response['message'] ?? 'Login failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Login failed: ${e.toString()}'};
    }
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    _accessibleLocations = [];

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
    await prefs.remove('accessibleLocations');

    notifyListeners();
  }

  Future<void> fetchCurrentUser() async {
    if (_token == null) return;

    try {
      final response = await ApiService.getCurrentUser(_token!);
      if (response['success'] == true) {
        _user = response['data']['user'];
        _accessibleLocations = response['data']['accessibleLocations'] ?? [];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user', jsonEncode(_user));
        await prefs.setString('accessibleLocations', jsonEncode(_accessibleLocations));

        notifyListeners();
      }
    } catch (e) {
      // Handle error
      print('Failed to fetch user: $e');
    }
  }
}
