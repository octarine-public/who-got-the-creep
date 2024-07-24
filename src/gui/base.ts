import { BaseMenu } from "../menu/base"

export abstract class BaseGUI<P extends object, M extends BaseMenu> {
	protected readonly menu: M

	constructor(
		menu: M
	) {
		this.menu = menu
	} 

	public abstract Draw(params: P): void

	protected State(menu: M): boolean {
		return menu.State.value
	}
}