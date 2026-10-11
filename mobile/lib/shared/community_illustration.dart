import 'package:flutter/material.dart';

class CommunityIllustration extends StatelessWidget {
  final double height;
  const CommunityIllustration({super.key, this.height = 300});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: CustomPaint(
        painter: _CommunityPainter(),
      ),
    );
  }
}

class _CommunityPainter extends CustomPainter {
  final Paint p = Paint()..style = PaintingStyle.fill;
  final Paint stroke = Paint()..style = PaintingStyle.stroke..strokeCap = StrokeCap.round;

  @override
  void paint(Canvas canvas, Size size) {
    final sx = size.width / 360;
    final sy = size.height / 300;
    canvas.save();
    canvas.scale(sx, sy);

    // warm background blob
    p.color = const Color(0xFFF4E3CA);
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(8, 8, 344, 284), const Radius.circular(34)),
      p,
    );

    p.color = const Color(0x22F3A83B);
    canvas.drawCircle(const Offset(306, 48), 55, p);
    p.color = const Color(0x221F7A63);
    canvas.drawCircle(const Offset(52, 255), 65, p);

    // road/ground
    p.color = const Color(0xFFDDEBCF);
    canvas.drawPath(
      Path()
        ..moveTo(0, 228)
        ..quadraticBezierTo(90, 190, 182, 224)
        ..quadraticBezierTo(270, 254, 360, 208)
        ..lineTo(360, 300)
        ..lineTo(0, 300)
        ..close(),
      p,
    );
    p.color = const Color(0xFFC9B391);
    stroke..color = const Color(0xFFC9B391)..strokeWidth = 22;
    canvas.drawLine(const Offset(24, 248), const Offset(322, 198), stroke);
    stroke..color = const Color(0xFFFFF7EC)..strokeWidth = 10;
    canvas.drawLine(const Offset(24, 248), const Offset(322, 198), stroke);

    // street light
    stroke..color = const Color(0xFF33463D)..strokeWidth = 5;
    canvas.drawLine(const Offset(294, 83), const Offset(294, 215), stroke);
    canvas.drawArc(const Rect.fromLTWH(294, 54, 45, 45), 3.1, 1.5, false, stroke);
    p.color = const Color(0xFFF3A83B);
    canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(327, 64, 26, 16), const Radius.circular(5)), p);
    p.color = const Color(0x33F3A83B);
    canvas.drawCircle(const Offset(340, 82), 27, p);

    // pothole
    p.color = const Color(0xFF8A715C);
    canvas.drawOval(const Rect.fromLTWH(226, 232, 60, 20), p);
    p.color = const Color(0xFF5D4D41);
    canvas.drawOval(const Rect.fromLTWH(238, 236, 37, 11), p);

    // older woman figure
    p.color = const Color(0xFF8A5C3A);
    canvas.drawCircle(const Offset(132, 112), 29, p);
    p.color = const Color(0xFF3C332E);
    canvas.drawPath(Path()
      ..moveTo(103, 115)
      ..quadraticBezierTo(107, 73, 137, 77)
      ..quadraticBezierTo(161, 80, 164, 117)
      ..quadraticBezierTo(142, 93, 103, 115)
      ..close(), p);
    p.color = const Color(0xFFF3A83B);
    canvas.drawArc(const Rect.fromLTWH(108, 77, 51, 24), 3.2, 3.0, false, Paint()..style=PaintingStyle.stroke..strokeWidth=8..strokeCap=StrokeCap.round..color=const Color(0xFFF3A83B));

    p.color = const Color(0xFF1F7A63);
    canvas.drawPath(Path()
      ..moveTo(103, 141)
      ..quadraticBezierTo(132, 130, 160, 143)
      ..lineTo(177, 226)
      ..lineTo(84, 226)
      ..close(), p);

    stroke..color = const Color(0xFF8A5C3A)..strokeWidth = 13;
    canvas.drawLine(const Offset(111, 158), const Offset(82, 194), stroke);
    canvas.drawLine(const Offset(155, 158), const Offset(191, 191), stroke);

    p.color = const Color(0xFF27372F);
    canvas.save();
    canvas.translate(185, 170);
    canvas.rotate(.12);
    canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(0, 0, 28, 46), const Radius.circular(7)), p);
    p.color = const Color(0xFFFFF8ED);
    canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(4, 5, 20, 31), const Radius.circular(4)), p);
    canvas.restore();

    stroke..color = const Color(0xFF5B4638)..strokeWidth = 14;
    canvas.drawLine(const Offset(102, 224), const Offset(96, 279), stroke);
    canvas.drawLine(const Offset(158, 224), const Offset(164, 279), stroke);
    p.color = const Color(0xFF27372F);
    canvas.drawOval(const Rect.fromLTWH(77, 275, 38, 12), p);
    canvas.drawOval(const Rect.fromLTWH(150, 275, 38, 12), p);

    // issue pin
    p.color = const Color(0xFFF06C4F);
    final pin = Path()
      ..moveTo(250, 141)
      ..cubicTo(250, 122, 265, 107, 284, 107)
      ..cubicTo(303, 107, 318, 122, 318, 141)
      ..cubicTo(318, 168, 284, 194, 284, 194)
      ..cubicTo(284, 194, 250, 168, 250, 141)
      ..close();
    canvas.drawPath(pin, p);
    p.color = const Color(0xFFFFF8ED);
    canvas.drawCircle(const Offset(284, 140), 11, p);
    stroke..color = const Color(0xFFF06C4F)..strokeWidth = 3.5;
    canvas.drawLine(const Offset(278, 140), const Offset(290, 140), stroke);
    canvas.drawLine(const Offset(284, 134), const Offset(284, 146), stroke);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
