import "../translations"

import {
	Color,
	DOTAGameState,
	EntityManager,
	EventsSDK,
	FakeUnit,
	Fountain,
	GameRules,
	GetPositionHeight,
	GUIInfo,
	Hero,
	LocalPlayer,
	MinimapSDK,
	Particle,
	ParticleAttachment,
	ParticlesSDK,
	RendererSDK,
	Sleeper,
	Unit,
	Vector2,
	Vector3
} from "github.com/octarine-public/wrapper/index"

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
	public Particles: { 
		particle: Particle
		enemiesCount: number
		gametime: number
		creepPos?: Vector3
	}[] = []
	public readonly AlliesXP = new Map<string, number>()

	private readonly pSDK = new ParticlesSDK()
	private readonly sleeper = new Sleeper()
	private readonly menu = new MenuManager(this.sleeper)
	private readonly tracker: TrackerMenu = this.menu.Tracker
	private readonly detector: DetectorMenu = this.menu.Detector

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

		console.log("creep death event, killer:", attackerEntity.Name, "distance", attackerEntity.Distance(this.localHero!))

		this.trackerGameEvent(killedEntity, attackerEntity)
		this.detectorGameEvent(killedEntity, attackerEntity)
	}

	public Tick() {
		this.updateAlliesXP()
		this.clearOldHeroesIcons()
	}

	public Draw(): void {
		this.destroyOldParticles()
		this.drawHeroesIcons()
		this.drawEnemiesCountOnHealthbar()
		this.drawDeadInvisibleCreepPos()
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
		if (!this.state(this.tracker)) {
			return
		}

		const gametime: number = GameRules?.RawGameTime ?? 0

		if (
			(
				(this.tracker.DisibleMin.value * 60) < gametime
			) ||
			(
				!killedEntity.IsEnemy(attackerEntity) &&
				!this.tracker.ShowAllyCreeps.value
			) ||
			(
				!attackerEntity.IsMyHero &&
				!attackerEntity.IsEnemy() &&
				!this.tracker.ShowAllyHeroes.value
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
		if (!this.state(this.detector)) {
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
				Color: Color.Red,
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

	private drawHeroesIcons(): void {
		if (
			!this.menu.State.value ||
			!this.state(this.tracker) ||
			this.isPostGame
		) {
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

	private drawEnemiesCountOnHealthbar(): void {
		if (!this.state(this.detector) || this.isPostGame) {
			return
		}

		this.Particles.forEach(particle => {
			const w2s: Nullable<Vector2> = RendererSDK.WorldToScreen(
				this.localHero?.VisualPosition!
			)
			if (w2s !== undefined) {
				RendererSDK.Text(
					particle.enemiesCount.toString(),
					this.getUpperCenterHealthbarPosition,
					Color.Red
				)
			}
		})
	}

	private drawDeadInvisibleCreepPos(): void {
		if (!this.state(this.detector) || this.isPostGame) {
			return
		}

		this.Particles.forEach(particle => {
			const { creepPos } = particle 

			if (creepPos) {
				const w2s: Nullable<Vector2> = RendererSDK.WorldToScreen(
					creepPos
				)
				if (w2s) {
					const size = new Vector2(50, 50)
					RendererSDK.OutlinedCircle(w2s, size, Color.Red)
				}
			}
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

	private clearOldHeroesIcons(): void {
		if (this.isPostGame || !GameRules?.RawGameTime) {
			return
		}
		if (!this.Units.length) {
			return
		}

		const gameTime = this.Units[0].gameTime

		if (gameTime + this.tracker.TimeToShow.value < GameRules?.RawGameTime) {
			this.Units.shift()
		}
	}

	private destroyOldParticles() {
		const particle = this.Particles.at(0)
		const gametime: Nullable<number> = GameRules?.RawGameTime

		if (
			gametime !== undefined &&
			particle !== undefined &&
			particle.gametime + 2 < gametime
		) {
			particle.particle.Destroy()
			this.Particles.shift()
		}
	}

	private get getUpperCenterHealthbarPosition(): Vector2 {
		let tossPos: Nullable<Vector3> = undefined
		if (this.localHero!.HasBuffByName("modifier_tiny_toss")) {
			tossPos = this.localHero!.Position
				.Clone()
				.SetZ(GetPositionHeight(this.localHero!.Position))
		}
		const hbSize: Vector2 = this.localHero!.HealthBarSize
			.DivideScalarX(2)
			.MultiplyScalarY(3)

		return this.localHero!
			.HealthBarPosition(true, tossPos)!
			.AddScalarX(hbSize.x)
			.SubtractScalarY(hbSize.y)
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
