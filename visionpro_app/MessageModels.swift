import Foundation

// Envelope + payloads strictly following revA; any additional fields belong in extensions.
struct Envelope: Codable {
    let schema_version: String
    let msg_type: String
    let seq: Int
    let t_send_ms: Int
    let session_id: String
    let payload: Payload
    let extensions: [String: AnyCodable]?
}

struct Payload: Codable {
    let sim_state: String?
    let q_rad: [Double]?
    let qd_rad_s: [Double]?
    let ee_pos_m: [Double]?
    let objects: [SimObject]?
    let alerts: [String]?
    let stats: [String: Double]?
    let event: String?
    let requested_scene_config_id: String?
    let command: String?
    let t_origin_ms: Int?
    let rtt_ms_est: Double?
}

struct SimObject: Codable {
    let name: String
    let pose: Pose
}

struct Pose: Codable {
    let pos_m: [Double]
    let quat_xyzw: [Double]
}

struct AnyCodable: Codable {}

