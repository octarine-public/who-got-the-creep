import { DetectorMenu } from "./detector"
import { LastHitIcons } from "./icons"
import { TrackerMenu } from "./tracker"

export class MenuManager {
	public readonly State: Menu.Toggle
	public readonly Tracker: TrackerMenu
	public readonly Detector: DetectorMenu

	private readonly entry = Menu.AddEntry("Visual")
	private readonly node: Menu.Node

	constructor() {
		this.node = this.entry.AddNode(
			"Last hit ESP",
			LastHitIcons.Page,
			"Who took the last hit, and who fed on your jungle unseen"
		)
		this.node.SortNodes = false
		this.State = this.node.AddToggle("State", true)
		this.State.IconPath = LastHitIcons.State
		this.node.HeaderControl = this.State
		this.node.Gate = this.State
		this.Tracker = new TrackerMenu(this.node)
		this.Detector = new DetectorMenu(this.node)
	}
}
