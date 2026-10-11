import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/report_category.dart';
import 'api_config.dart';

class CategoryService {
  CategoryService._();

  static Future<List<ReportCategory>> getCategories() async {
    final response = await http
        .get(
          Uri.parse('${ApiConfig.baseUrl}/categories'),
          headers: {'Accept': 'application/json'},
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

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        body['message']?.toString() ?? 'Could not load categories.',
      );
    }

    final dynamic rawCategories = body['data'] ?? body['categories'];

    if (rawCategories is! List) {
      return [];
    }

    return rawCategories
        .whereType<Map>()
        .map((item) => ReportCategory.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }
}
