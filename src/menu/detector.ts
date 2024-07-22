import { Menu } from "github.com/octarine-public/wrapper"
import { BaseMenu } from "./base"

export class DetectorMenu extends BaseMenu {
	constructor(node: Menu.Node) {
		super(node, "Xp ESP", false)
	}
}