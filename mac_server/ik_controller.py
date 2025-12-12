"""
阻尼最小二乘 IK 控制器：仅跟随末端位置，严格对齐 control_frame（无姿态）。
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Tuple

import mujoco
import numpy as np

from mac_server.config import ControlConfig, SceneConfig


@dataclass
class FilterState:
    prev: np.ndarray | None = None
    prev_timestamp: float | None = None


def one_euro_filter(value: np.ndarray, timestamp: float, state: FilterState, min_cutoff: float, beta: float) -> np.ndarray:
    if state.prev is None or state.prev_timestamp is None:
        state.prev = value
        state.prev_timestamp = timestamp
        return value
    dt = max(1e-6, timestamp - state.prev_timestamp)
    # 低通系数
    alpha = 1.0 / (1.0 + (2 * math.pi * min_cutoff * dt))
    dx = (value - state.prev) / dt
    filtered_dx = alpha * dx + (1 - alpha) * (state.prev * 0)
    cutoff = min_cutoff + beta * np.linalg.norm(filtered_dx)
    alpha_cutoff = 1.0 / (1.0 + (2 * math.pi * cutoff * dt))
    result = alpha_cutoff * value + (1 - alpha_cutoff) * state.prev
    state.prev = result
    state.prev_timestamp = timestamp
    return result


def lowpass_filter(value: np.ndarray, timestamp: float, state: FilterState, alpha: float) -> np.ndarray:
    if state.prev is None:
        state.prev = value
        return value
    result = alpha * value + (1 - alpha) * state.prev
    state.prev = result
    return result


@dataclass
class IKResult:
    dq_rad_s: np.ndarray
    alerts: List[str]


class IKController:
    def __init__(self, model: mujoco.MjModel, control_cfg: ControlConfig):
        self.model = model
        self.control_cfg = control_cfg
        self.filter_state = FilterState()

    def _filter_target(self, target: np.ndarray, timestamp: float) -> np.ndarray:
        filt = self.control_cfg.filter
        if filt.type == "one_euro":
            return one_euro_filter(target, timestamp, self.filter_state, filt.params.get("min_cutoff", 1.0), filt.params.get("beta", 0.0))
        if filt.type == "lowpass":
            return lowpass_filter(target, timestamp, self.filter_state, filt.params.get("alpha", 0.5))
        return target

    def _clamp_workspace(self, pos: np.ndarray) -> Tuple[np.ndarray, List[str]]:
        limits = self.control_cfg.limits.workspace_aabb_m
        min_xyz = np.array(limits["min"])
        max_xyz = np.array(limits["max"])
        clamped = np.minimum(np.maximum(pos, min_xyz), max_xyz)
        alerts = []
        if not np.allclose(clamped, pos):
            alerts.append("WORKSPACE_LIMIT")
        return clamped, alerts

    def _enforce_table_clearance(self, pos: np.ndarray, table_height: float) -> Tuple[np.ndarray, List[str]]:
        clearance = self.control_cfg.limits.table_clearance_m
        min_z = table_height + clearance
        alerts = []
        if pos[2] < min_z:
            pos = pos.copy()
            pos[2] = min_z
            alerts.append("TABLE_CLEARANCE")
        return pos, alerts

    def compute_dq(self, data: mujoco.MjData, ee_site: int, target_pos_world: np.ndarray, timestamp: float, table_height: float) -> IKResult:
        filtered_target = self._filter_target(target_pos_world, timestamp)
        filtered_target, alerts_ws = self._clamp_workspace(filtered_target)
        filtered_target, alerts_table = self._enforce_table_clearance(filtered_target, table_height)
        alerts = alerts_ws + alerts_table

        current_pos = data.site_xpos[ee_site].copy()
        error = filtered_target - current_pos

        # 任务空间限速
        max_ee_speed = self.control_cfg.limits.max_ee_speed_mps
        desired_vel = error / max(1e-3, np.linalg.norm(error)) * min(np.linalg.norm(error), max_ee_speed)

        # Jacobian
        jacp = np.zeros((3, self.model.nv))
        mujoco.mj_jacSite(self.model, data, jacp, None, ee_site)
        damp = 1e-4
        jj_t = jacp @ jacp.T
        inv = np.linalg.inv(jj_t + damp * np.eye(3))
        dq = jacp.T @ inv @ desired_vel

        # 关节速度限幅
        max_joint_speed = self.control_cfg.limits.max_joint_speed_rad_s
        dq = np.clip(dq, -max_joint_speed, max_joint_speed)

        return IKResult(dq_rad_s=dq, alerts=alerts)

    def pause_command(self, behavior: str) -> np.ndarray:
        if behavior == "hold":
            return np.zeros(self.model.nv)
        if behavior == "damp":
            return -0.1 * np.sign(np.zeros(self.model.nv))
        return np.zeros(self.model.nv)


def demo_convergence(controller: IKController, model: mujoco.MjModel, data: mujoco.MjData, site: int, targets: Iterable[np.ndarray]) -> None:
    """简单示例：依次跟踪目标并打印误差。"""
    for target in targets:
        result = controller.compute_dq(data, site, target, timestamp=0.01, table_height=1.0)
        print("target", target, "dq_norm", np.linalg.norm(result.dq_rad_s), "alerts", result.alerts)

