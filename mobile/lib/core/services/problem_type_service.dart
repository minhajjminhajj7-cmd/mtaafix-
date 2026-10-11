import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/problem_type.dart';
import 'api_config.dart';

class ProblemTypeService {
  ProblemTypeService._();

  static Future<List<ProblemType>> getProblemTypes({
    required int categoryId,
  }) async {
    final uri = Uri.parse(
      '${ApiConfig.baseUrl}/problem-types?categoryId=$categoryId',
    );

    final response = await http.get(
      uri,
      headers: const {'Accept': 'application/json'},
    );

    Map<String, dynamic> body = {};

    try {
      final decoded = jsonDecode(response.body);

      if (decoded is Map<String, dynamic>) {
        body = decoded;
      }
    } catch (_) {
      throw Exception('The server returned an invalid response.');
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        body['message']?.toString() ?? 'Unable to load problem types.',
      );
    }

    final dynamic rawData = body['data'] ?? body['problemTypes'];

    if (rawData is! List) {
      return [];
    }

    return rawData
        .whereType<Map>()
        .map((item) => ProblemType.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }
}
