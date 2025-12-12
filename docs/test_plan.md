# 端到端联调与验收用例（revA）

## 覆盖用例
- CONNECT/START/PAUSE/RESET/DISCONNECT 全链路：验证 sim_event 反馈与 sim_state 切换。
- 重连：断开后重新 CONNECT，校验 session_id 重新分配且旧控制无效。
- session_id 校验：伪造/空 session_id 时，服务器应忽略 control_frame。
- heartbeat 超时：模拟超过 timeout_ms 不发心跳，期待 alerts 出现 `NET_TIMEOUT` 且控制进入安全（hold/damp）。
- 控制帧生效条件：仅 RUNNING + clutch_enabled=true 时更新末端目标；其他状态保持 pause_behavior。

## 功能验收
- 左手位置跟随：mock_client 圆周/直线轨迹，观察末端误差收敛。
- 夹爪去抖：binary pinch 反复触发，确认 left_grip 无抖动（期望 0/1 边沿明晰）。
- 桌面避碰：目标低于 `table.top_height_m + table_clearance_m` 时，state_frame.alerts 包含 `TABLE_CLEARANCE`，末端高度被夹紧。
- 工作空间限制：超出 workspace_aabb_m 时 alerts `WORKSPACE_LIMIT`，末端被投影回工作区。
- alerts 输出一致性：state_frame.alerts 与控制侧触发保持一致。

## 性能与稳定性
- 频率：
  - cmd 60Hz：mock_client 打印时间戳，确认发送间隔 ~16.7ms。
  - state 60Hz：服务器日志或客户端接收间隔统计。
- 延迟：使用 heartbeat_ack.rtt_ms_est 记录，连续 1min 统计均值与峰值。
- 丢包/抖动：统计连续丢帧数量，检查 state_frame.seq 单调递增。

## 操作步骤
1. 启动服务器：`python mac_server/server.py`。
2. 启动 mock 客户端：`python scripts/mock_client.py`。
3. 依次触发 UI 命令（按钮或脚本），对照状态机图确认 sim_event。
4. 手动断网或暂停 heartbeat，观察 NET_TIMEOUT 响应。
5. 修改 mock 轨迹（直线/上下）并记录末端位置，确保限速与避碰生效。

