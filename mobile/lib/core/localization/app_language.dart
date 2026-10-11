import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppLanguage {
  AppLanguage._();

  static const _key = 'mtaafix_language';
  static final ValueNotifier<String> notifier = ValueNotifier<String>('en');

  static bool get isSwahili => notifier.value == 'sw';

  static Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    notifier.value = prefs.getString(_key) ?? 'en';
  }

  static Future<void> toggle() async {
    final next = notifier.value == 'en' ? 'sw' : 'en';
    notifier.value = next;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, next);
  }

  static String text({required String en, required String sw}) {
    return isSwahili ? sw : en;
  }
}
