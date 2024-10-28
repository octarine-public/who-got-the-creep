import { Particle, Unit, Vector3 } from "github.com/octarine-public/wrapper/index"

export interface CreepData {
	lastCreepPos: Vector3
	attackerEntity: Unit
	gameTime: number
}

export interface ParticleData {
	particle: Particle
	enemiesCount: number
	gametime: number
	creepPos?: Vector3
}

export class Storage {
	public static readonly Units: CreepData[] = []
	public static readonly Particles: ParticleData[] = []
	public static readonly AlliesXP = new Map<string, number>()

	public static Clear(): void {
		this.Units.clear()
		this.Particles.clear()
		this.AlliesXP.clear()
	}
}
