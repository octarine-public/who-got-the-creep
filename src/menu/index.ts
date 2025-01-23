import { ImageData, Menu } from "github.com/octarine-public/wrapper/index"

import { DetectorMenu } from "./detector"
import { TrackerMenu } from "./tracker"

export class MenuManager {
	public readonly State: Menu.Toggle

	public readonly Tracker: TrackerMenu
	public readonly Detector: DetectorMenu

	private readonly tree: Menu.Node
	private readonly baseNode: Menu.Node = Menu.AddEntry("Visual")

	constructor() {
		this.tree = this.baseNode.AddNode("Creep ESP", ImageData.Icons.icon_svg_alien)
		this.tree.SortNodes = false
		this.State = this.tree.AddToggle("State", true)
		this.Tracker = new TrackerMenu(this.tree)
		this.Detector = new DetectorMenu(this.tree)
	}

	public MenuChanged(callback: () => void) {
		this.State.OnValue(() => callback())
		this.Tracker.MenuChanged(callback)
		this.Detector.MenuChanged(callback)
	}
}
