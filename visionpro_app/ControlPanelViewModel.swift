import Foundation
import Combine

final class ControlPanelViewModel: ObservableObject {
    @Published var cooldown: Bool = false
    @Published var simState: String = "IDLE"
    @Published var connectionState: String = "DISCONNECTED"
    @Published var rtt: Double = 0

    private let network: NetworkClient
    private var cancellables = Set<AnyCancellable>()

    init(network: NetworkClient) {
        self.network = network
        network.$simState.assign(to: &self.$simState)
        network.$connectionState.assign(to: &self.$connectionState)
        network.$rttMs.assign(to: &self.$rtt)
    }

    func send(command: String, sceneId: String) {
        guard !cooldown else { return }
        cooldown = true
        network.sendUi(command: command, requestedScene: sceneId)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            self.cooldown = false
        }
    }
}

