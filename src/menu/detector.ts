import { Menu } from "github.com/octarine-public/wrapper"
import { BaseMenu } from "./base"

export class DetectorMenu extends BaseMenu {
	public readonly ShowAllyHeroes: Menu.Toggle

	constructor(node: Menu.Node) {
		super(node, "Xp ESP", false)
		this.ShowAllyHeroes = this.Tree.AddToggle("Show ally creep", false)
	}

	public ResetSettings(callback: () => void): void {
		super.ResetSettings(callback)
		this.ShowAllyHeroes.value = this.ShowAllyHeroes.defaultValue
	}
}