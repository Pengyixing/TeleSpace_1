"""模拟客户端：发送 ui_cmd + control_frame，支持轨迹配置。"""
from __future__ import annotations

import asyncio
import json
import math
import time
from dataclasses import dataclass
from typing import Callable, Iterable, List

import websockets

from mac_server.message_schema import SCHEMA_VERSION


@dataclass
class Trajectory:
    generator: Callable[[float], List[float]]


def circle(radius: float, z: float) -> Trajectory:
    return Trajectory(generator=lambda t: [0.5 + radius * math.cos(t), 0.0 + radius * math.sin(t), z])


def line(x0: float, x1: float, z: float) -> Trajectory:
    return Trajectory(generator=lambda t: [x0 + (x1 - x0) * (0.5 + 0.5 * math.sin(t)), 0.0, z])


def vertical(z0: float, z1: float, x: float) -> Trajectory:
    return Trajectory(generator=lambda t: [x, 0.0, z0 + (z1 - z0) * (0.5 + 0.5 * math.sin(t))])


async def send_control(ws, session_id: str, traj: Trajectory, clutch_enabled: bool) -> None:
    seq = 0
    while True:
        t = time.time()
        target = traj.generator(t)
        env = {
            "schema_version": SCHEMA_VERSION,
            "msg_type": "control_frame",
            "seq": seq,
            "t_send_ms": int(t * 1000),
            "session_id": session_id,
            "payload": {
                "frame_id": "vp_operator_anchor",
                "left_target_pos_m": target,
                "left_grip": {"mode": "binary", "value": 1},
                "clutch_enabled": clutch_enabled,
                "alerts": [],
            },
            "extensions": {},
        }
        await ws.send(json.dumps(env))
        seq += 1
        await asyncio.sleep(1 / 60)


async def main():
    uri = "ws://localhost:8765/ws"
    async with websockets.connect(uri) as ws:
        connect_env = {
            "schema_version": SCHEMA_VERSION,
            "msg_type": "ui_cmd",
            "seq": 0,
            "t_send_ms": int(time.time() * 1000),
            "session_id": "",
            "payload": {"command": "CONNECT", "requested_scene_config_id": "default_scene"},
            "extensions": {},
        }
        await ws.send(json.dumps(connect_env))
        msg = json.loads(await ws.recv())
        session_id = msg.get("payload", {}).get("session_id", "")

        start_env = connect_env | {"msg_type": "ui_cmd", "seq": 1, "payload": {"command": "START", "requested_scene_config_id": "default_scene"}, "session_id": session_id}
        await ws.send(json.dumps(start_env))

        ctrl_task = asyncio.create_task(send_control(ws, session_id, circle(0.1, 1.05), clutch_enabled=True))
        for _ in range(120):
            print("STATE", await ws.recv())
        ctrl_task.cancel()


if __name__ == "__main__":
    asyncio.run(main())

