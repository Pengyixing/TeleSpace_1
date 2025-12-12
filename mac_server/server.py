"""WebSocket 服务器（asyncio），实现 revA 状态机与 60Hz 上下行。"""
from __future__ import annotations

import asyncio
import json
import time
from typing import Dict

import websockets

from mac_server.config import load_scene_config
from mac_server.message_schema import SCHEMA_VERSION, Envelope
from mac_server.session import Session, SimEvent, SimState
from mac_server.shared_state import ControlCommand, SharedState
from mac_server.sim_core import SimCore

STATE_HZ = 60
CMD_HZ = 60


class TeleopServer:
    def __init__(self, config_path: str):
        self.scene_config = load_scene_config(config_path)
        self.sim = SimCore(self.scene_config)
        self.shared_state = SharedState()
        self.session: Session | None = None

    async def handle_client(self, websocket: websockets.WebSocketServerProtocol):
        recv_task = asyncio.create_task(self._recv_loop(websocket))
        state_task = asyncio.create_task(self._state_loop(websocket))
        await asyncio.wait({recv_task, state_task}, return_when=asyncio.FIRST_COMPLETED)
        recv_task.cancel()
        state_task.cancel()

    async def _recv_loop(self, websocket: websockets.WebSocketServerProtocol):
        async for message in websocket:
            env = json.loads(message)
            msg_type = env.get("msg_type")
            if msg_type == "ui_cmd":
                await self._handle_ui_cmd(websocket, env)
            elif msg_type == "control_frame":
                await self._handle_control(env)
            elif msg_type == "heartbeat":
                await self._handle_heartbeat(websocket, env)

    async def _state_loop(self, websocket: websockets.WebSocketServerProtocol):
        dt = 1.0 / STATE_HZ
        while True:
            await asyncio.sleep(dt)
            frame = self.shared_state.get_state_frame()
            if frame:
                await websocket.send(json.dumps(frame))

    async def _handle_ui_cmd(self, websocket: websockets.WebSocketServerProtocol, env: Dict):
        command = env["payload"].get("command")
        if command == "CONNECT":
            self.session = Session.create()
            await websocket.send(self._build_sim_event(SimEvent.CONNECTED))
        elif not self.session:
            return
        elif command == "START":
            self.session.start()
            self.sim.sim_state = SimState.RUNNING
            await websocket.send(self._build_sim_event(SimEvent.STARTED))
        elif command == "PAUSE":
            self.session.pause()
            self.sim.sim_state = SimState.PAUSED
            await websocket.send(self._build_sim_event(SimEvent.PAUSED))
        elif command == "RESET":
            self.sim.reset_scene()
            self.session.reset()
            await websocket.send(self._build_sim_event(SimEvent.RESET_DONE))
        elif command == "DISCONNECT":
            await websocket.send(self._build_sim_event(SimEvent.DISCONNECTED))
            self.session = None

    async def _handle_control(self, env: Dict):
        if not self.session or self.session.sim_state != SimState.RUNNING:
            return
        payload = env.get("payload", {})
        cmd = ControlCommand(seq=env.get("seq", 0), t_send_ms=env.get("t_send_ms", 0), frame=payload)
        if payload.get("clutch_enabled", False):
            self.shared_state.control_queue.push(cmd)

    async def _handle_heartbeat(self, websocket: websockets.WebSocketServerProtocol, env: Dict):
        t_origin = env.get("payload", {}).get("t_origin_ms", 0)
        now_ms = int(time.time() * 1000)
        ack = Envelope(
            schema_version=SCHEMA_VERSION,
            msg_type="heartbeat_ack",
            seq=env.get("seq", 0),
            t_send_ms=now_ms,
            session_id=self.session.session_id if self.session else "",
            payload={"t_origin_ms": t_origin, "rtt_ms_est": max(0, now_ms - t_origin)},
        )
        await websocket.send(json.dumps(ack.__dict__))

    def _build_sim_event(self, event: str) -> str:
        now_ms = int(time.time() * 1000)
        payload = {
            "event": event,
            "sim_state": self.session.sim_state if self.session else SimState.IDLE,
            "session_id": self.session.session_id if self.session else "",
        }
        env = Envelope(
            schema_version=SCHEMA_VERSION,
            msg_type="sim_event",
            seq=0,
            t_send_ms=now_ms,
            session_id=self.session.session_id if self.session else "",
            payload=payload,
        )
        return json.dumps(env.__dict__)

    async def _cmd_tick(self):
        dt = 1.0 / CMD_HZ
        ee_site = 0
        while True:
            await asyncio.sleep(dt)
            cmd = self.shared_state.control_queue.pop_latest()
            if cmd:
                target = cmd.frame.get("left_target_pos_m", [0, 0, 0])
                self.sim.data.qvel[: len(target)] = target  # placeholder until IK integration
            state = self.sim.get_state_snapshot()
            env = Envelope(
                schema_version=SCHEMA_VERSION,
                msg_type="state_frame",
                seq=int(time.time() * 1000),
                t_send_ms=int(time.time() * 1000),
                session_id=self.session.session_id if self.session else "",
                payload={
                    "sim_state": self.session.sim_state if self.session else SimState.IDLE,
                    "q_rad": state.q.tolist(),
                    "qd_rad_s": state.qd.tolist(),
                    "ee_pos_m": state.ee_pos_m.tolist(),
                    "objects": state.objects,
                    "alerts": state.alerts,
                    "stats": state.stats,
                },
            )
            self.shared_state.update_state_frame(env.__dict__)

    async def run(self) -> None:
        cmd_task = asyncio.create_task(self._cmd_tick())
        server = await websockets.serve(self.handle_client, self.scene_config.networking.ws_host, self.scene_config.networking.ws_port, path=self.scene_config.networking.ws_path)
        print(f"WebSocket listening on ws://{self.scene_config.networking.ws_host}:{self.scene_config.networking.ws_port}{self.scene_config.networking.ws_path}")
        await server.wait_closed()
        cmd_task.cancel()


async def main():
    server = TeleopServer("assets/scene_config.json")
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())

