import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/citizen_report.dart';
import '../models/report_submission_result.dart';
import 'api_config.dart';
import 'storage_service.dart';

class ReportService {
  ReportService._();

  // ==================================================
  // GET MY REPORTS
  // ==================================================

  static Future<List<CitizenReport>> getMyReports() async {
    final token = await StorageService.getToken();

    if (token == null || token.isEmpty) {
      throw Exception('Your session has expired. Please login again.');
    }

    final response = await http
        .get(
          Uri.parse('${ApiConfig.baseUrl}/reports/my'),
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer $token',
          },
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
      throw Exception(
        body['message']?.toString() ?? 'Could not load your reports.',
      );
    }

    final data = body['data'];

    if (data is! List) {
      return [];
    }

    return data
        .whereType<Map>()
        .map((item) => CitizenReport.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  static Future<List<Map<String, dynamic>>> getNearbyIncidents({
    required int categoryId,
    required int problemTypeId,
    required double latitude,
    required double longitude,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/reports/nearby').replace(
      queryParameters: {
        'categoryId': categoryId.toString(),
        'problemTypeId': problemTypeId.toString(),
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        'radius': '100',
      },
    );

    final response = await http.get(uri, headers: const {'Accept': 'application/json'}).timeout(const Duration(seconds: 12));
    if (response.body.trim().isEmpty) return [];
    final decoded = jsonDecode(response.body);
    if (decoded is! Map) return [];
    final body = Map<String, dynamic>.from(decoded);
    if (response.statusCode < 200 || response.statusCode >= 300 || body['success'] != true) return [];
    final data = body['data'];
    if (data is! List) return [];
    return data.whereType<Map>().map((item) => Map<String, dynamic>.from(item)).toList();
  }

  // ==================================================
  // SUBMIT REPORT
  // ==================================================

  static Future<ReportSubmissionResult> submitReport({
    required int categoryId,
    required int problemTypeId,
    required String description,
    required double latitude,
    required double longitude,
    required List<String> evidencePaths,
    String? attachToIncidentId,
    bool forceNew = false,
  }) async {
    final token = await StorageService.getToken();
    final isGuest = token == null || token.isEmpty;

    final uri = Uri.parse('${ApiConfig.baseUrl}/reports');

    final request = http.MultipartRequest('POST', uri);

    request.headers['Accept'] = 'application/json';

    if (!isGuest) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    // IMPORTANT:
    // Both categoryId and problemTypeId are sent.
    //
    // The backend uses problemTypeId to determine
    // the configured infrastructure risk level.
    request.fields.addAll({
      'categoryId': categoryId.toString(),
      'problemTypeId': problemTypeId.toString(),
      'description': description,
      'latitude': latitude.toString(),
      'longitude': longitude.toString(),
      'isAnonymous': isGuest ? 'true' : 'false',
    });
    if (attachToIncidentId != null && attachToIncidentId.isNotEmpty) {
      request.fields['attachToIncidentId'] = attachToIncidentId;
    }
    if (forceNew) request.fields['forceNew'] = 'true';

    for (final path in evidencePaths) {
      request.files.add(await http.MultipartFile.fromPath('evidence', path));
    }

    final streamedResponse = await request.send().timeout(
      const Duration(seconds: 30),
    );

    final response = await http.Response.fromStream(streamedResponse);

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
      throw Exception(
        body['message']?.toString() ?? 'Could not submit the report.',
      );
    }

    return ReportSubmissionResult.fromJson(body);
  }

  static Future<void> deleteMyReport(String reportId) async {
    final token = await StorageService.getToken();
    if (token == null || token.isEmpty) {
      throw Exception('You must sign in to delete a report.');
    }

    final response = await http
        .delete(
          Uri.parse('${ApiConfig.baseUrl}/reports/$reportId'),
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer $token',
          },
        )
        .timeout(const Duration(seconds: 15));

    final decoded = jsonDecode(response.body);
    if (decoded is! Map) throw Exception('Unexpected server response.');
    final body = Map<String, dynamic>.from(decoded);
    if (response.statusCode < 200 || response.statusCode >= 300 || body['success'] != true) {
      throw Exception(body['message']?.toString() ?? 'Could not delete report.');
    }
  }

}
