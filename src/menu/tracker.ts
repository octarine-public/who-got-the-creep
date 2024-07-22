import { Menu } from "github.com/octarine-public/wrapper"
import { BaseMenu } from "./base"

export class TrackerMenu extends BaseMenu {
	public readonly ShowAllyCreeps: Menu.Toggle
	public readonly ShowAllyHeroes: Menu.Toggle
	public readonly Size: Menu.Slider
	public readonly TimeToShow: Menu.Slider
	public readonly Opactity: Menu.Slider
	public readonly DisibleMin: Menu.Slider

	constructor(node: Menu.Node) {
		super(node, "Who got the creep", false)
		this.ShowAllyCreeps = this.Tree.AddToggle("Show ally creeps", false)
		this.ShowAllyHeroes = this.Tree.AddToggle("Show ally heroes", false)
		this.Size = this.Tree.AddSlider("Size", 30, 25, 50)
		this.TimeToShow = this.Tree.AddSlider("Time to show seconds", 2, 1, 5)
		this.Opactity = this.Tree.AddSlider("Opacity", 85, 40, 100)
		this.DisibleMin = this.Tree.AddSlider("Disable after N minutes", 15, 5, 60)
	}

	public ResetSettings(callback: () => void): void {
		super.ResetSettings(callback)

		this.State.value = this.State.defaultValue
		this.ShowAllyCreeps.value = this.ShowAllyCreeps.defaultValue
		this.ShowAllyHeroes.value = this.ShowAllyHeroes.defaultValue
		this.Size.value = this.Size.defaultValue
		this.TimeToShow.value = this.TimeToShow.defaultValue
		this.Opactity.value = this.Opactity.defaultValue
		this.DisibleMin.value = this.DisibleMin.defaultValue
		callback()
	}
}