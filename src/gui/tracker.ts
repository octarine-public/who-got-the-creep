import { canvas } from "../../render"
import { PortraitPose, PosePortrait } from "../animation"
import { TrackerMenu } from "../menu/tracker"
import { EPlayerColor, EPortrait, LastHitModel } from "../model"

/** How far the drop shadow reaches out from the portrait, as a fraction of its diameter. */
const SHADOW_FRACTION = 0.1
/** The shadow's reach in px at the smallest the portrait gets. */
const SHADOW_MIN = 2
/** The countdown ring's width in px at 1080p. */
const RING_WIDTH = 2

/**
 * The portrait of whoever took the last hit, over the spot the unit died at: a round portrait
 * on the shadow a buff icon wears, or the bare hero image, whose rim that shadow would outline,
 * moving as the chosen animation says and fading as its time runs out. A kind that asks for it
 * wears the taker's colour, their player colour or green / red by side: as a ring on the rim running down with the time left, or as
 * a disc filled behind the portrait with that shadow glowing around it.
 */
export class TrackerGUI {
	/** Reused every frame: the pose is read at once and nothing of it is kept. */
	private readonly pose: PortraitPose = { shift: new Vector2(), scale: 1, opacity: 1 }
	/** The backdrop disc's size, reused every frame. */
	private readonly box = new Vector2()
	/** The backdrop's colour at the portrait's opacity, reused every frame. */
	private readonly backdropColor = new Color()

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
		const portrait = menu.Portrait.SelectedID
		const playerColor = kind.PlayerColor.SelectedID
		const backdrop = playerColor === EPlayerColor.Backdrop
		const color = unit.PaintColor(kind.Colors.SelectedID)
		const shadowed = backdrop || portrait !== EPortrait.HeroImage
		if (backdrop) {
			// the timer only glows around the rim: the backdrop itself is a disc under the portrait
			this.box.x = this.box.y = size
			canvas.Circle(position, this.box, { color: this.faded(color, opacity) })
		}
		canvas.CircleTimer(position, size, {
			texture: unit.Texture(portrait),
			progress: playerColor === EPlayerColor.Ring ? 1 - elapsed / showTime : 0,
			color,
			ringWidth: Math.max(1, Math.round(GUIInfo.ScaleHeight(RING_WIDTH))),
			shadow: shadowed ? Math.max(Math.round(size * SHADOW_FRACTION), SHADOW_MIN) : 0,
			shadowColor: backdrop ? color : undefined,
			innerShadow: false,
			opacity
		})
	}

	private faded(color: Color, opacity: number): Color {
		return this.backdropColor.CopyFrom(color).SetA(Math.round(color.a * opacity))
	}

	private containsHUD(position: Vector2): boolean {
		return GUIInfo.ContainsShop(position) || GUIInfo.ContainsMiniMap(position) || GUIInfo.ContainsScoreboard(position)
	}
}
