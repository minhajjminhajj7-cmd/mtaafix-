import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'storage_service.dart';

class AuthResult {
  final bool success;
  final String message;
  final Map<String, dynamic>? user;

  const AuthResult({required this.success, required this.message, this.user});
}

class AuthService {
  AuthService._();

  static Future<AuthResult> login({
    required String identifier,
    required String password,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}/auth/login'),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({
              'identifier': identifier.trim(),
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 15));

      final data = _decodeResponse(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final token = data['token']?.toString();

        if (token == null || token.isEmpty) {
          return const AuthResult(
            success: false,
            message: 'Server did not return an authentication token.',
          );
        }

        Map<String, dynamic>? user;

        if (data['user'] is Map) {
          user = Map<String, dynamic>.from(data['user']);
        }

        await StorageService.saveSession(
          token: token,
          fullName:
              user?['fullName']?.toString() ?? user?['full_name']?.toString(),
          email: user?['email']?.toString(),
          role: user?['role']?.toString(),
        );

        return AuthResult(
          success: true,
          message: data['message']?.toString() ?? 'Login successful.',
          user: user,
        );
      }

      return AuthResult(
        success: false,
        message: _extractErrorMessage(data, fallback: 'Unable to sign in.'),
      );
    } on Exception catch (error) {
      return AuthResult(success: false, message: _networkMessage(error));
    }
  }

  static Future<AuthResult> register({
    required String fullName,
    required String phone,
    required String email,
    required String password,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}/auth/register'),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({
              'fullName': fullName.trim(),
              'phone': phone.trim(),
              'email': email.trim(),
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 15));

      final data = _decodeResponse(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final token = data['token']?.toString();

        if (token == null || token.isEmpty) {
          return const AuthResult(
            success: false,
            message:
                'Account created, but no authentication token was returned.',
          );
        }

        Map<String, dynamic>? user;

        if (data['user'] is Map) {
          user = Map<String, dynamic>.from(data['user']);
        }

        await StorageService.saveSession(
          token: token,
          fullName:
              user?['fullName']?.toString() ??
              user?['full_name']?.toString() ??
              fullName.trim(),
          email: user?['email']?.toString() ?? email.trim(),
          role: user?['role']?.toString() ?? 'citizen',
        );

        return AuthResult(
          success: true,
          message: data['message']?.toString() ?? 'Account created.',
          user: user,
        );
      }

      return AuthResult(
        success: false,
        message: _extractErrorMessage(
          data,
          fallback: 'Unable to create account.',
        ),
      );
    } on Exception catch (error) {
      return AuthResult(success: false, message: _networkMessage(error));
    }
  }



  static Future<Map<String, dynamic>> requestPhoneOtp(String phone) async {
    try {
      final response = await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}/auth/otp/request'),
            headers: const {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({'phone': phone.trim()}),
          )
          .timeout(const Duration(seconds: 15));

      final data = _decodeResponse(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300 && data['success'] == true) {
        return data;
      }
      throw Exception(_extractErrorMessage(data, fallback: 'Unable to send verification code.'));
    } on Exception catch (error) {
      throw Exception(_networkMessage(error));
    }
  }

  static Future<AuthResult> verifyPhoneOtp({
    required String phone,
    required String code,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}/auth/otp/verify'),
            headers: const {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({'phone': phone.trim(), 'code': code.trim()}),
          )
          .timeout(const Duration(seconds: 15));

      final data = _decodeResponse(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300 && data['success'] == true) {
        final token = data['token']?.toString();
        if (token == null || token.isEmpty) {
          return const AuthResult(success: false, message: 'No authentication token was returned.');
        }
        Map<String, dynamic>? user;
        if (data['user'] is Map) user = Map<String, dynamic>.from(data['user']);
        await StorageService.saveSession(
          token: token,
          fullName: user?['fullName']?.toString() ?? user?['full_name']?.toString(),
          email: user?['email']?.toString(),
          role: user?['role']?.toString(),
        );
        return AuthResult(success: true, message: data['message']?.toString() ?? 'Login successful.', user: user);
      }
      return AuthResult(
        success: false,
        message: _extractErrorMessage(data, fallback: 'Unable to verify code.'),
      );
    } on Exception catch (error) {
      return AuthResult(success: false, message: _networkMessage(error));
    }
  }

  static Map<String, dynamic> _decodeResponse(String body) {
    if (body.trim().isEmpty) {
      return {};
    }

    try {
      final decoded = jsonDecode(body);

      if (decoded is Map<String, dynamic>) {
        return decoded;
      }

      if (decoded is Map) {
        return Map<String, dynamic>.from(decoded);
      }

      return {};
    } catch (_) {
      return {};
    }
  }

  static String _extractErrorMessage(
    Map<String, dynamic> data, {
    required String fallback,
  }) {
    final message = data['message'];

    if (message != null && message.toString().trim().isNotEmpty) {
      return message.toString();
    }

    final error = data['error'];

    if (error != null && error.toString().trim().isNotEmpty) {
      return error.toString();
    }

    return fallback;
  }

  static String _networkMessage(Object error) {
    final text = error.toString().toLowerCase();

    if (text.contains('timeout')) {
      return 'The server took too long to respond.';
    }

    return 'Could not connect to MtaaFix. Check that the backend is running.';
  }
}
