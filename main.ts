tiles.setCurrentTilemap(tilemap`level1`);
let map = vb.currentMap();
scene.centerCameraAt(96, 68);
//game.debug = true;
let isP1Turn: boolean = true;

/**
 * Player 1 setup
 */
let player1Sprite = new vb.VBPlayerSprite(img`
    . . . . . . f f f f . . . . . .
    . . . . f f f 2 2 f f f . . . .
    . . . f f f 2 2 2 2 f f f . . .
    . . f f f e e e e e e f f f . .
    . . f f e 2 2 2 2 2 2 e e f . .
    . . f e 2 f f f f f f 2 e f . .
    . . f f f f e e e e f f f f . .
    . f f e f b f 4 4 f b f e f f .
    . f e e 4 1 f d d f 1 4 e e f .
    . . f e e d d d d d d e e f . .
    . . . f e e 4 4 4 4 e e f . . .
    . . e 4 f 2 2 2 2 2 2 f 4 e . .
    . . 4 d f 2 2 2 2 2 2 f d 4 . .
    . . 4 4 f 4 4 5 5 4 4 f 4 4 . .
    . . . . . f f f f f f . . . . .
    . . . . . f f . . f f . . . . .
`, controller.player1, SpriteKind.Player, Direction.Up);
player1Sprite.sm.setStateAnimations(SpriteAction.Idle, [
    new animation.Animation(assets.animation`heroWalkLeft`, 200, true),
    new animation.Animation(assets.animation`heroWalkBack`, 200, true),
    new animation.Animation(assets.animation`heroWalkRight`, 200, true),
    new animation.Animation(assets.animation`heroWalkFront`, 200, true)
]);
map.placeOnTile(player1Sprite, vb.location(1, 7));
player1Sprite.onTurnEnd(function() {
    isP1Turn = false;
    player2Sprite.startTurn();
});
player1Sprite.onDeath(function() {
    player1Sprite.controlsLocked = true;
    player2Sprite.controlsLocked = true;
    pause(2000);
    game.setGameOverMessage(true, "Player 2 Wins!");
    game.gameOverPlayerWin(2);
})

/**
 * Player 2 setup
 */
let player2Sprite = new vb.VBPlayerSprite(img`
    . . . . . . f f f f . . . . . .
    . . . . f f f 2 2 f f f . . . .
    . . . f f f 2 2 2 2 f f f . . .
    . . f f f e e e e e e f f f . .
    . . f f e 2 2 2 2 2 2 e e f . .
    . . f e 2 f f f f f f 2 e f . .
    . . f f f f e e e e f f f f . .
    . f f e f b f 4 4 f b f e f f .
    . f e e 4 1 f d d f 1 4 e e f .
    . . f e e d d d d d d e e f . .
    . . . f e e 4 4 4 4 e e f . . .
    . . e 4 f 2 2 2 2 2 2 f 4 e . .
    . . 4 d f 2 2 2 2 2 2 f d 4 . .
    . . 4 4 f 4 4 5 5 4 4 f 4 4 . .
    . . . . . f f f f f f . . . . .
    . . . . . f f . . f f . . . . .
`, controller.player2, SpriteKind.Player, Direction.Down);
player2Sprite.sm.setStateAnimations(SpriteAction.Idle, [
    new animation.Animation(assets.animation`witchLeft`, 200, true),
    new animation.Animation(assets.animation`witchBack`, 200, true),
    new animation.Animation(assets.animation`witchRight`, 200, true),
    new animation.Animation(assets.animation`witchForward`, 200, true)
]);
//map.placeOnTile(player2Sprite, vb.location(2, 7));
map.placeOnTile(player2Sprite, vb.location(10, 2));
player2Sprite.onTurnEnd(function () {
    isP1Turn = true;
    player1Sprite.startTurn();
});
player2Sprite.onDeath(function () {
    player1Sprite.controlsLocked = true;
    player2Sprite.controlsLocked = true;
    pause(2000);
    game.setGameOverMessage(true, "Player 1 Wins!");
    game.gameOverPlayerWin(1);
})

game.onPaint(function() {
    // draw HUD
    screen.drawLine(0, 0, 160, 0, isP1Turn ? 4 : 9);
    screen.fillRect(0, 1, 160, 22, isP1Turn ? 2 : 6);
    screen.drawLine(0, 23, 160, 23, isP1Turn ? 14 : 8);

    if (player1Sprite.storedTile)
        screen.drawImage(player1Sprite.storedTile, 5, 5);
    
    if (player2Sprite.storedTile)
        screen.drawImage(player2Sprite.storedTile, 141, 5);

    screen.drawTransparentImage(assets.image`selectedItemFrame`, 2, 2);
    screen.drawTransparentImage(assets.image`selectedItemFrame`, 138, 2);

    screen.print("P" + (isP1Turn ? "1" : "2") + " Turn", 60, 5, 1);
});

player1Sprite.startTurn();