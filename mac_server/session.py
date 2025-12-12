"""会话状态机，遵守 revA。"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Optional


class SimState:
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    ERROR = "ERROR"


class SimEvent:
    CONNECTED = "CONNECTED"
    STARTED = "STARTED"
    PAUSED = "PAUSED"
    RESET_DONE = "RESET_DONE"
    DISCONNECTED = "DISCONNECTED"


@dataclass
class Session:
    session_id: str
    sim_state: str = SimState.IDLE

    @staticmethod
    def create() -> "Session":
        return Session(session_id=str(uuid.uuid4()), sim_state=SimState.IDLE)

    def start(self) -> None:
        self.sim_state = SimState.RUNNING

    def pause(self) -> None:
        self.sim_state = SimState.PAUSED

    def reset(self) -> None:
        self.sim_state = SimState.IDLE

    def disconnect(self) -> None:
        self.sim_state = SimState.IDLE

