import { Color, GUIInfo, RendererSDK, Vector2 } from "github.com/octarine-public/wrapper/index"
import { CreepData } from ".."
import { TrackerMenu } from "../menu/tracker"
import { BaseGUI } from "./base"

interface DrawParams {
	units: CreepData[]
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

		this.drawHeroesIcons(params.units)
		this.destroyOldHeroesIcons(params.units, params.gametime)
	}

	private drawHeroesIcons(units: CreepData[]): void {
		units.forEach(unit => {
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

	private destroyOldHeroesIcons(units: CreepData[], gametime: number): void {
		if (!units.length) {
			return
		}

		const gameTime = units[0].gameTime

		if ((gameTime + this.menu.TimeToShow.value) < gameTime) {
			units.shift()
		}
	}
}