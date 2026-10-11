import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'core/localization/app_language.dart';
import 'features/splash/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppLanguage.initialize();
  runApp(const MtaaFixApp());
}

class MtaaFixApp extends StatelessWidget {
  const MtaaFixApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppLanguage.notifier,
      builder: (context, language, _) => MaterialApp(
      key: ValueKey(language),
      title: 'MtaaFix',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const SplashScreen(),
    ),
    );
  }
}
