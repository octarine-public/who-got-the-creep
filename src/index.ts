import "./translations"

import { XpDetector } from "./detector"
import { MenuManager } from "./menu/index"
import { LastHitTracker } from "./tracker"

new (class CLastHitESP {
	private readonly menu = new MenuManager()
	private readonly tracker = new LastHitTracker(this.menu.Tracker)
	private readonly detector = new XpDetector(this.menu.Detector)

	constructor() {
		EventsSDK.on("Draw", this.Draw.bind(this))
		EventsSDK.on("GameEvent", this.GameEvent.bind(this))
		EventsSDK.on("PostDataUpdate", this.PostDataUpdate.bind(this))
		EventsSDK.on("GameEnded", this.GameEnded.bind(this))
	}

	private get isPostGame() {
		return (
			Dota2SDK.GameRules === undefined || Dota2SDK.GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
		)
	}
	private get shouldDraw() {
		return this.menu.State.value && !this.isPostGame && GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
	}

	protected Draw(): void {
		const localHero = LocalPlayer?.Hero
		if (!this.shouldDraw || localHero === undefined) {
			return
		}
		const gameTime = GameState.RawGameTime
		this.tracker.Draw(gameTime)
		this.detector.Draw(localHero, gameTime)
	}

	protected PostDataUpdate(): void {
		const localHero = LocalPlayer?.Hero
		if (this.menu.State.value && localHero !== undefined) {
			this.detector.PostDataUpdate(localHero)
		}
	}

	protected GameEvent(eventName: string, event: IEntityKilledEvent): void {
		if (!this.menu.State.value || eventName !== "entity_killed") {
			return
		}
		const killed = EntityManager.EntityByIndex(event.entindex_killed)
		const attacker = EntityManager.EntityByIndex(event.entindex_attacker)
		if (!(killed instanceof Unit) || !(attacker instanceof Hero)) {
			return
		}
		const gameTime = GameState.RawGameTime
		this.tracker.EntityKilled(killed, attacker, gameTime)
		const localHero = LocalPlayer?.Hero
		if (localHero !== undefined) {
			this.detector.EntityKilled(killed, localHero, gameTime)
		}
	}

	protected GameEnded(): void {
		this.tracker.GameEnded()
		this.detector.GameEnded()
	}
})()
