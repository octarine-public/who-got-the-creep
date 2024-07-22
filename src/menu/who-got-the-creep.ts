import { Menu } from "github.com/octarine-public/wrapper"
import { BaseMenu } from "./base"

export class WhoGotTheCreepMenu extends BaseMenu {
	// public readonly showAllyCreeps: Menu.Toggle
	// public readonly showAllyHeroes: Menu.Toggle
	// public readonly size: Menu.Slider
	// public readonly timeToShow: Menu.Slider
	// public readonly opactity: Menu.Slider
	// public readonly disibleMin: Menu.Slider

	constructor(node: Menu.Node) {
		super(node, "Who got the creep", true)
		// this.showAllyCreeps = this.Tree.AddToggle("Show ally creeps", false)
		// this.showAllyHeroes = this.Tree.AddToggle("Show ally heroes", false)
		// this.size = this.Tree.AddSlider("Size", 30, 25, 50)
		// this.timeToShow = this.Tree.AddSlider("Time to show seconds", 2, 1, 5)
		// this.opactity = this.Tree.AddSlider("Opacity", 85, 40, 100)
		// this.disibleMin = this.Tree.AddSlider("Disable after N minutes", 15, 5, 60)
	}

	public ResetSettings(callback: () => void): void {
		super.ResetSettings(callback)

		this.State.value = this.State.defaultValue
		// this.showAllyCreeps.value = this.showAllyCreeps.defaultValue
		// this.showAllyHeroes.value = this.showAllyHeroes.defaultValue
		// this.size.value = this.size.defaultValue
		// this.timeToShow.value = this.timeToShow.defaultValue
		// this.opactity.value = this.opactity.defaultValue
		// this.disibleMin.value = this.disibleMin.defaultValue
		callback()
	}
}