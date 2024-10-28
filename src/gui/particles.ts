import { ParticleData } from "../storage/storage"

export function DestroyOldParticles(particles: ParticleData[], gametime: number): void {
	const particle = particles.at(0)

	if (gametime !== undefined && particle !== undefined && particle.gametime + 2 < gametime) {
		particle.particle.Destroy()
		particles.shift()
	}
}
