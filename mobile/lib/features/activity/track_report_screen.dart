import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/services/tracking_service.dart';
import '../../core/theme/app_colors.dart';

class TrackReportScreen extends StatefulWidget {
  const TrackReportScreen({super.key});

  @override
  State<TrackReportScreen> createState() => _TrackReportScreenState();
}

class _TrackReportScreenState extends State<TrackReportScreen> {
  final _controller = TextEditingController();
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _result;

  static const _steps = [
    ['open', 'Reported'],
    ['under_review', 'Reviewed'],
    ['assigned', 'Accepted'],
    ['in_progress', 'In Progress'],
    ['resolved', 'Resolved'],
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _track() async {
    FocusScope.of(context).unfocus();
    if (_controller.text.trim().isEmpty) {
      setState(() => _error = 'Enter your MtaaFix tracking code.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
      _result = null;
    });

    try {
      final result = await TrackingService.trackReport(_controller.text);
      if (!mounted) return;
      setState(() {
        _result = result;
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

  String _pretty(String? value) {
    if (value == null || value.isEmpty) return '—';
    return value
        .replaceAll('_', ' ')
        .split(' ')
        .map((word) => word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}')
        .join(' ');
  }

  int _statusIndex(String? status) {
    if (status == 'closed' || status == 'resolved') return _steps.length - 1;
    if (status == 'resolution_submitted') return 3;
    final index = _steps.indexWhere((step) => step.first == status);
    return index < 0 ? 0 : index;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Track report'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
          children: [
            const Text(
              'Follow your report from submission to resolution.',
              style: TextStyle(
                fontSize: 24,
                height: 1.18,
                fontWeight: FontWeight.w600,
                letterSpacing: -.7,
              ),
            ),
            const SizedBox(height: 9),
            const Text(
              'You do not need an account. Enter the tracking code you received after submitting your report.',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 11,
                height: 1.5,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 22),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border.all(color: AppColors.border),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                children: [
                  TextField(
                    controller: _controller,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(
                      labelText: 'Tracking code',
                      hintText: 'MTF-XXXXXXXXXX',
                      prefixIcon: Icon(LucideIcons.hash),
                    ),
                    onSubmitted: (_) => _track(),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _loading ? null : _track,
                      icon: _loading
                          ? const SizedBox(
                              width: 17,
                              height: 17,
                              child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white),
                            )
                          : const Icon(LucideIcons.search, size: 17),
                      label: Text(_loading ? 'Checking...' : 'Check report status'),
                    ),
                  ),
                ],
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3F3),
                  border: Border.all(color: const Color(0xFFF0D0D0)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(_error!, style: const TextStyle(color: AppColors.critical, fontSize: 10, fontWeight: FontWeight.w500)),
              ),
            ],
            if (_result != null) ...[
              const SizedBox(height: 20),
              _resultHeader(),
              const SizedBox(height: 12),
              _workflow(),
              const SizedBox(height: 12),
              _responsibility(),
              const SizedBox(height: 12),
              _details(),
              const SizedBox(height: 12),
              _history(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _resultHeader() {
    final status = _result!['status']?.toString();
    return Container(
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: AppColors.navy,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.teal,
              borderRadius: BorderRadius.circular(11),
            ),
            child: const Icon(LucideIcons.fileCheck, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _result!['problem_type_name']?.toString() ?? 'Infrastructure report',
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  _pretty(status),
                  style: const TextStyle(color: Color(0xFF83DDD1), fontSize: 10, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _workflow() {
    final current = _statusIndex(_result!['status']?.toString());
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 17, 16, 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'REPORT PROGRESS',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 9,
              letterSpacing: 1.15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 15),
          ...List.generate(_steps.length, (index) {
            final done = index <= current;
            final isCurrent = index == current;
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: done ? AppColors.tealDark : AppColors.surfaceSoft,
                      ),
                      child: Icon(
                        done ? LucideIcons.check : LucideIcons.circle,
                        size: 13,
                        color: done ? Colors.white : AppColors.textSecondary,
                      ),
                    ),
                    if (index < _steps.length - 1)
                      Container(
                        width: 2,
                        height: 28,
                        color: index < current ? AppColors.tealDark : AppColors.border,
                      ),
                  ],
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      _steps[index][1],
                      style: TextStyle(
                        color: isCurrent ? AppColors.tealDark : AppColors.textPrimary,
                        fontSize: 10,
                        fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }


  Widget _responsibility() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'WHO IS RESPONSIBLE',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 9,
              letterSpacing: 1.15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          _row('Responsible department', _result!['authority_name']?.toString()),
          _row('Department phone', _result!['authority_contact_phone']?.toString()),
          _row('Department email', _result!['authority_contact_email']?.toString()),
          _row('Reviewed by', _result!['reviewed_by_name']?.toString()),
          _row('Accepted by', _result!['accepted_by_name']?.toString()),
          _row('Work started by', _result!['work_started_by_name']?.toString()),
          _row('Resolved by', _result!['resolution_reviewed_by_name']?.toString()),
        ],
      ),
    );
  }

  Widget _history() {
    final raw = _result!['history'];
    if (raw is! List || raw.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'ACCOUNTABILITY TRAIL',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 9,
              letterSpacing: 1.15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          ...raw.whereType<Map>().map((entry) {
            final item = Map<String, dynamic>.from(entry);
            final actor = item['actor_name']?.toString() ?? 'System';
            final action = _pretty(item['action']?.toString());
            final note = item['note']?.toString();
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: const BoxDecoration(color: AppColors.mint, shape: BoxShape.circle),
                    child: const Icon(LucideIcons.userCheck, size: 14, color: AppColors.tealDark),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(action, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 2),
                        Text(actor, style: const TextStyle(fontSize: 9.5, color: AppColors.textSecondary)),
                        if (note != null && note.isNotEmpty) ...[
                          const SizedBox(height: 3),
                          Text(note, style: const TextStyle(fontSize: 9.5, color: AppColors.textSecondary, height: 1.35)),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _details() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          _row('Category', _result!['category_name']?.toString()),
          _row('Priority', _pretty(_result!['priority']?.toString())),
          _row('Responsible department', _result!['authority_name']?.toString()),
          _row('Progress evidence', _evidenceCount(_result!['progress_evidence'])),
          _row('Resolution evidence', _evidenceCount(_result!['resolution_evidence'])),
        ],
      ),
    );
  }

  String _evidenceCount(dynamic value) {
    if (value is! List || value.isEmpty) return 'None yet';
    final videos = value.whereType<Map>().where((item) => item['media_type']?.toString() == 'video').length;
    final photos = value.length - videos;
    final parts = <String>[];
    if (photos > 0) parts.add('$photos photo${photos == 1 ? '' : 's'}');
    if (videos > 0) parts.add('$videos video${videos == 1 ? '' : 's'}');
    return parts.join(', ');
  }

  Widget _row(String label, String? value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 118,
            child: Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 9, fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(
              value?.isNotEmpty == true ? value! : '—',
              textAlign: TextAlign.right,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 10, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
