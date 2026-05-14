import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../i18n/app_localizations.dart';
import '../providers/auth_provider.dart';
import '../widgets/language_toggle_button.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';

class SBColors {
  static const primary = Color(0xFF29418C);
  static const parchment = Color(0xFFF5F0E8);
  static const secondaryContainer = Color(0xFFDBE1FE);
  static const outlineVariant = Color(0xFFC5C5D3);
  static const onSurfaceVariant = Color(0xFF444651);
  static const securityCardBg = Color(0xFFF0E6D8);
  static const tertiaryContainer = Color(0xFF855200);
  static const heartRed = Color(0xFFE57373);
  static const card = Color(0xFFF1E9E3);
  static const surface = Color(0xFFFAF8FF);
  static const secondary = Color(0xFF575E76);
  static const error = Color(0xFFBA1A1A);
  static const errorContainer = Color(0xFFFFDAD6);
  static const outline = Color(0xFF757682);
  static const surfaceContainerLowest = Color(0xFFFFFFFF);
  static const surfaceContainerLow = Color(0xFFF4F3FA);
  static const onSurface = Color(0xFF1A1B20);
  static const tertiaryFixed = Color(0xFFFFDDB9);
  static const onTertiaryFixed = Color(0xFF2B1700);
  static const onSecondaryContainer = Color(0xFF5D647C);
}

class ParentProfileScreen extends StatefulWidget {
  const ParentProfileScreen({super.key});

  @override
  State<ParentProfileScreen> createState() => _ParentProfileScreenState();
}

