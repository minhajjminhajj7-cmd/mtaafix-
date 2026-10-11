import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_config.dart';

class TrackingService {
  TrackingService._();

  static Future<Map<String, dynamic>> trackReport(String code) async {
    final cleanCode = code.trim().toUpperCase();

    if (cleanCode.isEmpty) {
      throw Exception('Enter your tracking code.');
    }

    final response = await http
        .get(
          Uri.parse('${ApiConfig.baseUrl}/reports/track/$cleanCode'),
          headers: const {'Accept': 'application/json'},
        )
        .timeout(const Duration(seconds: 15));

    if (response.body.trim().isEmpty) {
      throw Exception('The server returned an empty response.');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map) {
      throw Exception('Unexpected server response.');
    }

    final body = Map<String, dynamic>.from(decoded);

    if (response.statusCode < 200 ||
        response.statusCode >= 300 ||
        body['success'] != true) {
      throw Exception(body['message']?.toString() ?? 'Report not found.');
    }

    return Map<String, dynamic>.from(body['data'] ?? {});
  }
}
