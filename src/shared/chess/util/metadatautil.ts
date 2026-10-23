// src/shared/chess/util/metadatautil.ts

/**
 * This script stores the type definition for a game's metadata.
 *
 * ICN (Infinite Chess Notation) is inspired from PGN notation.
 * https://github.com/tsevasa/infinite-chess-notation
 */

import type { Player } from './typeutil.js';
import type { MetaData, Rating } from '../../types.js';

import { players as p } from './typeutil.js';

// Types --------------------------------------------------------------------------

/** All valid metadata names. */
export type MetadataKey = keyof MetaData;

// Constants -----------------------------------------------------------------------

/** Canonical display name used for guest players in ICN metadata. Metadata is always in English. */
const GUEST_NAME_ICN_METADATA = '(Guest)' as const;

// Functions -----------------------------------------------------------------------

/**
 * Returns the value of the game's Result metadata, depending on the victor.
 * The result lists each player's score in player-number order, so a white win is
 * '1-0' in a 2 player game and '1-0-0-0' in a 4 player game, and a red win is '0-0-1-0'.
 * @param victor - The victor of the game, in player number. Or none if undefined.
 * @param playerCount - How many players the game has.
 * @returns The result of the game in the format '1-0', '0-1', '1/2-1/2', or '*' (aborted).
 */
function getResultFromVictor(victor?: Player | null, playerCount = 2): string {
	if (victor === null) return '1/2-1/2';
	if (victor === undefined) return '*';
	if (victor < p.WHITE || victor > playerCount)
		throw new Error(`Cannot get game result from unsupported victor ${victor}!`);
	return Array.from({ length: playerCount }, (_, i) => (i + 1 === victor ? '1' : '0')).join('-');
}

/** Inverse of {@link getResultFromVictor}. Throws if the result is not supported. */
function getVictorFromResult(result: string): Player | null | undefined {
	if (result === '1/2-1/2') return null;
	if (result === '*') return undefined;
	const scores = result.split('-');
	if (
		scores.length >= 2 &&
		scores.every((s) => s === '0' || s === '1') &&
		scores.filter((s) => s === '1').length === 1
	)
		return (scores.indexOf('1') + 1) as Player;
	throw Error(`Unsupported result (${result})!`);
}

/** Rounds the elo. And, if we're not confident about its value, appends a question mark "?" to it. */
function getFormattedElo(rating: Rating): string {
	const roundedElo = Math.round(rating.value);
	return rating.confident ? `${roundedElo}` : `${roundedElo}?`;
}

/**
 * Takes elo change, calculates the string that should go into
 * the WhiteRatingDiff or BlackRatingDiff fields of the metadata.
 */
function getWhiteBlackRatingDiff(eloChange: number): string {
	const isPositive = eloChange >= 0;
	eloChange = Math.round(eloChange);
	return isPositive ? `+${eloChange}` : `${eloChange}`; // negative numbers are already negative
}

export default {
	GUEST_NAME_ICN_METADATA,
	getResultFromVictor,
	getVictorFromResult,
	getFormattedElo,
	getWhiteBlackRatingDiff,
};
