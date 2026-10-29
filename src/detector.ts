import { DetectorGUI } from "./gui/detector"
import { LaneRoutes } from "./lanes"
import { DetectorMenu } from "./menu/detector"
import { WarningModel } from "./model"

/** How far a neutral's experience reaches, in units: the radius drawn around the camp. */
const XP_RANGE = 1500
/** How long a warning stands, in seconds. */
const WARNING_LIFETIME = 2
/**
 * How long a kill waits for the experience it gave, in seconds. The kill and the experience come
 * in either order within a tick or two, and kills inside this window are answered as one batch.
 */
const XP_SETTLE_TIME = 0.25

/** An ally's experience now, what it was before its last change, and when that change came. */
interface IXpRecord {
	xp: number
	before: number
	changedAt: number
}

/** A neutral that died and waits for the experience it gave to land. */
interface IPendingKill {
	readonly Position: Vector3
	readonly Visible: boolean
	readonly Bounty: number
	readonly GameTime: number
	readonly Lane: MapArea
	readonly VisibleEnemies: number
}

/**
 * Enemies fed by a neutral nobody saw die. A neutral's bounty is split evenly among every hero
 * within range, so the share one ally took says how many heroes shared it; every one past the
 * allies in range and the enemies in sight is someone hiding in the trees. Camps are sorted by
 * the lane nearest to them, each lane with its own switch and the enemies it takes to warn.
 */
export class XpDetector {
	private readonly warnings: WarningModel[] = []
	private readonly alliesXP = new Map<number, IXpRecord>()
	/** The kills of the batch waiting to settle, the first one leading. */
	private readonly pending: IPendingKill[] = []
	/** The allies in range of the batch, with their experience before its first kill. */
	private readonly pendingAllies = new Map<Hero, number>()
	private readonly particles = new ParticlesSDK()
	private readonly lanes = new LaneRoutes()
	private readonly gui: DetectorGUI
	private nextKey = 0

	constructor(private readonly menu: DetectorMenu) {
		this.gui = new DetectorGUI(menu)
	}

	public Draw(localHero: Hero, gameTime: number): void {
		this.expire(gameTime)
		if (this.menu.State.value) {
			this.gui.Draw(this.warnings, localHero, gameTime, WARNING_LIFETIME)
		}
	}

	public PostDataUpdate(localHero: Hero, gameTime: number): void {
		const heroes = EntityManager.GetEntitiesByClass(Hero)
		for (let index = heroes.length - 1; index > -1; index--) {
			const hero = heroes[index]
			if (hero.Team === localHero.Team) {
				this.recordXP(hero, gameTime)
			}
		}
		const last = this.pending[this.pending.length - 1]
		if (last !== undefined && gameTime - last.GameTime >= XP_SETTLE_TIME) {
			this.settle(localHero, gameTime)
		}
	}

	public EntityKilled(killed: Unit, localHero: Hero, gameTime: number): void {
		if (!this.menu.State.value || !killed.IsNeutral) {
			return
		}
		const bounty = killed.XPBounty + killed.XPBountyExtra
		if (bounty <= 0) {
			return
		}
		const heroes = EntityManager.GetEntitiesByClass(Hero)
		const alliesNear = heroes.filter(hero => hero.Team === localHero.Team && hero.Distance(killed) <= XP_RANGE)
		if (alliesNear.length === 0) {
			return
		}
		for (const hero of alliesNear) {
			if (!this.pendingAllies.has(hero)) {
				this.pendingAllies.set(hero, this.xpBefore(hero, gameTime))
			}
		}
		this.pending.push({
			Position: killed.Position.Clone(),
			Visible: killed.IsVisible,
			Bounty: bounty,
			GameTime: gameTime,
			Lane: this.lanes.Nearest(killed.Position),
			VisibleEnemies: heroes.filter(hero => hero.IsEnemy() && hero.IsVisible && hero.Distance(killed) <= XP_RANGE)
				.length
		})
	}

	public GameEnded(): void {
		this.warnings.clear()
		this.alliesXP.clear()
		this.pending.clear()
		this.pendingAllies.clear()
		this.lanes.Clear()
		this.particles.DestroyAll()
	}

	/** Answers the batch: the share an ally took says how many heroes split its bounty. */
	private settle(localHero: Hero, gameTime: number): void {
		const kill = this.pending[0]
		const bounty = this.pending.reduce((sum, pending) => sum + pending.Bounty, 0)
		const visibleEnemies = this.pending.reduce((most, pending) => Math.max(most, pending.VisibleEnemies), 0)
		let xpPerHero = 0
		for (const [hero, before] of this.pendingAllies) {
			xpPerHero = hero.CurrentXP - before
			if (xpPerHero > 0) {
				break
			}
		}
		const alliesNear = this.pendingAllies.size
		this.pending.clear()
		this.pendingAllies.clear()
		if (xpPerHero <= 0) {
			return
		}
		const enemiesGainedXp = Math.floor(bounty / xpPerHero) - alliesNear
		if (enemiesGainedXp <= 0 || visibleEnemies >= enemiesGainedXp) {
			return
		}
		// a spot no lane route was found near keeps warning: the map gave nothing to sort it by
		const lane = this.menu.Lane(kill.Lane)
		if (lane !== undefined && (!lane.State.value || enemiesGainedXp < lane.MinEnemies.value)) {
			return
		}
		const key = this.nextKey++
		this.particles.DrawCircle(key, localHero, XP_RANGE, {
			Color: this.menu.EnemyWarningColor.SelectedColor,
			Position: kill.Position
		})
		this.warnings.push(new WarningModel(key, enemiesGainedXp, gameTime, kill.Visible ? undefined : kill.Position))
	}

	private recordXP(hero: Hero, gameTime: number): void {
		const record = this.alliesXP.get(hero.Index)
		if (record === undefined) {
			this.alliesXP.set(hero.Index, { xp: hero.CurrentXP, before: hero.CurrentXP, changedAt: gameTime })
		} else if (record.xp !== hero.CurrentXP) {
			record.before = record.xp
			record.xp = hero.CurrentXP
			record.changedAt = gameTime
		}
	}

	/** The ally's experience from before the tick of a kill, whether that tick's update came first or not. */
	private xpBefore(hero: Hero, gameTime: number): number {
		const record = this.alliesXP.get(hero.Index)
		if (record === undefined) {
			return hero.CurrentXP
		}
		return record.changedAt >= gameTime ? record.before : record.xp
	}

	private expire(gameTime: number): void {
		for (let index = this.warnings.length - 1; index > -1; index--) {
			const warning = this.warnings[index]
			if (warning.TimeLeft(gameTime, WARNING_LIFETIME) <= 0) {
				this.particles.DestroyByKey(warning.Key)
				this.warnings.splice(index, 1)
			}
		}
	}
}
