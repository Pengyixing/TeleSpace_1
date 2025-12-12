import Foundation
import Combine
import RealityKit

final class LeftHandInputProvider: ObservableObject {
    @Published var clutchEnabled: Bool = false
    private var seq: Int = 0
    private let network: NetworkClient
    private var lastPinch: Bool = false
    private var debounceUntil = Date()

    init(network: NetworkClient) {
        self.network = network
    }

    func update(wristPosition: SIMD3<Float>, pinchDistance: Float, operatorAnchor: Entity) {
        let isPinching = pinchDistance < 0.02
        if Date() > debounceUntil, isPinching != lastPinch {
            lastPinch = isPinching
            debounceUntil = Date().addingTimeInterval(0.05)
        }
        let local = operatorAnchor.convert(position: wristPosition, to: nil)
        sendControl(target: local, gripClosed: lastPinch)
    }

    private func sendControl(target: SIMD3<Float>, gripClosed: Bool) {
        guard clutchEnabled else { return }
        seq += 1
        let env: [String: Any] = [
            "schema_version": "1.0.0-revA",
            "msg_type": "control_frame",
            "seq": seq,
            "t_send_ms": Int(Date().timeIntervalSince1970 * 1000),
            "session_id": network.sessionId,
            "payload": [
                "frame_id": "vp_operator_anchor",
                "left_target_pos_m": [Double(target.x), Double(target.y), Double(target.z)],
                "left_grip": ["mode": "binary", "value": gripClosed ? 1 : 0],
                "clutch_enabled": true,
                "alerts": []
            ],
            "extensions": [:]
        ]
        if let data = try? JSONSerialization.data(withJSONObject: env), let text = String(data: data, encoding: .utf8) {
            network.webSocketTask?.send(.string(text)) { _ in }
        }
    }
}

