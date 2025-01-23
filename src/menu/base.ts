import { ImageData, Menu } from "github.com/octarine-public/wrapper/index"

export abstract class BaseMenu {
	public readonly Tree: Menu.Node
	public readonly State: Menu.Toggle

	constructor(node: Menu.Node, nodeName: string, defaultState = true, tooltip?: string) {
		this.Tree = node.AddNode(nodeName, ImageData.Icons.icon_svg_hamburger, tooltip)
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
