import { GetPositionHeight, Hero, RendererSDK, Vector2, Vector3 } from "github.com/octarine-public/wrapper/index"
import { ParticleData } from "../"
import { DetectorMenu } from "../menu/detector"
import { BaseGUI } from "./base"

interface DrawParams {
	particles: ParticleData[]
	localHero: Hero
	isPostGame: boolean
}

export class DetectorGUI extends BaseGUI<DrawParams, DetectorMenu> {
	constructor(menu: DetectorMenu) {
		super(menu)
	}

	public Draw(params: DrawParams): void {
		if (!super.State(this.menu) || params.isPostGame) {
			return
		}

		this.drawEnemiesCountOnHealthbar(
			params.particles,
			params.localHero,
		)
		this.drawDeadInvisibleCreepPos(
			params.particles,
		)
	}

	private drawEnemiesCountOnHealthbar(
		particles: ParticleData[],
		localHero: Hero,
	): void {
		particles.forEach(particle => {
			const w2s: Nullable<Vector2> = RendererSDK.WorldToScreen(
				localHero.VisualPosition
			)
			if (w2s !== undefined) {
				RendererSDK.Text(
					particle.enemiesCount.toString(),
					this.getUpperCenterHealthbarPosition(localHero),
					this.menu.EnemyWarningColor.SelectedColor
				)
			}
		})
	}

	private drawDeadInvisibleCreepPos(
		particles: ParticleData[],
	): void {
		particles.forEach(particle => {
			const { creepPos } = particle 

			if (creepPos) {
				const w2s: Nullable<Vector2> = RendererSDK.WorldToScreen(
					creepPos
				)
				if (w2s) {
					const size = new Vector2(50, 50)
					RendererSDK.OutlinedCircle(w2s, size, this.menu.KilledCreepColor.SelectedColor)
				}
			}
		})
	}

	private getUpperCenterHealthbarPosition(
		localHero: Hero
	): Vector2 {
		let tossPos: Nullable<Vector3> = undefined
		if (localHero.HasBuffByName("modifier_tiny_toss")) {
			tossPos = localHero!.Position
				.Clone()
				.SetZ(GetPositionHeight(localHero.Position))
		}
		const hbSize: Vector2 = localHero.HealthBarSize
			.DivideScalarX(2)
			.MultiplyScalarY(3)

		return localHero
			.HealthBarPosition(true, tossPos)!
			.AddScalarX(hbSize.x)
			.SubtractScalarY(hbSize.y)
	}
}