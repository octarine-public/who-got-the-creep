import { SectionMenu } from "./base"
import { LastHitIcons } from "./icons"

/**
 * The camps by one lane: the row that switches their warnings on, and behind the gear at its end
 * how many enemies must share a camp before it warns, so a duo lane's own pair stays quiet.
 */
export class LaneMenu {
	public readonly State: Menu.Toggle
	public readonly MinEnemies: Menu.Slider

	constructor(node: Menu.Node, name: string, icon: string, tooltip: string, state: boolean, minEnemies: number) {
		this.State = node.AddToggle(name, state, tooltip)
		this.State.IconPath = icon
		const settings = node.AddSubSettings(this.State, undefined, icon)
		settings.SortNodes = false
		this.MinEnemies = settings.AddSlider(
			"Min enemies",
			minEnemies,
			1,
			5,
			0,
			"Warn only when at least this many enemies\nshared the experience of the camp"
		)
		this.MinEnemies.IconPath = LastHitIcons.MinEnemies
	}
}

export class DetectorMenu extends SectionMenu {
	public readonly Top: LaneMenu
	public readonly Middle: LaneMenu
	public readonly Bottom: LaneMenu
	public readonly EnemyWarningColor: Menu.ColorPicker
	public readonly KilledCreepColor: Menu.ColorPicker

	constructor(node: Menu.Node) {
		super(
			node,
			"Xp ESP",
			LastHitIcons.Detector,
			"Shows neutrals last hit by an unseen enemy\nand warns of enemies around while you farm the jungle",
			false
		)
		this.Top = new LaneMenu(
			this.Tree,
			"Top lane camps",
			LastHitIcons.TopLane,
			"Camps nearest to the top lane",
			false,
			3
		)
		this.Middle = new LaneMenu(
			this.Tree,
			"Middle lane camps",
			LastHitIcons.MiddleLane,
			"Camps nearest to the middle lane",
			true,
			1
		)
		this.Bottom = new LaneMenu(
			this.Tree,
			"Bottom lane camps",
			LastHitIcons.BottomLane,
			"Camps nearest to the bottom lane",
			false,
			3
		)
		this.EnemyWarningColor = this.Tree.AddColorPicker("Enemy warning", Color.Red, "Radius with enemies inside")
		this.EnemyWarningColor.IconPath = LastHitIcons.Color
		this.KilledCreepColor = this.Tree.AddColorPicker(
			"Last hitted neutral",
			Color.Blue,
			"Where the neutral was last hit"
		)
		this.KilledCreepColor.IconPath = LastHitIcons.Color
	}

	/** The rows of the camps by a lane; none for a spot no lane route was found near. */
	public Lane(lane: MapArea): Nullable<LaneMenu> {
		switch (lane) {
			case MapArea.Top:
				return this.Top
			case MapArea.Middle:
				return this.Middle
			case MapArea.Bottom:
				return this.Bottom
			default:
				return undefined
		}
	}
}
