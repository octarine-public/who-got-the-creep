import { Color, Menu } from "github.com/octarine-public/wrapper/index"
import { BaseMenu } from "./base"

export class DetectorMenu extends BaseMenu {
	public readonly EnemyWarningColor: Menu.ColorPicker
	public readonly KilledCreepColor: Menu.ColorPicker

	constructor(node: Menu.Node) {
		super(node, "Xp ESP", false, 'Shows last hitted neutrals by enemy, detects enemis around if you last hit neutrals')

		this.EnemyWarningColor = this.Tree.AddColorPicker(
			"Enemy warning",
			Color.Red,
			"Radius with enemies inside",
		)
		this.KilledCreepColor = this.Tree.AddColorPicker(
			"Last hitted neutral",
			Color.Blue,
			"Radius where neutral were last hitted",
		)
	}

	public ResetSettings(callback: () => void): void {
		super.ResetSettings(callback)
	}
}