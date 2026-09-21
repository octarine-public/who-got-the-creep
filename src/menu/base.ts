import { LastHitIcons } from "./icons"

/** A section of the page with a switch of its own riding its header and gating its rows. */
export abstract class SectionMenu {
	public readonly Tree: Menu.Node
	public readonly State: Menu.Toggle

	constructor(node: Menu.Node, name: string, icon: string, tooltip: string, defaultState: boolean) {
		this.Tree = node.AddNode(name, icon, tooltip)
		this.Tree.SortNodes = false
		this.State = this.Tree.AddToggle("State", defaultState)
		this.State.IconPath = LastHitIcons.State
		this.Tree.HeaderControl = this.State
		this.Tree.Gate = this.State
	}
}
