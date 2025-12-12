import Foundation
import Combine
import Network

final class NetworkClient: ObservableObject {
    @Published var sessionId: String = ""
    @Published var simState: String = "IDLE"
    @Published var rttMs: Double = 0
    @Published var connectionState: String = "DISCONNECTED"

    var webSocketTask: URLSessionWebSocketTask?
    private let url: URL
    private var cancellables = Set<AnyCancellable>()
    private var seq: Int = 0

    init(host: String, port: Int, path: String) {
        var comps = URLComponents()
        comps.scheme = "ws"
        comps.host = host
        comps.port = port as NSNumber
        comps.path = path
        self.url = comps.url ?? URL(string: "ws://localhost:8765/ws")!
    }

    func connect() {
        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        connectionState = "CONNECTING"
        listen()
    }

    func disconnect() {
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        connectionState = "DISCONNECTED"
    }

    private func listen() {
        webSocketTask?.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .failure:
                self.connectionState = "ERROR"
            case .success(let message):
                if case let .string(text) = message, let data = text.data(using: .utf8) {
                    if let env = try? JSONDecoder().decode(Envelope.self, from: data) {
                        DispatchQueue.main.async {
                            if env.msg_type == "sim_event", let event = env.payload.event {
                                if event == "CONNECTED" { self.sessionId = env.payload.session_id ?? env.session_id }
                                self.simState = env.payload.sim_state ?? self.simState
                            } else if env.msg_type == "state_frame" {
                                self.simState = env.payload.sim_state ?? self.simState
                                self.rttMs = env.payload.stats?["rtt_ms_est"] ?? self.rttMs
                            } else if env.msg_type == "heartbeat_ack" {
                                self.rttMs = env.payload.rtt_ms_est ?? self.rttMs
                            }
                            self.connectionState = "CONNECTED"
                        }
                    }
                }
                self.listen()
            }
        }
    }

    func sendUi(command: String, requestedScene: String) {
        guard let task = webSocketTask else { return }
        seq += 1
        let env: [String: Any] = [
            "schema_version": "1.0.0-revA",
            "msg_type": "ui_cmd",
            "seq": seq,
            "t_send_ms": Int(Date().timeIntervalSince1970 * 1000),
            "session_id": sessionId,
            "payload": ["command": command, "requested_scene_config_id": requestedScene],
            "extensions": [:]
        ]
        if let data = try? JSONSerialization.data(withJSONObject: env), let text = String(data: data, encoding: .utf8) {
            task.send(.string(text)) { _ in }
        }
    }

    func sendHeartbeat() {
        guard let task = webSocketTask else { return }
        seq += 1
        let now = Int(Date().timeIntervalSince1970 * 1000)
        let env: [String: Any] = [
            "schema_version": "1.0.0-revA",
            "msg_type": "heartbeat",
            "seq": seq,
            "t_send_ms": now,
            "session_id": sessionId,
            "payload": ["t_origin_ms": now],
            "extensions": [:]
        ]
        if let data = try? JSONSerialization.data(withJSONObject: env), let text = String(data: data, encoding: .utf8) {
            task.send(.string(text)) { _ in }
        }
    }
}

