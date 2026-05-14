import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _agreedToTerms = false;
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
  }

  @override
  void dispose() {
    _drawerController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
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
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF3F4F6),
      body: Center(
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
                    decoration: BoxDecoration(
                      color: SBColors.parchment,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildHeader(),
                        _buildHero(),
                        _buildForm(),
                        _buildSecurityNote(),
                        _buildFooter(),
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
                          0.4 * _drawerAnimation.value,
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
                      color: Colors.white,
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
                          padding: const EdgeInsets.fromLTRB(20, 40, 20, 24),
                          decoration: const BoxDecoration(
                            color: SBColors.primary,
                            borderRadius: BorderRadius.only(
                              topRight: Radius.circular(24),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              CircleAvatar(
                                radius: 25,
                                backgroundColor: Colors.white,
                                child: Icon(Icons.person_outline_rounded, color: SBColors.primary, size: 28),
                              ),
                              SizedBox(height: 12),
                              Text(
                                'StudyBee',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Family Dashboard',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: ListView(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            children: [
                              _drawerItem(Icons.person_outline_rounded, 'Profile', onTap: () => _navigateFromDrawer('/parent-profile')),
                              _drawerItem(Icons.bar_chart_outlined, 'Progress', onTap: () => _navigateFromDrawer('/child-progress')),
                              _drawerItem(Icons.settings_outlined, 'Settings', onTap: _closeDrawer),
                              _drawerItem(Icons.help_outline, 'Help', onTap: _closeDrawer),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: const BoxDecoration(
                            border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
                          ),
                          child: ListTile(
                            leading: const Icon(Icons.logout_rounded, color: Colors.red),
                            title: const Text('Logout', style: TextStyle(color: Colors.red)),
                            onTap: () {
                              _closeDrawer();
                              Navigator.pushReplacementNamed(context, '/signin');
                            },
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
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          GestureDetector(
            onTap: _openDrawer,
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.menu,
                size: 16,
                color: Color(0xFF6B7280),
              ),
            ),
          ),
          const Text(
            'StudyBee',
            style: TextStyle(
              color: SBColors.primary,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          GestureDetector(
            onTap: () => Navigator.of(context).maybePop(),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.close,
                size: 16,
                color: Color(0xFF6B7280),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _drawerItem(
    IconData icon,
    String label, {
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: SBColors.primary, size: 22),
            const SizedBox(width: 16),
            Text(
              label,
              style: const TextStyle(
                color: Color(0xFF1A1B20),
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHero() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: SBColors.secondaryContainer,
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'JOIN THE FAMILY',
              style: TextStyle(
                color: SBColors.primary,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.1,
              ),
            ),
          ),
          const SizedBox(height: 14),
          RichText(
            text: const TextSpan(
              style: TextStyle(
                color: Color(0xFF111827),
                fontSize: 32,
                fontWeight: FontWeight.w800,
                height: 1.2,
              ),
              children: [
                TextSpan(text: 'Create your\n'),
                TextSpan(
                  text: 'family account.',
                  style: TextStyle(
                    color: SBColors.primary,
                    fontStyle: FontStyle.italic,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            "Start tracking progress and supporting your child's learning journey today.",
            style: TextStyle(
              color: SBColors.onSurfaceVariant,
              fontSize: 13,
              height: 1.55,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _fieldLabel('Full Name'),
          const SizedBox(height: 6),
          _inputField(
            controller: _nameController,
            hint: 'Enter your name',
            prefixIcon: Icons.person_outline_rounded,
          ),
          const SizedBox(height: 14),

          _fieldLabel('Email Address'),
          const SizedBox(height: 6),
          _inputField(
            controller: _emailController,
            hint: 'you@example.com',
            keyboardType: TextInputType.emailAddress,
            prefixIcon: Icons.mail_outline_rounded,
          ),
          const SizedBox(height: 14),

          _fieldLabel('Password'),
          const SizedBox(height: 6),
          _inputField(
            controller: _passwordController,
            hint: 'Create a password',
            obscureText: _obscurePassword,
            prefixIcon: Icons.lock_outline_rounded,
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
                size: 18,
                color: const Color(0xFF9CA3AF),
              ),
              onPressed: () =>
                  setState(() => _obscurePassword = !_obscurePassword),
            ),
          ),
          const SizedBox(height: 14),

          _fieldLabel('Confirm Password'),
          const SizedBox(height: 6),
          _inputField(
            controller: _confirmPasswordController,
            hint: 'Repeat password',
            obscureText: _obscureConfirm,
            prefixIcon: Icons.lock_outline_rounded,
            suffixIcon: IconButton(
              icon: Icon(
                _obscureConfirm
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
                size: 18,
                color: const Color(0xFF9CA3AF),
              ),
              onPressed: () =>
                  setState(() => _obscureConfirm = !_obscureConfirm),
            ),
          ),
          const SizedBox(height: 16),

          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SizedBox(
                width: 20,
                height: 20,
                child: Checkbox(
                  value: _agreedToTerms,
                  onChanged: (v) =>
                      setState(() => _agreedToTerms = v ?? false),
                  activeColor: SBColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(4),
                  ),
                  side: const BorderSide(color: SBColors.primary, width: 1.5),
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      color: SBColors.onSurfaceVariant,
                      fontSize: 12,
                    ),
                    children: [
                      const TextSpan(text: 'I agree to the '),
                      TextSpan(
                        text: 'Terms of Service',
                        style: const TextStyle(
                          color: SBColors.primary,
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration.underline,
                          decorationColor: SBColors.primary,
                        ),
                        recognizer: TapGestureRecognizer()..onTap = () {},
                      ),
                      const TextSpan(text: ' and '),
                      TextSpan(
                        text: 'Privacy Policy',
                        style: const TextStyle(
                          color: SBColors.primary,
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration.underline,
                          decorationColor: SBColors.primary,
                        ),
                        recognizer: TapGestureRecognizer()..onTap = () {},
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          ElevatedButton(
            onPressed: _agreedToTerms ? () {} : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: SBColors.primary,
              disabledBackgroundColor: SBColors.primary.withOpacity(0.5),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 18),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 3,
              shadowColor: SBColors.primary.withOpacity(0.25),
            ),
            child: const Text(
              'Create Account',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
            ),
          ),
          const SizedBox(height: 14),

          Center(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(
                  color: SBColors.onSurfaceVariant,
                  fontSize: 12,
                ),
                children: [
                  const TextSpan(text: 'Already have an account? '),
                  TextSpan(
                    text: 'Sign In',
                    style: const TextStyle(
                      color: SBColors.primary,
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.underline,
                      decorationColor: SBColors.primary,
                    ),
                    recognizer: TapGestureRecognizer()
                      ..onTap = () => Navigator.pushReplacementNamed(context, '/signin'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildSecurityNote() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: SBColors.securityCardBg,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.6),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.favorite,
                color: SBColors.heartRed,
                size: 18,
              ),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SECURITY NOTE',
                    style: TextStyle(
                      color: SBColors.tertiaryContainer,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.3,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Your data is encrypted and only visible to authorized family members.',
                    style: TextStyle(
                      color: SBColors.onSurfaceVariant,
                      fontSize: 11,
                      height: 1.5,
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

  Widget _buildFooter() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 22),
      child: Center(
        child: RichText(
          text: TextSpan(
            style: const TextStyle(
              color: SBColors.onSurfaceVariant,
              fontSize: 12,
            ),
            children: [
              const TextSpan(text: 'Need help? '),
              TextSpan(
                text: 'Contact Support',
                style: const TextStyle(
                  color: SBColors.primary,
                  fontWeight: FontWeight.w700,
                  decoration: TextDecoration.underline,
                  decorationColor: SBColors.primary,
                ),
                recognizer: TapGestureRecognizer()..onTap = () {},
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _fieldLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xFF374151),
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  Widget _inputField({
    required TextEditingController controller,
    required String hint,
    required IconData prefixIcon,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
    Widget? suffixIcon,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      style: const TextStyle(fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
        prefixIcon: Icon(prefixIcon, size: 18, color: const Color(0xFF9CA3AF)),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: Colors.white.withOpacity(0.3),
        contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: SBColors.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: SBColors.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: SBColors.primary, width: 1.5),
        ),
      ),
    );
  }
}

class SBColors {
  static const primary = Color(0xFF29418C);
  static const parchment = Color(0xFFF5F0E8);
  static const secondaryContainer = Color(0xFFDBE1FE);
  static const outlineVariant = Color(0xFFC5C5D3);
  static const onSurfaceVariant = Color(0xFF444651);
  static const securityCardBg = Color(0xFFF0E6D8);
  static const tertiaryContainer = Color(0xFF855200);
  static const heartRed = Color(0xFFE57373);
}
