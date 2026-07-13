import { Color, GUIInfo, RendererSDK, Vector2 } from "github.com/octarine-public/wrapper/index"

import { TrackerMenu } from "../menu/tracker"
import { CreepData, Storage } from "../storage/storage"
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
				const size = GUIInfo.ScaleWidth(
					unit.isBigKill ? this.menu.BigKillsSize.value : this.menu.Size.value
				)
				const heroSize = new Vector2(size, size)
				const position = w2sPosition.Subtract(heroSize.DivideScalar(2))
				let alpha = this.menu.Opactity.value * 2.55

				if (this.menu.Animation.value) {
					const elapsed = Math.max(gametime - unit.gameTime, 0)
					position.SubtractScalarY(GUIInfo.ScaleHeight(60) * elapsed)

					const fadeTime = 0.5
					const timeLeft = this.showTime(unit) - elapsed
					if (timeLeft < fadeTime) {
						alpha *= Math.max(timeLeft, 0) / fadeTime
					}
				}

				const iconPath = `panorama/images/heroes/icons/${unit.attackerEntity.Name}_png.vtex_c`

				if (unit.isBigKill) {
					const padding = GUIInfo.ScaleWidth(4)
					RendererSDK.FilledCircle(
						position.SubtractScalar(padding),
						heroSize.AddScalar(padding * 2),
						unit.attackerEntity.Color.Clone().SetA(alpha)
					)
					RendererSDK.Image(iconPath, position, 0, heroSize, Color.White.SetA(alpha))
				} else {
					RendererSDK.Image(iconPath, position, -1, heroSize, Color.White.SetA(alpha))
				}
			}
		})
	}

	private destroyOldHeroesIcons(gametime: number): void {
		for (let i = Storage.Units.length - 1; i > -1; i--) {
			const unit = Storage.Units[i]
			if (unit.gameTime + this.showTime(unit) < gametime) {
				Storage.Units.splice(i, 1)
			}
		}
	}

	private showTime(unit: CreepData): number {
		return unit.isBigKill ? this.menu.BigKillsTimeToShow.value : this.menu.TimeToShow.value
	}
}
