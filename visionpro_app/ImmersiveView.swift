import SwiftUI
import RealityKit

struct ImmersiveView: View {
    @StateObject var network = NetworkClient(host: "localhost", port: 8765, path: "/ws")
    @State private var synchronizer: SceneSynchronizer?
    var body: some View {
        RealityView { content in
            let root = Entity()
            content.add(root)
            synchronizer = SceneSynchronizer(root: root)
            network.connect()
        } update: { _ in
            // rendering loop
        }
        .overlay(alignment: .topLeading) {
            VStack(alignment: .leading) {
                Text("State: \(network.simState)")
                Text("RTT: \(Int(network.rttMs)) ms")
            }
            .padding()
            .background(.ultraThinMaterial)
        }
    }
}

#Preview {
    ImmersiveView()
}

