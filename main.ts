const numLevels = 3;
let level = 0;

game.showLongText("Welcome to Void Battle! This is a 2-player PvP game, so grab a friend!\n \nHappy Halloween everyone!!\n - Will B", DialogLayout.Full);

while (level < 1 || level > numLevels) {
    game.showLongText("There are " + numLevels + " levels to pick from at the moment.", DialogLayout.Full);
    level = game.askForNumber("Which level would you like to play? (1 - " + numLevels + ")", 1);
}

let p1Start = vb.location(1, 7);
let p2Start = vb.location(10, 2);

let map = vb.currentMap();
scene.centerCameraAt(96, 68);

switch(level) {
    case 1:
        tiles.setCurrentTilemap(tilemap`level0`);
        p1Start = vb.location(2, 7);
        p2Start = vb.location(9, 2); 
        break;
    case 3:
        tiles.setCurrentTilemap(tilemap`level0`);
        p1Start = vb.location(2, 7);
        p2Start = vb.location(9, 2);
        for( const loc of tiles.getTilesByType(img`
            b d d d d d d d d d d d d d d c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            d b b b b b b b b b b b b b b c
            c c c c c c c c c c c c c c c a
        `)) {
            let boulder = new vb.VBSprite(img`
    . . . . . . . . b b b b b . . .
    . . . . . . b b d d d d b b . .
    . . . . . b d d d d d d d c . .
    . . . . c d d d d d d d d c . .
    . . . c b d d d d d d d b c c .
    . . . c b b d d d d b c c c c .
    . . c c d b b b c c c c c c c .
    . . c c c d d d d c c d d d c c
    . c d b c c b b c c d d d d d c
    . c b d d b b b c c d d d d d c
    . c c b b b b c b c b d d d b c
    c b b c c c c c b b b b b c c c
    c c b b c c c c c d d d d d b c
    c c c c c c b b b b b c c c c c
    c c c c c c c b b b b b c c c c
    c c c c c c c c b b b b b c c c
`, vb.location(loc.column, loc.row));
            boulder.pushable = true;
            boulder.hittable = true;
            boulder.canCrush = true;
            boulder.health = 2;
            boulder.sm.setStateAnimations(SpriteAction.Idle, [
                new animation.Animation(assets.animation`boulder`, 200, true)
            ]);
            boulder.sm.setStateAnimations(SpriteAction.Hurt, [
                new animation.Animation(assets.animation`boulderCracked`, 200, true)
            ]);
            boulder.sm.setStateAnimations(SpriteAction.Fall, [
                new animation.Animation(assets.animation`boulderFall`, 200, false)
            ]);
            boulder.onHurt(function (sprite: vb.VBSprite) {
                sprite._action = SpriteAction.Hurt;
            });
        }
        break;
    default:
        tiles.setCurrentTilemap(tilemap`level1`);
        break;
}

