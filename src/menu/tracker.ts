import { ANIMATION_NAMES, EAnimation } from "../animation"
import { EKillKind, EPlayerColor, EPortrait, PLAYER_COLOR_NAMES, PORTRAIT_NAMES } from "../model"
import { SectionMenu } from "./base"
import { LastHitIcons } from "./icons"

/** The time rail is declared to a tenth so the thumb glides; the value it lands on is a half. */
function snapHalfStep(slider: Menu.Slider): void {
	slider.value = Math.round(slider.value * 2) / 2
}

/**
 * One kind of kill: the row that switches it on, and behind the gear at its end the size and
 * time of its portrait and where the taker's player colour goes on it.
 */
export class KillKindMenu {
	public readonly State: Menu.Toggle
	public readonly Size: Menu.Slider
	public readonly TimeToShow: Menu.Slider
	public readonly PlayerColor: Menu.Dropdown

	constructor(node: Menu.Node, name: string, icon: string, tooltip: string, time: number, playerColor: EPlayerColor) {
		this.State = node.AddToggle(name, true, tooltip)
		this.State.IconPath = icon
		const settings = node.AddSubSettings(this.State, undefined, icon)
		settings.SortNodes = false
		this.Size = settings.AddSlider("Size", 30, 25, 60)
		this.Size.IconPath = LastHitIcons.Size
		this.TimeToShow = settings.AddSlider("Time to show seconds", time, 1, 10, 1)
		this.TimeToShow.IconPath = LastHitIcons.Time
		this.TimeToShow.OnValue(snapHalfStep)
		this.PlayerColor = settings.AddDropdown(
			"Player color",
			PLAYER_COLOR_NAMES,
			playerColor,
			"Where the taker's player color goes:\na ring running down with the time left,\nor the backdrop behind the portrait"
		)
		this.PlayerColor.IconPath = LastHitIcons.PlayerColor
	}
}

export class TrackerMenu extends SectionMenu {
	public readonly LaneCreeps: KillKindMenu
	public readonly NeutralCreeps: KillKindMenu
	public readonly Heroes: KillKindMenu
	public readonly Buildings: KillKindMenu
	public readonly ShowAllyCreeps: Menu.Toggle
	public readonly ShowAllyHeroes: Menu.Toggle
	public readonly Portrait: Menu.Dropdown
	public readonly Animation: Menu.Dropdown
	public readonly Opacity: Menu.Slider

	/** The kinds by {@link EKillKind}, so a kill is answered with its own rows. */
	private readonly kinds: readonly KillKindMenu[]

	constructor(node: Menu.Node) {
		super(
			node,
			"Last hits",
			LastHitIcons.Tracker,
			"Shows who took the last hit on creeps, heroes, towers and Roshan",
			true
		)
		const tree = this.Tree
		this.LaneCreeps = new KillKindMenu(
			tree,
			"Lane creeps",
			LastHitIcons.LaneCreeps,
			"Creeps of the lane waves",
			1.5,
			EPlayerColor.None
		)
		this.NeutralCreeps = new KillKindMenu(
			tree,
			"Neutral creeps",
			LastHitIcons.NeutralCreeps,
			"Camps of the jungle, ancients included",
			1.5,
			EPlayerColor.None
		)
		this.Heroes = new KillKindMenu(
			tree,
			"Heroes",
			LastHitIcons.Heroes,
			"Who took the kill on a hero",
			2.5,
			EPlayerColor.Ring
		)
		this.Buildings = new KillKindMenu(
			tree,
			"Towers & Roshan",
			LastHitIcons.Buildings,
			"Towers, other buildings and Roshan",
			2.5,
			EPlayerColor.Ring
		)
		this.kinds = [this.LaneCreeps, this.NeutralCreeps, this.Heroes, this.Buildings]
		this.ShowAllyCreeps = tree.AddToggle("Show ally creeps", false, "Denies: creeps last hit by their own side")
		this.ShowAllyCreeps.IconPath = LastHitIcons.AllyCreeps
		this.ShowAllyHeroes = tree.AddToggle("Show ally heroes", false, "Creeps last hit by your allies, not only by you")
		this.ShowAllyHeroes.IconPath = LastHitIcons.AllyHeroes
		this.Portrait = tree.AddDropdown(
			"Portrait",
			PORTRAIT_NAMES,
			EPortrait.MinimapIcon,
			"What the portrait shows:\nthe hero's minimap icon or its image"
		)
		this.Portrait.IconPath = LastHitIcons.Portrait
		this.Animation = tree.AddDropdown(
			"Animation",
			ANIMATION_NAMES,
			EAnimation.FloatUp,
			"How the portrait comes and goes:\nfloats up or pops in"
		)
		this.Animation.IconPath = LastHitIcons.Animation
		this.Opacity = tree.AddSlider("Opacity", 85, 40, 100)
		this.Opacity.Suffix = "%"
		this.Opacity.IconPath = LastHitIcons.Opacity
	}

	/** The rows of the kind a kill falls under. */
	public Kind(kind: EKillKind): KillKindMenu {
		return this.kinds[kind]
	}
}
