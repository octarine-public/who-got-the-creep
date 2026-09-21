/** What the tracker paints a portrait for: each kind is switched, sized and timed on its own. */
export const enum EKillKind {
	LaneCreep,
	NeutralCreep,
	Hero,
	Building
}

/** One last hit still on screen: where the unit died, who took it, when, and what it was. */
export class LastHitModel {
	/** The taker's player colour, the one the game rims their portrait with. */
	public readonly Color: Color
	/** The taker's square icon, cut to a disc when painted. */
	public readonly Texture: string

	constructor(
		public readonly Position: Vector3,
		public readonly Attacker: Hero,
		public readonly GameTime: number,
		public readonly Kind: EKillKind
	) {
		this.Color = PlayerCustomData.get(Attacker.PlayerID)?.Color ?? Attacker.Color
		this.Texture = ImageData.GetHeroTexture(Attacker.Name, true)
	}

	public Elapsed(gameTime: number): number {
		return Math.max(gameTime - this.GameTime, 0)
	}
}

/**
 * A neutral that fed an enemy nobody saw: the radius drawn around the camp, how many enemies
 * shared the bounty, and where the neutral died while the camp itself was out of sight.
 */
export class WarningModel {
	constructor(
		public readonly Key: number,
		public readonly EnemiesCount: number,
		public readonly GameTime: number,
		public readonly CreepPosition: Nullable<Vector3>
	) {}

	public TimeLeft(gameTime: number, lifetime: number): number {
		return this.GameTime + lifetime - gameTime
	}
}
