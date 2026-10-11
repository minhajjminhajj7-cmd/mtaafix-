import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const primary = Color(0xFF1F7A63);
  static const primaryDark = Color(0xFF185E4D);
  static const charcoal = Color(0xFF26362F);
  static const accent = Color(0xFFF3A83B);
  static const coral = Color(0xFFF06C4F);

  // aliases kept for existing screens while the product moves away from blue/navy
  static const navy = charcoal;
  static const navyLight = Color(0xFF355248);
  static const teal = primary;
  static const tealDark = primaryDark;
  static const mint = Color(0xFFEAF6F0);

  static const background = Color(0xFFFFF9F0);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceSoft = Color(0xFFF5F7F2);
  static const cream = Color(0xFFFFF3E1);

  static const textPrimary = charcoal;
  static const textSecondary = Color(0xFF738078);
  static const textLight = Color(0xFFFFFFFF);

  static const border = Color(0xFFE7DED1);

  static const critical = Color(0xFFC95345);
  static const high = Color(0xFFE97B32);
  static const normal = Color(0xFFD79A2B);
  static const resolved = Color(0xFF2C8B61);
}
