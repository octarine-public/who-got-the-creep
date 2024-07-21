import { Paths } from "github.com/octarine-public/wrapper/wrapper/Data/ImageData"
import {
	Menu,
	NotificationsSDK,
	ResetSettingsUpdated,
	Sleeper
} from "github.com/octarine-public/wrapper/wrapper/Imports"

export class MenuManager {
	public readonly State: Menu.Toggle
	public readonly showAllyCreeps: Menu.Toggle
	public readonly showAllyHeroes: Menu.Toggle
	public readonly size: Menu.Slider
	public readonly timeToShow: Menu.Slider
	public readonly opactity: Menu.Slider
	public readonly disibleMin: Menu.Slider

	private readonly reset: Menu.Button

	private readonly visual = Menu.AddEntry("Visual")
	private readonly baseNode: Menu.Node
	private readonly sleeper = new Sleeper()

	private readonly nodeImage = Paths.Icons.icon_svg_alien

	constructor() {
		this.baseNode = this.visual.AddNode("Creep ESP", this.nodeImage, "Multifunctional creep tool", -1)
		this.baseNode.SortNodes = false

		this.State = this.baseNode.AddToggle("State", true)
		this.showAllyCreeps = this.baseNode.AddToggle("Show ally creeps", false)
		this.showAllyHeroes = this.baseNode.AddToggle("Show ally heroes", false)
		this.size = this.baseNode.AddSlider("Size", 30, 25, 50)
		this.timeToShow = this.baseNode.AddSlider("Time to show seconds", 2, 1, 5)
		this.opactity = this.baseNode.AddSlider("Opacity", 85, 40, 100)
		this.disibleMin = this.baseNode.AddSlider("Disable after N minutes", 15, 5, 60)
		this.reset = this.baseNode.AddButton("Reset", "Reset settings to default values")
		this.reset.OnValue(() => this.ResetSettings())
	}

	public MenuChanged(callback: () => void) {
		this.reset.OnValue(() => callback())
	}

	public ResetSettings() {
		if (this.sleeper.Sleeping("ResetSettings")) {
			return
		}
		this.State.value = this.State.defaultValue
		this.showAllyCreeps.value = this.showAllyCreeps.defaultValue
		this.showAllyHeroes.value = this.showAllyHeroes.defaultValue
		this.size.value = this.size.defaultValue
		this.timeToShow.value = this.timeToShow.defaultValue
		this.opactity.value = this.opactity.defaultValue
		this.disibleMin.value = this.disibleMin.defaultValue
		NotificationsSDK.Push(new ResetSettingsUpdated())
		this.sleeper.Sleep(2 * 1000, "ResetSettings")
	}

	public GameChanged() {
		this.sleeper.FullReset()
	}
}
