// src/client/scripts/esm/game/rendering/promotionlines.ts

/**
 * This script handles the rendering of our promotion lines.
 */

import type { Color } from '../../../../../shared/util/math/math.js';
import type { Player } from '../../../../../shared/chess/util/typeutil.js';

import bd from '@naviary/bigdecimal';

import typeutil from '../../../../../shared/chess/util/typeutil.js';

import camera from './camera.js';
import meshes from './meshes.js';
import gameslot from '../chess/gameslot.js';
import boardpos from './boardpos.js';
import boardtiles from './boardtiles.js';
import primitives from './primitives.js';
import { createRenderable } from '../../webgl/Renderable.js';

// ===================================== Constants =====================================

/** How many tiles on both ends the promotion lines should extend past the farthest piece */
const EXTRA_LENGTH = 2;
/** Vertical thickness of the promotion lines. */
const THICKNESS = 0.01;

// ===================================== Functions =====================================

function render(): void {
	const gamefile = gameslot.getGamefile()!;
	if (gamefile.basegame.gameRules.promotionRanks === undefined) return; // No promotion ranks in this game

	// Generate the vertex data

	const position = boardpos.getBoardPos();
	const scale = boardpos.getBoardScaleAsNumber();

	let left: number;
	let right: number;
	let bottom: number;
	let top: number;

	if (gamefile.boardsim.editor) {
		// In editor mode, the promotion lines extend to the edges of the screen
		({ left, right, bottom, top } = camera.getRespectiveScreenBox());
	} else {
		// Round the start position box away to encapsulate the entirity of all squares
		const floatingBox = meshes.expandTileBoundingBoxToEncompassWholeSquare(
			gamefile.boardsim.startSnapshot.box,
		);
		left = (bd.toNumber(bd.subtract(floatingBox.left, position[0])) - EXTRA_LENGTH) * scale;
		right = (bd.toNumber(bd.subtract(floatingBox.right, position[0])) + EXTRA_LENGTH) * scale;
		bottom = (bd.toNumber(bd.subtract(floatingBox.bottom, position[1])) - EXTRA_LENGTH) * scale;
		top = (bd.toNumber(bd.subtract(floatingBox.top, position[1])) + EXTRA_LENGTH) * scale;
	}

	const squareCenterNum = boardtiles.getSquareCenterAsNumber();
	const color: Color = [0, 0, 0, 1];
	const vertexData: number[] = [];

	for (const [playerStr, ranks] of Object.entries(gamefile.basegame.gameRules.promotionRanks)) {
		const forward = typeutil.getPawnDirection(Number(playerStr) as Player);
		// The line is drawn on the far edge of the promotion square, from the pawn's perspective.
		const shift = forward[0] + forward[1] > 0n ? 1 : 0;
		const vertical = forward[0] !== 0n; // Pawns moving horizontally promote on files (vertical lines)
		ranks.forEach((rank) => {
			const relativeRank: number = bd.toNumber(
				bd.subtract(bd.fromBigInt(rank), position[vertical ? 0 : 1]),
			); // Subtract our board position
			const start = (relativeRank - squareCenterNum + shift - THICKNESS) * scale;
			const end = (relativeRank - squareCenterNum + shift + THICKNESS) * scale;
			if (vertical) vertexData.push(...primitives.Quad_Color(start, bottom, end, top, color));
			else vertexData.push(...primitives.Quad_Color(left, start, right, end, color));
		});
	}

	// Create and Render the model

	createRenderable(vertexData, 2, 'TRIANGLES', 'color', true).render();
}

// ===================================== Exports =====================================

export default {
	render,
};
