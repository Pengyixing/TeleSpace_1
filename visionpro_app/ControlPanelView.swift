import SwiftUI

struct ControlPanelView: View {
    @ObservedObject var viewModel: ControlPanelViewModel
    @State private var sceneId: String = "default_scene"

    var body: some View {
        VStack {
            Text("Session: \(viewModel.connectionState)")
            Text("State: \(viewModel.simState)")
            Text("RTT: \(Int(viewModel.rtt)) ms")
            HStack {
                Button("Connect") { viewModel.send(command: "CONNECT", sceneId: sceneId) }
                Button("Start") { viewModel.send(command: "START", sceneId: sceneId) }
                Button("Pause") { viewModel.send(command: "PAUSE", sceneId: sceneId) }
                Button("Reset") { viewModel.send(command: "RESET", sceneId: sceneId) }
                Button("Disconnect") { viewModel.send(command: "DISCONNECT", sceneId: sceneId) }
            }
            .buttonStyle(.borderedProminent)
            .disabled(viewModel.cooldown)
            TextField("scene_config_id", text: $sceneId)
                .textFieldStyle(.roundedBorder)
        }
        .padding()
        .background(.thinMaterial)
        .cornerRadius(12)
    }
}

#Preview {
    ControlPanelView(viewModel: ControlPanelViewModel(network: NetworkClient(host: "localhost", port: 8765, path: "/ws")))
}

