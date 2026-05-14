import 'package:flutter/material.dart';
import '../i18n/app_localizations.dart';
import '../widgets/language_toggle_button.dart';

class SBColors {
  static const primary = Color(0xFF29418C);
  static const secondaryContainer = Color(0xFFDBE1FE);
  static const onSurfaceVariant = Color(0xFF444651);
  static const card = Color(0xFFF1E9E3);
  static const securityCardBg = Color(0xFFF0E6D8);
  static const outlineVariant = Color(0xFFC5C5D3);
}

class ChildProgressScreen extends StatefulWidget {
  const ChildProgressScreen({super.key});

  @override
  State<ChildProgressScreen> createState() => _ChildProgressScreenState();
}

class _ChildProgressScreenState extends State<ChildProgressScreen>
    with SingleTickerProviderStateMixin {
  bool _drawerOpen = false;
  late final AnimationController _drawerController;
  late final Animation<double> _drawerAnimation;

  @override
  void initState() {
    super.initState();
    _drawerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
    _drawerAnimation = CurvedAnimation(
      parent: _drawerController,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _drawerController.dispose();
    super.dispose();
  }

  void _openDrawer() {
    setState(() => _drawerOpen = true);
    _drawerController.forward();
  }

  void _closeDrawer() {
    _drawerController.reverse().then((_) {
      if (!mounted) return;
      setState(() => _drawerOpen = false);
    });
  }

  void _navigateFromDrawer(String route) {
    _closeDrawer();
    Future.microtask(() {
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, route);
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      body: SafeArea(
        child: Center(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: SizedBox(
              width: 375,
              child: Stack(
                children: [
                  SingleChildScrollView(
                    child: Container(
                      width: 375,
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 100),
                      decoration: const BoxDecoration(
                        color: Color(0xFFF8F4F0),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildHeader(t),
                          const SizedBox(height: 20),
                          _buildHero(t),
                          const SizedBox(height: 28),
                          _buildStatsGrid(t),
                          const SizedBox(height: 28),
                          _buildChartSection(t),
                          const SizedBox(height: 28),
                          _buildSubjectMastery(t),
                          const SizedBox(height: 28),
                          _buildActionButtons(t),
                          const SizedBox(height: 28),
                          _buildInsightFooter(t),
                        ],
                      ),
                    ),
                  ),

                  if (_drawerOpen)
                    AnimatedBuilder(
                      animation: _drawerAnimation,
                      builder: (_, __) => GestureDetector(
                        onTap: _closeDrawer,
                        child: Container(
                          color: Colors.black.withOpacity(
                            0.35 * _drawerAnimation.value,
                          ),
                        ),
                      ),
                    ),

                  AnimatedBuilder(
                    animation: _drawerAnimation,
                    builder: (_, child) => Transform.translate(
                      offset: Offset(-260 * (1 - _drawerAnimation.value), 0),
                      child: child,
                    ),
                    child: Container(
                      width: 260,
                      height: double.infinity,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF8F4F0),
                        borderRadius: BorderRadius.only(
                          topRight: Radius.circular(24),
                          bottomRight: Radius.circular(24),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x22000000),
                            blurRadius: 24,
                            offset: Offset(4, 0),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.fromLTRB(20, 48, 20, 28),
                            decoration: const BoxDecoration(
                              color: Color(0xFFF1E9E3),
                              borderRadius: BorderRadius.only(
                                topRight: Radius.circular(24),
                              ),
                              border: Border(
                                bottom: BorderSide(
                                  color: Color(0xFFD6CAC0),
                                  width: 1,
                                ),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Image.asset(
                                  'assets/images/logo.png',
                                  width: 150,
                                  height: 150,
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, __, ___) => const Icon(
                                    Icons.school_rounded,
                                    color: SBColors.primary,
                                    size: 40,
                                  ),
                                ),
                                const SizedBox(height: 0),
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    t.familyDashboard,
                                    style: const TextStyle(
                                      color: SBColors.onSurfaceVariant,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: ListView(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 12),
                              children: [
                                _drawerItem(Icons.home_outlined, t.dashboard,
                                    onTap: () => _navigateFromDrawer('/home')),
                                _drawerItem(
                                    Icons.person_outline_rounded, t.profile,
                                    onTap: () =>
                                        _navigateFromDrawer('/parent-profile')),
                                _drawerItem(Icons.bar_chart_outlined, t.progress,
                                    onTap: _closeDrawer),
                                _drawerItem(Icons.settings_outlined, t.settings,
                                    onTap: _closeDrawer),
                                _drawerItem(Icons.help_outline, t.help,
                                    onTap: _closeDrawer),
                              ],
                            ),
                          ),
                          Container(
                            decoration: const BoxDecoration(
                              border: Border(
                                top: BorderSide(color: Color(0xFFD6CAC0)),
                              ),
                            ),
                            child: _drawerItem(
                              Icons.logout_rounded,
                              t.logout,
                              iconColor: Colors.redAccent,
                              labelColor: Colors.redAccent,
                              onTap: () => _navigateFromDrawer('/signin'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _drawerItem(IconData icon, String label,
      {Color iconColor = SBColors.primary,
      Color labelColor = const Color(0xFF1A1B20),
      required VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      splashColor: const Color(0xFFE8DDD4),
      highlightColor: const Color(0xFFF1E9E3),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            const SizedBox(width: 2),
            Icon(icon, color: iconColor, size: 22),
            const SizedBox(width: 16),
            Text(
              label,
              style: TextStyle(
                color: labelColor,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(AppLocalizations t) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        GestureDetector(
          onTap: _openDrawer,
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.menu,
              size: 20,
              color: Color(0xFF6B7280),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Image.asset(
            'assets/images/logo.png',
            width: 200,
            height: 60,
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) => Text(
              t.appName,
              style: const TextStyle(
                color: SBColors.primary,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const LanguageToggleButton(),
      ],
    );
  }

  Widget _buildHero(AppLocalizations t) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: SBColors.secondaryContainer,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            t.academicInsights.toUpperCase(),
            style: const TextStyle(
              color: SBColors.primary,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
        ),
        const SizedBox(height: 14),
        Builder(builder: (context) {
          final parts = t.learningGrowth.split('\n');
          return Text.rich(
            TextSpan(
              style: const TextStyle(
                color: Color(0xFF111827),
                fontSize: 34,
                fontWeight: FontWeight.w800,
                height: 1.2,
              ),
              children: [
                TextSpan(text: parts.isNotEmpty ? parts[0] + '\n' : ''),
                TextSpan(
                  text: parts.length > 1 ? parts[1] : '',
                  style: const TextStyle(
                    color: SBColors.primary,
                    fontStyle: FontStyle.italic,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          );
        }),
        const SizedBox(height: 10),
        Text(
          t.realTimeAnalytics,
          style: const TextStyle(
            color: SBColors.onSurfaceVariant,
            fontSize: 13,
            height: 1.55,
          ),
        ),
      ],
    );
  }

  Widget _buildStatsGrid(AppLocalizations t) {
    final stats = [
      ('24.5h', t.totalStudy),
      ('88%', t.avgFocus),
      ('12/15', t.tasksDone),
      ('Top 5', t.classRank),
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.8,
      children: stats.map((s) {
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: SBColors.card,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                s.$1,
                style: const TextStyle(
                  color: SBColors.primary,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                s.$2,
                style: const TextStyle(
                  color: SBColors.onSurfaceVariant,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildChartSection(AppLocalizations t) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: SBColors.card,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                t.weeklyFocus,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
              const Icon(
                Icons.bar_chart_rounded,
                color: SBColors.onSurfaceVariant,
                size: 18,
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 120,
            child: CustomPaint(
              size: const Size(double.infinity, 120),
              painter: _ChartPainter(),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) {
              return Text(
                d,
                style: const TextStyle(
                  color: SBColors.onSurfaceVariant,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectMastery(AppLocalizations t) {
    final subjects = [
      ('Mathematics', 0.92, SBColors.primary),
      ('Science', 0.78, SBColors.primary),
      ('Languages', 0.64, SBColors.primary),
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: SBColors.card,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t.subjectMastery,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 16),
          ...subjects.map((subject) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        subject.$1,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        '${(subject.$2 * 100).round()}%',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: subject.$2,
                      minHeight: 8,
                      backgroundColor: Colors.white,
                      valueColor: AlwaysStoppedAnimation<Color>(subject.$3),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildActionButtons(AppLocalizations t) {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.add_circle_outline),
            label: Text(t.addNote),
            style: ElevatedButton.styleFrom(
              backgroundColor: SBColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.file_download_outlined),
            label: Text(t.exportLabel),
            style: OutlinedButton.styleFrom(
              foregroundColor: SBColors.onSurfaceVariant,
              side: const BorderSide(color: SBColors.outlineVariant, width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInsightFooter(AppLocalizations t) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: SBColors.securityCardBg,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        t.studyStreakFooter,
        style: const TextStyle(
          fontSize: 13,
          height: 1.6,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _PersonIcon extends StatelessWidget {
  const _PersonIcon({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: const Icon(
        Icons.person_outline_rounded,
        size: 20,
        color: SBColors.primary,
      ),
    );
  }
}

class _ChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final points = [
      Offset(0, size.height * 0.80),
      Offset(size.width * 0.167, size.height * 0.40),
      Offset(size.width * 0.333, size.height * 0.70),
      Offset(size.width * 0.500, size.height * 0.45),
      Offset(size.width * 0.667, size.height * 0.50),
      Offset(size.width * 0.833, size.height * 0.40),
      Offset(size.width * 1.000, size.height * 0.60),
    ];

    final areaPath = Path()..moveTo(points.first.dx, points.first.dy);
    for (int i = 0; i < points.length - 1; i++) {
      final cp = Offset(
        (points[i].dx + points[i + 1].dx) / 2,
        (points[i].dy + points[i + 1].dy) / 2,
      );
      areaPath.quadraticBezierTo(points[i].dx, points[i].dy, cp.dx, cp.dy);
    }
    areaPath.lineTo(points.last.dx, points.last.dy);
    areaPath.lineTo(size.width, size.height);
    areaPath.lineTo(0, size.height);
    areaPath.close();

    canvas.drawPath(
      areaPath,
      Paint()
        ..color = const Color(0xFF29418C).withOpacity(0.1)
        ..style = PaintingStyle.fill,
    );

    final linePath = Path()..moveTo(points.first.dx, points.first.dy);
    for (int i = 0; i < points.length - 1; i++) {
      final cp = Offset(
        (points[i].dx + points[i + 1].dx) / 2,
        (points[i].dy + points[i + 1].dy) / 2,
      );
      linePath.quadraticBezierTo(points[i].dx, points[i].dy, cp.dx, cp.dy);
    }
    linePath.lineTo(points.last.dx, points.last.dy);

    canvas.drawPath(
      linePath,
      Paint()
        ..color = SBColors.primary
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );

    for (final p in points) {
      canvas.drawCircle(p, 4, Paint()..color = SBColors.primary);
      canvas.drawCircle(p, 2.5, Paint()..color = Colors.white);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
