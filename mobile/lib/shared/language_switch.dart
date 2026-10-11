import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/localization/app_language.dart';
import '../core/theme/app_colors.dart';

class LanguageSwitch extends StatelessWidget {
  final bool compact;
  const LanguageSwitch({super.key, this.compact = true});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppLanguage.notifier,
      builder: (context, language, _) {
        return InkWell(
          borderRadius: BorderRadius.circular(22),
          onTap: AppLanguage.toggle,
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: compact ? 10 : 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(LucideIcons.languages, size: 15, color: AppColors.primary),
                const SizedBox(width: 6),
                if (!compact) ...[
                  Text(
                    language == 'en' ? 'English' : 'Kiswahili',
                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(width: 6),
                ],
                Text(
                  language == 'en' ? 'SW' : 'EN',
                  style: const TextStyle(color: AppColors.primary, fontSize: 10.5, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
