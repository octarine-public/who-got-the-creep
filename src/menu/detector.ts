import { SectionMenu } from "./base"
import { LastHitIcons } from "./icons"

export class DetectorMenu extends SectionMenu {
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
		this.EnemyWarningColor = this.Tree.AddColorPicker("Enemy warning", Color.Red, "Radius with enemies inside")
		this.EnemyWarningColor.IconPath = LastHitIcons.Color
		this.KilledCreepColor = this.Tree.AddColorPicker(
			"Last hitted neutral",
			Color.Blue,
			"Where the neutral was last hit"
		)
		this.KilledCreepColor.IconPath = LastHitIcons.Color
	}
}
