/* eslint-disable @typescript-eslint/naming-convention */
/** The fields of the game's `entity_killed` event the script reads. */
declare interface IEntityKilledEvent {
	readonly entindex_killed: number
	readonly entindex_attacker: number
}
