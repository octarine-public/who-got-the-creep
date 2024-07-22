import "../translations"

import {
	Color,
	DOTAGameState,
	Entity,
	EntityManager,
	EventsSDK,
	GameRules,
	GUIInfo,
	Hero,
	LocalPlayer,
	Particle,
	ParticleAttachment,
	ParticlesSDK,
	RendererSDK,
	Sleeper,
	Unit,
	Vector2,
	Vector3
} from "github.com/octarine-public/wrapper/wrapper/Imports"

import { MenuManager } from "./menu/index"
import { BaseMenu } from "./menu/base"
import { TrackerMenu } from "./menu/tracker"
import { DetectorMenu } from "./menu/detector"

interface AttackOutcome {
	entindex_killed: number
	entindex_attacker: number
}

interface CreepData {
	lastCreepPos: Vector3
	attackerEntity: Unit
	gameTime: number
}

const bootstrap = new (class CWhoGotCreep {
	constructor() {
		this.menu.MenuChanged(() => {})
	}

	public Units: CreepData[] = []
	public Particles: { particle: Particle, destroyAt: Date }[] = []
	public readonly AlliesXP = new Map<string, number>()

	private readonly pSDK = new ParticlesSDK()
	private readonly sleeper = new Sleeper()
	private readonly menu = new MenuManager(this.sleeper)
	private readonly tracker: TrackerMenu = this.menu.Tracker
	private readonly detector: DetectorMenu = this.menu.Detector

	public GameEvent(eventName: string, obj: any): void {
		const gameTime = GameRules?.RawGameTime ?? 0

		if (
			!this.State(this.detector) &&
			(!this.State(this.tracker) && 
				this.tracker.DisibleMin.value * 60 > gameTime)
		) {

		}

		if (!this.ShouldAttackOutcome(eventName, obj)) {
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

		if (
			this.State(this.tracker) && (
				(
					!killedEntity.IsEnemy(attackerEntity) &&
					!this.tracker.ShowAllyCreeps.value
				) ||
				(
					!attackerEntity.IsMyHero &&
					!attackerEntity.IsEnemy() &&
					!this.tracker.ShowAllyHeroes.value
				)
			)
		) {
			this.Units.push({
				lastCreepPos: killedEntity.Position.Clone(),
				attackerEntity,
				gameTime,
			})
		}

		this.DetectorGameEvent(killedEntity, attackerEntity)
	}

	public Tick() {
		EntityManager.GetEntitiesByClass(Hero).forEach((hero: Hero): void => {
			if (hero.Team === LocalPlayer?.Hero?.Team) {
				const currXp: Nullable<number> = this.AlliesXP.get(hero.Name)
				
				if (currXp !== hero.CurrentXP) {
					this.AlliesXP.set(hero.Name, hero.CurrentXP)
				}
			}
		})

		const targetMenu: TrackerMenu = this.menu.Tracker

		if (
			!this.State(targetMenu) ||
			this.IsPostGame ||
			!GameRules?.RawGameTime
		) {
			return
		}
		if (!this.Units.length) {
			return
		}

		const gameTime = this.Units[0].gameTime

		if (gameTime + targetMenu.TimeToShow.value < GameRules?.RawGameTime) {
			this.Units.shift()
		}
	}

	public Draw(): void {
		const particle = this.Particles.at(0)

		if (
			particle !== undefined &&
			particle.destroyAt < new Date()
		) {
			particle.particle.Destroy()
			this.Particles.shift()
		}

		if (!this.State(this.tracker) || this.IsPostGame) {
			return
		}

		this.Units.forEach(unit => {
			const creepPos = unit.lastCreepPos
			const w2sPosition = RendererSDK.WorldToScreen(creepPos)
			if (w2sPosition !== undefined) {
				const size = GUIInfo.ScaleWidth(this.tracker.Size.value)
				const heroSize = new Vector2(size, size)
				const position = w2sPosition.Subtract(heroSize.DivideScalar(2))
				RendererSDK.Image(
					`panorama/images/heroes/icons/${unit.attackerEntity.Name}_png.vtex_c`,
					position,
					-1,
					heroSize,
					Color.White.SetA(this.tracker.Opactity.value * 2.55)
				)
			}
		})
	}

	private get IsPostGame(): boolean {
		return ( 
			GameRules === undefined || 
			GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
		)
	}

	private get LocalHero(): Nullable<Hero> {
		return LocalPlayer?.Hero
	}

	private State(menu: BaseMenu): boolean {
		return menu.State.value
	}

	private GetXpDiff(hero: Hero): number {
		return hero.CurrentXP - this.AlliesXP.get(hero.Name)!
	}

	private ShouldAttackOutcome(eventName: string, obj: any): obj is AttackOutcome {
		return (
			eventName === "entity_killed" &&
			typeof obj.entindex_killed === "number" &&
			typeof obj.entindex_attacker === "number"
		)
	}

	private DetectorGameEvent(killedEntity: Unit, attackerEntity: Unit): void {
		if (
			!this.State(this.detector) ||
			!killedEntity.IsNeutral ||
			(
				!attackerEntity.IsMyHero &&
				!attackerEntity.IsEnemy() &&
				!this.detector.ShowAllyHeroes.value
			)
		) {
			return
		}

		const heroes: Hero[] = EntityManager.GetEntitiesByClass(Hero)
		const alliesGainedXp: Hero[] = [] 
		
		heroes.forEach((hero: Hero): void => {
			if (
				this.LocalHero!.Team === hero.Team &&
				hero.Distance(killedEntity) <= 1500
			) {
				alliesGainedXp.push(hero)
			}
		})

		if (alliesGainedXp.length === 0) {
			return
		}

		const xpPerHero: number = this.GetXpDiff(alliesGainedXp[0]!)
		const heroesGainedXp: number = Math.floor(
			(killedEntity.XPBounty + killedEntity.XPBountyExtra) / xpPerHero
		)
		const enemiesGainedXp: number = heroesGainedXp - alliesGainedXp.length

		if (enemiesGainedXp <= 0) {
			return
		}

		const date = new Date()
		const particle: Particle = this.pSDK.DrawCircle(
			`Circle_${new Date().getTime()}`, 
			this.LocalHero!,
			1500,
			{
				Color: Color.Red,
				Attachment: ParticleAttachment.PATTACH_ABSORIGIN_FOLLOW 
			},
		)

		this.Particles.push({ 
			particle: particle,
			destroyAt: new Date(
				date.getTime() + 2000
			)
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
