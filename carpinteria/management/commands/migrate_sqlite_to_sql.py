import os
import tempfile

from django.conf import settings
from django.core.management import BaseCommand, call_command, CommandError


class Command(BaseCommand):
    help = "Migrate data from SQLite source DB to default SQL DB using dumpdata/loaddata."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            dest="source",
            default=settings.DATABASES.get("sqlite_source", {}).get("NAME"),
            help="Path to source SQLite file. Defaults to settings sqlite_source NAME.",
        )
        parser.add_argument(
            "--flush-target",
            action="store_true",
            help="Flush target (default DB) before loading data.",
        )

    def handle(self, *args, **options):
        source = options["source"]
        flush_target = options["flush_target"]

        if not source:
            raise CommandError("SQLite source path is empty.")

        if not os.path.exists(source):
            raise CommandError(f"SQLite source file not found: {source}")

        default_name = str(settings.DATABASES["default"].get("NAME", ""))
        if settings.DATABASES["default"].get("ENGINE") == "django.db.backends.sqlite3" and os.path.abspath(default_name) == os.path.abspath(source):
            raise CommandError(
                "Default DB points to the same SQLite file as source. Configure DATABASE_URL to your SQL database first."
            )

        settings.DATABASES["sqlite_source"]["NAME"] = source

        self.stdout.write(self.style.NOTICE(f"Source SQLite: {source}"))
        self.stdout.write(self.style.NOTICE("Dumping data from sqlite_source..."))

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".json")
        temp_path = temp_file.name
        temp_file.close()

        try:
            with open(temp_path, "w", encoding="utf-8") as out:
                call_command(
                    "dumpdata",
                    "--database=sqlite_source",
                    "--natural-foreign",
                    "--natural-primary",
                    "--exclude=contenttypes",
                    "--exclude=auth.permission",
                    stdout=out,
                )

            if flush_target:
                self.stdout.write(self.style.WARNING("Flushing target database (default)..."))
                call_command("flush", "--database=default", "--no-input")

            self.stdout.write(self.style.NOTICE("Loading data into default SQL database..."))
            call_command("loaddata", temp_path, "--database=default")

            self.stdout.write(self.style.SUCCESS("Data migration completed successfully."))
            self.stdout.write(
                self.style.SUCCESS(
                    "Tip: run 'python manage.py createsuperuser' in SQL DB if needed."
                )
            )
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
