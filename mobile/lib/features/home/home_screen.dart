import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/localization/app_language.dart';
import '../../core/models/citizen_report.dart';
import '../../core/services/report_service.dart';
import '../../core/services/storage_service.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/gradient_button.dart';
import '../../shared/language_switch.dart';
import '../../shared/issue_slideshow.dart';
import '../activity/activity_screen.dart';
import '../activity/track_report_screen.dart';
import '../auth/login_screen.dart';
import '../report/report_issue_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _name = 'Citizen';
  bool _loading = true;
  String? _error;
  List<CitizenReport> _reports = [];

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final name = await StorageService.getUserName();
      final reports = await ReportService.getMyReports();
      if (!mounted) return;
      setState(() {
        _name = (name != null && name.trim().isNotEmpty) ? name.trim() : 'Citizen';
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

  List<CitizenReport> get _incidents {
    final map = <String, CitizenReport>{};
    for (final report in _reports) {
      if (report.incidentId.isEmpty) continue;
      map.putIfAbsent(report.incidentId, () => report);
    }
    return map.values.toList();
  }

  List<CitizenReport> get _activeIncidents => _incidents
      .where((item) => item.status != 'resolved' && item.status != 'closed')
      .toList();

  int get _resolvedCount => _incidents
      .where((item) => item.status == 'resolved' || item.status == 'closed')
      .length;

  String get _firstName {
    final parts = _name.trim().split(' ');
    return parts.isEmpty || parts.first.isEmpty ? 'Citizen' : parts.first;
  }

  Future<void> _logout() async {
    await StorageService.clearSession();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  Future<void> _openReport() async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReportIssueScreen()));
    _loadDashboard();
  }

  void _openTrack() => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TrackReportScreen()));
  void _openActivity() => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ActivityScreen()));

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppLanguage.notifier,
      builder: (context, language, _) {
        final sw = language == 'sw';
        return Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
            bottom: false,
            child: RefreshIndicator(
              color: AppColors.primary,
              onRefresh: _loadDashboard,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 118),
                children: [
                  _header(sw),
                  const SizedBox(height: 22),
                  _hero(sw),
                  const SizedBox(height: 16),
                  _quickActions(sw),
                  const SizedBox(height: 26),
                  _sectionTitle(sw ? 'Muhtasari wa taarifa zako' : 'Your reporting summary', _loading ? '' : '${_reports.length} ${sw ? 'taarifa' : 'reports'}'),
                  const SizedBox(height: 11),
                  _summaryStrip(sw),
                  const SizedBox(height: 27),
                  _sectionTitle(sw ? 'Matukio yanayoendelea' : 'Active incidents', _loading ? '' : '${_activeIncidents.length} ${sw ? 'yanaendelea' : 'active'}'),
                  const SizedBox(height: 11),
                  if (_loading)
                    _loadingBox()
                  else if (_error != null)
                    _errorBox(sw)
                  else if (_activeIncidents.isEmpty)
                    _emptyBox(sw)
                  else
                    ..._activeIncidents.take(4).map((item) => _incidentCard(item, sw)),
                  if (!_loading && _activeIncidents.length > 4) ...[
                    const SizedBox(height: 6),
                    OutlinedButton(
                      onPressed: _openActivity,
                      child: Text(sw ? 'Angalia taarifa zangu zote' : 'View all my reports'),
                    ),
                  ],
                ],
              ),
            ),
          ),
          bottomNavigationBar: _bottomNavigation(sw),
        );
      },
    );
  }

  Widget _header(bool sw) {
    return Row(
      children: [
        Image.asset('assets/brand/mtaafix_mark.png', width: 43, height: 43),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                sw ? 'Habari, $_firstName' : 'Hello, $_firstName',
                style: const TextStyle(fontSize: 17.5, fontWeight: FontWeight.w600, letterSpacing: -.3),
              ),
              const SizedBox(height: 2),
              Text(
                sw ? 'Mtaa wako unaendeleaje leo?' : 'How is your neighborhood today?',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 10.5, fontWeight: FontWeight.w400),
              ),
            ],
          ),
        ),
        const LanguageSwitch(),
        const SizedBox(width: 6),
        PopupMenuButton<String>(
          onSelected: (value) {
            if (value == 'logout') _logout();
          },
          itemBuilder: (_) => [
            PopupMenuItem(value: 'logout', child: Text(sw ? 'Toka' : 'Sign out')),
          ],
          child: Container(
            width: 39,
            height: 39,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: AppColors.border),
              shape: BoxShape.circle,
            ),
            child: Text(
              _firstName.substring(0, 1).toUpperCase(),
              style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.primary, fontSize: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _hero(bool sw) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(25),
      child: SizedBox(
        height: 300,
        child: Stack(
          fit: StackFit.expand,
          children: [
            const IssueSlideshow(height: 300, borderRadius: 0, showCaption: false),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0xD0173A31)],
                ),
              ),
            ),
            Positioned(
              left: 18,
              right: 18,
              bottom: 18,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    sw ? 'Umeona tatizo mtaani?' : 'See a problem in your area?',
                    style: const TextStyle(color: Colors.white, fontSize: 22, height: 1.12, fontWeight: FontWeight.w600, letterSpacing: -.45),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    sw ? 'Tuma picha au video na eneo; kisha fuatilia uwajibikaji hadi tatizo litatuliwe.' : 'Send a photo or video and location, then follow responsibility until the problem is resolved.',
                    style: const TextStyle(color: Color(0xE6FFFFFF), fontSize: 11.5, height: 1.45, fontWeight: FontWeight.w400),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: 190,
                    child: GradientButton(
                      onPressed: _openReport,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                      radius: 16,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(LucideIcons.camera, size: 17),
                          const SizedBox(width: 7),
                          Text(sw ? 'Ripoti tatizo' : 'Report a problem'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickActions(bool sw) {
    return Row(
      children: [
        Expanded(
          child: _quickAction(
            icon: LucideIcons.search,
            title: sw ? 'Fuatilia taarifa' : 'Track report',
            subtitle: sw ? 'Tumia tracking code' : 'Use your code',
            tint: AppColors.mint,
            iconColor: AppColors.primary,
            onTap: _openTrack,
          ),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: _quickAction(
            icon: LucideIcons.fileText,
            title: sw ? 'Taarifa zangu' : 'My reports',
            subtitle: sw ? 'Historia na hatua' : 'History & status',
            tint: const Color(0xFFFFF0D4),
            iconColor: const Color(0xFFD68A24),
            onTap: _openActivity,
          ),
        ),
      ],
    );
  }

  Widget _quickAction({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color tint,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(18)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 39,
                height: 39,
                decoration: BoxDecoration(color: tint, borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(height: 11),
              Text(title, style: const TextStyle(fontSize: 12.2, fontWeight: FontWeight.w600)),
              const SizedBox(height: 3),
              Text(subtitle, style: const TextStyle(color: AppColors.textSecondary, fontSize: 9.5, fontWeight: FontWeight.w400)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(String title, String action) {
    return Row(
      children: [
        Expanded(child: Text(title, style: const TextStyle(color: AppColors.charcoal, fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: -.2))),
        if (action.isNotEmpty) Text(action, style: const TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _summaryStrip(bool sw) {
    final values = [
      ['${_reports.length}', sw ? 'Taarifa' : 'Reports', AppColors.primary],
      ['${_activeIncidents.length}', sw ? 'Zinaendelea' : 'Active', AppColors.accent],
      ['$_resolvedCount', sw ? 'Zimetatuliwa' : 'Resolved', AppColors.resolved],
    ];
    return Container(
      decoration: BoxDecoration(color: Colors.white, border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(19)),
      child: Row(
        children: values.map((item) {
          final index = values.indexOf(item);
          return Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 15),
              decoration: BoxDecoration(border: index < values.length - 1 ? const Border(right: BorderSide(color: AppColors.border)) : null),
              child: Column(
                children: [
                  Text(_loading ? '—' : item[0] as String, style: TextStyle(fontSize: 21, fontWeight: FontWeight.w600, color: item[2] as Color, letterSpacing: -.45)),
                  const SizedBox(height: 3),
                  Text(item[1] as String, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary, fontSize: 9.2, fontWeight: FontWeight.w400)),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _incidentCard(CitizenReport incident, bool sw) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: _openActivity,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(color: Colors.white, border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(18)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(color: AppColors.mint, borderRadius: BorderRadius.circular(12)),
                  child: const Icon(LucideIcons.mapPinned, color: AppColors.primary, size: 18),
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(incident.categoryName, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 3),
                      Text(incident.description, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w400)),
                    ],
                  ),
                ),
                const Icon(LucideIcons.chevronRight, color: AppColors.textSecondary, size: 16),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 7,
              runSpacing: 7,
              children: [
                _badge(_pretty(incident.status), _statusColor(incident.status)),
                _badge('${_pretty(incident.priority)} ${sw ? 'kipaumbele' : 'priority'}', _priorityColor(incident.priority)),
              ],
            ),
            const SizedBox(height: 11),
            Row(
              children: [
                const Icon(LucideIcons.building2, size: 12, color: AppColors.textSecondary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(incident.authorityName ?? (sw ? 'Uelekezaji unaendelea' : 'Routing in progress'), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textSecondary, fontSize: 9.5, fontWeight: FontWeight.w400)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _badge(String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
        decoration: BoxDecoration(color: color.withValues(alpha: .10), borderRadius: BorderRadius.circular(20)),
        child: Text(label, style: TextStyle(color: color, fontSize: 8.4, fontWeight: FontWeight.w500)),
      );

  Color _statusColor(String value) {
    switch (value) {
      case 'resolved':
      case 'closed': return AppColors.resolved;
      case 'in_progress': return AppColors.primary;
      case 'resolution_submitted': return const Color(0xFF8B6A45);
      case 'under_review': return const Color(0xFFD39228);
      default: return AppColors.textSecondary;
    }
  }

  Color _priorityColor(String value) {
    switch (value) {
      case 'critical': return AppColors.critical;
      case 'high': return AppColors.high;
      case 'low': return AppColors.primary;
      default: return AppColors.normal;
    }
  }

  String _pretty(String value) => value.replaceAll('_', ' ').split(' ').map((word) => word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}').join(' ');

  Widget _loadingBox() => const Padding(padding: EdgeInsets.symmetric(vertical: 28), child: Center(child: CircularProgressIndicator(color: AppColors.primary)));

  Widget _errorBox(bool sw) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: const Color(0xFFFFF3EF), border: Border.all(color: const Color(0xFFF0CFC7)), borderRadius: BorderRadius.circular(18)),
        child: Text(_error ?? (sw ? 'Imeshindikana kupakia taarifa.' : 'Unable to load reports.'), style: const TextStyle(color: AppColors.critical, fontSize: 11, fontWeight: FontWeight.w500)),
      );

  Widget _emptyBox(bool sw) => Container(
        padding: const EdgeInsets.all(19),
        decoration: BoxDecoration(color: const Color(0xFFF1F8F3), border: Border.all(color: const Color(0xFFDCEBDF)), borderRadius: BorderRadius.circular(18)),
        child: Row(
          children: [
            const Icon(LucideIcons.circleCheckBig, color: AppColors.resolved, size: 22),
            const SizedBox(width: 12),
            Expanded(child: Text(sw ? 'Kwa sasa hakuna tukio linaloendelea kutoka kwenye taarifa zako.' : 'There are no active incidents from your reports right now.', style: const TextStyle(fontSize: 10.5, height: 1.4, fontWeight: FontWeight.w400))),
          ],
        ),
      );

  Widget _bottomNavigation(bool sw) {
    return Container(
      margin: const EdgeInsets.fromLTRB(14, 0, 14, 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(23),
        boxShadow: const [BoxShadow(color: Color(0x10000000), blurRadius: 20, offset: Offset(0, 7))],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 67,
          child: Row(
            children: [
              _navItem(LucideIcons.house, sw ? 'Mwanzo' : 'Home', true, () {}),
              _navItem(LucideIcons.mapPinPlus, sw ? 'Ripoti' : 'Report', false, _openReport),
              _navItem(LucideIcons.search, sw ? 'Fuatilia' : 'Track', false, _openTrack),
              _navItem(LucideIcons.fileText, sw ? 'Zangu' : 'My reports', false, _openActivity),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(IconData icon, String label, bool active, VoidCallback onTap) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: active ? 35 : 30,
              height: active ? 30 : 28,
              decoration: BoxDecoration(color: active ? AppColors.mint : Colors.transparent, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, size: 17, color: active ? AppColors.primary : AppColors.textSecondary),
            ),
            const SizedBox(height: 3),
            Text(label, style: TextStyle(color: active ? AppColors.primary : AppColors.textSecondary, fontSize: 8.5, fontWeight: active ? FontWeight.w600 : FontWeight.w400)),
          ],
        ),
      ),
    );
  }
}
