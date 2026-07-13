import { Menu } from "github.com/octarine-public/wrapper/index"

import { BaseMenu } from "./base"

export class TrackerMenu extends BaseMenu {
	public readonly ShowAllyCreeps: Menu.Toggle
	public readonly ShowAllyHeroes: Menu.Toggle
	public readonly Animation: Menu.Toggle
	public readonly Size: Menu.Slider
	public readonly TimeToShow: Menu.Slider
	public readonly Opactity: Menu.Slider
	public readonly DisibleMin: Menu.Slider
	public readonly BigKills: Menu.Toggle
	public readonly BigKillsSize: Menu.Slider
	public readonly BigKillsTimeToShow: Menu.Slider

	constructor(node: Menu.Node) {
		super(node, "Who got the creep", true, "Shows who last hit the creep")
		const snapHalfStep = (slider: Menu.Slider): void => {
			slider.value = Math.round(slider.value * 2) / 2
		}

		this.ShowAllyCreeps = this.Tree.AddToggle("Show ally creeps", false)
		this.ShowAllyHeroes = this.Tree.AddToggle("Show ally heroes", false)
		this.Animation = this.Tree.AddToggle("Animation", true, "Icon floats up while shown")
		this.Size = this.Tree.AddSlider("Size", 30, 25, 50)
		this.TimeToShow = this.Tree.AddSlider("Time to show seconds", 1.5, 1, 5, 1)
		this.TimeToShow.OnValue(snapHalfStep)
		this.Opactity = this.Tree.AddSlider("Opacity", 85, 40, 100)
		this.DisibleMin = this.Tree.AddSlider("Disable after N minutes", 15, 5, 60)

		const bigKillsTree = this.Tree.AddNode(
			"Towers & Roshan",
			"",
			"Shows who last hit towers, buildings and Roshan"
		)
		this.BigKills = bigKillsTree.AddToggle("State", true)
		this.BigKillsSize = bigKillsTree.AddSlider("Size", 30, 25, 60)
		this.BigKillsTimeToShow = bigKillsTree.AddSlider("Time to show seconds", 2.5, 1, 10, 1)
		this.BigKillsTimeToShow.OnValue(snapHalfStep)
	}

	public ResetSettings(callback: () => void): void {
		super.ResetSettings(callback)

		this.State.value = this.State.defaultValue
		this.ShowAllyCreeps.value = this.ShowAllyCreeps.defaultValue
		this.ShowAllyHeroes.value = this.ShowAllyHeroes.defaultValue
		this.Animation.value = this.Animation.defaultValue
		this.Size.value = this.Size.defaultValue
		this.TimeToShow.value = this.TimeToShow.defaultValue
		this.Opactity.value = this.Opactity.defaultValue
		this.DisibleMin.value = this.DisibleMin.defaultValue
		this.BigKills.value = this.BigKills.defaultValue
		this.BigKillsSize.value = this.BigKillsSize.defaultValue
		this.BigKillsTimeToShow.value = this.BigKillsTimeToShow.defaultValue
		callback()
	}
}
