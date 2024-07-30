import { Color, GUIInfo, RendererSDK, Vector2 } from "github.com/octarine-public/wrapper/index"
import { TrackerMenu } from "../menu/tracker"
import { BaseGUI } from "./base"
import { Storage } from "../storage/storage"

interface DrawParams {
	isPostGame: boolean
	gametime: number
}

export class TrackerGUI extends BaseGUI<DrawParams, TrackerMenu> {
	constructor(menu: TrackerMenu) {
		super(menu)
	}

	public Draw(params: DrawParams): void {
		if (!super.State(this.menu) || params.isPostGame) {
			return
		}

		this.drawHeroesIcons()
		this.destroyOldHeroesIcons(params.gametime)
	}

	private drawHeroesIcons(): void {
		Storage.Units.forEach(unit => {
			const creepPos = unit.lastCreepPos
			const w2sPosition = RendererSDK.WorldToScreen(creepPos)
			if (w2sPosition !== undefined) {
				const size = GUIInfo.ScaleWidth(this.menu.Size.value)
				const heroSize = new Vector2(size, size)
				const position = w2sPosition.Subtract(heroSize.DivideScalar(2))
				
				RendererSDK.Image(
					`panorama/images/heroes/icons/${unit.attackerEntity.Name}_png.vtex_c`,
					position,
					-1,
					heroSize,
					Color.White.SetA(this.menu.Opactity.value * 2.55)
				)
			}
		})
	}

	private destroyOldHeroesIcons(gametime: number): void {
		if (!Storage.Units.length) {
			return
		}

		const unitCreated = Storage.Units[0].gameTime

		if ((unitCreated + this.menu.TimeToShow.value) < gametime) {
			Storage.Units.shift()
		}
	}
}