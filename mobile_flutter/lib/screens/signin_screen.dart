import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../i18n/app_localizations.dart';
import '../providers/auth_provider.dart';
import '../widgets/language_toggle_button.dart';

// ─── Colors ────────────────────────────────────────────────────────────────
class StudyBeeColors {
  static const blue = Color(0xFF29418C);
  static const bg = Color(0xFFF8F4F0);
  static const lavender = Color(0xFFE0E7FF);
  static const card = Color(0xFFF2E8DF);
  static const textMuted = Color(0xFF6B7280);
  static const border = Color(0xFFE5E7EB);
}

// ─── Sign In Screen ─────────────────────────────────────────────────────────
class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
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
                color: StudyBeeColors.bg,
                borderRadius: BorderRadius.circular(40),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.18),
                    blurRadius: 40,
                    offset: const Offset(0, 12),
                  ),
                ],
                border: Border.all(color: Colors.white, width: 8),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(33),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Header ──────────────────────────────────────────────
                    _Header(),
                    // ── Hero ────────────────────────────────────────────────
                    _HeroSection(),
                    // ── Login Form ──────────────────────────────────────────
                    _LoginForm(
                      emailController: _emailController,
                      passwordController: _passwordController,
                      obscurePassword: _obscurePassword,
                      onToggleObscure: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    // ── Security Note ────────────────────────────────────────
                    _SecurityNote(),
                    // ── Footer ──────────────────────────────────────────────
                    _Footer(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Header ─────────────────────────────────────────────────────────────────
class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
      child: Row(
        children: [
          Expanded(
            child: Center(
              child: Image.asset(
                'assets/images/logo.png',
                width: 200,
                height: 60,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => Text(
                  t.appName,
                  style: const TextStyle(
                    color: StudyBeeColors.blue,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          const LanguageToggleButton(),
        ],
      ),
    );
  }
}

// ─── Hero Section ────────────────────────────────────────────────────────────
class _HeroSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
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
              color: StudyBeeColors.lavender,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              t.welcomeBack,
              style: TextStyle(
                color: StudyBeeColors.blue,
                fontSize: 11,
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
                fontSize: 36,
                fontWeight: FontWeight.w800,
                height: 1.15,
              ),
              children: [
                TextSpan(text: '${t.signInTitleLine1}\n'),
                TextSpan(
                  text: t.signInTitleLine2,
                  style: const TextStyle(
                    color: StudyBeeColors.blue,
                    fontStyle: FontStyle.italic,
                    fontFamily: 'serif',
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Subtitle
          Text(
            t.signInSubtitle,
            style: const TextStyle(
              color: StudyBeeColors.textMuted,
              fontSize: 13,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Login Form ──────────────────────────────────────────────────────────────
class _LoginForm extends StatelessWidget {
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final bool obscurePassword;
  final VoidCallback onToggleObscure;

  const _LoginForm({
    required this.emailController,
    required this.passwordController,
    required this.obscurePassword,
    required this.onToggleObscure,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Email ──────────────────────────────────────────────────────
          _FieldLabel(t.emailAddress),
          const SizedBox(height: 4),
          _InputField(
            controller: emailController,
            hint: 'parent@studybee.com',
            keyboardType: TextInputType.emailAddress,
            prefixIcon: Icons.mail_outline_rounded,
          ),
          const SizedBox(height: 16),

          // ── Password ───────────────────────────────────────────────────
          _FieldLabel(t.password),
          const SizedBox(height: 4),
          _InputField(
            controller: passwordController,
            hint: '••••••••',
            obscureText: obscurePassword,
            prefixIcon: Icons.lock_outline_rounded,
            suffixIcon: IconButton(
              icon: Icon(
                obscurePassword
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
                size: 18,
                color: const Color(0xFF9CA3AF),
              ),
              onPressed: onToggleObscure,
            ),
          ),
          const SizedBox(height: 8),

          // ── Forgot Password ────────────────────────────────────────────
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {},
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'Forgot Password?',
                style: TextStyle(
                  color: StudyBeeColors.blue,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // ── Sign In Button ─────────────────────────────────────────────
          Consumer<AuthProvider>(
            builder: (context, authProvider, _) => _PrimaryButton(
              label: t.signInToDashboard,
              isLoading: authProvider.isLoading,
              onPressed: () async {
                final success = await authProvider.signIn(
                  email: emailController.text,
                  password: passwordController.text,
                );
                if (success && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('${t.signIn} successful!')),
                  );
                  Navigator.of(context).pushReplacementNamed('/home');
                } else if (!success && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(authProvider.errorMessage ?? '${t.signIn} failed')),
                  );
                }
              },
            ),
          ),
          const SizedBox(height: 24),

          // ── OR Divider ─────────────────────────────────────────────────
          Row(
            children: [
              const Expanded(child: Divider(color: Color(0xFFE5E7EB))),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                    'OR',
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const Expanded(child: Divider(color: Color(0xFFE5E7EB))),
            ],
          ),
          const SizedBox(height: 24),

          // ── Create Account ─────────────────────────────────────────────
          _OutlineButton(
            label: t.createFamilyAccount,
            onPressed: () => Navigator.pushNamed(context, '/signup'),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

// ─── Security Note ───────────────────────────────────────────────────────────
class _SecurityNote extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: StudyBeeColors.card,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon bubble
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.favorite,
                color: Color(0xFFF9A8A8),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),

            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t.securityNoteTitle,
                    style: TextStyle(
                      color: Color(0xFF92400E),
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.1,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    '${t.securityNoteBody}',
                    style: TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 12,
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
}

// ─── Footer ──────────────────────────────────────────────────────────────────
class _Footer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Center(
        child: RichText(
          text: TextSpan(
            style: const TextStyle(
              color: StudyBeeColors.textMuted,
              fontSize: 12,
            ),
            children: [
              TextSpan(text: t.needHelp),
              WidgetSpan(
                child: GestureDetector(
                  onTap: () {},
                  child: Text(
                    t.contactSupport,
                    style: TextStyle(
                      color: StudyBeeColors.blue,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.underline,
                      decorationColor: StudyBeeColors.blue,
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
}

// ─── Shared Widgets ──────────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xFF374151),
        fontSize: 13,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData prefixIcon;
  final bool obscureText;
  final TextInputType keyboardType;
  final Widget? suffixIcon;

  const _InputField({
    required this.controller,
    required this.hint,
    required this.prefixIcon,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.suffixIcon,
  });

  @override
  Widget build(BuildContext context) {
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
        fillColor: Colors.white.withOpacity(0.5),
        contentPadding:
            const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide:
              const BorderSide(color: StudyBeeColors.blue, width: 1.5),
        ),
      ),
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final bool isLoading;

  const _PrimaryButton({
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: StudyBeeColors.blue,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 18),
        shape: const StadiumBorder(),
        elevation: 6,
        shadowColor: const Color(0xFF29418C).withOpacity(0.35),
      ),
      child: isLoading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            )
          : Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
            ),
    );
  }
}

class _OutlineButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const _OutlineButton({required this.label, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: const Color(0xFF374151),
        padding: const EdgeInsets.symmetric(vertical: 18),
        shape: const StadiumBorder(),
        side: const BorderSide(color: Color(0xFFD1D5DB)),
      ),
      child: Text(
        label,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    );
  }
}
