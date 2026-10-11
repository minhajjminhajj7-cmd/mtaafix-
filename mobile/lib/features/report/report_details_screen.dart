import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/models/report_category.dart';
import '../../core/models/problem_type.dart';
import '../../core/models/report_submission_result.dart';
import '../../core/services/category_service.dart';
import '../../core/services/problem_type_service.dart';
import '../../core/services/report_service.dart';
import '../../core/theme/app_colors.dart';
import 'report_result_screen.dart';

class ReportDetailsScreen extends StatefulWidget {
  final List<String> evidencePaths;
  final double latitude;
  final double longitude;

  const ReportDetailsScreen({
    super.key,
    required this.evidencePaths,
    required this.latitude,
    required this.longitude,
  });

  @override
  State<ReportDetailsScreen> createState() => _ReportDetailsScreenState();
}

class _ReportDetailsScreenState extends State<ReportDetailsScreen> {
  final TextEditingController _descriptionController = TextEditingController();

  List<ReportCategory> _categories = [];
  ReportCategory? _selectedCategory;

  List<ProblemType> _problemTypes = [];
  ProblemType? _selectedProblemType;

  bool _loadingProblemTypes = false;
  String? _problemTypeError;

  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await CategoryService.getCategories();

      if (!mounted) return;

      setState(() {
        _categories = categories;
        _loading = false;
        _error = null;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _loadProblemTypes(ReportCategory category) async {
    setState(() {
      _selectedCategory = category;
      _selectedProblemType = null;
      _problemTypes = [];
      _loadingProblemTypes = true;
      _problemTypeError = null;
    });

    try {
      final problemTypes = await ProblemTypeService.getProblemTypes(
        categoryId: category.id,
      );

      if (!mounted) return;

      // Prevent an older request from replacing the
      // results if the citizen quickly changes category.
      if (_selectedCategory?.id != category.id) {
        return;
      }

      setState(() {
        _problemTypes = problemTypes;
        _loadingProblemTypes = false;
      });
    } catch (error) {
      if (!mounted) return;

      if (_selectedCategory?.id != category.id) {
        return;
      }

      setState(() {
        _loadingProblemTypes = false;
        _problemTypeError = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(behavior: SnackBarBehavior.floating, content: Text(message)),
      );
  }

  void _reviewReport() {
    if (_selectedCategory == null) {
      _showMessage('Choose the type of issue.');
      return;
    }

    if (_selectedProblemType == null) {
      _showMessage('Choose the specific problem.');
      return;
    }

    final description = _descriptionController.text.trim();

    if (description.length < 10) {
      _showMessage('Please describe the issue with a little more detail.');
      return;
    }

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return _ReviewSheet(
          evidencePaths: widget.evidencePaths,
          latitude: widget.latitude,
          longitude: widget.longitude,
          category: _selectedCategory!,
          problemType: _selectedProblemType!,
          description: description,
        );
      },
    );
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

  bool _isVideoPath(String path) {
    final lower = path.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.m4v');
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
          'Issue details',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(22, 14, 22, 30),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildProgress(),

                    const SizedBox(height: 30),

                    const Text(
                      'What kind of issue is this?',
                      style: TextStyle(
                        fontSize: 27,
                        height: 1.1,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -.7,
                      ),
                    ),

                    const SizedBox(height: 9),

                    const Text(
                      'Choose the closest category so MtaaFix can route the incident correctly.',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                    ),

                    const SizedBox(height: 25),

                    if (_loading)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(35),
                          child: CircularProgressIndicator(
                            color: AppColors.teal,
                          ),
                        ),
                      )
                    else if (_error != null)
                      _buildErrorCard()
                    else
                      _buildCategoryGrid(),

                    if (_selectedCategory != null) ...[
                      const SizedBox(height: 29),

                      const Text(
                        'SPECIFIC PROBLEM',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.3,
                        ),
                      ),

                      const SizedBox(height: 8),

                      const Text(
                        'Choose what you can actually observe. MtaaFix will determine the safety priority automatically.',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                          height: 1.45,
                        ),
                      ),

                      const SizedBox(height: 13),

                      _buildProblemTypes(),
                    ],

                    const SizedBox(height: 29),

