# 单臂沉浸式遥操作仿真系统（MVP）架构说明（revA 对齐）

本说明落实“不可变接口规范 v1.0.0（revA）”并给出工程骨架、消息定义与运行时要求。

## 仓库目录结构

```
mac_server/          # MuJoCo 仿真、IK、网络服务（Mac 权威仿真源）
visionpro_app/       # visionOS（Vision Pro）沉浸式客户端，RealityKit 场景与输入
assets/              # 场景资源与默认 scene_config.json
docs/                # 设计、测试、故障排查文档
scripts/             # 辅助脚本（压测、mock 客户端）
```

## scene_config.json revA 字段解释

- `schema_version`: 固定 `"1.0.0-revA"`。
- `scene_id`: 配置标识，ui_cmd.CONNECT.requested_scene_config_id 应匹配。
- `networking`: `{ "ws_host": "localhost", "ws_port": 8765, "ws_path": "/ws" }`，ws_path 必须被服务器支持。
- `frames.vp_operator_anchor.t_sim_from_vp_anchor`: 4x4 行主矩阵，描述从 Vision Pro 操作者锚点到仿真世界的齐次变换；Vision Pro 端控制帧使用 `frame_id="vp_operator_anchor"`，Mac 根据该变换落地到仿真世界。
- `robot`: `{ "mjcf_path": "assets/robot.xml", "base_pose": {...}, "home_q": [...], "gripper": {"actuator_name": "gripper_close"} }`。
- `table`: `{ "top_height_m": 1.0, "fixed": true }`，桌子为静态几何体。
- `objects`: 数组，示例 `[{"name": "cube_01", "type": "box", "size_m": [0.05,0.05,0.05], "pose": {...}}]`，均为自由刚体。
- `control`: `{ "limits": {"workspace_aabb_m": {...}, "max_ee_speed_mps": 1.0, "max_joint_speed_rad_s": 1.5, "table_clearance_m": 0.05}, "filter": {"type": "one_euro", "params": {...}}, "pause_behavior": "hold" }`。
- `heartbeat`: `{ "period_ms": 1000, "timeout_ms": 3000 }`。
- 任何扩展字段只能放在 `extensions` 内。

## 通信 Envelope 与消息

统一 Envelope：

```
{
  "schema_version": "1.0.0-revA",
  "msg_type": "state_frame",   # 枚举：ui_cmd/control_frame/heartbeat/sim_event/state_frame/heartbeat_ack
  "seq": 42,
  "t_send_ms": 1700000123,
  "session_id": "abcd-1234",   # CONNECT 阶段分配
  "payload": { ... },
  "extensions": {"debug": {"note": "optional"}}
}
```

### 上行（VP→Mac）

- `ui_cmd.payload`: `{ "command": "CONNECT|START|PAUSE|RESET|DISCONNECT", "requested_scene_config_id": "demo", "extensions": {} }`
- `control_frame.payload`: `{ "frame_id": "vp_operator_anchor", "left_target_pos_m": [x,y,z], "left_grip": {"mode": "binary", "value": 0|1}, "clutch_enabled": true, "alerts": [], "extensions": {} }`
- `heartbeat.payload`: `{ "t_origin_ms": 1700000, "extensions": {} }`

#### 示例 ui_cmd（CONNECT）
```
{
  "schema_version": "1.0.0-revA",
  "msg_type": "ui_cmd",
  "seq": 1,
  "t_send_ms": 1700000000,
  "session_id": "",
  "payload": {
    "command": "CONNECT",
    "requested_scene_config_id": "default_scene"
  },
  "extensions": {}
}
```

#### 示例 control_frame（RUNNING + clutch）
```
{
  "schema_version": "1.0.0-revA",
  "msg_type": "control_frame",
  "seq": 120,
  "t_send_ms": 1700000120,
  "session_id": "abcd-1234",
  "payload": {
    "frame_id": "vp_operator_anchor",
    "left_target_pos_m": [0.45, -0.2, 1.05],
    "left_grip": {"mode": "binary", "value": 1},
    "clutch_enabled": true,
    "alerts": []
  },
  "extensions": {}
}
```

### 下行（Mac→VP）

- `sim_event.payload`: `{ "event": "CONNECTED|STARTED|PAUSED|RESET_DONE|DISCONNECTED", "sim_state": "IDLE|RUNNING|PAUSED|ERROR", "session_id": "abcd" }`
- `state_frame.payload`: `{ "sim_state": "RUNNING", "q_rad": [...], "qd_rad_s": [...], "ee_pos_m": [x,y,z], "objects": [{"name": "cube_01", "pose": {...}}], "alerts": [], "stats": {"rtt_ms_est": 20}, "extensions": {} }`
- `heartbeat_ack.payload`: `{ "t_origin_ms": 1700000, "rtt_ms_est": 22, "extensions": {} }`

#### 示例 sim_event（CONNECTED）
```
{
  "schema_version": "1.0.0-revA",
  "msg_type": "sim_event",
  "seq": 2,
  "t_send_ms": 1700000001,
  "session_id": "abcd-1234",
  "payload": {
    "event": "CONNECTED",
    "sim_state": "IDLE",
    "session_id": "abcd-1234"
  },
  "extensions": {}
}
```

#### 示例 state_frame（运行态）
```
{
  "schema_version": "1.0.0-revA",
  "msg_type": "state_frame",
  "seq": 300,
  "t_send_ms": 1700000300,
  "session_id": "abcd-1234",
  "payload": {
    "sim_state": "RUNNING",
    "q_rad": [0.0, 0.2, -0.3, 1.1, 0.0, 0.5],
    "qd_rad_s": [0,0,0,0,0,0],
    "ee_pos_m": [0.48, -0.1, 1.02],
    "objects": [{"name": "cube_01", "pose": {"pos_m": [0.6,0.0,1.0], "quat_xyzw": [0,0,0,1]}}],
    "alerts": [],
    "stats": {"rtt_ms_est": 22}
  },
  "extensions": {}
}
```

## 线程与频率

- 仿真线程：240 Hz（`SimCore.step_sim`）。
- 控制输入处理：60 Hz；网络线程读取 control_frame，写入线程安全队列，仿真线程消费。
- 状态广播：60 Hz；仿真线程写快照到共享状态，网络线程在定时器中发送 state_frame。
- 心跳：按 `heartbeat.period_ms` 接收并回复，超时触发 `NET_TIMEOUT` 警报并进入安全（hold/damp）。
- 线程间通过队列或锁（例如 `queue.Queue` / `asyncio.Queue`）传递控制命令和状态，避免长时间持锁。

## 状态机（文字描述）

```
CONNECT -> CONNECTED -> START -> RUNNING
RUNNING --PAUSE--> PAUSED --START--> RUNNING
RUNNING/PAUSED --RESET--> RESET_DONE -> IDLE
RUNNING/PAUSED/IDLE --DISCONNECT--> DISCONNECTED -> 清理 session
``` 

- CONNECT 时分配 `session_id` 并回复 `sim_event(CONNECTED, sim_state=IDLE)`。
- RESET 完成后保持在 IDLE（或 PAUSED），用于安全恢复，本实现选择 IDLE 以避免误动作。

