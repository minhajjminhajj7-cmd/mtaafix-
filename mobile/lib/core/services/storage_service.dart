import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  StorageService._();

  static const String _tokenKey = 'mtaafix_auth_token';
  static const String _userNameKey = 'mtaafix_user_name';
  static const String _userEmailKey = 'mtaafix_user_email';
  static const String _userRoleKey = 'mtaafix_user_role';

  static Future<void> saveSession({
    required String token,
    String? fullName,
    String? email,
    String? role,
  }) async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setString(_tokenKey, token);

    if (fullName != null) {
      await prefs.setString(_userNameKey, fullName);
    }

    if (email != null) {
      await prefs.setString(_userEmailKey, email);
    }

    if (role != null) {
      await prefs.setString(_userRoleKey, role);
    }
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<String?> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userNameKey);
  }

  static Future<String?> getUserEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userEmailKey);
  }

  static Future<String?> getUserRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userRoleKey);
  }

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.remove(_tokenKey);
    await prefs.remove(_userNameKey);
    await prefs.remove(_userEmailKey);
    await prefs.remove(_userRoleKey);
  }
}