//game.debug = true;
let isP1Turn: boolean = true;
let p1Dead: boolean = false;
let p2Dead: boolean = false;
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
`, controller.player1, p1Start, SpriteKind.Player, Direction.Up);
player1Sprite.sm.setStateAnimations(SpriteAction.Idle, [
    new animation.Animation(assets.animation`witchLeft`, 200, true),
    new animation.Animation(assets.animation`witchBack`, 200, true),
    new animation.Animation(assets.animation`witchRight`, 200, true),
    new animation.Animation(assets.animation`witchForward`, 200, true)
]);
player1Sprite.sm.setStateAnimations(SpriteAction.Push, [
    new animation.Animation(assets.animation`witchPushLeft`, 500, false),
    new animation.Animation(assets.animation`witchPushBack`, 500, false),
    new animation.Animation(assets.animation`witchPushRight`, 500, false),
    new animation.Animation(assets.animation`witchPushForward`, 500, false)
]);
player1Sprite.sm.setStateAnimations(SpriteAction.Hurt, [
    new animation.Animation(assets.animation`witchHurt`, 200, false)
]);
player1Sprite.sm.setStateAnimations(SpriteAction.Fall, [
    new animation.Animation(assets.animation`witchFall`, 150, false)
]);
player1Sprite.sm.setStateAnimations(SpriteAction.Win, [
    new animation.Animation(assets.animation`witchWin`, 200, false)
]);
player1Sprite.sm.setAutoTransition(SpriteAction.Hurt, SpriteAction.Idle);
player1Sprite.sm.setAutoTransition(SpriteAction.Push, SpriteAction.Idle);
//map.placeOnTile(player1Sprite, vb.location(1, 7));
player1Sprite.onTurnEnd(function() {
    isP1Turn = false;
    player2Sprite.startTurn();
});
player1Sprite.onDeath(function() {
    p1Dead = true;
    player1Sprite.controlsLocked = true;
    player2Sprite.controlsLocked = true;
    pause(500);
    player2Sprite._action = SpriteAction.Win;
    pause(1500);
    game.setGameOverMessage(true, "Player 2 Wins!");
    game.gameOverPlayerWin(2);
});
player1Sprite.onHurt(function () {
    player1Sprite._action = SpriteAction.Hurt;
});
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
`, controller.player2, p2Start, SpriteKind.Player, Direction.Down);
player2Sprite.sm.setStateAnimations(SpriteAction.Idle, [
    new animation.Animation(assets.animation`purpleWitchLeft`, 200, true),
    new animation.Animation(assets.animation`purpleWitchBack`, 200, true),
    new animation.Animation(assets.animation`purpleWitchRight`, 200, true),
    new animation.Animation(assets.animation`purpleWitchForward`, 200, true)
]);
player2Sprite.sm.setStateAnimations(SpriteAction.Push, [
    new animation.Animation(assets.animation`purpleWitchPushLeft`, 500, false),
    new animation.Animation(assets.animation`purpleWitchPushBack`, 500, false),
    new animation.Animation(assets.animation`purpleWitchPushRight`, 500, false),
    new animation.Animation(assets.animation`purpleWitchPushForward`, 500, false)
]);
player2Sprite.sm.setStateAnimations(SpriteAction.Hurt, [
    new animation.Animation(assets.animation`purpleWitchHurt`, 200, false)
]);
player2Sprite.sm.setStateAnimations(SpriteAction.Fall, [
    new animation.Animation(assets.animation`purpleWitchFall`, 150, false)
]);
player2Sprite.sm.setStateAnimations(SpriteAction.Win, [
    new animation.Animation(assets.animation`purpleWitchWin`, 200, false)
]);
player2Sprite.sm.setAutoTransition(SpriteAction.Hurt, SpriteAction.Idle);
player2Sprite.sm.setAutoTransition(SpriteAction.Push, SpriteAction.Idle);
//map.placeOnTile(player2Sprite, vb.location(2, 7));
//map.placeOnTile(player2Sprite, vb.location(10, 2));
player2Sprite.onTurnEnd(function () {
    isP1Turn = true;
    player1Sprite.startTurn();
});
player2Sprite.onDeath(function () {
    p2Dead = true;
    player1Sprite.controlsLocked = true;
    player2Sprite.controlsLocked = true;
    pause(500);
    player1Sprite._action = SpriteAction.Win;
    pause(1500);
    game.setGameOverMessage(true, "Player 1 Wins!");
    game.gameOverPlayerWin(1);
});
player2Sprite.onHurt(function () {
    player2Sprite._action = SpriteAction.Hurt;
});

