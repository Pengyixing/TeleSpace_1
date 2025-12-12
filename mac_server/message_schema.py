"""revA Envelope 与消息结构。所有扩展字段必须放在 extensions。"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


SCHEMA_VERSION = "1.0.0-revA"


@dataclass
class Envelope:
    schema_version: str
    msg_type: str
    seq: int
    t_send_ms: int
    session_id: str
    payload: Dict[str, Any]
    extensions: Dict[str, Any] = field(default_factory=dict)


@dataclass
class StateFramePayload:
    sim_state: str
    q_rad: List[float]
    qd_rad_s: List[float]
    ee_pos_m: List[float]
    objects: List[Dict[str, Any]]
    alerts: List[str]
    stats: Dict[str, Any]
    extensions: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SimEventPayload:
    event: str
    sim_state: str
    session_id: str
    extensions: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ControlFramePayload:
    frame_id: str
    left_target_pos_m: List[float]
    left_grip: Dict[str, Any]
    clutch_enabled: bool
    alerts: List[str]
    extensions: Dict[str, Any] = field(default_factory=dict)


@dataclass
class UiCmdPayload:
    command: str
    requested_scene_config_id: str
    extensions: Dict[str, Any] = field(default_factory=dict)


@dataclass
class HeartbeatPayload:
    t_origin_ms: int
    extensions: Dict[str, Any] = field(default_factory=dict)


@dataclass
class HeartbeatAckPayload:
    t_origin_ms: int
    rtt_ms_est: float
    extensions: Dict[str, Any] = field(default_factory=dict)

