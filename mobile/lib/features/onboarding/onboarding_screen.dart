import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/localization/app_language.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/gradient_button.dart';
import '../../shared/language_switch.dart';
import '../../shared/issue_slideshow.dart';
import '../activity/track_report_screen.dart';
import '../auth/login_screen.dart';
import '../report/report_issue_screen.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppLanguage.notifier,
      builder: (context, language, _) {
        final sw = language == 'sw';
        return Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
              children: [
                Row(
                  children: [
                    Image.asset('assets/brand/mtaafix_mark.png', width: 44, height: 44),
                    const SizedBox(width: 11),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('MtaaFix', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w600, letterSpacing: -.35)),
                          SizedBox(height: 2),
                          Text('Mtaa yetu, jukumu letu.', style: TextStyle(color: AppColors.textSecondary, fontSize: 10.5, fontWeight: FontWeight.w400)),
                        ],
                      ),
                    ),
                    const LanguageSwitch(),
                  ],
                ),
                const SizedBox(height: 22),

                const IssueSlideshow(height: 285).animate().fadeIn(duration: 500.ms),

                const SizedBox(height: 25),
                Text(
                  sw ? 'Umeona tatizo?\nLifikishe sehemu sahihi.' : 'See a problem?\nSend it where action can happen.',
                  style: const TextStyle(
                    color: AppColors.charcoal,
                    fontSize: 31,
                    height: 1.08,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -.85,
                  ),
                ).animate().fadeIn(delay: 80.ms).slideY(begin: .05, end: 0),
                const SizedBox(height: 13),
                Text(
                  sw
                      ? 'Ripoti mashimo ya barabara, uvujaji wa maji, mifereji, taka au taa hatarishi. Weka picha au video na eneo, kisha fuatilia hatua.'
                      : 'Report potholes, water leaks, drainage, waste or unsafe streetlights. Add a photo or video and location, then follow the progress.',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 13.5, height: 1.58, fontWeight: FontWeight.w400),
                ),

                const SizedBox(height: 23),
                GradientButton(
                  onPressed: () {
                    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReportIssueScreen()));
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(LucideIcons.camera, size: 18),
                      const SizedBox(width: 8),
                      Text(sw ? 'Ripoti tatizo' : 'Report a problem'),
                    ],
                  ),
                ),

                const SizedBox(height: 14),
                InkWell(
                  borderRadius: BorderRadius.circular(18),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TrackReportScreen())),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(color: AppColors.mint, borderRadius: BorderRadius.circular(13)),
                          child: const Icon(LucideIcons.search, size: 18, color: AppColors.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(sw ? 'Fuatilia taarifa' : 'Track a report', style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 2),
                              Text(sw ? 'Tumia tracking code yako' : 'Use your tracking code', style: const TextStyle(color: AppColors.textSecondary, fontSize: 10.5, fontWeight: FontWeight.w400)),
                            ],
                          ),
                        ),
                        const Icon(LucideIcons.chevronRight, size: 17, color: AppColors.textSecondary),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(sw ? 'Una akaunti?' : 'Already have an account?', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11.5)),
                    TextButton(
                      onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen())),
                      child: Text(sw ? 'Ingia' : 'Sign in', style: const TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
