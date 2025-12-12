"""
MuJoCo 仿真核心（Mac 端权威）
- 单臂机械臂 + 固定桌子 + 自由方块
- 提供 reset_scene / step_sim / get_state_snapshot
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Dict, List

import mujoco
import numpy as np

from mac_server.config import ObjectConfig, SceneConfig


@dataclass
class SimState:
    q: np.ndarray
    qd: np.ndarray
    ee_pos_m: np.ndarray
    objects: List[Dict]
    sim_state: str
    alerts: List[str] = field(default_factory=list)
    stats: Dict = field(default_factory=dict)


class SimCore:
    def __init__(self, config: SceneConfig):
        self.config = config
        self.model = mujoco.MjModel.from_xml_path(config.robot.mjcf_path)
        self.data = mujoco.MjData(self.model)
        self._build_scene_objects()
        self._gripper_actuator = config.robot.gripper.actuator_name
        self.sim_state = "IDLE"
        self.last_sim_time = time.time()

    def _build_scene_objects(self) -> None:
        """创建桌面与方块。桌子固定，方块自由体。"""
        # 桌子：使用地面几何体替代，保持 top_height
        table_height = self.config.table.top_height_m
        geom_id = mujoco.mj_name2id(self.model, mujoco.mjtObj.mjOBJ_GEOM, "table")
        if geom_id >= 0:
            self.model.geom_pos[geom_id] = np.array([0.0, 0.0, table_height - self.model.geom_size[geom_id][2]])
        # 方块：放置自由刚体
        for obj in self.config.objects:
            self._place_object(obj)

    def _place_object(self, obj_cfg: ObjectConfig) -> None:
        body_id = mujoco.mj_name2id(self.model, mujoco.mjtObj.mjOBJ_BODY, obj_cfg.name)
        if body_id < 0:
            return
        pos = np.array(obj_cfg.pose["pos_m"])
        quat = np.array(obj_cfg.pose["quat_xyzw"])
        self.data.qpos[self.model.jnt_qposadr[body_id]: self.model.jnt_qposadr[body_id] + 7] = np.concatenate([pos, quat])

    def reset_scene(self) -> None:
        self.data.qpos[:] = 0
        self.data.qvel[:] = 0
        self.data.ctrl[:] = 0
        # 机械臂回 home_q
        n_arm = len(self.config.robot.home_q)
        self.data.qpos[:n_arm] = np.array(self.config.robot.home_q)
        for obj in self.config.objects:
            self._place_object(obj)
        mujoco.mj_forward(self.model, self.data)
        self.sim_state = "IDLE"

    def step_sim(self, dt: float) -> None:
        mujoco.mj_step(self.model, self.data, nstep=max(1, int(dt / self.model.opt.timestep)))
        self.last_sim_time = time.time()

    def set_gripper(self, closed: bool) -> None:
        actuator_id = mujoco.mj_name2id(self.model, mujoco.mjtObj.mjOBJ_ACTUATOR, self._gripper_actuator)
        if actuator_id >= 0:
            self.data.ctrl[actuator_id] = 1.0 if closed else 0.0

    def get_state_snapshot(self) -> SimState:
        # 末端位置
        ee_site = mujoco.mj_name2id(self.model, mujoco.mjtObj.mjOBJ_SITE, "ee_site")
        ee_pos = self.data.site_xpos[ee_site] if ee_site >= 0 else np.zeros(3)
        objects_payload = []
        for obj in self.config.objects:
            body_id = mujoco.mj_name2id(self.model, mujoco.mjtObj.mjOBJ_BODY, obj.name)
            if body_id < 0:
                continue
            pos = self.data.xpos[body_id]
            quat = self.data.xquat[body_id]
            objects_payload.append({"name": obj.name, "pose": {"pos_m": pos.tolist(), "quat_xyzw": quat.tolist()}})
        return SimState(
            q=self.data.qpos.copy(),
            qd=self.data.qvel.copy(),
            ee_pos_m=ee_pos.copy(),
            objects=objects_payload,
            sim_state=self.sim_state,
            stats={"sim_time": self.last_sim_time},
        )