class _ParentProfileScreenState extends State<ParentProfileScreen>
    with SingleTickerProviderStateMixin {
  int _selectedNav = 3;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
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

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<AuthProvider>().loadParentProfile();
    });
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
      key: _scaffoldKey,
      backgroundColor: SBColors.surface,
      body: SafeArea(
        child: Center(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: SizedBox(
              width: 375,
              child: Stack(
                children: [
                  SingleChildScrollView(
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
                                  child: const Icon(Icons.menu,
                                      size: 20, color: Color(0xFF6B7280)),
                                ),
                              ),
                              Text(
                                t.profile,
                                style: const TextStyle(
                                  color: SBColors.primary,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const LanguageToggleButton(),
                            ],
                          ),
                          const SizedBox(height: 24),
                          _buildParentHeader(context),
                          const SizedBox(height: 32),
                          _buildFamilySection(context),
                          const SizedBox(height: 32),
                          _buildHelpSection(),
                          const SizedBox(height: 32),
                          _buildLogout(context),
                        ],
                      ),
                    ),
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
                                    color: SBColors.primary,
                                    size: 40,
                                  ),
                                ),
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

                          // ── Items du menu ────────────────────────────────
                          Expanded(
                            child: ListView(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 12),
                              children: [
                                _drawerItem(
                                  Icons.home_outlined,
                                  t.dashboard,
                                  onTap: () =>
                                      _navigateFromDrawer('/home'),
                                ),
                                _drawerItem(
                                  Icons.person_outline_rounded,
                                  t.profile,
                                  onTap: _closeDrawer,
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
                                t.logout,
                              iconColor: SBColors.error,
                              labelColor: SBColors.error,
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
    Color iconColor = SBColors.primary,
    Color labelColor = SBColors.onSurface,
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

  Widget _buildParentHeader(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        final parentData = authProvider.parentData;
        final fullName =
            '${parentData?.firstName ?? ''} ${parentData?.lastName ?? ''}'
                .trim();
        final email = parentData?.email ?? 'email@example.com';
        final userId = parentData?.id ?? 0;

        return Column(
          children: [
            Stack(
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFE3E1E9),
                      width: 4,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF29418C).withOpacity(0.08),
                        blurRadius: 24,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: Container(
                      color: SBColors.secondaryContainer,
                      child: Builder(builder: (context) {
                        final avatarUrl = parentData?.avatar;
                        if (avatarUrl != null && avatarUrl.isNotEmpty) {
                          return Image.network(
                            avatarUrl,
                            fit: BoxFit.cover,
                            width: 96,
                            height: 96,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.person_rounded,
                              color: SBColors.primary,
                              size: 48,
                            ),
                          );
                        }
                        return const Icon(
                          Icons.person_rounded,
                          color: SBColors.primary,
                          size: 48,
                        );
                      }),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(5),
                        decoration: const BoxDecoration(
                          color: SBColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.verified_rounded,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                      const SizedBox(width: 6),
                      // Edit avatar button
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () async {
                            final picker = ImagePicker();
                            final source = await showModalBottomSheet<ImageSource>(
                              context: context,
                              builder: (ctx) => SafeArea(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    ListTile(
                                      leading: const Icon(Icons.photo_library),
                                      title: Text(AppLocalizations.of(ctx).gallery),
                                      onTap: () => Navigator.of(ctx).pop(ImageSource.gallery),
                                    ),
                                    ListTile(
                                      leading: const Icon(Icons.camera_alt),
                                      title: Text(AppLocalizations.of(ctx).camera),
                                      onTap: () => Navigator.of(ctx).pop(ImageSource.camera),
                                    ),
                                  ],
                                ),
                              ),
                            );

                            if (source == null) return;
                            if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Selected: ${source.name}')));
                            XFile? file;
                            try {
                              file = await picker.pickImage(source: source, imageQuality: 75);
                            } catch (e) {
                              if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Image pick failed: ${e.toString()}')));
                              return;
                            }
                            if (file == null) {
                              if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('No image selected')));
                              return;
                            }

                            // show simple loading
                            showDialog(
                              context: context,
                              barrierDismissible: false,
                              builder: (_) => const Center(child: CircularProgressIndicator()),
                            );

                            final result = await ApiService.uploadProfileAvatar(file.path);
                            Navigator.of(context).pop(); // remove loading

                            if (result['success'] == true || result['parent'] != null || result['user'] != null) {
                              // refresh profile
                              await context.read<AuthProvider>().loadParentProfile();
                              if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).avatarUpdated)));
                            } else {
                              if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).avatarUpdateFailed)));
                            }
                          },
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 6),
                              ],
                            ),
                            child: const Icon(Icons.edit, size: 16, color: SBColors.primary),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              fullName.isEmpty ? t.connectedParent : fullName,
              style: const TextStyle(
                color: SBColors.onSurface,
                fontSize: 22,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              email,
              style: const TextStyle(
                  color: SBColors.onSurfaceVariant, fontSize: 15),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () =>
                  Navigator.pushNamed(context, '/child-progress'),
              style: OutlinedButton.styleFrom(
                foregroundColor: SBColors.primary,
                padding: const EdgeInsets.symmetric(
                    horizontal: 24, vertical: 10),
                shape: const StadiumBorder(),
                side: const BorderSide(color: SBColors.outlineVariant),
              ),
              child: Text(
                t.viewTracking,
                style:
                    const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildFamilySection(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              t.maFamille,
              style: const TextStyle(
                color: SBColors.onSurface,
                fontSize: 22,
                fontWeight: FontWeight.w500,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(width: 8),
            // Add child button removed as requested
            const SizedBox.shrink(),
          ],
        ),
        const SizedBox(height: 12),
        Consumer<AuthProvider>(
          builder: (context, authProvider, _) {
            final children = authProvider.children;
            if (children.isEmpty) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text(
                  t.noChildren,
                  style: const TextStyle(color: SBColors.onSurfaceVariant),
                ),
              );
            }
            return Column(
              children: children.map((c) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _childCard(
                    name: '${c.firstName} ${c.lastName}',
                    subtitle: (c.classLevel != null && c.classLevel!.isNotEmpty)
                        ? '${c.classLevel}'
                        : (c.email ?? ''),
                    iconData: Icons.child_care_rounded,
                    iconBg: SBColors.secondaryContainer,
                    iconColor: SBColors.onSecondaryContainer,
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _childCard({
    required String name,
    required String subtitle,
    required IconData iconData,
    required Color iconBg,
    required Color iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: SBColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(14),
        border:
            Border.all(color: SBColors.outlineVariant.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF29418C).withOpacity(0.05),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration:
                BoxDecoration(shape: BoxShape.circle, color: iconBg),
            child: Icon(iconData, color: iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: SBColors.onSurface)),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: const TextStyle(
                        fontSize: 12,
                        color: SBColors.onSurfaceVariant)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded,
              color: SBColors.outlineVariant),
        ],
      ),
    );
  }

  Widget _buildHelpSection() {
    return Builder(
      builder: (context) {
        final t = AppLocalizations.of(context);
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: EdgeInsets.only(left: 4, bottom: 8),
              child: Text(
                t.help.toUpperCase(),
                style: const TextStyle(
                  color: SBColors.onSurfaceVariant,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.2,
                ),
              ),
            ),
            _menuCard([
              _menuItem(Icons.info_outline_rounded, t.aboutStudyBee,
                  SBColors.secondary, () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: Text(t.aboutStudyBee),
                    content: Text(t.aboutStudyBeeDescription),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        child: Text(MaterialLocalizations.of(ctx).closeButtonLabel),
                      ),
                    ],
                  ),
                );
              }),
            ]),
          ],
        );
      },
    );
  }

  Widget _menuCard(List<Widget> items) {
    return Container(
      decoration: BoxDecoration(
        color: SBColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: SBColors.outlineVariant.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF29418C).withOpacity(0.05),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        children: () {
          final result = <Widget>[];
          for (int i = 0; i < items.length; i++) {
            result.add(items[i]);
            if (i < items.length - 1) {
              result.add(
                const Divider(
                  height: 1,
                  indent: 16,
                  endIndent: 16,
                  color: Color(0x33C5C5D3),
                ),
              );
            }
          }
          return result;
        }(),
      ),
    );
  }

  Widget _menuItem(IconData icon, String label, Color iconColor,
      [VoidCallback? onTap]) {
    return InkWell(
      onTap: onTap ?? () {},
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Row(
          children: [
            Icon(icon, color: iconColor, size: 22),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                    fontSize: 15, color: SBColors.onSurface),
              ),
            ),
            const Icon(Icons.chevron_right_rounded,
                color: SBColors.outlineVariant),
          ],
        ),
      ),
    );
  }

  Widget _buildLogout(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Column(
      children: [
        Consumer<AuthProvider>(
          builder: (context, authProvider, _) {
            return InkWell(
              onTap: () {
                authProvider.logout();
                Navigator.pushReplacementNamed(context, '/signin');
              },
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: SBColors.errorContainer.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.logout_rounded,
                        color: SBColors.error, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      t.logout,
                      style: TextStyle(
                        color: SBColors.error,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 24),
        Text(
          t.versionLabel,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: SBColors.outline,
            fontSize: 12,
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    );
  }
}