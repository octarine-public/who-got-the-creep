import "./Translate"

import {
	Color,
	EntityManager,
	EventsSDK,
	GameRules,
	LocalPlayer,
	Menu,
	RendererSDK,
	Vector2
} from "github.com/octarine-public/wrapper/index"

const Entry = Menu.AddEntry("Visual")
const WhoLastHitMenu = Entry.AddNode(
	"Who Last Hit",
	"panorama/images/hud/reborn/icon_magic_resist_psd.vtex_c",
	"Shows who last hit the creep"
)
const StateToggle = WhoLastHitMenu.AddToggle("State")
const SizeSlider = WhoLastHitMenu.AddSlider("Size", 28, 25, 50)
const OpactitySlider = WhoLastHitMenu.AddSlider("Opacity", 85, 40, 100)
const DisibleMinutesSlider = WhoLastHitMenu.AddSlider("Disable after N minutes", 15, 5, 60)
const TimeToShow = WhoLastHitMenu.AddSlider("How much to show sec", 2, 1, 5)

EventsSDK.on("GameEvent", (eventName: string, obj: any) => {
	const gameTime = GameRules?.RawGameTime ?? 0
	if (!StateToggle.value || gameTime / 60 > DisibleMinutesSlider.value) {
		return
	}

	if (eventName === "entity_killed") {
		checkEntity(obj)
	}
})
let arrayHeroes: any[] = []

function checkEntity(obj: any): void {
	const [KilledEntity, AttackerEntity] = [
		EntityManager.EntityByIndex(obj.entindex_killed),
		EntityManager.EntityByIndex(obj.entindex_attacker)
	]

	const MyHero = LocalPlayer?.Hero

	if (MyHero === undefined) {
		return
	}

	if (AttackerEntity === MyHero) {
		return
	}

	if (KilledEntity === undefined && AttackerEntity === undefined) {
		return
	}

	if (!KilledEntity?.Name_.startsWith("npc_dota_creep")) {
		return
	}

	if (MyHero.IsAlive && KilledEntity?.Distance(MyHero.Position) > 2000) {
		return
	}

	if (!AttackerEntity?.IsHero) {
		return
	}

	if (AttackerEntity.IsEnemy(KilledEntity)) {
		const gameTime = GameRules?.RawGameTime
		arrayHeroes.push({ entity: KilledEntity, ally: AttackerEntity, time: gameTime })
	}
}

EventsSDK.on("Tick", () => {
	for (let i = 0; i < arrayHeroes.length; i++) {
		if (GameRules?.RawGameTime === undefined) {
			return
		}

		if (arrayHeroes[i].time + TimeToShow.value < GameRules?.RawGameTime) {
			arrayHeroes.splice(i, 1)
		}
	}
})

EventsSDK.on("Draw", () => {
	if (arrayHeroes.length === 0) {
		return
	}
	for (const value of arrayHeroes) {
		const w2sPosition = RendererSDK.WorldToScreen(value.entity.VisualPosition)
		const vectorSize = new Vector2(SizeSlider.value, SizeSlider.value)

		if (w2sPosition === undefined) {
			continue
		}

		const position = w2sPosition.Subtract(vectorSize.DivideScalar(2))
		RendererSDK.Image(
			`panorama/images/heroes/icons/${value.ally.Name}_png.vtex_c`,
			position,
			0,
			vectorSize,
			new Color(255, 255, 255, OpactitySlider.value * 2.55)
		)
	}
})

EventsSDK.on("GameEnded", () => {
	arrayHeroes = []
})
