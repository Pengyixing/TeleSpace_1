"""
scene_config 解析器（revA）。
不可变接口：字段名保持协议一致，扩展字段统一放 extensions。
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Tuple


@dataclass
class FrameConfig:
    t_sim_from_vp_anchor: List[float]


@dataclass
class NetworkingConfig:
    ws_host: str
    ws_port: int
    ws_path: str


@dataclass
class GripperConfig:
    actuator_name: str


@dataclass
class RobotConfig:
    mjcf_path: str
    base_pose: Dict[str, Any]
    home_q: List[float]
    gripper: GripperConfig


@dataclass
class TableConfig:
    top_height_m: float = 1.0
    fixed: bool = True


@dataclass
class ObjectConfig:
    name: str
    type: str
    size_m: List[float]
    pose: Dict[str, Any]


@dataclass
class ControlLimits:
    workspace_aabb_m: Dict[str, List[float]]
    max_ee_speed_mps: float
    max_joint_speed_rad_s: float
    table_clearance_m: float


@dataclass
class ControlFilter:
    type: str
    params: Dict[str, Any]


@dataclass
class ControlConfig:
    limits: ControlLimits
    filter: ControlFilter
    pause_behavior: str


@dataclass
class HeartbeatConfig:
    period_ms: int
    timeout_ms: int


@dataclass
class SceneConfig:
    schema_version: str
    scene_id: str
    networking: NetworkingConfig
    frames: Dict[str, FrameConfig]
    robot: RobotConfig
    table: TableConfig
    objects: List[ObjectConfig]
    control: ControlConfig
    heartbeat: HeartbeatConfig
    extensions: Dict[str, Any] = field(default_factory=dict)

    @staticmethod
    def from_file(path: Path) -> "SceneConfig":
        raw = json.loads(path.read_text())
        frames = {name: FrameConfig(**frame) for name, frame in raw["frames"].items()}
        networking = NetworkingConfig(**raw["networking"])
        gripper = GripperConfig(**raw["robot"]["gripper"])
        robot = RobotConfig(
            mjcf_path=raw["robot"]["mjcf_path"],
            base_pose=raw["robot"]["base_pose"],
            home_q=raw["robot"]["home_q"],
            gripper=gripper,
        )
        table = TableConfig(**raw["table"])
        objects = [ObjectConfig(**obj) for obj in raw.get("objects", [])]
        limits = ControlLimits(**raw["control"]["limits"])
        ctrl_filter = ControlFilter(**raw["control"]["filter"])
        control = ControlConfig(limits=limits, filter=ctrl_filter, pause_behavior=raw["control"]["pause_behavior"])
        heartbeat = HeartbeatConfig(**raw["heartbeat"])
        return SceneConfig(
            schema_version=raw["schema_version"],
            scene_id=raw["scene_id"],
            networking=networking,
            frames=frames,
            robot=robot,
            table=table,
            objects=objects,
            control=control,
            heartbeat=heartbeat,
            extensions=raw.get("extensions", {}),
        )


DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent.parent / "assets" / "scene_config.json"


def load_scene_config(path: Path | None = None) -> SceneConfig:
    cfg_path = path or DEFAULT_CONFIG_PATH
    return SceneConfig.from_file(cfg_path)

