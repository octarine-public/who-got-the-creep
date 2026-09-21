import { TrackerGUI } from "./gui/tracker"
import { TrackerMenu } from "./menu/tracker"
import { EKillKind, LastHitModel } from "./model"

/** Who took each last hit: a portrait over the spot the unit died at, for a moment. */
export class LastHitTracker {
	private readonly units: LastHitModel[] = []
	private readonly gui: TrackerGUI

	constructor(private readonly menu: TrackerMenu) {
		this.gui = new TrackerGUI(menu)
	}

	public Draw(gameTime: number): void {
		this.expire(gameTime)
		if (this.menu.State.value) {
			this.gui.Draw(this.units, gameTime)
		}
	}

	public EntityKilled(killed: Unit, attacker: Hero, gameTime: number): void {
		if (!this.menu.State.value) {
			return
		}
		const kind = this.kindOf(killed)
		if (kind === undefined || !this.menu.Kind(kind).State.value || !this.shouldShow(kind, killed, attacker)) {
			return
		}
		const position = killed.Position.Clone().AddScalarZ(killed.HealthBarOffset)
		this.units.push(new LastHitModel(position, attacker, gameTime, kind))
	}

	public GameEnded(): void {
		this.units.clear()
	}

	/** Which rows answer for the unit, or nothing for a unit the tracker has no row for. */
	private kindOf(killed: Unit): Nullable<EKillKind> {
		if (killed instanceof Hero) {
			return killed.IsRealHero ? EKillKind.Hero : undefined
		}
		if (killed.IsBuilding || killed.IsRoshan) {
			return EKillKind.Building
		}
		if (!(killed instanceof Creep)) {
			return undefined
		}
		if (killed.IsNeutral) {
			return EKillKind.NeutralCreep
		}
		return killed.IsLaneCreep ? EKillKind.LaneCreep : undefined
	}

	/** A creep is shown by who took it; a hero, a building or Roshan is shown whoever did. */
	private shouldShow(kind: EKillKind, killed: Unit, attacker: Hero): boolean {
		if (kind === EKillKind.Hero || kind === EKillKind.Building) {
			return true
		}
		if (!killed.IsEnemy(attacker) && !this.menu.ShowAllyCreeps.value) {
			return false
		}
		return attacker.IsMyHero || attacker.IsEnemy() || this.menu.ShowAllyHeroes.value
	}

	private expire(gameTime: number): void {
		for (let index = this.units.length - 1; index > -1; index--) {
			const unit = this.units[index]
			if (unit.Elapsed(gameTime) >= this.menu.Kind(unit.Kind).TimeToShow.value) {
				this.units.splice(index, 1)
			}
		}
	}
}
