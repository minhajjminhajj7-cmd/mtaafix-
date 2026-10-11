class ReportSubmissionResult {
  final bool success;
  final String message;
  final bool duplicate;
  final double? distanceFromIncident;

  final String categoryName;

  final String? authorityName;
  final String? authorityType;

  final String priority;
  final int priorityScore;
  final List<String> priorityReasons;

  final String incidentId;
  final String incidentTitle;
  final String incidentStatus;
  final int reportCount;

  final String reportId;
  final String? trackingCode;

  const ReportSubmissionResult({
    required this.success,
    required this.message,
    required this.duplicate,
    required this.distanceFromIncident,
    required this.categoryName,
    required this.authorityName,
    required this.authorityType,
    required this.priority,
    required this.priorityScore,
    required this.priorityReasons,
    required this.incidentId,
    required this.incidentTitle,
    required this.incidentStatus,
    required this.reportCount,
    required this.reportId,
    required this.trackingCode,
  });

  factory ReportSubmissionResult.fromJson(Map<String, dynamic> json) {
    final category = Map<String, dynamic>.from(json['category'] ?? {});

    final routing = Map<String, dynamic>.from(json['routing'] ?? {});

    final priorityAssessment = Map<String, dynamic>.from(
      json['priorityAssessment'] ?? {},
    );

    final incident = Map<String, dynamic>.from(json['incident'] ?? {});

    final report = Map<String, dynamic>.from(json['report'] ?? {});

    final rawReasons = priorityAssessment['reasons'];

    return ReportSubmissionResult(
      success: json['success'] == true,
      message: json['message']?.toString() ?? 'Report submitted',
      duplicate: json['duplicate'] == true,
      distanceFromIncident: double.tryParse(
        json['distanceFromIncident']?.toString() ?? '',
      ),
      categoryName: category['name']?.toString() ?? 'Issue',
      authorityName: routing['authorityName']?.toString(),
      authorityType: routing['authorityType']?.toString(),
      priority:
          priorityAssessment['priority']?.toString() ??
          incident['priority']?.toString() ??
          'normal',
      priorityScore:
          int.tryParse(priorityAssessment['score']?.toString() ?? '0') ?? 0,
      priorityReasons: rawReasons is List
          ? rawReasons.map((item) => item.toString()).toList()
          : [],
      incidentId: incident['id']?.toString() ?? '',
      incidentTitle: incident['title']?.toString() ?? 'Incident',
      incidentStatus: incident['status']?.toString() ?? 'open',
      reportCount:
          int.tryParse(incident['reportCount']?.toString() ?? '1') ?? 1,
      reportId: report['id']?.toString() ?? '',
      trackingCode:
          json['trackingCode']?.toString() ?? report['tracking_code']?.toString(),
    );
  }
}
