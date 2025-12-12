# 故障排查指南（revA）

## 坐标系错位
- 症状：末端与 Vision Pro 位置不一致。
- 定位：确认 control_frame.frame_id=vp_operator_anchor；检查 scene_config.frames.vp_operator_anchor.t_sim_from_vp_anchor 矩阵是否单位；在服务器打印控制目标与 ee_pos_m 对比。
- 处理：调整变换矩阵，重启服务器并 CONNECT。

## 末端抖动 / IK 发散
- 症状：末端震荡或速度超限。
- 定位：查看 control.filter 参数（one_euro / lowpass）；检查 workspace 限制是否频繁夹紧。
- 处理：增大 one_euro.min_cutoff 或 beta；缩小 max_ee_speed_mps；启用 pause_behavior=hold 观察稳定性。

## 桌面穿透
- 症状：末端或方块穿过桌面。
- 定位：确认 table.top_height_m=1.0；检查 control.limits.table_clearance_m；查看 state_frame.alerts 是否包含 TABLE_CLEARANCE。
- 处理：提高 table_clearance_m；在 IK 控制器中增加障碍高度。

## 抓取不稳
- 症状：夹爪无法保持抓取。
- 定位：检查 left_grip 映射是否 binary；确认 gripper actuator 名称匹配 robot.gripper.actuator_name。
- 处理：降低控制周期或在 SimCore.set_gripper 中加入力闭环；保证 control_frame.clutch_enabled 为 true 才写入抓取。

## 网络超时 / 丢帧
- 症状：Vision Pro 停止刷新或进入安全模式。
- 定位：检查 heartbeat 超时阈值；查看 heartbeat_ack.rtt_ms_est；确认 state_frame.seq 是否连续。
- 处理：优化网络；增加 jitter buffer；必要时降低频率（state/cmd 仍保持协议字段）。

