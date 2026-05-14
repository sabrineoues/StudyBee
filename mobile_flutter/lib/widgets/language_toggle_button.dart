import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../i18n/app_localizations.dart';
import '../providers/locale_provider.dart';

class LanguageToggleButton extends StatelessWidget {
  const LanguageToggleButton({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>().locale;
    final t = AppLocalizations.of(context);
    final isFrench = locale.languageCode == 'fr';

    return Semantics(
      button: true,
      label: t.switchLanguage,
      child: InkWell(
        onTap: () => context.read<LocaleProvider>().toggleLocale(),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.language_rounded,
                size: 18,
                color: const Color(0xFF475569),
              ),
              const SizedBox(width: 6),
              Text(
                isFrench ? 'FR' : 'EN',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF111827),
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}