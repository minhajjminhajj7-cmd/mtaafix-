class ProblemType {
  final int id;
  final int categoryId;
  final String name;
  final String? description;
  final String defaultPriority;
  final String? safetyMessage;
  final bool emergencyContactRecommended;

  const ProblemType({
    required this.id,
    required this.categoryId,
    required this.name,
    this.description,
    required this.defaultPriority,
    this.safetyMessage,
    required this.emergencyContactRecommended,
  });

  factory ProblemType.fromJson(Map<String, dynamic> json) {
    return ProblemType(
      id: _toInt(json['id']),
      categoryId: _toInt(json['categoryId'] ?? json['category_id']),
      name: json['name']?.toString() ?? 'Unknown problem',
      description: json['description']?.toString(),
      defaultPriority:
          (json['defaultPriority'] ?? json['default_priority'] ?? 'normal')
              .toString()
              .toLowerCase(),
      safetyMessage: (json['safetyMessage'] ?? json['safety_message'])
          ?.toString(),
      emergencyContactRecommended: _toBool(
        json['emergencyContactRecommended'] ??
            json['emergency_contact_recommended'],
      ),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static bool _toBool(dynamic value) {
    if (value is bool) return value;

    if (value is num) {
      return value != 0;
    }

    final text = value?.toString().toLowerCase();

    return text == 'true' || text == '1' || text == 'yes';
  }
}