/*
let boulder = new vb.VBSprite(img`
    . . . . . . . . b b b b b . . .
    . . . . . . b b d d d d b b . .
    . . . . . b d d d d d d d c . .
    . . . . c d d d d d d d d c . .
    . . . c b d d d d d d d b c c .
    . . . c b b d d d d b c c c c .
    . . c c d b b b c c c c c c c .
    . . c c c d d d d c c d d d c c
    . c d b c c b b c c d d d d d c
    . c b d d b b b c c d d d d d c
    . c c b b b b c b c b d d d b c
    c b b c c c c c b b b b b c c c
    c c b b c c c c c d d d d d b c
    c c c c c c b b b b b c c c c c
    c c c c c c c b b b b b c c c c
    c c c c c c c c b b b b b c c c
`, vb.location(2, 6));
boulder.pushable = true;
boulder.canCrush = true;
boulder.sm.setStateAnimations(SpriteAction.Idle, [
    new animation.Animation(assets.animation`boulder`, 200, true)
])

boulder = new vb.VBSprite(img`
    . . . . . . . . b b b b b . . .
    . . . . . . b b d d d d b b . .
    . . . . . b d d d d d d d c . .
    . . . . c d d d d d d d d c . .
    . . . c b d d d d d d d b c c .
    . . . c b b d d d d b c c c c .
    . . c c d b b b c c c c c c c .
    . . c c c d d d d c c d d d c c
    . c d b c c b b c c d d d d d c
    . c b d d b b b c c d d d d d c
    . c c b b b b c b c b d d d b c
    c b b c c c c c b b b b b c c c
    c c b b c c c c c d d d d d b c
    c c c c c c b b b b b c c c c c
    c c c c c c c b b b b b c c c c
    c c c c c c c c b b b b b c c c
`, vb.location(2, 5));
boulder.pushable = true;
boulder.canCrush = true;
boulder.sm.setStateAnimations(SpriteAction.Idle, [
    new animation.Animation(assets.animation`boulder`, 200, true)
])
*/
const heartImage = assets.image`heart`;
const heartSpacing = heartImage.width + 1;

const cooldownBarWidth = 78;
const panelHeight = 24;

function drawCooldownBar(sprite: vb.VBPlayerSprite, x: number, y: number, maxWidth: number, height: number) {
    const cooldownPercentage = sprite.cooldownTimer / vb.MoveCooldown;
    screen.fillRect(x, y, maxWidth * cooldownPercentage, height, 13);
}

game.onPaint(function() {
    // draw HUD
    
    // player 1 HUD
    screen.drawImage(!player1Sprite.isInCooldown ? assets.image`p1HudActive` : assets.image`hudInactive`, 0, 0);
    if (p1Dead) {
        screen.drawTransparentImage(assets.image`uhOhText`, 0, 0);
    } else if (player1Sprite._action == SpriteAction.Hurt) {
        screen.drawTransparentImage(assets.image`ouchText`, 0, 0);
    } else {
        if (player1Sprite.isInCooldown)
            drawCooldownBar(player1Sprite, 1, 1, cooldownBarWidth, panelHeight - 2);
        
        if (player1Sprite.storedTile)
            screen.drawImage(player1Sprite.storedTile, 6, 5);
        else
            screen.drawTransparentImage(assets.image`wandIcon`, 6, 5);
        
        screen.drawTransparentImage(assets.image`selectedItemFrame`, 3, 2);
        screen.drawTransparentImage(assets.image`fistIcon`, 28, 5);
        screen.drawTransparentImage(assets.image`bButtonFrameEnabled`, 25, 2);

        for (let i = 0; i < 3; i++)
            screen.drawTransparentImage((i + 1 <= player1Sprite.health) ? assets.image`heart` : assets.image`emptyHeart`, 48 + i * heartSpacing, 8);
        
    }
    
    // player 2 HUD
    screen.drawImage(!player2Sprite.isInCooldown ? assets.image`p2HudActive` : assets.image`hudInactive`, 80, 0);
    if (p2Dead) {
        screen.drawTransparentImage(assets.image`uhOhText`, 80, 0);
    } else if (player2Sprite._action == SpriteAction.Hurt) {
        screen.drawTransparentImage(assets.image`ouchText`, 80, 0);
    } else {
        if (player2Sprite.isInCooldown)
            drawCooldownBar(player2Sprite, 3 + cooldownBarWidth, 1, cooldownBarWidth, panelHeight - 2);

        if (player2Sprite.storedTile)
            screen.drawImage(player2Sprite.storedTile, 86, 5);
        else
            screen.drawTransparentImage(assets.image`wandIcon`, 86, 5);

        screen.drawTransparentImage(assets.image`selectedItemFrame`, 83, 2);
        screen.drawTransparentImage(assets.image`fistIcon`, 108, 5);
        screen.drawTransparentImage(assets.image`bButtonFrameEnabled`, 105, 2);

        for(let i = 0; i < 3; i++)
            screen.drawTransparentImage((i + 1 <= player2Sprite.health) ? assets.image`heart` : assets.image`emptyHeart`, 128 + i * heartSpacing, 8);
    }
});

player1Sprite.startTurn();