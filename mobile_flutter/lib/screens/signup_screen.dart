import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../i18n/app_localizations.dart';
import '../providers/auth_provider.dart';
import '../widgets/language_toggle_button.dart';

// ─── Colors ────────────────────────────────────────────────────────────────
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

// ─── Sign Up Screen ────────────────────────────────────────────────────────
class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _agreedToTerms = false;

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
    final t = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
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
        ),
      ),
    );
  }

  // ─── Header ───────────────────────────────────────────────────────────────
  Widget _buildHeader() {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Flexible logo: shrinks to avoid overflow on narrow screens
          Flexible(
            child: Padding(
              padding: const EdgeInsets.only(left: 0),
              child: Image.asset(
                'assets/images/logo.png',
                width: 300,
                height: 60,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const Text(
                  'StudyBee',
                  style: TextStyle(
                    color: SBColors.primary,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, size: 18, color: Color(0xFF6B7280)),
            ),
          ),
          const SizedBox(width: 10),
          const LanguageToggleButton(),
        ],
      ),
    );
  }

  // ── Hero ──────────────────────────────────────────────────────────────────
  Widget _buildHero() {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: SBColors.secondaryContainer,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              t.joinTheFamily,
              style: TextStyle(
                color: SBColors.primary,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Headline
          RichText(
            text: TextSpan(
              style: const TextStyle(
                color: Color(0xFF111827),
                fontSize: 34,
                fontWeight: FontWeight.w700,
                height: 1.2,
              ),
              children: [
                const TextSpan(text: 'Create your\n'),
                TextSpan(
                  text: t.createYourFamilyAccountLine2,
                  style: const TextStyle(
                    color: SBColors.primary,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Subtitle
          Text(
            t.createYourFamilyAccountSubtitle,
            style: const TextStyle(
              color: SBColors.onSurfaceVariant,
              fontSize: 13,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  Widget _buildForm() {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Full Name
          _fieldLabel(t.fullName),
          const SizedBox(height: 8),
          _inputField(
            controller: _nameController,
            hint: t.enterYourName,
            keyboardType: TextInputType.name,
            prefixIcon: Icons.person_outline_rounded,
          ),
          const SizedBox(height: 16),

          // Email
          _fieldLabel(t.emailAddress),
          const SizedBox(height: 8),
          _inputField(
            controller: _emailController,
            hint: 'you@example.com',
            keyboardType: TextInputType.emailAddress,
            prefixIcon: Icons.mail_outline_rounded,
          ),
          const SizedBox(height: 16),

          // Password
          _fieldLabel(t.password),
          const SizedBox(height: 8),
          _inputField(
            controller: _passwordController,
            hint: t.createPassword,
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
          const SizedBox(height: 16),

          // Confirm Password
          _fieldLabel(t.confirmPassword),
          const SizedBox(height: 8),
          _inputField(
            controller: _confirmPasswordController,
            hint: t.repeatPassword,
            obscureText: _obscureConfirm,
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
          const SizedBox(height: 16),

          // Terms & Conditions Checkbox
          Row(
            children: [
              Checkbox(
                value: _agreedToTerms,
                onChanged: (value) =>
                    setState(() => _agreedToTerms = value ?? false),
                activeColor: SBColors.primary,
              ),
                Expanded(
                  child: Text(
                    t.agreedToTerms,
                    style: const TextStyle(
                    color: SBColors.onSurfaceVariant,
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Create Account button
          Consumer<AuthProvider>(
            builder: (context, authProvider, _) => ElevatedButton(
              onPressed: authProvider.isLoading
                  ? null
                  : () async {
                      // Extract first and last name from full name
                      final fullName = _nameController.text.trim();
                      final nameParts = fullName.split(' ');
                      final firstName = nameParts.isNotEmpty ? nameParts[0] : '';
                      final lastName = nameParts.length > 1
                          ? nameParts.sublist(1).join(' ')
                          : '';

                      if (_passwordController.text !=
                          _confirmPasswordController.text) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(t.passwordsMismatch)),
                        );
                        return;
                      }

                      final success = await authProvider.signUp(
                        email: _emailController.text,
                        password: _passwordController.text,
                        firstName: firstName,
                        lastName: lastName,
                      );

                      if (success && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('${t.createAccount} successful!')),
                        );
                        // Navigate to home or next screen
                      } else if (!success && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                              content: Text(authProvider.errorMessage ??
                                  '${t.createAccount} failed')),
                        );
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: SBColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: const StadiumBorder(),
                elevation: 4,
                shadowColor: SBColors.primary.withOpacity(0.25),
              ),
              child: authProvider.isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                    : Text(
                      t.createAccount,
                      style: TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 15),
                    ),
            ),
          ),
          const SizedBox(height: 16),

          // Sign In link
          Center(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(
                  color: SBColors.onSurfaceVariant,
                  fontSize: 12,
                ),
                children: [
                  TextSpan(text: '${t.alreadyHaveAccount}'),
                  WidgetSpan(
                    child: GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Text(
                        t.signIn,
                        style: const TextStyle(
                          color: SBColors.primary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          decoration: TextDecoration.underline,
                          decorationColor: SBColors.primary,
                        ),
                      ),
                    ),
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

  // ── Security Note ─────────────────────────────────────────────────────────
  Widget _buildSecurityNote() {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: SBColors.securityCardBg,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.6),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.favorite,
                color: SBColors.heartRed,
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t.securityNoteTitle,
                    style: const TextStyle(
                      color: SBColors.tertiaryContainer,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.4,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    t.securityNoteBody,
                    style: const TextStyle(
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

  // ── Footer ────────────────────────────────────────────────────────────────
  Widget _buildFooter() {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Center(
        child: RichText(
          text: TextSpan(
            style: const TextStyle(
              color: SBColors.onSurfaceVariant,
              fontSize: 12,
            ),
            children: [
              TextSpan(text: t.needHelp),
              WidgetSpan(
                child: GestureDetector(
                  onTap: () {},
                  child: Text(
                    t.contactSupport,
                    style: const TextStyle(
                      color: SBColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.underline,
                      decorationColor: SBColors.primary,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
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
        contentPadding:
            const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
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
