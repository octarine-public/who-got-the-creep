import "../translations"

import {
	Color,
	DOTAGameState,
	EntityManager,
	EventsSDK,
	GameRules,
	GUIInfo,
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
	private readonly menu = new MenuManager()
	public units: {
		lastCreepPos: Vector3
		attackerEntity: Unit
		gameTime: number
	}[] = []

	protected get State() {
		return this.menu.State.value
	}

	protected get IsPostGame() {
		return GameRules === undefined || GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
	}
	public GameEvent(eventName: string, obj: any) {
		if (!this.State) {
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

			const gameTime = GameRules?.RawGameTime ?? 0
			this.units.push({
				lastCreepPos: killedEntity.Position.Clone(),
				attackerEntity,
				gameTime
			})
		}
	}
	protected ShouldAttackOutcome(eventName: string, obj: any): obj is AttackOutcome {
		return (
			eventName === "entity_killed" &&
			typeof obj.entindex_killed === "number" &&
			typeof obj.entindex_attacker === "number"
		)
	}
	public Tick() {
		if (!this.State || this.IsPostGame || !GameRules?.RawGameTime) {
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

	public Draw() {
		if (!this.State || this.IsPostGame) {
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
})()

EventsSDK.on("Draw", () => bootstrap.Draw())
EventsSDK.on("Tick", () => bootstrap.Tick())
EventsSDK.on("GameEvent", (eventName: string, obj: any) => bootstrap.GameEvent(eventName, obj))
EventsSDK.on("GameEnded", () => {
	bootstrap.units = []
})