                    const Text(
                      'DESCRIBE THE PROBLEM',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.3,
                      ),
                    ),

                    const SizedBox(height: 11),

                    TextField(
                      controller: _descriptionController,
                      minLines: 4,
                      maxLines: 6,
                      maxLength: 500,
                      decoration: const InputDecoration(
                        hintText: 'Example: Large pothole near the junction causing vehicles to swerve...',
                        alignLabelWithHint: true,
                      ),
                    ),

                    const SizedBox(height: 8),

                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.mint,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            LucideIcons.mapPinCheck,
                            color: AppColors.tealDark,
                            size: 19,
                          ),

                          const SizedBox(width: 11),

                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Location attached',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${widget.latitude.toStringAsFixed(5)}, '
                                  '${widget.longitude.toStringAsFixed(5)}',
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: SizedBox(
                              width: 62,
                              height: 62,
                              child: _isVideoPath(widget.evidencePaths.first)
                                  ? Container(
                                      color: AppColors.mint,
                                      alignment: Alignment.center,
                                      child: const Icon(LucideIcons.video, color: AppColors.tealDark),
                                    )
                                  : Image.file(
                                      File(widget.evidencePaths.first),
                                      fit: BoxFit.cover,
                                    ),
                            ),
                          ),

                          const SizedBox(width: 13),

                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Evidence attached',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'Photos and videos will be submitted with the incident.',
                                  style: TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 11,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const Icon(
                            LucideIcons.circleCheck,
                            color: AppColors.teal,
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            Container(
              padding: const EdgeInsets.fromLTRB(22, 14, 22, 16),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SafeArea(
                top: false,
                child: SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: FilledButton(
                    onPressed: _reviewReport,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.navy,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Review report',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                        SizedBox(width: 9),
                        Icon(LucideIcons.arrowRight, size: 18),
                      ],
                    ),
                  ),
                ),
              ),
            ),
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
        _progressSegment(true),
        const SizedBox(width: 6),
        _progressSegment(true),
        const SizedBox(width: 6),
        _progressSegment(false),
      ],
    );
  }

  Widget _progressSegment(bool active) {
    return Expanded(
      child: Container(
        height: 5,
        decoration: BoxDecoration(
          color: active ? AppColors.teal : AppColors.border,
          borderRadius: BorderRadius.circular(100),
        ),
      ),
    );
  }

  Widget _buildCategoryGrid() {
    if (_categories.isEmpty) {
      return const Text('No report categories are currently available.');
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _categories.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 11,
        mainAxisSpacing: 11,
        childAspectRatio: 1.45,
      ),
      itemBuilder: (context, index) {
        final category = _categories[index];

        final selected = _selectedCategory?.id == category.id;

        return InkWell(
              onTap: () {
                _loadProblemTypes(category);
              },
              borderRadius: BorderRadius.circular(20),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: selected ? AppColors.navy : AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: selected ? AppColors.navy : AppColors.border,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Icon(
                      _categoryIcon(category.name),
                      color: selected ? AppColors.teal : AppColors.tealDark,
                      size: 24,
                    ),
                    Text(
                      category.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: selected ? Colors.white : AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            )
            .animate()
            .fadeIn(delay: Duration(milliseconds: 50 * index))
            .slideY(begin: .06);
      },
    );
  }

  Widget _buildProblemTypes() {
    if (_loadingProblemTypes) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: const Center(
          child: CircularProgressIndicator(color: AppColors.teal),
        ),
      );
    }

    if (_problemTypeError != null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(17),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            const Icon(
              LucideIcons.triangleAlert,
              color: AppColors.critical,
              size: 21,
            ),
            const SizedBox(height: 8),
            Text(
              _problemTypeError!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 5),
            TextButton(
              onPressed: () {
                final category = _selectedCategory;

                if (category != null) {
                  _loadProblemTypes(category);
                }
              },
              child: const Text('Try again'),
            ),
          ],
        ),
      );
    }

    if (_problemTypes.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(17),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: const Text(
          'No specific problems are configured for this category.',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }

    return Column(
      children: List.generate(_problemTypes.length, (index) {
        final problemType = _problemTypes[index];

        final selected = _selectedProblemType?.id == problemType.id;

        return Padding(
              padding: EdgeInsets.only(
                bottom: index == _problemTypes.length - 1 ? 0 : 10,
              ),
              child: InkWell(
                onTap: () {
                  setState(() {
                    _selectedProblemType = problemType;
                  });
                },
                borderRadius: BorderRadius.circular(18),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.navy : AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: selected ? AppColors.navy : AppColors.border,
                    ),
                  ),
                  child: Row(
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: selected ? AppColors.teal : AppColors.mint,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          selected ? LucideIcons.check : LucideIcons.circleDot,
                          size: 18,
                          color: selected ? Colors.white : AppColors.tealDark,
                        ),
                      ),
                      const SizedBox(width: 13),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              problemType.name,
                              style: TextStyle(
                                color: selected
                                    ? Colors.white
                                    : AppColors.textPrimary,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (problemType.description != null) ...[
                              const SizedBox(height: 3),
                              Text(
                                problemType.description!,
                                style: TextStyle(
                                  color: selected
                                      ? Colors.white.withValues(alpha: .72)
                                      : AppColors.textSecondary,
                                  fontSize: 11,
                                  height: 1.35,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        LucideIcons.chevronRight,
                        size: 17,
                        color: selected
                            ? Colors.white.withValues(alpha: .7)
                            : AppColors.textSecondary,
                      ),
                    ],
                  ),
                ),
              ),
            )
            .animate()
            .fadeIn(delay: Duration(milliseconds: 35 * index))
            .slideY(begin: .04);
      }),
    );
  }

  Widget _buildErrorCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          const Icon(LucideIcons.wifiOff, color: AppColors.critical),

          const SizedBox(height: 10),

          Text(
            _error!,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textSecondary),
          ),

          TextButton(
            onPressed: () {
              setState(() {
                _loading = true;
                _error = null;
              });

              _loadCategories();
            },
            child: const Text('Try again'),
          ),
        ],
      ),
    );
  }
}

