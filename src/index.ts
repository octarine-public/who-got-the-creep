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
	public currentXP: number = LocalPlayer?.Hero ? LocalPlayer.Hero.CurrentXP : 0
	public units: {
		lastCreepPos: Vector3
		attackerEntity: Unit
		gameTime: number
	}[] = []
	
	private readonly menu = new MenuManager()

	public GameEvent(eventName: string, obj: any) {
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

			console.log(EntityManager.GetEntitiesByClass(Hero).length)

			this.units.push({
				lastCreepPos: killedEntity.Position.Clone(),
				attackerEntity,
				gameTime
			})
		}
	}

	public Tick() {
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
	bootstrap.currentXP = 0
})
