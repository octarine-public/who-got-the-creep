import { Paths } from "github.com/octarine-public/wrapper/wrapper/Data/ImageData"
import {
	Menu,
	NotificationsSDK,
	ResetSettingsUpdated,
	Sleeper
} from "github.com/octarine-public/wrapper/wrapper/Imports"
import { WhoGotTheCreepMenu } from "./who-got-the-creep"
import { XpESPMenu } from "./xp-esp"

export class MenuManager {
	public readonly State: Menu.Toggle

	public readonly WhoGotTheCreep: WhoGotTheCreepMenu
	public readonly XpESP: XpESPMenu

	private readonly tree: Menu.Node
	private readonly reset: Menu.Button
	private readonly baseNode: Menu.Node = Menu.AddEntry("Visual")


	constructor(private readonly sleeper: Sleeper) {
		this.tree = this.baseNode.AddNode("Creep ESP", Paths.Icons.icon_svg_alien)
		this.tree.SortNodes = false
		this.State = this.tree.AddToggle("State", true)
		this.WhoGotTheCreep = new WhoGotTheCreepMenu(this.tree)
		this.XpESP = new XpESPMenu(this.tree)
		this.reset = this.tree.AddButton("Reset settings", "Reset settings to default")
	}

	public MenuChanged(callback: () => void) {
		this.State.OnValue(() => callback)
		this.WhoGotTheCreep.MenuChanged(callback)
		this.XpESP.MenuChanged(callback)
		this.reset.OnValue(() => this.ResetSettings(callback))
	}

	public ResetSettings(callback: () => void) {
		if (this.sleeper.Sleeping("ResetSettings")) {
			return
		}
		
		this.WhoGotTheCreep.ResetSettings(callback)
		this.XpESP.ResetSettings(callback)
		this.State.value = this.State.defaultValue
		NotificationsSDK.Push(new ResetSettingsUpdated())
		this.sleeper.Sleep(2 * 1000, "ResetSettings")
	}

	public GameChanged() {
		this.sleeper.FullReset()
	}
}
