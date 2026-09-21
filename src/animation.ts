/** How the portrait comes, stays and goes: the choices of the Animation dropdown, in its order. */
export const enum EAnimation {
	None,
	FloatUp,
	Pop
}

/** The dropdown's rows, one per {@link EAnimation} in its order. */
export const ANIMATION_NAMES = ["None", "Float up", "Pop"]

/** Where the portrait stands at a moment: its shift in px at 1080p, its scale, and its opacity. */
export interface PortraitPose {
	readonly shift: Vector2
	scale: number
	opacity: number
}

/** How long the pop takes to settle, in seconds. */
const ENTER_TIME = 0.35
/** The portrait fades out over this many seconds at the end of its time. */
const FADE_TIME = 0.5
/** How far the portrait floats up each second, in px at 1080p. */
const FLOAT_SPEED = 60
/** How far past its size the pop swings before it settles. */
const OVERSHOOT = 1.7

function easeOutBack(t: number): number {
	const u = t - 1
	return 1 + (OVERSHOOT + 1) * u ** 3 + OVERSHOOT * u * u
}

/**
 * Writes the portrait's pose at `elapsed` seconds of a `showTime` second life into `pose`, so
 * the frame allocates nothing. Every animation but none fades out over its last half second;
 * what it does before is its own.
 */
export function PosePortrait(animation: EAnimation, elapsed: number, showTime: number, pose: PortraitPose): void {
	pose.shift.toZero()
	pose.scale = 1
	pose.opacity = 1
	if (animation === EAnimation.None) {
		return
	}
	pose.opacity = Math.clamp((showTime - elapsed) / FADE_TIME, 0, 1)
	switch (animation) {
		case EAnimation.FloatUp:
			pose.shift.y = -FLOAT_SPEED * elapsed
			break
		case EAnimation.Pop: {
			const enter = Math.min(elapsed / ENTER_TIME, 1)
			pose.scale = enter < 1 ? easeOutBack(enter) : pose.opacity
			break
		}
	}
}
