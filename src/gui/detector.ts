import { canvas } from "../../render"
import { DetectorMenu } from "../menu/detector"
import { WarningModel } from "../model"

/** The ring over a camp that died out of sight: its diameter and stroke, in px at 1080p. */
const MARK_SIZE = 50
const MARK_WIDTH = 2
/** The count over the health bar: its size and the room it keeps from the bar, in px at 1080p. */
const TEXT_SIZE = 14
const TEXT_GAP = 4
/** The box the count is centred in, as a share of its size: the line box RmlUi lays out. */
const TEXT_BOX = 1.3
/** The game drops the health bar by this much under a visual shield. */
const SHIELD_OFFSET = 5
/** A warning fades out over this many seconds at the end of its time. */
const FADE_TIME = 0.5

/**
 * What the detector says on screen: how many unseen enemies fed on the last neutral, written
 * over your own health bar in the warning colour, and a ring where a neutral died out of sight.
 * The radius itself is a world particle and needs no painting here.
 */
export class DetectorGUI {
	private readonly box = new Rectangle()

	constructor(private readonly menu: DetectorMenu) {}

	public Draw(warnings: WarningModel[], localHero: Hero, gameTime: number, lifetime: number): void {
		let count = 0
		let alpha = 0
		for (let index = warnings.length - 1; index > -1; index--) {
			const warning = warnings[index]
			const fade = Math.clamp(warning.TimeLeft(gameTime, lifetime) / FADE_TIME, 0, 1)
			count = Math.max(count, warning.EnemiesCount)
			alpha = Math.max(alpha, fade)
			if (warning.CreepPosition !== undefined) {
				this.drawCampMark(warning.CreepPosition, fade)
			}
		}
		if (count > 0) {
			this.drawEnemiesCount(localHero, count, alpha)
		}
	}

	private drawEnemiesCount(hero: Hero, count: number, alpha: number): void {
		const bar = this.healthBarPosition(hero)
		if (bar === undefined) {
			return
		}
		const size = Math.round(GUIInfo.ScaleHeight(TEXT_SIZE))
		const height = Math.round(size * TEXT_BOX)
		const bottom = Math.round(bar.y - GUIInfo.ScaleHeight(TEXT_GAP))
		this.box.pos1.SetVector(Math.round(bar.x), bottom - height)
		this.box.pos2.SetVector(Math.round(bar.x + hero.HealthBarSize.x), bottom)
		canvas.TextIn(`${count}`, this.box, {
			color: this.faded(this.menu.EnemyWarningColor.SelectedColor, alpha),
			size,
			weight: MenuSDK.HudBold,
			outline: true,
			flags: TextFlags.Center
		})
	}

	private drawCampMark(position: Vector3, alpha: number): void {
		const screen = RendererSDK.WorldToScreen(position)
		if (screen === undefined) {
			return
		}
		const size = Math.round(GUIInfo.ScaleHeight(MARK_SIZE))
		canvas.Circle(screen.SubtractScalar(size / 2).RoundForThis(), new Vector2(size, size), {
			color: Color.fromUint32(0),
			borderColor: this.faded(this.menu.KilledCreepColor.SelectedColor, alpha),
			borderWidth: Math.max(1, Math.round(GUIInfo.ScaleHeight(MARK_WIDTH)))
		})
	}

	/** The bar's top-left corner as the game lays it, held over the ground while tossed. */
	private healthBarPosition(hero: Hero): Nullable<Vector2> {
		const origin = hero.Position.Clone()
		if (hero.HasBuffByName("modifier_tiny_toss")) {
			origin.SetZ(Dota2SDK.GetPositionHeight(origin))
		}
		const screen = RendererSDK.WorldToScreen(origin.AddScalarZ(hero.HealthBarOffset))
		if (screen === undefined) {
			return undefined
		}
		if (hero.HasVisualShield) {
			screen.AddScalarY(SHIELD_OFFSET)
		}
		return screen.SubtractForThis(hero.HealthBarPositionCorrection)
	}

	private faded(color: Color, alpha: number): Color {
		return alpha >= 1 ? color : color.Clone().SetA(Math.round(color.a * alpha))
	}
}
