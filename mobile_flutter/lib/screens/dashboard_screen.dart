import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../i18n/app_localizations.dart';
import '../models/home_stats.dart';
import '../models/study_session_stats.dart';
import '../models/study_session_summary.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/language_toggle_button.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _drawerOpen = false;
  late final AnimationController _drawerController;
  late final Animation<double> _drawerAnimation;
  Future<_DashboardBundle>? _dashboardFuture;

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

  Future<_DashboardBundle> get _futureDashboardData =>
      _dashboardFuture ??= _loadDashboardData();

  Future<_DashboardBundle> _loadDashboardData() async {
    final homeStats = await ApiService.getHomeStats().catchError((_) {
      return HomeStats(
        studentsSupported: 0,
        studyMinutesGuided: 0,
        studyHoursGuided: 0,
      );
    });

    final studyStats = await ApiService.getMyStudySessionStats().catchError((_) {
      return StudySessionStats(
        totalSessions: 0,
        completedSessions: 0,
        inProgressSessions: 0,
        totalStudyMinutes: 0,
        totalStudyHours: 0,
      );
    });

    final recentSessions = await ApiService.listMyStudySessionsSafe();

            return _DashboardBundle(
      homeStats: homeStats,
      studyStats: studyStats,
      recentSessions: recentSessions,
    );
  }

  String _formatDuration(int minutes) {
    final safeMinutes = minutes < 0 ? 0 : minutes;
    if (safeMinutes >= 60) {
      final hours = safeMinutes / 60.0;
      return hours == hours.roundToDouble()
          ? '${hours.round()} h'
          : '${hours.toStringAsFixed(1)} h';
    }
    return '$safeMinutes min';
  }

  String _relativeTime(String isoDate) {
    final parsed = DateTime.tryParse(isoDate);
    if (parsed == null) return '';
    final diff = DateTime.now().difference(parsed);
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} h ago';
    if (diff.inDays < 7) return '${diff.inDays} d ago';
    return '${(diff.inDays / 7).floor()} wk ago';
  }

  String _capitalize(String value) {
    if (value.isEmpty) return value;
    return value[0].toUpperCase() + value.substring(1);
  }

  Widget _buildContent(BuildContext context, AppLocalizations t, _DashboardBundle data) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        final children = authProvider.children;
        final child = children.isNotEmpty ? children.first : null;
        final displayName = child == null
            ? t.connectedParent
            : '${child.firstName} ${child.lastName}'.trim();
        final level = child?.classLevel?.isNotEmpty == true
            ? child!.classLevel!
            : (child?.email ?? t.myChild);

        final sessionsHours = data.studyStats.totalStudyHours > 0
            ? data.studyStats.totalStudyHours
            : data.homeStats.studyHoursGuided;
        final completed = data.studyStats.completedSessions;
        final totalSessions = data.studyStats.totalSessions;
        final progressPct = totalSessions > 0
            ? ((completed / totalSessions) * 100).round()
            : (sessionsHours > 0 ? (sessionsHours * 7).round().clamp(0, 100) : 0);
        final goalsValue = totalSessions > 0 ? completed : data.homeStats.studentsSupported;
        final recentSession = data.recentSessions.isNotEmpty ? data.recentSessions.first : null;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Container(
            width: 375,
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 100),
            decoration: BoxDecoration(
              color: const Color(0xFFF8F4F0),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFE5E7EB)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 28,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
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
                            color: Color(0xFF29418C),
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const LanguageToggleButton(),
                  ],
                ),
                const SizedBox(height: 22),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDBE1FE),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          t.dashboard.toUpperCase(),
                          style: const TextStyle(
                            color: Color(0xFF29418C),
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        t.welcomeBack,
                        style: const TextStyle(
                          color: Color(0xFF111827),
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        children.isEmpty
                            ? t.dashboardSubtitle
                            : '${t.dashboardSubtitle} ${t.myChild.toLowerCase()} ${displayName.isNotEmpty ? displayName : ''}.',
                        style: const TextStyle(
                          color: Color(0xFF444651),
                          fontSize: 13,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                _SectionTitle(title: t.quickStats),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        icon: Icons.access_time_rounded,
                        label: t.sessionsLabel,
                        value: _formatDuration((sessionsHours * 60).round()),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        icon: Icons.timeline_rounded,
                        label: t.progressLabel,
                        value: '$progressPct%',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        icon: Icons.groups_rounded,
                        label: t.childLabel,
                        value: '${children.length}',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        icon: Icons.verified_outlined,
                        label: t.goalsLabel,
                        value: '$goalsValue',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                _SectionTitle(title: t.myChild),
                const SizedBox(height: 10),
                if (child != null)
                  _ChildCard(
                    name: '${child.firstName} ${child.lastName}'.trim(),
                    level: level,
                    status: recentSession == null
                        ? 'No recent study session'
                        : 'Last update ${_relativeTime(recentSession.createdAt)}',
                  )
                else
                  _DashboardCard(
                    icon: Icons.person_off_outlined,
                    title: 'No child linked yet',
                    subtitle: 'Connect a child account to see progress here.',
                  ),
                const SizedBox(height: 18),
                _SectionTitle(title: t.recentActivity),
                const SizedBox(height: 10),
                if (recentSession != null)
                  _DashboardCard(
                    icon: Icons.school_outlined,
                    title: recentSession.title.isNotEmpty
                        ? recentSession.title
                        : 'Study session completed',
                    subtitle:
                        '${recentSession.subject.isNotEmpty ? recentSession.subject : t.studySessionCompleted} • ${_formatDuration(recentSession.studyDuration)} • ${_relativeTime(recentSession.createdAt)}',
                  )
                else
                  _DashboardCard(
                    icon: Icons.school_outlined,
                    title: t.studySessionCompleted,
                    subtitle: t.studySessionSubtitle,
                  ),
                const SizedBox(height: 12),
                _DashboardCard(
                  icon: Icons.notifications_none,
                  title: t.newUpdateReceived,
                  subtitle: child == null
                      ? 'No child connected yet.'
                      : 'Connected child: ${child.firstName} ${child.lastName}'.trim(),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pushNamed(context, '/child-progress'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF29418C),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Text(
                          t.openChildProgress,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF3F4F6),
      body: SafeArea(
        child: Center(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: SizedBox(
              width: 375,
              child: Stack(
                children: [
                  FutureBuilder<_DashboardBundle>(
                    future: _futureDashboardData,
                    builder: (context, snapshot) {
                      final data = snapshot.data ?? _DashboardBundle.empty();
                      if (snapshot.connectionState == ConnectionState.waiting &&
                          snapshot.data == null) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      return _buildContent(context, t, data);
                    },
                  ),

                  // Overlay sombre
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

                  // Drawer amélioré
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
                          // ── Header du drawer ─────────────────────────────
                          Container(
                            width: double.infinity,
                            padding:
                                const EdgeInsets.fromLTRB(20, 48, 20, 28),
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
                                    color: Color(0xFF29418C),
                                    size: 40,
                                  ),
                                ),
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    t.familyDashboard,
                                    style: const TextStyle(
                                      color: Color(0xFF444651),
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // ── Items du menu ────────────────────────────────
                          Expanded(
                            child: ListView(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 12),
                              children: [
                                _drawerItem(
                                  Icons.home_outlined,
                                  t.dashboard,
                                  onTap: _closeDrawer,
                                ),
                                _drawerItem(
                                  Icons.person_outline_rounded,
                                  t.profile,
                                  onTap: () =>
                                      _navigateFromDrawer('/parent-profile'),
                                ),
                                _drawerItem(
                                  Icons.bar_chart_outlined,
                                  t.progress,
                                  onTap: () =>
                                      _navigateFromDrawer('/child-progress'),
                                ),
                                _drawerItem(
                                  Icons.settings_outlined,
                                  t.settings,
                                  onTap: _closeDrawer,
                                ),
                                _drawerItem(
                                  Icons.help_outline,
                                  t.help,
                                  onTap: _closeDrawer,
                                ),
                              ],
                            ),
                          ),

                          // ── Logout ───────────────────────────────────────
                          Container(
                            decoration: const BoxDecoration(
                              border: Border(
                                top: BorderSide(color: Color(0xFFD6CAC0)),
                              ),
                            ),
                            child: _drawerItem(
                              Icons.logout_rounded,
                              'Logout',
                              iconColor: const Color(0xFFBA1A1A),
                              labelColor: const Color(0xFFBA1A1A),
                              onTap: () =>
                                  _navigateFromDrawer('/signin'),
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

  Widget _drawerItem(
    IconData icon,
    String label, {
    Color iconColor = const Color(0xFF29418C),
    Color labelColor = const Color(0xFF1A1B20),
    required VoidCallback onTap,
  }) {
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
}

class _DashboardBundle {
  final HomeStats homeStats;
  final StudySessionStats studyStats;
  final List<StudySessionSummary> recentSessions;

  const _DashboardBundle({
    required this.homeStats,
    required this.studyStats,
    required this.recentSessions,
  });

  factory _DashboardBundle.empty() {
    return _DashboardBundle(
      homeStats: HomeStats(
        studentsSupported: 0,
        studyMinutesGuided: 0,
        studyHoursGuided: 0,
      ),
      studyStats: StudySessionStats(
        totalSessions: 0,
        completedSessions: 0,
        inProgressSessions: 0,
        totalStudyMinutes: 0,
        totalStudyHours: 0,
      ),
      recentSessions: const [],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        color: Color(0xFF111827),
        fontSize: 14,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFDBE1FE),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: const Color(0xFF29418C), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
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

class _ChildCard extends StatelessWidget {
  final String name;
  final String level;
  final String status;

  const _ChildCard({
    required this.name,
    required this.level,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFF0E6D8),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.child_care_rounded,
              color: Color(0xFF855200),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  level,
                  style: const TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  status,
                  style: const TextStyle(
                    color: Color(0xFF29418C),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
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

class _DashboardCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _DashboardCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFDBE1FE),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: const Color(0xFF29418C)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 12,
                    height: 1.35,
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