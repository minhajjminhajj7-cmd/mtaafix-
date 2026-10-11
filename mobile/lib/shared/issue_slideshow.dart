import 'dart:async';

import 'package:flutter/material.dart';

import '../core/localization/app_language.dart';

class IssueSlide {
  const IssueSlide({
    required this.image,
    required this.enTitle,
    required this.swTitle,
    required this.enCaption,
    required this.swCaption,
  });

  final String image;
  final String enTitle;
  final String swTitle;
  final String enCaption;
  final String swCaption;
}

const issueSlides = <IssueSlide>[
  IssueSlide(
    image: 'assets/images/slides/roads.jpg',
    enTitle: 'Roads',
    swTitle: 'Barabara',
    enCaption: 'Potholes and damaged roads can be reported before they become a bigger safety risk.',
    swCaption: 'Mashimo na uharibifu wa barabara unaweza kuripotiwa kabla haujawa hatari kubwa zaidi.',
  ),
  IssueSlide(
    image: 'assets/images/slides/water.jpg',
    enTitle: 'Water',
    swTitle: 'Maji',
    enCaption: 'Leaks and burst pipes can be located and followed through to action.',
    swCaption: 'Uvujaji na mabomba yaliyopasuka yanaweza kuwekwa kwenye ramani na kufuatiliwa.',
  ),
  IssueSlide(
    image: 'assets/images/slides/drainage.jpg',
    enTitle: 'Drainage',
    swTitle: 'Mifereji',
    enCaption: 'Blocked drains and flood-prone points become visible before the problem grows.',
    swCaption: 'Mifereji iliyoziba na maeneo ya mafuriko yanaonekana kabla tatizo halijakua.',
  ),
  IssueSlide(
    image: 'assets/images/slides/waste.jpg',
    enTitle: 'Waste',
    swTitle: 'Taka',
    enCaption: 'Waste hotspots can be reported with evidence, location and a visible response trail.',
    swCaption: 'Maeneo yenye taka yanaweza kuripotiwa pamoja na ushahidi, eneo na historia ya hatua.',
  ),
  IssueSlide(
    image: 'assets/images/slides/streetlight.jpg',
    enTitle: 'Street lighting',
    swTitle: 'Taa za barabarani',
    enCaption: 'Unsafe or non-working lights can be assigned to the responsible service team.',
    swCaption: 'Taa zisizofanya kazi zinaweza kupelekwa kwa timu inayohusika na kufuatiliwa.',
  ),
];

class IssueSlideshow extends StatefulWidget {
  const IssueSlideshow({
    super.key,
    this.height = 285,
    this.borderRadius = 26,
    this.showCaption = true,
  });

  final double height;
  final double borderRadius;
  final bool showCaption;

  @override
  State<IssueSlideshow> createState() => _IssueSlideshowState();
}

class _IssueSlideshowState extends State<IssueSlideshow> {
  int _index = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (!mounted) return;
      setState(() => _index = (_index + 1) % issueSlides.length);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sw = AppLanguage.isSwahili;
    final slide = issueSlides[_index];

    return ClipRRect(
      borderRadius: BorderRadius.circular(widget.borderRadius),
      child: SizedBox(
        height: widget.height,
        width: double.infinity,
        child: Stack(
          fit: StackFit.expand,
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 650),
              switchInCurve: Curves.easeInOut,
              switchOutCurve: Curves.easeInOut,
              child: Image.asset(
                slide.image,
                key: ValueKey(slide.image),
                fit: BoxFit.cover,
              ),
            ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0xD4142F28)],
                  stops: [0.35, 1],
                ),
              ),
            ),
            if (widget.showCaption)
              Positioned(
                left: 18,
                right: 18,
                bottom: 18,
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 350),
                  child: Column(
                    key: ValueKey('${AppLanguage.notifier.value}-$_index'),
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        sw ? slide.swTitle : slide.enTitle,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 19,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        sw ? slide.swCaption : slide.enCaption,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11.5,
                          height: 1.45,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                      const SizedBox(height: 11),
                      Row(
                        children: List.generate(issueSlides.length, (i) {
                          final active = i == _index;
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            margin: const EdgeInsets.only(right: 5),
                            width: active ? 22 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: active ? Colors.white : Colors.white54,
                              borderRadius: BorderRadius.circular(100),
                            ),
                          );
                        }),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
