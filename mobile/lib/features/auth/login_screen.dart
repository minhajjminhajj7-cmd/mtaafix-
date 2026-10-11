import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/localization/app_language.dart';
import '../../core/services/auth_service.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/gradient_button.dart';
import '../../shared/language_switch.dart';
import '../../shared/issue_slideshow.dart';
import '../home/home_screen.dart';
import '../activity/track_report_screen.dart';
import '../report/report_issue_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  final _otpController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _useOtp = false;
  bool _otpSent = false;
  String? _developmentOtp;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _showMessage(String message, {bool error = true}) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        backgroundColor: error ? AppColors.critical : AppColors.resolved,
      ),
    );
  }

  Future<void> _login() async {
    FocusScope.of(context).unfocus();
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text;
    final sw = AppLanguage.isSwahili;
    if (identifier.isEmpty || password.isEmpty) {
      _showMessage(sw ? 'Weka barua pepe/simu na nenosiri.' : 'Enter your email/phone and password.');
      return;
    }

    setState(() => _isLoading = true);
    final result = await AuthService.login(identifier: identifier, password: password);
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (!result.success) {
      _showMessage(result.message);
      return;
    }

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const HomeScreen()),
      (route) => false,
    );
  }


  Future<void> _requestOtp() async {
    FocusScope.of(context).unfocus();
    final phone = _identifierController.text.trim();
    if (phone.isEmpty) {
      _showMessage(AppLanguage.isSwahili ? 'Weka namba ya simu.' : 'Enter your phone number.');
      return;
    }
    setState(() => _isLoading = true);
    try {
      final data = await AuthService.requestPhoneOtp(phone);
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _otpSent = true;
        _developmentOtp = data['developmentOtp']?.toString();
      });
      _showMessage(
        data['message']?.toString() ?? (AppLanguage.isSwahili ? 'OTP imetumwa.' : 'Verification code sent.'),
        error: false,
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      _showMessage(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _verifyOtp() async {
    final phone = _identifierController.text.trim();
    final code = _otpController.text.trim();
    if (phone.isEmpty || code.length != 6) {
      _showMessage(AppLanguage.isSwahili ? 'Weka namba ya simu na OTP ya tarakimu 6.' : 'Enter your phone number and 6-digit OTP.');
      return;
    }
    setState(() => _isLoading = true);
    final result = await AuthService.verifyPhoneOtp(phone: phone, code: code);
    if (!mounted) return;
    setState(() => _isLoading = false);
    if (!result.success) {
      _showMessage(result.message);
      return;
    }
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const HomeScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: AppLanguage.notifier,
      builder: (context, language, _) {
        final sw = language == 'sw';
        return Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      IconButton(
                        onPressed: () => Navigator.of(context).maybePop(),
                        style: IconButton.styleFrom(backgroundColor: Colors.white, side: const BorderSide(color: AppColors.border)),
                        icon: const Icon(LucideIcons.arrowLeft, size: 18),
                      ),
                      const Spacer(),
                      const LanguageSwitch(),
                    ],
                  ),

                  const SizedBox(height: 18),
                  const IssueSlideshow(height: 180, borderRadius: 24, showCaption: false),

                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Image.asset('assets/brand/mtaafix_mark.png', width: 54, height: 54),
                      const SizedBox(width: 13),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('MtaaFix', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, letterSpacing: -.35)),
                          const SizedBox(height: 2),
                          Text(sw ? 'Akaunti ya mwananchi' : 'Citizen account', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w400)),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 28),
                  Text(
                    sw ? 'Karibu tena' : 'Welcome back',
                    style: const TextStyle(fontSize: 29, fontWeight: FontWeight.w600, letterSpacing: -.7),
                  ),
                  const SizedBox(height: 7),
                  Text(
                    sw ? 'Ingia kuona taarifa zako, historia na maendeleo ya matukio uliyotuma.' : 'Sign in to keep your reports, history and incident updates together.',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.55, fontWeight: FontWeight.w400),
                  ),

                  const SizedBox(height: 28),
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: FilledButton(
                            onPressed: _isLoading ? null : () => setState(() { _useOtp = false; _otpSent = false; }),
                            style: FilledButton.styleFrom(
                              backgroundColor: !_useOtp ? AppColors.teal : Colors.transparent,
                              foregroundColor: !_useOtp ? Colors.white : AppColors.textSecondary,
                              elevation: 0,
                            ),
                            child: Text(sw ? 'Nenosiri' : 'Password'),
                          ),
                        ),
                        Expanded(
                          child: FilledButton(
                            onPressed: _isLoading ? null : () => setState(() => _useOtp = true),
                            style: FilledButton.styleFrom(
                              backgroundColor: _useOtp ? AppColors.teal : Colors.transparent,
                              foregroundColor: _useOtp ? Colors.white : AppColors.textSecondary,
                              elevation: 0,
                            ),
                            child: const Text('Phone OTP'),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(_useOtp ? (sw ? 'Namba ya simu' : 'Phone number') : (sw ? 'Barua pepe au simu' : 'Email or phone'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _identifierController,
                    keyboardType: _useOtp ? TextInputType.phone : TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(
                      hintText: _useOtp ? (sw ? 'Mfano 0712345678' : 'Example 0712345678') : (sw ? 'Weka barua pepe au simu' : 'Enter email or phone'),
                      prefixIcon: const Icon(LucideIcons.userRound, size: 18),
                    ),
                  ),

                  if (!_useOtp) ...[
                    const SizedBox(height: 18),
                    Text(sw ? 'Nenosiri' : 'Password', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      onSubmitted: (_) { if (!_isLoading) _login(); },
                      decoration: InputDecoration(
                        hintText: sw ? 'Weka nenosiri lako' : 'Enter your password',
                        prefixIcon: const Icon(LucideIcons.lockKeyhole, size: 18),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          icon: Icon(_obscurePassword ? LucideIcons.eye : LucideIcons.eyeOff, size: 18),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    GradientButton(
                      onPressed: _isLoading ? null : _login,
                      child: _isLoading
                          ? const SizedBox(width: 21, height: 21, child: CircularProgressIndicator(strokeWidth: 2.3, color: Colors.white))
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [Text(sw ? 'Ingia' : 'Sign in'), const SizedBox(width: 8), const Icon(LucideIcons.arrowRight, size: 17)],
                            ),
                    ),
                  ] else ...[
                    const SizedBox(height: 18),
                    if (_otpSent) ...[
                      Text(sw ? 'Namba ya uthibitisho' : 'Verification code', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _otpController,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        decoration: InputDecoration(
                          counterText: '',
                          hintText: '123456',
                          prefixIcon: const Icon(LucideIcons.shieldCheck, size: 18),
                        ),
                      ),
                      if (_developmentOtp != null) ...[
                        const SizedBox(height: 7),
                        Text('DEV OTP: $_developmentOtp', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      ],
                      const SizedBox(height: 18),
                      GradientButton(onPressed: _isLoading ? null : _verifyOtp, child: Text(sw ? 'Thibitisha na uingie' : 'Verify and sign in')),
                      Center(child: TextButton(onPressed: _isLoading ? null : _requestOtp, child: Text(sw ? 'Tuma tena OTP' : 'Resend OTP'))),
                    ] else ...[
                      Text(
                        sw ? 'Tutakutumia OTP ya tarakimu 6 kwenye namba iliyosajiliwa.' : 'We will send a 6-digit OTP to your registered mobile number.',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.45),
                      ),
                      const SizedBox(height: 18),
                      GradientButton(onPressed: _isLoading ? null : _requestOtp, child: Text(sw ? 'Tuma OTP' : 'Send OTP')),
                    ],
                  ],

                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _isLoading ? null : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReportIssueScreen())),
                          icon: const Icon(LucideIcons.userRound, size: 17),
                          label: Text(sw ? 'Endelea kama mgeni' : 'Continue as guest'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _isLoading ? null : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TrackReportScreen())),
                          icon: const Icon(LucideIcons.search, size: 17),
                          label: Text(sw ? 'Fuatilia taarifa' : 'Track report'),
                        ),
                      ),
                    ],
                  ),

                  const Divider(height: 32),
                  Center(
                    child: Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      alignment: WrapAlignment.center,
                      children: [
                        Text(sw ? 'Huna akaunti?' : 'New to MtaaFix?', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11.5)),
                        TextButton(
                          onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const RegisterScreen())),
                          child: Text(sw ? 'Fungua akaunti' : 'Create account', style: const TextStyle(fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
