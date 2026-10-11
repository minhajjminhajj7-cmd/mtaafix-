import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/models/citizen_report.dart';
import '../../core/services/api_config.dart';
import '../../core/theme/app_colors.dart';

class IncidentDetailsScreen extends StatelessWidget {
  final CitizenReport report;

  const IncidentDetailsScreen({super.key, required this.report});

  String? get _imageUrl {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          _buildAppBar(context),

          SliverPadding(
            padding: const EdgeInsets.fromLTRB(22, 22, 22, 45),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _buildHeading(),

                const SizedBox(height: 20),

                _buildStatusOverview()
                    .animate()
                    .fadeIn(duration: 450.ms)
                    .slideY(begin: .04),

                const SizedBox(height: 16),

                _buildDescription()
                    .animate()
                    .fadeIn(delay: 80.ms, duration: 450.ms)
                    .slideY(begin: .04),

                const SizedBox(height: 16),

                _buildLocation()
                    .animate()
                    .fadeIn(delay: 120.ms, duration: 450.ms)
                    .slideY(begin: .04),

                const SizedBox(height: 16),

                _buildAuthority()
                    .animate()
                    .fadeIn(delay: 160.ms, duration: 450.ms)
                    .slideY(begin: .04),

                const SizedBox(height: 28),

                _sectionTitle('RESPONSE PROGRESS'),

                const SizedBox(height: 14),

                _buildTimeline().animate().fadeIn(
                  delay: 200.ms,
                  duration: 500.ms,
                ),

                const SizedBox(height: 28),

                _sectionTitle('WHO IS RESPONSIBLE'),

                const SizedBox(height: 14),

                _buildResponsibility(),

                const SizedBox(height: 28),

                _sectionTitle('INCIDENT INFORMATION'),

                const SizedBox(height: 14),

                _buildIncidentInformation(),

                const SizedBox(height: 25),

                _buildCommunityMessage(),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    final image = _imageUrl;

    return SliverAppBar(
      expandedHeight: image != null ? 300 : 220,
      pinned: true,
      backgroundColor: AppColors.navy,
      foregroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,

      leading: Padding(
        padding: const EdgeInsets.all(8),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: .25),
            borderRadius: BorderRadius.circular(14),
          ),
          child: IconButton(
            onPressed: () {
              Navigator.pop(context);
            },
            icon: const Icon(LucideIcons.arrowLeft, size: 20),
          ),
        ),
      ),

      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (image != null)
              Image.network(
                image,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return _heroPlaceholder();
                },
              )
            else
              _heroPlaceholder(),

            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    AppColors.navy.withValues(alpha: .15),
                    AppColors.navy.withValues(alpha: .75),
                  ],
                ),
              ),
            ),

            Positioned(
              left: 22,
              right: 22,
              bottom: 22,
              child: Row(
                children: [
                  _heroBadge(
                    _statusLabel(report.status),
                    _statusColor(report.status),
                  ),

                  const SizedBox(width: 8),

                  _heroBadge(
                    '${_priorityLabel(report.priority)} priority',
                    _priorityColor(report.priority),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _heroPlaceholder() {
    return Container(
      color: AppColors.navy,
      child: Stack(
        children: [
          Positioned(
            right: -60,
            top: 20,
            child: Container(
              width: 190,
              height: 190,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.teal.withValues(alpha: .12),
              ),
            ),
          ),

          Center(
            child: Icon(
              _categoryIcon(report.categoryName),
              color: Colors.white.withValues(alpha: .85),
              size: 55,
            ),
          ),
        ],
      ),
    );
  }

  Widget _heroBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeading() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.mint,
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                report.categoryName.toUpperCase(),
                style: const TextStyle(
                  color: AppColors.tealDark,
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  letterSpacing: .7,
                ),
              ),
            ),

            const Spacer(),

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

        const SizedBox(height: 13),

        Text(
          report.incidentTitle.isEmpty
              ? '${report.categoryName} Incident'
              : report.incidentTitle,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 27,
            height: 1.08,
            fontWeight: FontWeight.w600,
            letterSpacing: -.8,
          ),
        ),

        const SizedBox(height: 8),

        Text(
          'Incident #${_shortId(report.incidentId)}',
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    ).animate().fadeIn().slideY(begin: .04);
  }

  Widget _buildStatusOverview() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: _overviewItem(
              LucideIcons.activity,
              _statusLabel(report.status),
              'Current status',
              _statusColor(report.status),
            ),
          ),

          Container(width: 1, height: 45, color: AppColors.border),

          Expanded(
            child: _overviewItem(
              LucideIcons.gauge,
              _priorityLabel(report.priority),
              'Priority',
              _priorityColor(report.priority),
            ),
          ),

          Container(width: 1, height: 45, color: AppColors.border),

          Expanded(
            child: _overviewItem(
              LucideIcons.users,
              '${report.reportCount}',
              report.reportCount == 1 ? 'Report' : 'Reports',
              AppColors.tealDark,
            ),
          ),
        ],
      ),
    );
  }

  Widget _overviewItem(IconData icon, String value, String label, Color color) {
    return Column(
      children: [
        Icon(icon, size: 18, color: color),

        const SizedBox(height: 8),

        Text(
          value,
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: color,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),

        const SizedBox(height: 4),

        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 9,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildDescription() {
    return _informationCard(
      icon: LucideIcons.fileText,
      title: 'Citizen evidence',
      child: Text(
        report.description,
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontSize: 13,
          height: 1.6,
        ),
      ),
    );
  }

  Widget _buildLocation() {
    return _informationCard(
      icon: LucideIcons.mapPin,
      title: 'Reported location',
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'GPS coordinates',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),

                const SizedBox(height: 5),

                Text(
                  '${report.latitude.toStringAsFixed(6)}, '
                  '${report.longitude.toStringAsFixed(6)}',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

          Container(
            width: 43,
            height: 43,
            decoration: BoxDecoration(
              color: AppColors.mint,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              LucideIcons.navigation,
              color: AppColors.tealDark,
              size: 19,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAuthority() {
    return _informationCard(
      icon: LucideIcons.building2,
      title: 'Responsible service unit',
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: AppColors.surfaceSoft,
              borderRadius: BorderRadius.circular(15),
            ),
            child: const Icon(
              LucideIcons.landmark,
              color: AppColors.navy,
              size: 21,
            ),
          ),

          const SizedBox(width: 13),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  report.authorityName ?? 'Routing in progress',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),

                const SizedBox(height: 4),

                const Text(
                  'Automatically routed by problem type',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

          const Icon(LucideIcons.route, color: AppColors.tealDark, size: 19),
        ],
      ),
    );
  }

  Widget _informationCard({
    required IconData icon,
    required String title,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 17, color: AppColors.tealDark),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),

          const SizedBox(height: 15),

          child,
        ],
      ),
    );
  }

  Widget _sectionTitle(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: AppColors.textSecondary,
        fontSize: 10,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.4,
      ),
    );
  }

  Widget _buildTimeline() {
    const steps = [
      _TimelineStep(
        keyName: 'open',
        title: 'Reported',
        description: 'Your report reached the responsible department.',
        icon: LucideIcons.circleCheckBig,
      ),
      _TimelineStep(
        keyName: 'under_review',
        title: 'Reviewed',
        description: 'The department reviewed and validated the issue.',
        icon: LucideIcons.searchCheck,
      ),
      _TimelineStep(
        keyName: 'assigned',
        title: 'Accepted',
        description: 'The department accepted responsibility for the response.',
        icon: LucideIcons.handshake,
      ),
      _TimelineStep(
        keyName: 'in_progress',
        title: 'In Progress',
        description: 'Field work on the reported issue is underway.',
        icon: LucideIcons.hammer,
      ),
      _TimelineStep(
        keyName: 'resolved',
        title: 'Resolved',
        description: 'The department completed the work and uploaded proof.',
        icon: LucideIcons.badgeCheck,
      ),
    ];

    final currentIndex = _statusIndex(report.status);

    return Container(
      padding: const EdgeInsets.fromLTRB(18, 20, 18, 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: List.generate(steps.length, (index) {
          final step = steps[index];
          final completed = index < currentIndex;
          final current = index == currentIndex;
          final isLast = index == steps.length - 1;
          return _timelineRow(
            step: step,
            completed: completed,
            current: current,
            isLast: isLast,
          );
        }),
      ),
    );
  }

  Widget _timelineRow({
    required _TimelineStep step,
    required bool completed,
    required bool current,
    required bool isLast,
  }) {
    final active = completed || current;

    final color = completed
        ? AppColors.resolved
        : current
        ? AppColors.teal
        : AppColors.border;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 42,
          child: Column(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: active ? color : AppColors.surfaceSoft,
                  shape: BoxShape.circle,
                  border: current
                      ? Border.all(
                          color: AppColors.teal.withValues(alpha: .25),
                          width: 5,
                        )
                      : null,
                ),
                child: Icon(
                  completed ? LucideIcons.check : step.icon,
                  size: 15,
                  color: active ? Colors.white : AppColors.textSecondary,
                ),
              ),

              if (!isLast)
                Container(
                  width: 2,
                  height: 48,
                  color: completed ? AppColors.resolved : AppColors.border,
                ),
            ],
          ),
        ),

        const SizedBox(width: 12),

        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        step.title,
                        style: TextStyle(
                          color: active
                              ? AppColors.textPrimary
                              : AppColors.textSecondary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),

                    if (current)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.mint,
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: const Text(
                          'CURRENT',
                          style: TextStyle(
                            color: AppColors.tealDark,
                            fontSize: 8,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 5),

                Text(
                  step.description,
                  style: TextStyle(
                    color: AppColors.textSecondary.withValues(
                      alpha: active ? 1 : .65,
                    ),
                    fontSize: 10,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }


  Widget _buildResponsibility() {
    String valueOrPending(String? value, String fallback) {
      if (value == null || value.trim().isEmpty) return fallback;
      return value;
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          _responsibilityRow(
            LucideIcons.userRound,
            'Reported by',
            'You',
          ),
          _detailDivider(),
          _responsibilityRow(
            LucideIcons.building2,
            'Responsible department',
            valueOrPending(report.authorityName, 'Routing in progress'),
          ),
          if (report.authorityPhone?.isNotEmpty == true) ...[
            _detailDivider(),
            _responsibilityRow(LucideIcons.phone, 'Department phone', report.authorityPhone!),
          ],
          if (report.authorityEmail?.isNotEmpty == true) ...[
            _detailDivider(),
            _responsibilityRow(LucideIcons.mail, 'Department email', report.authorityEmail!),
          ],
          _detailDivider(),
          _responsibilityRow(
            LucideIcons.searchCheck,
            'Reviewed by',
            valueOrPending(report.reviewedByName, 'Department review pending'),
          ),
          _detailDivider(),
          _responsibilityRow(
            LucideIcons.handshake,
            'Accepted by',
            valueOrPending(report.acceptedByName, 'Department has not accepted yet'),
          ),
          _detailDivider(),
          _responsibilityRow(
            LucideIcons.hammer,
            'Work started by',
            valueOrPending(report.workStartedByName, 'Work not started yet'),
          ),
          _detailDivider(),
          _responsibilityRow(
            LucideIcons.badgeCheck,
            'Resolved by',
            valueOrPending(report.resolutionReviewedByName, 'Not resolved yet'),
          ),
        ],
      ),
    );
  }

  Widget _responsibilityRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppColors.mint,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 17, color: AppColors.tealDark),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 9.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                value,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 11.5,
                  height: 1.35,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildIncidentInformation() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          _detailRow('Report ID', _shortId(report.id)),

          _detailDivider(),

          _detailRow('Incident ID', _shortId(report.incidentId)),

          _detailDivider(),

          _detailRow('Category', report.categoryName),

          _detailDivider(),

          _detailRow('Community reports', '${report.reportCount}'),

          _detailDivider(),

          _detailRow('Reported', _formatDate(report.createdAt)),
        ],
      ),
    );
  }

  Widget _detailDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 13),
      child: Container(height: 1, color: AppColors.border),
    );
  }

  Widget _detailRow(String label, String value) {
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        const SizedBox(width: 15),

        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCommunityMessage() {
    final multiple = report.reportCount > 1;

    return Container(
      padding: const EdgeInsets.all(19),
      decoration: BoxDecoration(
        color: AppColors.mint,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: const BoxDecoration(
              color: AppColors.teal,
              shape: BoxShape.circle,
            ),
            child: Icon(
              multiple ? LucideIcons.users : LucideIcons.mapPinCheck,
              color: Colors.white,
              size: 19,
            ),
          ),

          const SizedBox(width: 13),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  multiple
                      ? 'Community evidence strengthened'
                      : 'Report registered',
                  style: const TextStyle(
                    color: AppColors.navy,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),

                const SizedBox(height: 5),

                Text(
                  multiple
                      ? '${report.reportCount} reports are linked to this same physical incident. MtaaFix combines nearby reports instead of creating duplicate incidents.'
                      : 'Your report is currently linked to this incident and can be tracked here as its status changes.',
                  style: const TextStyle(
                    color: AppColors.tealDark,
                    fontSize: 11,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  int _statusIndex(String status) {
    switch (status) {
      case 'under_review':
        return 1;

      case 'assigned':
        return 2;

      case 'in_progress':
        return 3;

      case 'resolution_submitted':
        return 3;

      case 'resolved':
      case 'closed':
        return 4;

      default:
        return 0;
    }
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
        return 'Reviewed';

      case 'assigned':
        return 'Accepted';

      case 'in_progress':
        return 'In progress';

      case 'resolution_submitted':
        return 'In progress';

      case 'resolved':
        return 'Resolved';

      case 'closed':
        return 'Closed';

      default:
        return 'Reported';
    }
  }

  String _priorityLabel(String priority) {
    if (priority.isEmpty) {
      return 'Normal';
    }

    return '${priority[0].toUpperCase()}'
        '${priority.substring(1)}';
  }

  String _shortId(String value) {
    if (value.isEmpty) {
      return '—';
    }

    if (value.length <= 8) {
      return value.toUpperCase();
    }

    return value.substring(0, 8).toUpperCase();
  }

  String _formatDate(DateTime? date) {
    if (date == null) {
      return 'Recently';
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
}

class _TimelineStep {
  final String keyName;
  final String title;
  final String description;
  final IconData icon;

  const _TimelineStep({
    required this.keyName,
    required this.title,
    required this.description,
    required this.icon,
  });
}
