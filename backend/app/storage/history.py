from __future__ import annotations

import json
from pathlib import Path

from app.core.config import get_settings
from app.models.schemas import RunRecord


class HistoryStore:
    def __init__(self) -> None:
        settings = get_settings()
        self.path = Path(settings.storage_path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("[]", encoding="utf-8")

    def list_runs(self) -> list[RunRecord]:
        raw = json.loads(self.path.read_text(encoding="utf-8"))
        return [RunRecord.model_validate(item) for item in raw]

    def save_run(self, run: RunRecord) -> None:
        runs = self.list_runs()
        updated = [existing for existing in runs if existing.id != run.id]
        updated.insert(0, run)
        self.path.write_text(
            json.dumps([item.model_dump(mode="json") for item in updated], indent=2),
            encoding="utf-8",
        )

    def get_run(self, run_id: str) -> RunRecord | None:
        for run in self.list_runs():
            if run.id == run_id:
                return run
        return None
