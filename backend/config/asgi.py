"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from pathlib import Path

from django.core.asgi import get_asgi_application


def _load_dotenv() -> None:
	env_path = Path(__file__).resolve().parent.parent.parent / ".env"
	if not env_path.exists():
		return

	for raw in env_path.read_text(encoding="utf-8").splitlines():
		line = raw.strip()
		if not line or line.startswith("#"):
			continue
		if "=" not in line:
			continue
		key, value = line.split("=", 1)
		key = key.strip()
		value = value.strip()
		if not key:
			continue
		if value and len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
			value = value[1:-1]
		os.environ.setdefault(key, value)


_load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_asgi_application()
