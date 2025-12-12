import Foundation
import RealityKit

final class SceneSynchronizer {
    private let rootEntity: Entity
    private var jointEntities: [Entity] = []
    private var objectEntities: [String: Entity] = [:]

    init(root: Entity) {
        self.rootEntity = root
    }

    func update(from payload: Payload) {
        if let objects = payload.objects {
            for obj in objects {
                let entity = objectEntities[obj.name] ?? Entity()
                entity.position = SIMD3<Float>(Float(obj.pose.pos_m[0]), Float(obj.pose.pos_m[1]), Float(obj.pose.pos_m[2]))
                if objectEntities[obj.name] == nil {
                    entity.name = obj.name
                    entity.components[ModelComponent.self] = ModelComponent(mesh: .generateBox(size: 0.05))
                    rootEntity.addChild(entity)
                    objectEntities[obj.name] = entity
                }
            }
        }
        // 关节驱动可后续用 q_rad 实现，当前用占位 transform。
    }
}

