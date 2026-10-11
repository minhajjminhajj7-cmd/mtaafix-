import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/localization/app_language.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/gradient_button.dart';

class ChosenLocation {
  const ChosenLocation({
    required this.latitude,
    required this.longitude,
    required this.label,
  });

  final double latitude;
  final double longitude;
  final String label;
}

class ChooseLocationScreen extends StatefulWidget {
  const ChooseLocationScreen({
    super.key,
    this.initialLatitude,
    this.initialLongitude,
  });

  final double? initialLatitude;
  final double? initialLongitude;

  @override
  State<ChooseLocationScreen> createState() => _ChooseLocationScreenState();
}

class _ChooseLocationScreenState extends State<ChooseLocationScreen> {
  final _searchController = TextEditingController();
  final _mapController = MapController();
  late LatLng _selected;
  String _label = '';
  bool _searching = false;
  bool _locating = false;
  List<Map<String, dynamic>> _results = const [];

  @override
  void initState() {
    super.initState();
    _selected = LatLng(
      widget.initialLatitude ?? -3.3869,
      widget.initialLongitude ?? 36.6830,
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _searching = true;
      _results = const [];
    });

    try {
      final uri = Uri.https('nominatim.openstreetmap.org', '/search', {
        'q': query,
        'format': 'jsonv2',
        'limit': '5',
        'countrycodes': 'tz',
      });

      final response = await http.get(
        uri,
        headers: const {
          'User-Agent': 'MtaaFix/1.0 (civic infrastructure reporting prototype)',
        },
      );

      if (response.statusCode != 200) {
        throw Exception('Search failed');
      }

      final decoded = jsonDecode(response.body) as List<dynamic>;
      if (!mounted) return;

      setState(() {
        _results = decoded.cast<Map<String, dynamic>>();
        _searching = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _searching = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(
            AppLanguage.text(
              en: 'Could not search locations. You can still tap a point on the map.',
              sw: 'Imeshindikana kutafuta eneo. Bado unaweza kugusa sehemu kwenye ramani.',
            ),
          ),
        ),
      );
    }
  }


  Future<void> _useCurrentLocation() async {
    setState(() => _locating = true);

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('service disabled');
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        throw Exception('permission denied');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      if (!mounted) return;

      final point = LatLng(position.latitude, position.longitude);
      setState(() {
        _selected = point;
        _label = AppLanguage.text(
          en: 'Current GPS location',
          sw: 'Eneo la sasa kwa GPS',
        );
        _locating = false;
        _results = const [];
      });
      _mapController.move(point, 16);
    } catch (_) {
      if (!mounted) return;
      setState(() => _locating = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(
            AppLanguage.text(
              en: 'Could not get your current location right now.',
              sw: 'Imeshindikana kupata eneo lako la sasa kwa sasa.',
            ),
          ),
        ),
      );
    }
  }

  void _chooseResult(Map<String, dynamic> result) {
    final lat = double.tryParse('${result['lat']}');
    final lon = double.tryParse('${result['lon']}');
    if (lat == null || lon == null) return;

    final point = LatLng(lat, lon);
    setState(() {
      _selected = point;
      _label = '${result['display_name'] ?? ''}';
      _results = const [];
    });
    _mapController.move(point, 16);
  }

  @override
  Widget build(BuildContext context) {
    final sw = AppLanguage.isSwahili;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          sw ? 'Chagua eneo' : 'Choose location',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    sw ? 'Tafuta sehemu au alama maarufu' : 'Search a place or landmark',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _searchController,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (_) => _search(),
                    decoration: InputDecoration(
                      hintText: sw ? 'Mfano: Sakina, Arusha' : 'Example: Sakina, Arusha',
                      prefixIcon: const Icon(LucideIcons.search, size: 18),
                      suffixIcon: _searching
                          ? const Padding(
                              padding: EdgeInsets.all(13),
                              child: SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            )
                          : IconButton(
                              onPressed: _search,
                              icon: const Icon(LucideIcons.arrowRight, size: 18),
                            ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      OutlinedButton.icon(
                        onPressed: _locating ? null : _useCurrentLocation,
                        icon: _locating
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(LucideIcons.locateFixed, size: 17),
                        label: Text(sw ? 'Tumia eneo la sasa' : 'Use current location'),
                      ),
                      OutlinedButton.icon(
                        onPressed: () {
                          setState(() {
                            _results = const [];
                          });
                        },
                        icon: const Icon(LucideIcons.hand, size: 17),
                        label: Text(sw ? 'Chagua kwenye ramani' : 'Pick on map'),
                      ),
                    ],
                  ),
                  if (_results.isNotEmpty)
                    Container(
                      constraints: const BoxConstraints(maxHeight: 190),
                      margin: const EdgeInsets.only(top: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: _results.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final result = _results[index];
                          return ListTile(
                            dense: true,
                            leading: const Icon(LucideIcons.mapPin, size: 18, color: AppColors.tealDark),
                            title: Text(
                              '${result['display_name'] ?? ''}',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12),
                            ),
                            onTap: () => _chooseResult(result),
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: Stack(
                children: [
                  FlutterMap(
                    mapController: _mapController,
                    options: MapOptions(
                      initialCenter: _selected,
                      initialZoom: 13.5,
                      onTap: (_, point) {
                        setState(() {
                          _selected = point;
                          _label = sw ? 'Eneo ulilochagua kwenye ramani' : 'Point selected on map';
                        });
                      },
                    ),
                    children: [
                      TileLayer(
                        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'com.mtaafix.mobile',
                      ),
                      MarkerLayer(
                        markers: [
                          Marker(
                            point: _selected,
                            width: 52,
                            height: 52,
                            child: Container(
                              decoration: BoxDecoration(
                                color: AppColors.teal,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 4),
                                boxShadow: const [
                                  BoxShadow(color: Colors.black26, blurRadius: 12, offset: Offset(0, 5)),
                                ],
                              ),
                              child: const Icon(LucideIcons.mapPin, color: Colors.white, size: 24),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Positioned(
                    left: 14,
                    right: 14,
                    bottom: 14,
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: const [
                          BoxShadow(color: Colors.black12, blurRadius: 18, offset: Offset(0, 7)),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            children: [
                              const Icon(LucideIcons.mapPinCheck, size: 18, color: AppColors.tealDark),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _label.isNotEmpty
                                      ? _label
                                      : '${_selected.latitude.toStringAsFixed(5)}, ${_selected.longitude.toStringAsFixed(5)}',
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          GradientButton(
                            onPressed: () {
                              Navigator.of(context).pop(
                                ChosenLocation(
                                  latitude: _selected.latitude,
                                  longitude: _selected.longitude,
                                  label: _label.isNotEmpty
                                      ? _label
                                      : '${_selected.latitude.toStringAsFixed(5)}, ${_selected.longitude.toStringAsFixed(5)}',
                                ),
                              );
                            },
                            child: Text(sw ? 'Thibitisha eneo' : 'Confirm location'),
                          ),
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
}
