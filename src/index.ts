import "../translations"

import {
	DOTAGameState,
	EntityManager,
	EventsSDK,
	GameRules,
	Hero,
	LocalPlayer,
	Particle,
	ParticleAttachment,
	ParticlesSDK,
	Sleeper,
	Unit,
	Vector3
} from "github.com/octarine-public/wrapper/index"

import { MenuManager } from "./menu/index"
import { BaseMenu } from "./menu/base"
import { DetectorGUI } from "./gui/detector"
import { DestroyOldParticles } from "./gui/particles"
import { TrackerGUI } from "./gui/tracker"

interface AttackOutcome {
	entindex_killed: number
	entindex_attacker: number
}

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

const bootstrap = new (class CWhoGotCreep {
	constructor() {
		this.menu.MenuChanged(() => {})
	}

	public Units: CreepData[] = []
	public Particles: ParticleData[] = []
	public readonly AlliesXP = new Map<string, number>()

	private readonly pSDK = new ParticlesSDK()
	private readonly sleeper = new Sleeper()
	private readonly menu = new MenuManager(this.sleeper)
	private readonly detectorGUI = new DetectorGUI(this.menu.Detector)
	private readonly trackerGUI = new TrackerGUI(this.menu.Tracker)

	public GameEvent(eventName: string, obj: any): void {
		if (!this.menu.State.value) {
			return
		}
		
		if (!this.shouldAttackOutcome(eventName, obj)) {
			return
		}

		const [killedEntity, attackerEntity] = [
			EntityManager.EntityByIndex(obj.entindex_killed),
			EntityManager.EntityByIndex(obj.entindex_attacker)
		]

		if (
			!(killedEntity instanceof Unit) ||
			!killedEntity.IsCreep ||
			!(attackerEntity instanceof Unit) ||
			!attackerEntity.IsHero
		) {
			return
		}

		this.trackerGameEvent(killedEntity, attackerEntity)
		this.detectorGameEvent(killedEntity, attackerEntity)
	}

	public Tick() {
		this.updateAlliesXP()
	}

	public Draw(): void {
		console.log("tracker menu state", this.menu.Tracker.State.value)

		DestroyOldParticles(this.Particles, GameRules?.RawGameTime!)

		if (!this.menu.State.value) {
			return
		}

		this.detectorGUI.Draw({
			particles: this.Particles,
			localHero: this.localHero!,
			isPostGame: this.isPostGame,
		})
		this.trackerGUI.Draw({
			units: this.Units,
			isPostGame: this.isPostGame,
			gametime: GameRules?.RawGameTime!
		})
	}

	private get isPostGame(): boolean {
		return ( 
			GameRules === undefined || 
			GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
		)
	}

	private get localHero(): Nullable<Hero> {
		return LocalPlayer?.Hero
	}

	private state(menu: BaseMenu): boolean {
		return menu.State.value
	}

	private getXpDiff(hero: Hero): number {
		return hero.CurrentXP - this.AlliesXP.get(hero.Name)!
	}

	private shouldAttackOutcome(eventName: string, obj: any): obj is AttackOutcome {
		return (
			eventName === "entity_killed" &&
			typeof obj.entindex_killed === "number" &&
			typeof obj.entindex_attacker === "number"
		)
	}

	private trackerGameEvent(killedEntity: Unit, attackerEntity: Unit): void {
		if (!this.state(this.menu.Tracker)) {
			return
		}

		const gametime: number = GameRules?.RawGameTime ?? 0

		if (
			(
				(this.menu.Tracker.DisibleMin.value * 60) < gametime
			) ||
			(
				!killedEntity.IsEnemy(attackerEntity) &&
				!this.menu.Tracker.ShowAllyCreeps.value
			) ||
			(
				!attackerEntity.IsMyHero &&
				!attackerEntity.IsEnemy() &&
				!this.menu.Tracker.ShowAllyHeroes.value
			)
		) {
			return
		}

		this.Units.push({
			lastCreepPos: killedEntity.Position.Clone(),
			attackerEntity,
			gameTime: GameRules?.RawGameTime!,
		})
	}

	private detectorGameEvent(killedEntity: Unit, attackerEntity: Unit): void {
		if (!this.state(this.menu.Detector)) {
			return
		}

		if (
			!killedEntity.IsNeutral
		) {
			return
		}

		const heroes: Hero[] = EntityManager.GetEntitiesByClass(Hero)
		const alliesNear: Hero[] = [] 
		
		heroes.forEach((hero: Hero): void => {
			if (
				this.localHero!.Team === hero.Team &&
				hero.Distance(killedEntity) <= 1500
			) {
				alliesNear.push(hero)
			}
		})
		
		// console.log("allies who gained xp", alliesGainedXp)

		if (alliesNear.length === 0) {
			return
		}

		const xpPerHero: number = alliesNear.map(
			(hero: Hero) => this.getXpDiff(hero)
		).filter((diff) => diff !== 0)[0] ?? 0

		console.log("xp per hero", xpPerHero)

		// xp per hero can be zero if every ally has 30 level
		if (xpPerHero === 0) {
			return
		}

		const heroesGainedXp: number = Math.floor(
			(killedEntity.XPBounty + killedEntity.XPBountyExtra) / xpPerHero
		)

		// console.log("heroes gained xp", heroesGainedXp)

		const enemiesGainedXp: number = heroesGainedXp - alliesNear.length

		// console.log("enemies gained xp", enemiesGainedXp)

		if (enemiesGainedXp <= 0) {
			return
		}

		const visibleEnemies: number = EntityManager.GetEntitiesByClass(Hero)
			.filter(
				(hero: Hero): boolean => 
					hero.IsEnemy() &&
					hero.IsVisible && 
					hero.Distance(killedEntity.Position) <= 1500
			).length

		// console.log("visible enemies", visibleEnemies)

		if (visibleEnemies === enemiesGainedXp) {
			return
		}

		// console.log("is killed creep visible", killedEntity.IsVisible)
		// console.log("entity to set particle", killedEntity.IsVisible ? killedEntity : this.localHero!)

		const particle: Particle = this.pSDK.DrawCircle(
			`Circle_${new Date().getTime()}`, 
			killedEntity,
			1500,
			{
				Color: this.menu.Detector.EnemyWarningColor.SelectedColor,
				Attachment: ParticleAttachment.PATTACH_ABSORIGIN_FOLLOW,
			},
		)

		this.Particles.push({ 
			particle: particle,
			gametime: GameRules?.RawGameTime!,
			enemiesCount: enemiesGainedXp,
			creepPos: killedEntity.IsVisible ? undefined : killedEntity.Position
		})
	}

	private updateAlliesXP(): void {
		if (!this.menu.State.value) {
			return
		}

		EntityManager.GetEntitiesByClass(Hero).forEach((hero: Hero): void => {
			if (hero.Team === LocalPlayer?.Hero?.Team) {
				const currXp: Nullable<number> = this.AlliesXP.get(hero.Name)
				
				if (currXp !== hero.CurrentXP) {
					this.AlliesXP.set(hero.Name, hero.CurrentXP)
				}
			}
		})
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

EventsSDK.on("Tick", () => bootstrap.Tick())

EventsSDK.on("GameEvent", (eventName: string, obj: any) => bootstrap.GameEvent(eventName, obj))

EventsSDK.on("GameEnded", () => {
	bootstrap.Units = []
	bootstrap.Particles = []
	bootstrap.AlliesXP.clear()
})
