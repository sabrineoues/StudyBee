import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LocaleProvider extends ChangeNotifier {
  static const _storage = FlutterSecureStorage();
  static const _storageKey = 'app_locale';

  Locale _locale = const Locale('en');
  bool _loaded = false;

  Locale get locale => _locale;
  bool get isLoaded => _loaded;

  LocaleProvider() {
    _loadLocale();
  }

  Future<void> _loadLocale() async {
    final saved = await _storage.read(key: _storageKey);
    if (saved == 'fr') {
      _locale = const Locale('fr');
    } else {
      _locale = const Locale('en');
    }
    _loaded = true;
    notifyListeners();
  }

  Future<void> setLocale(Locale newLocale) async {
    if (_locale.languageCode == newLocale.languageCode) return;
    _locale = Locale(newLocale.languageCode);
    await _storage.write(key: _storageKey, value: _locale.languageCode);
    notifyListeners();
  }

  Future<void> toggleLocale() async {
    await setLocale(_locale.languageCode == 'en' ? const Locale('fr') : const Locale('en'));
  }
}