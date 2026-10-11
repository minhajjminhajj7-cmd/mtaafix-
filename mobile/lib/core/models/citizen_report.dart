class CitizenReport {
  final String id;
  final String description;
  final double latitude;
  final double longitude;
  final String? imageUrl;
  final DateTime? createdAt;
  final String categoryName;
  final String incidentId;
  final String incidentTitle;
  final String status;
  final String priority;
  final int reportCount;
  final String? authorityName;
  final String? authorityPhone;
  final String? authorityEmail;
  final String? trackingCode;
  final String? reviewedByName;
  final String? assignedByName;
  final String? acceptedByName;
  final String? workStartedByName;
  final String? resolutionReviewedByName;

  const CitizenReport({
    required this.id,
    required this.description,
    required this.latitude,
    required this.longitude,
    required this.imageUrl,
    required this.createdAt,
    required this.categoryName,
    required this.incidentId,
    required this.incidentTitle,
    required this.status,
    required this.priority,
    required this.reportCount,
    required this.authorityName,
    required this.authorityPhone,
    required this.authorityEmail,
    required this.trackingCode,
    required this.reviewedByName,
    required this.assignedByName,
    required this.acceptedByName,
    required this.workStartedByName,
    required this.resolutionReviewedByName,
  });

  factory CitizenReport.fromJson(Map<String, dynamic> json) {
    return CitizenReport(
      id: json['id']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      latitude: double.tryParse(json['latitude']?.toString() ?? '') ?? 0,
      longitude: double.tryParse(json['longitude']?.toString() ?? '') ?? 0,
      imageUrl: json['image_url']?.toString(),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? ''),
      categoryName: json['category_name']?.toString() ?? 'Other',
      incidentId: json['incident_id']?.toString() ?? '',
      incidentTitle: json['incident_title']?.toString() ?? 'Community Issue',
      status: json['status']?.toString() ?? 'open',
      priority: json['priority']?.toString() ?? 'normal',
      reportCount: int.tryParse(json['report_count']?.toString() ?? '') ?? 1,
      authorityName: json['authority_name']?.toString(),
      authorityPhone: json['authority_phone']?.toString(),
      authorityEmail: json['authority_email']?.toString(),
      trackingCode: json['tracking_code']?.toString(),
      reviewedByName: json['reviewed_by_name']?.toString(),
      assignedByName: json['assigned_by_name']?.toString(),
      acceptedByName: json['accepted_by_name']?.toString(),
      workStartedByName: json['work_started_by_name']?.toString(),
      resolutionReviewedByName: json['resolution_reviewed_by_name']?.toString(),
    );
  }
}
