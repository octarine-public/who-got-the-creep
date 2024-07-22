import { ImageData, Menu } from "github.com/octarine-public/wrapper"

export abstract class BaseMenu {
	public readonly Tree: Menu.Node
	public readonly State: Menu.Toggle

	constructor(node: Menu.Node, nodeName: string, defaultState: boolean) {
		this.Tree = node.AddNode(nodeName, ImageData.Paths.Icons.icon_roshan)
		this.State = this.Tree.AddToggle("State", defaultState)
	}

	public MenuChanged(callback: () => void) {
		this.State.OnValue(() => callback())
	}

	public ResetSettings(callback: () => void) {
		this.State.value = this.State.defaultValue
		callback()
	}
}