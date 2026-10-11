import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import 'report_details_screen.dart';
import 'choose_location_screen.dart';
import '../../core/theme/app_colors.dart';
import '../../core/localization/app_language.dart';

class ReportIssueScreen extends StatefulWidget {
  const ReportIssueScreen({super.key});

  @override
  State<ReportIssueScreen> createState() => _ReportIssueScreenState();
}

class _ReportIssueScreenState extends State<ReportIssueScreen> {
  final ImagePicker _picker = ImagePicker();

  final List<XFile> _evidence = [];
  double? _latitude;
  double? _longitude;
  String _locationLabel = '';

  bool _gettingLocation = false;

  Future<void> _choosePhotoSource() async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return Container(
          padding: const EdgeInsets.fromLTRB(22, 12, 22, 30),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(100),
                ),
              ),
              const SizedBox(height: 22),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Add evidence',
                  style: TextStyle(fontSize: 21, fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(height: 6),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Photos or videos help verify and resolve the issue faster.',
                  style: TextStyle(color: AppColors.textSecondary, height: 1.4),
                ),
              ),
              const SizedBox(height: 22),
              _sourceButton(
                icon: LucideIcons.camera,
                title: 'Take a photo',
                subtitle: 'Use your camera',
                onTap: () {
                  Navigator.pop(sheetContext);
                  _pickImage(ImageSource.camera);
                },
              ),
              const SizedBox(height: 10),
              _sourceButton(
                icon: LucideIcons.image,
                title: 'Choose from gallery',
                subtitle: 'Select an existing photo',
                onTap: () {
                  Navigator.pop(sheetContext);
                  _pickImage(ImageSource.gallery);
                },
              ),
              const SizedBox(height: 10),
              _sourceButton(
                icon: LucideIcons.video,
                title: 'Record a video',
                subtitle: 'Capture field evidence',
                onTap: () {
                  Navigator.pop(sheetContext);
                  _pickVideo(ImageSource.camera);
                },
              ),
              const SizedBox(height: 10),
              _sourceButton(
                icon: LucideIcons.clapperboard,
                title: 'Choose video from gallery',
                subtitle: 'Select an existing video',
                onTap: () {
                  Navigator.pop(sheetContext);
                  _pickVideo(ImageSource.gallery);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _sourceButton({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: AppColors.mint,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: AppColors.tealDark, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              LucideIcons.chevronRight,
              size: 19,
              color: AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final image = await _picker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 1600,
      );

      if (image == null || !mounted) return;

      setState(() {
        if (_evidence.length < 5) _evidence.add(image);
      });
    } catch (_) {
      if (!mounted) return;

      _showMessage('Could not access the camera or gallery.');
    }
  }

  Future<void> _pickVideo(ImageSource source) async {
    try {
      final video = await _picker.pickVideo(
        source: source,
        maxDuration: const Duration(seconds: 45),
      );
      if (video == null || !mounted) return;
      setState(() {
        if (_evidence.length < 5) _evidence.add(video);
      });
    } catch (_) {
      if (!mounted) return;
      _showMessage('Could not access video capture or gallery.');
    }
  }

  bool _isVideo(XFile file) {
    final path = file.path.toLowerCase();
    return path.endsWith('.mp4') || path.endsWith('.mov') || path.endsWith('.webm') || path.endsWith('.m4v');
  }

  Future<void> _getLocation() async {
    setState(() {
      _gettingLocation = true;
    });

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();

      if (!serviceEnabled) {
        if (!mounted) return;

        setState(() {
          _gettingLocation = false;
        });

        _showMessage(
          'Location services are turned off. Please enable location.',
        );
        return;
      }

      var permission = await Geolocator.checkPermission();

      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied) {
        if (!mounted) return;

        setState(() {
          _gettingLocation = false;
        });

        _showMessage('Location permission is required to report an issue.');
        return;
      }

      if (permission == LocationPermission.deniedForever) {
        if (!mounted) return;

        setState(() {
          _gettingLocation = false;
        });

        _showMessage(
          'Location permission is disabled. Enable it from device settings.',
        );
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      if (!mounted) return;

      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
        _locationLabel = AppLanguage.text(
          en: 'Current GPS location',
          sw: 'Eneo la sasa kwa GPS',
        );
        _gettingLocation = false;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _gettingLocation = false;
      });

      _showMessage('We could not get your current location.');
    }
  }

  Future<void> _chooseLocationOnMap() async {
    final chosen = await Navigator.of(context).push<ChosenLocation>(
      MaterialPageRoute(
        builder: (_) => ChooseLocationScreen(
          initialLatitude: _latitude,
          initialLongitude: _longitude,
        ),
      ),
    );

    if (chosen == null || !mounted) return;

    setState(() {
      _latitude = chosen.latitude;
      _longitude = chosen.longitude;
      _locationLabel = chosen.label;
    });
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(behavior: SnackBarBehavior.floating, content: Text(message)),
      );
  }

  void _continue() {
    if (_evidence.isEmpty) {
      _showMessage('Add at least one photo or video of the issue first.');
      return;
    }

    if (_latitude == null || _longitude == null) {
      _showMessage(
        AppLanguage.text(
          en: 'Confirm the issue location first.',
          sw: 'Thibitisha eneo la tatizo kwanza.',
        ),
      );
      return;
    }

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ReportDetailsScreen(
          evidencePaths: _evidence.map((file) => file.path).toList(),
          latitude: _latitude!,
          longitude: _longitude!,
        ),
      ),
    );
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
          'Report an issue',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(22, 14, 22, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildProgress(),
                    const SizedBox(height: 31),

                    const Text(
                      'Show us what happened',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 28,
                        height: 1.1,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -0.8,
                      ),
                    ),

                    const SizedBox(height: 10),

                    const Text(
                      'Start with evidence and the exact location. This helps MtaaFix identify and group the physical issue.',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),

                    const SizedBox(height: 27),

                    _buildEvidenceCard()
                        .animate()
                        .fadeIn(duration: 400.ms)
                        .slideY(begin: 0.05),

                    const SizedBox(height: 16),

                    _buildLocationCard()
                        .animate()
                        .fadeIn(delay: 100.ms, duration: 400.ms)
                        .slideY(begin: 0.05),

                    const SizedBox(height: 20),

                    _buildWhyLocation(),
                  ],
                ),
              ),
            ),

            _buildBottomAction(),
          ],
        ),
      ),
    );
  }

  Widget _buildProgress() {
    return Row(
      children: [
        _progressSegment(true),
        const SizedBox(width: 6),
        _progressSegment(false),
        const SizedBox(width: 6),
        _progressSegment(false),
        const SizedBox(width: 6),
        _progressSegment(false),
      ],
    );
  }

  Widget _progressSegment(bool active) {
    return Expanded(
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        height: 5,
        decoration: BoxDecoration(
          color: active ? AppColors.teal : AppColors.border,
          borderRadius: BorderRadius.circular(100),
        ),
      ),
    );
  }

  Widget _buildEvidenceCard() {
    if (_evidence.isNotEmpty) {
      return Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: AppColors.border),
        ),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Evidence attached',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 112,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _evidence.length,
                separatorBuilder: (_, __) => const SizedBox(width: 10),
                itemBuilder: (context, index) {
                  final file = _evidence[index];
                  final video = _isVideo(file);
                  return Stack(
                    children: [
                      Container(
                        width: 112,
                        height: 112,
                        clipBehavior: Clip.antiAlias,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceSoft,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: video
                            ? const Center(child: Icon(LucideIcons.video, size: 32, color: AppColors.tealDark))
                            : Image.file(File(file.path), fit: BoxFit.cover),
                      ),
                      Positioned(
                        right: 5,
                        top: 5,
                        child: IconButton.filled(
                          visualDensity: VisualDensity.compact,
                          style: IconButton.styleFrom(backgroundColor: Colors.black54, foregroundColor: Colors.white),
                          onPressed: () => setState(() => _evidence.removeAt(index)),
                          icon: const Icon(LucideIcons.x, size: 14),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${_evidence.length}/5 files • photos and videos supported',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 11.5),
                  ),
                ),
                TextButton.icon(
                  onPressed: _evidence.length >= 5 ? null : _choosePhotoSource,
                  icon: const Icon(LucideIcons.plus, size: 16),
                  label: const Text('Add more'),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return InkWell(
      onTap: _choosePhotoSource,
      borderRadius: BorderRadius.circular(26),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 35),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: AppColors.border),
        ),
        child: const Column(
          children: [
            SizedBox(
              width: 64,
              height: 64,
              child: DecoratedBox(
                decoration: BoxDecoration(color: AppColors.mint, borderRadius: BorderRadius.all(Radius.circular(21))),
                child: Icon(LucideIcons.camera, color: AppColors.tealDark, size: 29),
              ),
            ),
            SizedBox(height: 17),
            Text('Add photo or video evidence', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
            SizedBox(height: 7),
            Text(
              'Take a photo, record a short video, or choose media from your gallery.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationCard() {
    final hasLocation = _latitude != null && _longitude != null;
    final sw = AppLanguage.isSwahili;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: hasLocation
              ? AppColors.teal.withValues(alpha: 0.45)
              : AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: hasLocation ? AppColors.mint : AppColors.surfaceSoft,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Icon(
                  hasLocation ? LucideIcons.mapPinCheck : LucideIcons.mapPin,
                  color: hasLocation ? AppColors.tealDark : AppColors.navy,
                  size: 22,
                ),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      hasLocation
                          ? (sw ? 'Eneo limethibitishwa' : 'Location confirmed')
                          : (sw ? 'Eneo la tatizo' : 'Issue location'),
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      hasLocation
                          ? (_locationLabel.isNotEmpty
                              ? _locationLabel
                              : '${_latitude!.toStringAsFixed(5)}, ${_longitude!.toStringAsFixed(5)}')
                          : (sw
                              ? 'Tumia eneo la sasa au chagua sehemu nyingine'
                              : 'Use current location or choose another place'),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _gettingLocation ? null : _getLocation,
                  icon: _gettingLocation
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(LucideIcons.locateFixed, size: 17),
                  label: Text(sw ? 'Eneo la sasa' : 'Current location'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  onPressed: _chooseLocationOnMap,
                  icon: const Icon(LucideIcons.map, size: 17),
                  label: Text(sw ? 'Chagua kwenye ramani' : 'Choose on map'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.teal,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWhyLocation() {
    return Container(
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: AppColors.navy.withValues(alpha: 0.045),
        borderRadius: BorderRadius.circular(18),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.sparkles, size: 18, color: AppColors.tealDark),
          SizedBox(width: 11),
          Expanded(
            child: Text(
              'MtaaFix uses location to detect whether nearby residents are reporting the same physical problem.',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
                height: 1.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomAction() {
    final ready = _evidence.isNotEmpty && _latitude != null && _longitude != null;

    return Container(
      padding: const EdgeInsets.fromLTRB(22, 14, 22, 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(color: AppColors.border.withValues(alpha: 0.8)),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          width: double.infinity,
          height: 55,
          child: FilledButton(
            onPressed: _continue,
            style: FilledButton.styleFrom(
              backgroundColor: ready ? AppColors.teal : AppColors.navy,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
              ),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Continue',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                ),
                SizedBox(width: 9),
                Icon(LucideIcons.arrowRight, size: 19),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
