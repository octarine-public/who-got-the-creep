import { canvas } from "../../render"
import { PortraitPose, PosePortrait } from "../animation"
import { TrackerMenu } from "../menu/tracker"
import { LastHitModel } from "../model"

/** How far the drop shadow reaches out from the portrait, as a fraction of its diameter. */
const SHADOW_FRACTION = 0.1
/** The shadow's reach in px at the smallest the portrait gets. */
const SHADOW_MIN = 2
/** The countdown ring's width in px at 1080p. */
const RING_WIDTH = 2

/**
 * The portrait of whoever took the last hit, over the spot the unit died at: a round portrait
 * on the shadow a buff icon wears, moving as the chosen animation says and fading as its time
 * runs out. A kind that asks for it rims the portrait with the taker's player colour, running
 * down with the time left.
 */
export class TrackerGUI {
	/** Reused every frame: the pose is read at once and nothing of it is kept. */
	private readonly pose: PortraitPose = { shift: new Vector2(), scale: 1, opacity: 1 }

	constructor(private readonly menu: TrackerMenu) {}

	public Draw(units: LastHitModel[], gameTime: number): void {
		for (let index = units.length - 1; index > -1; index--) {
			this.drawUnit(units[index], gameTime)
		}
	}

	private drawUnit(unit: LastHitModel, gameTime: number): void {
		const screen = RendererSDK.WorldToScreen(unit.Position)
		if (screen === undefined) {
			return
		}
		const menu = this.menu
		const kind = menu.Kind(unit.Kind)
		const showTime = kind.TimeToShow.value
		const elapsed = unit.Elapsed(gameTime)
		const pose = this.pose
		PosePortrait(menu.Animation.SelectedID, elapsed, showTime, pose)
		const size = Math.round(GUIInfo.ScaleHeight(kind.Size.value) * pose.scale)
		const opacity = (menu.Opacity.value / 100) * pose.opacity
		if (size <= 0 || opacity <= 0) {
			return
		}
		const position = screen
			.AddForThis(pose.shift.MultiplyScalarForThis(GUIInfo.ScaleHeight(1)))
			.SubtractScalarForThis(size / 2)
			.RoundForThis()
		if (this.containsHUD(position)) {
			return
		}
		canvas.CircleTimer(position, size, {
			texture: unit.Texture,
			progress: kind.Ring.value ? 1 - elapsed / showTime : 0,
			color: unit.Color,
			ringWidth: Math.max(1, Math.round(GUIInfo.ScaleHeight(RING_WIDTH))),
			shadow: Math.max(Math.round(size * SHADOW_FRACTION), SHADOW_MIN),
			opacity
		})
	}

	private containsHUD(position: Vector2): boolean {
		return GUIInfo.ContainsShop(position) || GUIInfo.ContainsMiniMap(position) || GUIInfo.ContainsScoreboard(position)
	}
}
