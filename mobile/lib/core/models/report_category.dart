class ReportCategory {
  final int id;
  final String name;
  final String? description;

  const ReportCategory({
    required this.id,
    required this.name,
    this.description,
  });

  factory ReportCategory.fromJson(Map<String, dynamic> json) {
    return ReportCategory(
      id: int.tryParse(json['id'].toString()) ?? 0,
      name: json['name']?.toString() ?? 'Other',
      description: json['description']?.toString(),
    );
  }
}
