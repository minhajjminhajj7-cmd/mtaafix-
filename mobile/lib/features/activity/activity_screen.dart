import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/models/citizen_report.dart';
import '../../core/services/api_config.dart';
import '../../core/services/report_service.dart';
import '../../core/theme/app_colors.dart';
import 'incident_details_screen.dart';

class ActivityScreen extends StatefulWidget {
  const ActivityScreen({super.key});

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
  bool _loading = true;
  String? _error;

  List<CitizenReport> _reports = [];

  String _selectedFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final reports = await ReportService.getMyReports();

      if (!mounted) return;

      setState(() {
        _reports = reports;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  List<CitizenReport> get _filteredReports {
    if (_selectedFilter == 'active') {
      return _reports.where((report) {
        return report.status != 'resolved' && report.status != 'closed';
      }).toList();
    }

    if (_selectedFilter == 'resolved') {
      return _reports.where((report) {
        return report.status == 'resolved' || report.status == 'closed';
      }).toList();
    }

    return _reports;
  }

  int get _activeCount {
    return _reports.where((report) {
      return report.status != 'resolved' && report.status != 'closed';
    }).length;
  }

  int get _resolvedCount {
    return _reports.where((report) {
      return report.status == 'resolved' || report.status == 'closed';
    }).length;
  }

  String? _imageUrl(CitizenReport report) {
    final image = report.imageUrl;

    if (image == null || image.trim().isEmpty) {
      return null;
    }

    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }

    final apiBase = ApiConfig.baseUrl;

    final serverBase = apiBase.endsWith('/api')
        ? apiBase.substring(0, apiBase.length - 4)
        : apiBase;

    return '$serverBase$image';
  }



  Future<void> _deleteReport(CitizenReport report) async {
    final allowed = report.status == 'open' || report.status == 'under_review';
    if (!allowed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('This report can no longer be deleted because operational work has already started.')),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete report?'),
        content: const Text('This removes your report before it is assigned for field work.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.critical),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;
    try {
      await ReportService.deleteMyReport(report.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Report deleted.')));
      _loadReports();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(LucideIcons.arrowLeft),
        ),
        title: const Text(
          'Activity',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.teal,
          onRefresh: _loadReports,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(22, 14, 22, 35),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    const Text(
                      'Your reports',
                      style: TextStyle(
                        fontSize: 29,
                        height: 1,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -.9,
                      ),
                    ),

                    const SizedBox(height: 9),

                    const Text(
                      'Follow the issues you have reported and see how they move through the response process.',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                        height: 1.5,
                      ),
                    ),

                    const SizedBox(height: 25),

                    _buildSummary(),

                    const SizedBox(height: 25),

                    _buildFilters(),

                    const SizedBox(height: 20),

                    if (_loading)
                      _buildLoading()
                    else if (_error != null)
                      _buildError()
                    else if (_filteredReports.isEmpty)
                      _buildEmpty()
                    else
                      ...List.generate(_filteredReports.length, (index) {
                        return _buildReportCard(_filteredReports[index], index);
                      }),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummary() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.navy,
        borderRadius: BorderRadius.circular(26),
      ),
      child: Row(
        children: [
          Expanded(child: _summaryItem('${_reports.length}', 'Reports')),

          _divider(),

          Expanded(child: _summaryItem('$_activeCount', 'Active')),

          _divider(),

          Expanded(child: _summaryItem('$_resolvedCount', 'Resolved')),
        ],
      ),
    ).animate().fadeIn(duration: 450.ms).slideY(begin: .05);
  }

  Widget _summaryItem(String value, String label) {
    return Column(
      children: [
        Text(
          _loading ? '—' : value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: .6),
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _divider() {
    return Container(
      width: 1,
      height: 38,
      color: Colors.white.withValues(alpha: .12),
    );
  }

  Widget _buildFilters() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _filterChip('all', 'All', _reports.length),
          const SizedBox(width: 9),
          _filterChip('active', 'Active', _activeCount),
          const SizedBox(width: 9),
          _filterChip('resolved', 'Resolved', _resolvedCount),
        ],
      ),
    );
  }

