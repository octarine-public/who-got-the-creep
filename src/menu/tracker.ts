import { ANIMATION_NAMES, EAnimation } from "../animation"
import { COLORS_NAMES, EColors, EKillKind, EPlayerColor, EPortrait, PLAYER_COLOR_NAMES, PORTRAIT_NAMES } from "../model"
import { SectionMenu } from "./base"
import { LastHitIcons } from "./icons"

/** The match clock past which the creep rows' default rule switches them off, in seconds. */
const CREEPS_UNTIL = 15 * 60

/** The time rail is declared to a tenth so the thumb glides; the value it lands on is a half. */
function snapHalfStep(slider: Menu.Slider): void {
	slider.value = Math.round(slider.value * 2) / 2
}

/**
 * One kind of kill: the row that switches it on, and behind the gear at its end the size and
 * time of its portrait, where the taker's colour goes on it and which colour that is.
 */
export class KillKindMenu {
	public readonly State: Menu.Toggle
	public readonly Size: Menu.Slider
	public readonly TimeToShow: Menu.Slider
	public readonly PlayerColor: Menu.Dropdown
	public readonly Colors: Menu.Dropdown

	constructor(node: Menu.Node, name: string, icon: string, tooltip: string, time: number) {
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
			EPlayerColor.Backdrop,
			"Where the taker's player color goes:\na ring running down with the time left,\nor the backdrop behind the portrait"
		)
		this.PlayerColor.IconPath = LastHitIcons.PlayerColor
		this.Colors = settings.AddDropdown(
			"Colors",
			COLORS_NAMES,
			EColors.Player,
			"What color the ring or the backdrop wears:\nthe taker's player color,\nor just green for allies and red for enemies"
		)
		this.Colors.IconPath = LastHitIcons.Color
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
	/** Hidden: set once the default creep rules went in, so a rule the user removed stays removed. */
	private readonly creepLogicSeeded: Menu.Toggle

	constructor(node: Menu.Node) {
		super(
			node,
			"Last hits",
			LastHitIcons.Tracker,
			"Shows who took the last hit on creeps, heroes, towers and Roshan",
			true
		)
		const tree = this.Tree
		this.LaneCreeps = new KillKindMenu(tree, "Lane creeps", LastHitIcons.LaneCreeps, "Creeps of the lane waves", 1.5)
		this.NeutralCreeps = new KillKindMenu(
			tree,
			"Neutral creeps",
			LastHitIcons.NeutralCreeps,
			"Camps of the jungle, ancients included",
			1.5
		)
		this.Heroes = new KillKindMenu(tree, "Heroes", LastHitIcons.Heroes, "Who took the kill on a hero", 2.5)
		this.Buildings = new KillKindMenu(
			tree,
			"Towers & Roshan",
			LastHitIcons.Buildings,
			"Towers, other buildings, Roshan and Undying's tombstone",
			2.5
		)
		this.kinds = [this.LaneCreeps, this.NeutralCreeps, this.Heroes, this.Buildings]
		this.ShowAllyCreeps = tree.AddToggle("Show ally creeps", false, "Denies: creeps last hit by their own side")
		this.ShowAllyCreeps.IconPath = LastHitIcons.AllyCreeps
		this.ShowAllyHeroes = tree.AddToggle("Show ally heroes", false, "Creeps last hit by your allies, not only by you")
		this.ShowAllyHeroes.IconPath = LastHitIcons.AllyHeroes
		this.creepLogicSeeded = tree.AddToggle("Creep logic seeded", false)
		this.creepLogicSeeded.IsHidden = true
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

	/**
	 * Gives the creep rows their default rule once: past 15:00 they switch off, so the late game
	 * shows only heroes, towers, Roshan and the like. Rules live in the config, so this waits for
	 * the config to land and never adds them twice; the user edits or removes them from the row.
	 */
	public SeedCreepLogic(): void {
		if (this.creepLogicSeeded.value || !MenuSDK.ConfigApplied()) {
			return
		}
		for (const kind of [this.LaneCreeps, this.NeutralCreeps]) {
			if (kind.State.Logic.length === 0) {
				kind.State.AddLogic("after", CREEPS_UNTIL).Value = false
			}
		}
		this.creepLogicSeeded.value = true
	}

	/** The rows of the kind a kill falls under. */
	public Kind(kind: EKillKind): KillKindMenu {
		return this.kinds[kind]
	}
}
