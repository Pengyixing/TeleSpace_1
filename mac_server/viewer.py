"""监控渲染窗口：使用 mujoco.viewer 提供第三人称视角。"""
from __future__ import annotations

import mujoco
from mujoco import viewer


class SimViewer:
    def __init__(self, model: mujoco.MjModel, data: mujoco.MjData):
        self.model = model
        self.data = data
        self._viewer = None

    def launch(self) -> None:
        if self._viewer is None:
            self._viewer = viewer.launch_passive(self.model, self.data)

    def render_once(self) -> None:
        if self._viewer:
            self._viewer.sync()

    def close(self) -> None:
        if self._viewer:
            self._viewer.close()
            self._viewer = None