  Widget _filterChip(String value, String label, int count) {
    final selected = _selectedFilter == value;

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedFilter = value;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.navy : AppColors.surface,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: selected ? AppColors.navy : AppColors.border,
          ),
        ),
        child: Row(
          children: [
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : AppColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 7),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: selected ? AppColors.teal : AppColors.surfaceSoft,
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  color: selected ? Colors.white : AppColors.textSecondary,
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReportCard(CitizenReport report, int index) {
    final imageUrl = _imageUrl(report);

    final statusColor = _statusColor(report.status);

    final priorityColor = _priorityColor(report.priority);

    return Container(
          margin: const EdgeInsets.only(bottom: 15),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.border),
          ),
          clipBehavior: Clip.antiAlias,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                Navigator.of(context)
                    .push(
                      MaterialPageRoute(
                        builder: (_) => IncidentDetailsScreen(report: report),
                      ),
                    )
                    .then((_) {
                      _loadReports();
                    });
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (imageUrl != null)
                    SizedBox(
                      width: double.infinity,
                      height: 145,
                      child: Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return _imagePlaceholder(report);
                        },
                      ),
                    )
                  else
                    _imagePlaceholder(report),

                  Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    report.incidentTitle.isNotEmpty
                                        ? report.incidentTitle
                                        : '${report.categoryName} Incident',
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),

                                  const SizedBox(height: 5),

                                  Text(
                                    _formatDate(report.createdAt),
                                    style: const TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            const SizedBox(width: 10),

                            _statusBadge(
                              _statusLabel(report.status),
                              statusColor,
                            ),
                          ],
                        ),

                        const SizedBox(height: 14),

                        Text(
                          report.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                            height: 1.45,
                          ),
                        ),

                        const SizedBox(height: 16),

                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _smallBadge(
                              '${_priorityLabel(report.priority)} priority',
                              priorityColor,
                            ),

                            if (report.reportCount > 1)
                              _smallBadge(
                                '${report.reportCount} reports',
                                AppColors.tealDark,
                              ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        Container(height: 1, color: AppColors.border),

                        const SizedBox(height: 14),

                        Row(
                          children: [
                            const Icon(
                              LucideIcons.building2,
                              size: 15,
                              color: AppColors.textSecondary,
                            ),

                            const SizedBox(width: 7),

                            Expanded(
                              child: Text(
                                report.authorityName ?? 'Routing in progress',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),

                            const SizedBox(width: 8),

                            if (report.status == 'open' || report.status == 'under_review') ...[
                              IconButton(
                                tooltip: 'Delete report',
                                visualDensity: VisualDensity.compact,
                                onPressed: () => _deleteReport(report),
                                icon: const Icon(LucideIcons.trash2, size: 16, color: AppColors.critical),
                              ),
                            ],

                            const Text(
                              'View',
                              style: TextStyle(
                                color: AppColors.tealDark,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),

                            const SizedBox(width: 3),

                            const Icon(
                              LucideIcons.chevronRight,
                              size: 16,
                              color: AppColors.tealDark,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        )
        .animate()
        .fadeIn(
          delay: Duration(milliseconds: index * 60),
          duration: 400.ms,
        )
        .slideY(begin: .04);
  }

  Widget _imagePlaceholder(CitizenReport report) {
    return Container(
      width: double.infinity,
      height: 110,
      color: _categoryBackground(report.categoryName),
      child: Center(
        child: Icon(
          _categoryIcon(report.categoryName),
          size: 34,
          color: AppColors.navy,
        ),
      ),
    );
  }

  Widget _statusBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .10),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 9,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _smallBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .08),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildLoading() {
    return Column(
      children: List.generate(
        3,
        (index) =>
            Container(
                  height: 250,
                  margin: const EdgeInsets.only(bottom: 15),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(24),
                  ),
                )
                .animate(
                  onPlay: (controller) => controller.repeat(reverse: true),
                )
                .fade(begin: .45, end: 1, duration: 850.ms),
      ),
    );
  }

  Widget _buildError() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          const Icon(LucideIcons.wifiOff, color: AppColors.critical, size: 30),
          const SizedBox(height: 12),
          Text(
            _error ?? 'Could not load your reports.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 10),
          TextButton(onPressed: _loadReports, child: const Text('Try again')),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 40),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: const Column(
        children: [
          Icon(LucideIcons.clipboardList, color: AppColors.tealDark, size: 34),
          SizedBox(height: 13),
          Text(
            'Nothing here yet',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
          ),
          SizedBox(height: 7),
          Text(
            'Your reports and their progress will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, height: 1.4),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) {
      return 'Recently reported';
    }

    final local = date.toLocal();

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return '${months[local.month - 1]} '
        '${local.day}, ${local.year}';
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'resolved':
      case 'closed':
        return AppColors.resolved;

      case 'in_progress':
        return AppColors.tealDark;

      case 'assigned':
        return const Color(0xFF3D70B2);

      case 'under_review':
        return AppColors.normal;

      default:
        return AppColors.high;
    }
  }

  Color _priorityColor(String priority) {
    switch (priority) {
      case 'critical':
        return AppColors.critical;

      case 'high':
        return AppColors.high;

      case 'low':
        return AppColors.resolved;

      default:
        return AppColors.normal;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'under_review':
        return 'UNDER REVIEW';

      case 'assigned':
        return 'ASSIGNED';

      case 'in_progress':
        return 'IN PROGRESS';

      case 'resolved':
        return 'RESOLVED';

      case 'closed':
        return 'CLOSED';

      default:
        return 'REPORTED';
    }
  }

  String _priorityLabel(String priority) {
    if (priority.isEmpty) {
      return 'Normal';
    }

    return '${priority[0].toUpperCase()}'
        '${priority.substring(1)}';
  }

  IconData _categoryIcon(String category) {
    final value = category.toLowerCase();
    if (value.contains('road') || value.contains('pothole')) {
      return LucideIcons.construction;
    }
    if (value.contains('water')) {
      return LucideIcons.droplets;
    }
    if (value.contains('drainage') || value.contains('sewage')) {
      return LucideIcons.waves;
    }
    if (value.contains('waste')) {
      return LucideIcons.trash2;
    }
    if (value.contains('street') || value.contains('electrical')) {
      return LucideIcons.lightbulb;
    }
    return LucideIcons.triangleAlert;
  }

  Color _categoryBackground(String category) {
    final value = category.toLowerCase();
    if (value.contains('water')) return const Color(0xFFE6F3F7);
    if (value.contains('road') || value.contains('pothole')) return const Color(0xFFFFF0E5);
    if (value.contains('drainage') || value.contains('sewage')) return const Color(0xFFEAF2FA);
    if (value.contains('waste')) return const Color(0xFFE8F5ED);
    if (value.contains('street') || value.contains('electrical')) return const Color(0xFFFFF6D9);
    return AppColors.surfaceSoft;
  }
}
