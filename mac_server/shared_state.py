"""线程安全状态交换容器。"""
from __future__ import annotations

import queue
import threading
from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class ControlCommand:
    seq: int
    t_send_ms: int
    frame: Dict[str, Any]


class ControlQueue:
    def __init__(self) -> None:
        self._queue: "queue.Queue[ControlCommand]" = queue.Queue()

    def push(self, cmd: ControlCommand) -> None:
        self._queue.put(cmd)

    def pop_latest(self) -> Optional[ControlCommand]:
        latest = None
        while not self._queue.empty():
            latest = self._queue.get()
        return latest


@dataclass
class StateSnapshot:
    state_frame: Dict[str, Any] = field(default_factory=dict)
    lock: threading.Lock = field(default_factory=threading.Lock)


class SharedState:
    def __init__(self) -> None:
        self.control_queue = ControlQueue()
        self.snapshot = StateSnapshot()

    def update_state_frame(self, frame: Dict[str, Any]) -> None:
        with self.snapshot.lock:
            self.snapshot.state_frame = frame

    def get_state_frame(self) -> Dict[str, Any]:
        with self.snapshot.lock:
            return dict(self.snapshot.state_frame)

