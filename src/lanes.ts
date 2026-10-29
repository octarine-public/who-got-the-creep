/**
 * The routes the lane waves walk, read off the creep spawners and the path corners they lead
 * through: a camp belongs to the lane whose route passes nearest to it.
 */
export class LaneRoutes {
	private readonly routes: [MapArea, Segment2D[]][] = []

	/** The lane nearest to the point, or `Unknown` while the map holds no spawners. */
	public Nearest(position: Vector3): MapArea {
		if (this.routes.length === 0) {
			this.build()
		}
		const point = Vector2.FromVector3(position)
		let nearest = MapArea.Unknown
		let best = Infinity
		for (const [lane, segments] of this.routes) {
			for (const segment of segments) {
				const distance = segment.DistanceSqr(point)
				if (distance < best) {
					best = distance
					nearest = lane
				}
			}
		}
		return nearest
	}

	public Clear(): void {
		this.routes.clear()
	}

	private build(): void {
		for (const spawner of EntityManager.GetEntitiesByClass(LaneCreepSpawner)) {
			const segments: Segment2D[] = []
			const passed = new Set<CreepPathCorner>()
			let from = Vector2.FromVector3(spawner.OriginPosition)
			for (let corner = spawner.TargetPath; corner !== undefined && !passed.has(corner); corner = corner.TargetPath) {
				passed.add(corner)
				const to = Vector2.FromVector3(corner.OriginPosition)
				segments.push(new Segment2D(from, to))
				from = to
			}
			this.routes.push([spawner.Lane, segments])
		}
	}
}
