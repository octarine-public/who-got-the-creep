import { Color, GUIInfo, RendererSDK, Vector2 } from "github.com/octarine-public/wrapper/index"

import { TrackerMenu } from "../menu/tracker"
import { Storage } from "../storage/storage"
import { BaseGUI } from "./base"

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

		this.drawHeroesIcons(params.gametime)
		this.destroyOldHeroesIcons(params.gametime)
	}

	private drawHeroesIcons(gametime: number): void {
		Storage.Units.forEach(unit => {
			const creepPos = unit.lastCreepPos
			const w2sPosition = RendererSDK.WorldToScreen(creepPos)
			if (w2sPosition !== undefined) {
				const size = GUIInfo.ScaleWidth(this.menu.Size.value)
				const heroSize = new Vector2(size, size)
				const position = w2sPosition.Subtract(heroSize.DivideScalar(2))
				let alpha = this.menu.Opactity.value * 2.55

				if (this.menu.Animation.value) {
					const elapsed = Math.max(gametime - unit.gameTime, 0)
					position.SubtractScalarY(GUIInfo.ScaleHeight(60) * elapsed)

					const fadeTime = 0.5
					const timeLeft = this.menu.TimeToShow.value - elapsed
					if (timeLeft < fadeTime) {
						alpha *= Math.max(timeLeft, 0) / fadeTime
					}
				}

				RendererSDK.Image(
					`panorama/images/heroes/icons/${unit.attackerEntity.Name}_png.vtex_c`,
					position,
					-1,
					heroSize,
					Color.White.SetA(alpha)
				)
			}
		})
	}

	private destroyOldHeroesIcons(gametime: number): void {
		if (!Storage.Units.length) {
			return
		}

		const unitCreated = Storage.Units[0].gameTime

		if (unitCreated + this.menu.TimeToShow.value < gametime) {
			Storage.Units.shift()
		}
	}
}
