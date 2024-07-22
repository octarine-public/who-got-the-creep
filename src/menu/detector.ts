import { Menu } from "github.com/octarine-public/wrapper"
import { BaseMenu } from "./base"

export class DetectorMenu extends BaseMenu {
	public readonly ShowAllyHeroes: Menu.Toggle
	public readonly TimeToShow: Menu.Slider

	constructor(node: Menu.Node) {
		super(node, "Xp ESP", false)
		this.ShowAllyHeroes = this.Tree.AddToggle("Show ally creep", false)
		this.TimeToShow = this.Tree.AddSlider("Time to show (seconds)", 2, 1, 5)
	}

	public override ResetSettings(callback: () => void): void {
		super.ResetSettings(callback)

		this.ShowAllyHeroes.value = this.ShowAllyHeroes.defaultValue
		this.TimeToShow.value = this.TimeToShow.defaultValue

		callback()
	}
}