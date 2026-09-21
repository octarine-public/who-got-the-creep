import { DetectorGUI } from "./gui/detector"
import { DetectorMenu } from "./menu/detector"
import { WarningModel } from "./model"

/** How far a neutral's experience reaches, in units: the radius drawn around the camp. */
const XP_RANGE = 1500
/** How long a warning stands, in seconds. */
const WARNING_LIFETIME = 2

/**
 * Enemies fed by a neutral nobody saw die. A neutral's bounty is split evenly among every hero
 * within range, so the share one ally took says how many heroes shared it; every one past the
 * allies in range and the enemies in sight is someone hiding in the trees.
 */
export class XpDetector {
	private readonly warnings: WarningModel[] = []
	private readonly alliesXP = new Map<number, number>()
	private readonly particles = new ParticlesSDK()
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

	public PostDataUpdate(localHero: Hero): void {
		const heroes = EntityManager.GetEntitiesByClass(Hero)
		for (let index = heroes.length - 1; index > -1; index--) {
			const hero = heroes[index]
			if (hero.Team === localHero.Team) {
				this.alliesXP.set(hero.Index, hero.CurrentXP)
			}
		}
	}

	public EntityKilled(killed: Unit, localHero: Hero, gameTime: number): void {
		if (!this.menu.State.value || !killed.IsNeutral) {
			return
		}
		const heroes = EntityManager.GetEntitiesByClass(Hero)
		const alliesNear = heroes.filter(hero => hero.Team === localHero.Team && hero.Distance(killed) <= XP_RANGE)
		if (alliesNear.length === 0) {
			return
		}
		const xpPerHero = alliesNear.map(hero => this.xpGained(hero)).find(diff => diff !== 0) ?? 0
		if (xpPerHero === 0) {
			return
		}
		const heroesGainedXp = Math.floor((killed.XPBounty + killed.XPBountyExtra) / xpPerHero)
		const enemiesGainedXp = heroesGainedXp - alliesNear.length
		if (enemiesGainedXp <= 0) {
			return
		}
		const visibleEnemies = heroes.filter(
			hero => hero.IsEnemy() && hero.IsVisible && hero.Distance(killed) <= XP_RANGE
		).length
		if (visibleEnemies === enemiesGainedXp) {
			return
		}
		const key = this.nextKey++
		this.particles.DrawCircle(key, killed, XP_RANGE, {
			Color: this.menu.EnemyWarningColor.SelectedColor,
			Attachment: ParticleAttachment.PATTACH_ABSORIGIN_FOLLOW
		})
		this.warnings.push(
			new WarningModel(key, enemiesGainedXp, gameTime, killed.IsVisible ? undefined : killed.Position.Clone())
		)
	}

	public GameEnded(): void {
		this.warnings.clear()
		this.alliesXP.clear()
		this.particles.DestroyAll()
	}

	private xpGained(hero: Hero): number {
		return hero.CurrentXP - (this.alliesXP.get(hero.Index) ?? hero.CurrentXP)
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
