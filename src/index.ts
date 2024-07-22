import "../translations"

import {
	Color,
	DOTAGameState,
	EntityManager,
	EventsSDK,
	GameRules,
	GUIInfo,
	Hero,
	LocalPlayer,
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

const bootstrap = new (class CWhoGotCreep {
	constructor() {
		this.menu.MenuChanged(() => {})
	}

	public units: {
		lastCreepPos: Vector3
		attackerEntity: Unit
		gameTime: number
		enemiesAround: number
	}[] = []
	public teammatesXP = new Map<string, number>()

	private readonly pSDK = new ParticlesSDK()
	private readonly sleeper = new Sleeper()
	private readonly menu = new MenuManager(this.sleeper)
	private readonly tracker: TrackerMenu = this.menu.Tracker
	private readonly detector: DetectorMenu = this.menu.Detector

	public GameEvent(eventName: string, obj: any): void {
		const gameTime = GameRules?.RawGameTime ?? 0
		if (
			(!this.State(this.tracker) && !this.State(this.detector)) ||
			gameTime > this.tracker.disibleMin.value * 60
		) {
			return
		}

		if (!this.ShouldAttackOutcome(eventName, obj)) {
			return
		}
		const [killedEntity, attackerEntity] = [
			EntityManager.EntityByIndex(obj.entindex_killed),
			EntityManager.EntityByIndex(obj.entindex_attacker)
		]

		if (
			killedEntity instanceof Unit &&
			killedEntity.IsCreep &&
			attackerEntity instanceof Unit &&
			attackerEntity.IsHero
		) {
			if (
				(!killedEntity.IsEnemy(attackerEntity) && !this.tracker.showAllyCreeps.value) ||
				(!attackerEntity.IsMyHero && !attackerEntity.IsEnemy() && !this.tracker.showAllyHeroes.value)
			) {
				return
			}

			const localHero: Nullable<Hero> = LocalPlayer?.Hero
			if (!localHero) {
				return
			}

			const xpPerHero: number = localHero.CurrentXP! - this.teammatesXP.get(localHero.Name!)!

			let heroesGainedXp: number = Math.floor(
				(killedEntity.XPBounty + killedEntity.XPBountyExtra) / xpPerHero
			) 
			let alliesGainedXp: number = 0

			EntityManager.GetEntitiesByClass(Hero).forEach((hero: Hero): void => {
				if (
					(hero.CurrentXP !== this.teammatesXP.get(hero.Name) || hero.Level === 30) &&
					localHero.Team === hero.Team &&
					hero.Distance(killedEntity) <= 1500
				) {
					alliesGainedXp++
				}
			})

			console.log("NEW CREEP DEATH RECEIVED")
			console.log("heroes gained xp", heroesGainedXp)
			console.log("allies gained xp", alliesGainedXp)
			console.log("enemies gained xp", heroesGainedXp - alliesGainedXp)
			console.log("creep:", killedEntity.Name, "bounty", killedEntity.XPBounty, "extra bounty", killedEntity.XPBountyExtra)

			EntityManager.GetEntitiesByClass(Hero).forEach((hero: Hero): void => {
				const prevXp: number = this.teammatesXP.get(hero.Name) ?? 0
				const currXp: number = hero.CurrentXP

				console.log("name:", hero.Name, "prev xp:", prevXp, "curr xp:", currXp, "xp diff:", currXp - prevXp)
			})

			this.units.push({
				lastCreepPos: killedEntity.Position.Clone(),
				attackerEntity,
				gameTime,
				enemiesAround: heroesGainedXp - alliesGainedXp
			})
		}
	}

	public Tick() {
		EntityManager.GetEntitiesByClass(Hero).forEach((hero: Hero): void => {
			if (hero.Team === LocalPlayer?.Hero?.Team) {
				const currXp: Nullable<number> = this.teammatesXP.get(hero.Name)
				
				if (currXp !== hero.CurrentXP) {
					this.teammatesXP.set(hero.Name, hero.CurrentXP)
				}
			}
		})

		const targetMenu: TrackerMenu = this.menu.Tracker

		if (!this.State(targetMenu) || this.IsPostGame || !GameRules?.RawGameTime) {
			return
		}
		if (!this.units.length) {
			return
		}

		const gameTime = this.units[0].gameTime

		if (gameTime + targetMenu.timeToShow.value < GameRules?.RawGameTime) {
			this.units.shift()
		}
	}

	public Draw(): void {
		if (!this.State(this.tracker) || this.IsPostGame) {
			return
		}

		this.units.forEach(unit => {
			const creepPos = unit.lastCreepPos
			const w2sPosition = RendererSDK.WorldToScreen(creepPos)
			if (w2sPosition !== undefined) {
				const size = GUIInfo.ScaleWidth(this.tracker.size.value)
				const heroSize = new Vector2(size, size)
				const position = w2sPosition.Subtract(heroSize.DivideScalar(2))
				RendererSDK.Image(
					`panorama/images/heroes/icons/${unit.attackerEntity.Name}_png.vtex_c`,
					position,
					-1,
					heroSize,
					Color.White.SetA(this.tracker.opactity.value * 2.55)
				)

				if (unit.enemiesAround !== 0) {
					const localHero: Hero = LocalPlayer?.Hero!
					const key: string = `WarningCircle_${new Date().toISOString()}`

					this.pSDK.DrawCircle(key, localHero, 1500, { Color: Color.Red })
					this.sleeper.Sleep(5000, new Date().toISOString())
					this.pSDK.DestroyByKey(key)
				}
			}
		})
	}

	protected ShouldAttackOutcome(eventName: string, obj: any): obj is AttackOutcome {
		return (
			eventName === "entity_killed" &&
			typeof obj.entindex_killed === "number" &&
			typeof obj.entindex_attacker === "number"
		)
	}

	protected State(menu: BaseMenu): boolean {
		return menu.State.value
	}

	protected get IsPostGame(): boolean {
		return GameRules === undefined || GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())
EventsSDK.on("Tick", () => bootstrap.Tick())
EventsSDK.on("GameEvent", (eventName: string, obj: any) => bootstrap.GameEvent(eventName, obj))
EventsSDK.on("GameEnded", () => {
	bootstrap.units = []
	bootstrap.teammatesXP.clear()
})
