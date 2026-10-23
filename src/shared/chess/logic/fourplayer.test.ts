// src/shared/chess/logic/fourplayer.test.ts

import { describe, it, expect } from 'vitest';

import gamefile from './gamefile.js';
import movepiece from './movepiece.js';
import boardutil from '../util/boardutil.js';
import coordutil from '../util/coordutil.js';
import gamefileutility from '../util/gamefileutility.js';
import { players as p } from '../util/typeutil.js';

import type { FullGame } from './gamefile.js';

/** Starts a fresh 4 Player game. */
function newGame(): FullGame {
	return gamefile.initFullGame({ TimeControl: '-' }, Date.now(), 'Four_Player');
}

/** Makes each move, in compact `x,y>x,y` form, and runs the game over checks. */
function play(game: FullGame, ...tokens: string[]): void {
	for (const token of tokens) {
		const [start, end] = token.split('>');
		movepiece.generateAndMakeMove(game, {
			startCoords: coordutil.getCoordsFromKey(start as `${bigint},${bigint}`),
			endCoords: coordutil.getCoordsFromKey(end as `${bigint},${bigint}`),
		});
		gamefileutility.doGameOverChecks(game);
	}
}

/** White's queen walks out and captures red's king on move 9. */
const CAPTURE_RED_KING = [
	'7,2>7,3',
	'2,7>3,7',
	'4,13>4,12',
	'13,4>12,4',
	'7,1>7,2',
	'2,5>3,5',
	'5,13>5,12',
	'13,5>12,5',
	'7,2>1,8',
];

describe('4 Player', () => {
	it('rotates turns white, red, black, blue', () => {
		const game = newGame();
		const order = [];
		for (const token of ['7,2>7,3', '2,7>3,7', '4,13>4,12', '13,4>12,4']) {
			order.push(game.basegame.whosTurn);
			play(game, token);
		}
		expect(order).toEqual([p.WHITE, p.RED, p.BLACK, p.BLUE]);
		expect(game.basegame.whosTurn).toBe(p.WHITE);
	});

	it('turns an army into gargoyles when its last royal is captured, and skips its turns', () => {
		const game = newGame();
		play(game, ...CAPTURE_RED_KING);

		expect(game.basegame.eliminations).toEqual([
			{ player: p.RED, moveIndex: 8, condition: 'royalcapture' },
		]);
		expect(boardutil.getPieceCountOfColor(game.boardsim.pieces, p.RED)).toBe(0);
		expect(boardutil.getPieceCountOfColor(game.boardsim.pieces, p.NEUTRAL)).toBe(15);
		expect(game.basegame.gameConclusion).toBeUndefined();
		// Red is skipped
		expect(game.basegame.whosTurn).toBe(p.BLACK);
		play(game, '6,13>6,12', '13,6>12,6');
		expect(game.basegame.whosTurn).toBe(p.WHITE);
	});

	it('restores the army when the capture is rewound', () => {
		const game = newGame();
		play(game, ...CAPTURE_RED_KING);
		movepiece.rewindMove(game);

		expect(game.basegame.eliminations).toEqual([]);
		expect(boardutil.getPieceCountOfColor(game.boardsim.pieces, p.RED)).toBe(16);
		expect(boardutil.getPieceCountOfColor(game.boardsim.pieces, p.NEUTRAL)).toBe(0);
		expect(game.basegame.whosTurn).toBe(p.WHITE);
	});

	it('ends with the last player standing after resignations', () => {
		const game = newGame();
		play(game, ...CAPTURE_RED_KING);
		gamefileutility.eliminatePlayer(game.basegame, p.BLACK, 'resignation');
		expect(game.basegame.whosTurn).toBe(p.BLUE);
		expect(game.basegame.gameConclusion).toBeUndefined();
		gamefileutility.eliminatePlayer(game.basegame, p.BLUE, 'resignation');
		expect(game.basegame.gameConclusion).toEqual({ victor: p.WHITE, condition: 'resignation' });
	});
});
