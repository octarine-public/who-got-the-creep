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
	RendererSDK,
	Unit,
	Vector2,
	Vector3
} from "github.com/octarine-public/wrapper/wrapper/Imports"

import { MenuManager } from "./menu/index"

interface AttackOutcome {
	entindex_killed: number
	entindex_attacker: number
}

const bootstrap = new (class CWhoGotCreep {
	constructor() {
		this.menu.getTeammatesXp.OnPressed(() => this.GetTeammatesXp()) 
	}

	public units: {
		lastCreepPos: Vector3
		attackerEntity: Unit
		gameTime: number
	}[] = []
	public teammatesXP = new Map<string, number>()

	private readonly menu = new MenuManager()

	public GetTeammatesXp(): void {
		console.log(this.teammatesXP)
	}

	public GameEvent(eventName: string, obj: any): void {
		const gameTime = GameRules?.RawGameTime ?? 0
		if (!this.WhoGotTheCreepState || gameTime > this.menu.disibleMin.value * 60) {
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
				(!killedEntity.IsEnemy(attackerEntity) && !this.menu.showAllyCreeps.value) ||
				(!attackerEntity.IsMyHero && !attackerEntity.IsEnemy() && !this.menu.showAllyHeroes.value)
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

			console.log("heroes gained xp", heroesGainedXp)
			console.log("allies gained xp", alliesGainedXp)
			console.log("enemies gained xp", heroesGainedXp - alliesGainedXp)

			if ((heroesGainedXp - alliesGainedXp) > 0) {
				const w2sPosition = RendererSDK.WorldToScreen(localHero.Position)

				if (w2sPosition) {
					RendererSDK.OutlinedCircle(
						w2sPosition,
						new Vector2(1500, 1500),
						Color.Red
					)	
				}
			}

			const heroes: Hero[] = EntityManager.GetEntitiesByClass(Hero)

			console.log("creep:", killedEntity.Name, "bounty", killedEntity.XPBounty, "extra bounty", killedEntity.XPBountyExtra)

			heroes.filter((hero) => hero.IsAlive).forEach((hero: Hero): void => {
				console.log(
					"name:",
					hero.Name,
					"distance:",
					killedEntity.Position.Distance(hero.Position),
					"xp:",
					hero.CurrentXP,
					"old xp:",
					this.teammatesXP.get(hero.Name),
					"gain:",
					hero.CurrentXP - this.teammatesXP.get(hero.Name)!
				)
			})

			this.units.push({
				lastCreepPos: killedEntity.Position.Clone(),
				attackerEntity,
				gameTime
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

		if (!this.WhoGotTheCreepState || this.IsPostGame || !GameRules?.RawGameTime) {
			return
		}
		if (!this.units.length) {
			return
		}

		const gameTime = this.units[0].gameTime

		if (gameTime + this.menu.timeToShow.value < GameRules?.RawGameTime) {
			this.units.shift()
		}
	}

	public Draw(): void {
		if (!this.WhoGotTheCreepState || this.IsPostGame) {
			return
		}

		this.units.forEach(unit => {
			const creepPos = unit.lastCreepPos
			const w2sPosition = RendererSDK.WorldToScreen(creepPos)
			if (w2sPosition !== undefined) {
				const size = GUIInfo.ScaleWidth(this.menu.size.value)
				const heroSize = new Vector2(size, size)
				const position = w2sPosition.Subtract(heroSize.DivideScalar(2))
				RendererSDK.Image(
					`panorama/images/heroes/icons/${unit.attackerEntity.Name}_png.vtex_c`,
					position,
					-1,
					heroSize,
					Color.White.SetA(this.menu.opactity.value * 2.55)
				)
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

	protected get WhoGotTheCreepState(): boolean {
		return this.menu.WhoGotTheCreepState.value
	}

	protected get XpESPState(): boolean {
		return this.menu.XpESPState.value
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
