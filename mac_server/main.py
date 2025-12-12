"""
SimStudio 入口：加载 scene_config、启动仿真与监控窗口。
命令：python mac_server/main.py --config assets/scene_config.json
"""
from __future__ import annotations

import argparse
import threading
import time

import mujoco
import numpy as np

from mac_server.config import load_scene_config
from mac_server.sim_core import SimCore
from mac_server.viewer import SimViewer


SIM_HZ = 240


def run_sim_loop(sim: SimCore, viewer: SimViewer | None) -> None:
    dt = 1.0 / SIM_HZ
    while True:
        sim.step_sim(dt)
        if viewer:
            viewer.render_once()
        time.sleep(dt)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default="assets/scene_config.json")
    parser.add_argument("--headless", action="store_true")
    args = parser.parse_args()

    cfg = load_scene_config(args.config)
    sim = SimCore(cfg)
    viewer = None if args.headless else SimViewer(sim.model, sim.data)
    if viewer:
        viewer.launch()

    sim.reset_scene()
    sim_thread = threading.Thread(target=run_sim_loop, args=(sim, viewer), daemon=True)
    sim_thread.start()

    print("SimStudio running. Press Ctrl+C to exit.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        if viewer:
            viewer.close()


if __name__ == "__main__":
    main()