class _ReviewSheet extends StatefulWidget {
  final List<String> evidencePaths;
  final double latitude;
  final double longitude;
  final ReportCategory category;
  final ProblemType problemType;
  final String description;

  const _ReviewSheet({
    required this.evidencePaths,
    required this.latitude,
    required this.longitude,
    required this.category,
    required this.problemType,
    required this.description,
  });

  @override
  State<_ReviewSheet> createState() => _ReviewSheetState();
}

class _ReviewSheetState extends State<_ReviewSheet> {
  bool _submitting = false;
  bool _checkingNearby = true;
  List<Map<String, dynamic>> _nearby = [];
  String? _attachToIncidentId;
  bool _forceNew = false;

  @override
  void initState() {
    super.initState();
    _checkNearby();
  }

  Future<void> _checkNearby() async {
    try {
      final items = await ReportService.getNearbyIncidents(
        categoryId: widget.category.id,
        problemTypeId: widget.problemType.id,
        latitude: widget.latitude,
        longitude: widget.longitude,
      );
      if (!mounted) return;
      setState(() {
        _nearby = items;
        _checkingNearby = false;
        if (items.isNotEmpty && (double.tryParse('${items.first['distanceMetres']}') ?? 999) <= 30) {
          _attachToIncidentId = items.first['id']?.toString();
        }
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _checkingNearby = false);
    }
  }

  bool _reviewVideo(String path) {
    final lower = path.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.m4v');
  }

  Future<void> _submit() async {
    if (_submitting) return;

    setState(() {
      _submitting = true;
    });

    try {
      final ReportSubmissionResult result = await ReportService.submitReport(
        categoryId: widget.category.id,
        problemTypeId: widget.problemType.id,
        description: widget.description,
        latitude: widget.latitude,
        longitude: widget.longitude,

        evidencePaths: widget.evidencePaths,
        attachToIncidentId: _attachToIncidentId,
        forceNew: _forceNew,
      );

      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => ReportResultScreen(result: result)),
      );
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _submitting = false;
      });

      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text(error.toString().replaceFirst('Exception: ', '')),
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * .88,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(22, 12, 22, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
              ),

              const SizedBox(height: 22),

              const Text(
                'Review your report',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -.5,
                ),
              ),

              const SizedBox(height: 6),

              const Text(
                'Check the evidence and details before sending.',
                style: TextStyle(color: AppColors.textSecondary),
              ),

              const SizedBox(height: 20),

              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: SizedBox(
                      width: double.infinity,
                      height: 190,
                      child: _reviewVideo(widget.evidencePaths.first)
                          ? Container(
                              color: AppColors.mint,
                              alignment: Alignment.center,
                              child: const Icon(LucideIcons.video, size: 48, color: AppColors.tealDark),
                            )
                          : Image.file(File(widget.evidencePaths.first), fit: BoxFit.cover),
                    ),
                  ),

                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.navy.withValues(alpha: .85),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            LucideIcons.camera,
                            size: 13,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 5),
                          Text(
                            '${widget.evidencePaths.length} FILE${widget.evidencePaths.length == 1 ? '' : 'S'}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              letterSpacing: .8,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              _buildRow(LucideIcons.tag, 'Category', widget.category.name),

              _buildRow(
                LucideIcons.circleDot,
                'Specific problem',
                widget.problemType.name,
              ),

              _buildRow(
                LucideIcons.mapPin,
                'Location',
                '${widget.latitude.toStringAsFixed(5)}, '
                    '${widget.longitude.toStringAsFixed(5)}',
              ),

              _buildRow(
                LucideIcons.messageSquareText,
                'Description',
                widget.description,
              ),

              if (_checkingNearby) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceSoft,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Row(
                    children: [
                      SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                      SizedBox(width: 11),
                      Expanded(child: Text('Checking for the same problem nearby…', style: TextStyle(fontSize: 11.5, color: AppColors.textSecondary))),
                    ],
                  ),
                ),
              ] else if (_nearby.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF8E8),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFF0D9A7)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(LucideIcons.combine, size: 18, color: Color(0xFF9B6B24)),
                          SizedBox(width: 8),
                          Expanded(child: Text('Possible existing issue nearby', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: Color(0xFF6E4C1C)))),
                        ],
                      ),
                      const SizedBox(height: 7),
                      Text(
                        '${_nearby.first['title'] ?? widget.problemType.name} · ${_nearby.first['distanceMetres']} m away · ${_nearby.first['report_count'] ?? 1} report(s)',
                        style: const TextStyle(fontSize: 11, height: 1.45, color: Color(0xFF77592D)),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => setState(() {
                                _attachToIncidentId = _nearby.first['id']?.toString();
                                _forceNew = false;
                              }),
                              style: OutlinedButton.styleFrom(
                                backgroundColor: _attachToIncidentId != null ? const Color(0xFFFFEDC8) : Colors.white,
                                side: const BorderSide(color: Color(0xFFE2C280)),
                              ),
                              child: const Text('Same problem', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => setState(() {
                                _attachToIncidentId = null;
                                _forceNew = true;
                              }),
                              style: OutlinedButton.styleFrom(
                                backgroundColor: _forceNew ? const Color(0xFFEAF4EF) : Colors.white,
                                side: BorderSide(color: _forceNew ? AppColors.teal : const Color(0xFFD7DFDB)),
                              ),
                              child: const Text('Different issue', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 15),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.navy.withValues(alpha: .05),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      LucideIcons.scanSearch,
                      color: AppColors.tealDark,
                      size: 19,
                    ),

                    SizedBox(width: 11),

                    Expanded(
                      child: Text(
                        'MtaaFix will check nearby incidents, assess priority and determine the configured service unit.',
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
              ),

              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                height: 55,
                child: FilledButton(
                  onPressed: _submitting ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.teal,
                    disabledBackgroundColor: AppColors.teal.withValues(
                      alpha: .6,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                  child: _submitting
                      ? const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 21,
                              height: 21,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.3,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(width: 12),
                            Text(
                              'Sending evidence...',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                          ],
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.send, size: 18),
                            SizedBox(width: 9),
                            Text(
                              'Submit report',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 17),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.tealDark),

          const SizedBox(width: 11),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 9,
                    letterSpacing: 1,
                    fontWeight: FontWeight.w600,
                  ),
                ),

                const SizedBox(height: 4),

                Text(
                  value,
                  style: const TextStyle(
                    fontWeight: FontWeight.w500,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
