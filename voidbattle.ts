enum Direction {
    Left = 0,
    Up = 1,
    Right = 2,
    Down = 3
}

enum SpriteAction {
    Idle,
    Move,
    Hurt,
    Fall,
    Die,
    Push,
    Win
}

namespace SpriteKind {
    export const Detector = SpriteKind.create();
}

namespace animation {
    const stateNamespace = "__animation";

    interface AnimationState {
        animations: SpriteAnimation[];
    }

    // this will tell the state machines that their animations are still active
    export function updateActiveStateAnimations(): void {
        let state: AnimationState = game.currentScene().data[stateNamespace];
        if(state && state.animations) {
            state.animations.forEach((anim: SpriteAnimation) => {
                if (anim.sprite instanceof vb.VBSprite) {
                    const vbs = anim.sprite as vb.VBSprite;
                    if(vbs.sm)
                        vbs.sm.animationActive = true;
                }
            });
        }
    }

    export class Animation {
        constructor(public frames: Image[], public frameInterval: number = 500, public loop: boolean = false){}
        runAnimationOnSprite(sprite: Sprite) {
            animation.runImageAnimation(sprite, this.frames, this.frameInterval, this.loop);
        }
    }

    interface AnimationMap {
        [key: number]: Animation[];
    }

    interface StateMap {
        [key: number]: number;
    }

    let stateMachines: AnimationStateMachine[];

    // should allow you to change the sprite's animation based on its direction
    // what should i put in here and what should just be part of VBSprite?
    export class AnimationStateMachine {
        dir: Direction = Direction.Down;
        lastDir: Direction = Direction.Down;
        sprite: vb.VBSprite;
        lastAction: number;
        animationActive: boolean = false;
        stateAnimations: AnimationMap = {};
        autoTransitions: StateMap = {};

        constructor(sprite: vb.VBSprite) {
            this.sprite = sprite;
            this.lastAction = sprite._action;
            this._init();
        }

        _init() {
            if (!stateMachines) {
                stateMachines = [];
                game.eventContext().registerFrameHandler(scene.ANIMATION_UPDATE_PRIORITY, () => {
                    // see which animations are still active
                    animation.updateActiveStateAnimations();

                    // remove state machines of dead sprites
                    stateMachines = stateMachines.filter((sm: AnimationStateMachine) => {
                        if (sm.sprite.flags & sprites.Flag.Destroyed)
                            return false;
                        sm.update();
                        return true;
                    });
                });
            }
            stateMachines.push(this);
        }

        update() {
            // first priority, check if the state was changed externally
            // second priority, change state if animation ended and there's an autotransition


            // detect if the action has been changed
            if(this.lastAction != this.sprite._action || this.lastDir != this.dir) {
                this.lastAction = this.sprite._action;
                this.lastDir = this.dir;
                const anim = this.getAnimationFromState(this.lastAction)
                if(anim)
                    anim.runAnimationOnSprite(this.sprite);
            } else if(!this.animationActive){
                // transition to next state
                const nextAction = this.autoTransitions[this.lastAction];
                if(nextAction !== undefined) {
                    this.lastAction = nextAction;
                    this.sprite._action = nextAction;
                    const anim = this.getAnimationFromState(nextAction);
                    if(anim)
                        anim.runAnimationOnSprite(this.sprite);
                }
            }
            this.animationActive = false;
        }

        setDirection(direction: Direction) {
            this.dir = direction;
        }

        // You should really put these in the order [left, up, right, down]
        setStateAnimations(state: number, animations: Animation[]) {
            this.stateAnimations[state] = animations;
        }

        setAutoTransition(oldState: number, newState: number) {
            this.autoTransitions[oldState] = newState;
        }

        getAnimationFromState(state: number): Animation {
            const anims: Animation[] = this.stateAnimations[state];
            if (!anims || anims.length == 0)
                return null;
            
            if (anims.length == 1 || this.dir < 0 || this.dir >= anims.length)
                return anims[0];
            
            return anims[this.dir];

        }
        //constructor(frameInterval: number, )
    }

}


namespace vb {
    const tileSize = 16;
    export class VBSprite extends sprites.ExtendableSprite {
        sm: animation.AnimationStateMachine;
        dir: Direction = Direction.Down;
        onDeathCallback: (sprite: VBSprite) => void;
        onHurtCallback: (sprite: VBSprite) => void;
        canPush: boolean = false;
        pushable: boolean = false;
        canCrush: boolean = false;
        crushable: boolean = false;
        hittable: boolean = false;
        hitboxWidth: number = 16;
        hitboxHeight: number = 16;
        health: number = 1;

        // trust me bro you dont wanna set this yourself
        location: Location;

        constructor(spriteImage: Image, loc?: Location, kind?: number, dir?: Direction) {
            super(spriteImage, kind);
            this.flags ^= SpriteFlag.GhostThroughWalls;
            this.setDimensions(this.hitboxWidth, this.hitboxHeight);
            //this._hitbox.ox = Fx8(-4);
            //this._hitbox.oy = Fx8(-4);
            this.sm = new animation.AnimationStateMachine(this);
            this._action = SpriteAction.Idle;

            if (dir)
                this.setDirection(dir);
            else
                this.setDirection(Direction.Down);

            if (loc)
                placeOnTile(this, loc);           
        }

        // Accounts for the offset from the hitbox, which is wider so we can
        // detect neighboring sprites
        draw(drawLeft: number, drawTop: number) {
            drawLeft += (this.hitboxWidth - this.image.width) >> 1;
            drawTop += (this.hitboxHeight - this.image.height) >> 1;
            super.draw(drawLeft, drawTop);
        }

        /**
         * todo: update location on the vb map from here?
         */
        setPosition(x: number, y: number): void {
            const physics = game.currentScene().physicsEngine;
            physics.moveSprite(
                this,
                Fx8(x - this.x),
                Fx8(y - this.y)
            );
            // call it a second time to correct a bug where sprites that ghost 
            // through walls are still pushed out
            physics.moveSprite(
                this,
                Fx8(x - this.x),
                Fx8(y - this.y)
            );
        }

        update(deltaTimeMillis: number) {
            if (this.tileKindAt(TileDirection.Center, assets.image`blankTile`)) {
                this._action = SpriteAction.Fall;
                //sprites.destroy(this, effects.fire, 2000);
                this.die();
            }
        }

        // if no callback function is provided, just destroy it after 2 seconds i guess
        die() {
            currentMap().removeFromMap(this);
            if (this.onDeathCallback)
                control.runInParallel(() => {
                    this.onDeathCallback(this);
                });
            else
                control.runInParallel(() => {
                    pause(2000)
                    sprites.destroy(this);
                })
        }

        onDeath(cb: (sprite: VBSprite) => void) {
            this.onDeathCallback = cb;
        }

        onHurt(cb: (sprite: VBSprite) => void) {
            this.onHurtCallback = cb;
        }

        setDirection(dir: Direction) {
            this.dir = dir;
            this.sm.setDirection(dir);
        }

        getNeighboringLocation(dir: Direction): Location {
            return this.location.getNeighbor(dir);
        }

        push(dir: Direction) {
            const loc = this.getNeighboringLocation(dir);
            if (!loc || !this.pushable || loc.isWall())
                return;

            if (!loc.isOccupied())
                placeOnTile(this, loc);

            const target = loc.getSprite()
            if (this.canCrush && target && target.crushable ) {
                sprites.destroy(target, effects.spray, 300);
                target.die();
                placeOnTile(this, loc);
            }            
        }

        hit() {
            if(!this.hittable) return;
            
            this.startEffect(effects.disintegrate, 200);
            this.health--;

            if (this.onHurtCallback)
                control.runInParallel(() => {
                    this.onHurtCallback(this);
                });
            
            if(this.health <= 0){
                sprites.destroy(this, effects.disintegrate, 500);
                this.die();
            }
        }

    }

    export const MoveCooldown = 500;
    export const MoveBuffer = 250;
    export class VBPlayerSprite extends VBSprite {
        ctrl: controller.Controller;
        isMyTurn: boolean = false;
        turnEndCallback: () => void;
        storedTile: Image;
        // failsafe if there are shenanigans with the turns
        controlsLocked: boolean = false;
        cooldownTimer = MoveCooldown;
        isInCooldown = false;
        bufferedMove: ControllerButton;

        constructor(spriteImage: Image, ctrl: controller.Controller, loc?: Location, kind?: number, dir?: Direction){
            super(spriteImage, loc, kind, dir);
            this.ctrl = ctrl;
            this._setupButtonEvents();
            this.canPush = true;
            this.pushable = true;
            this.canCrush = false;
            this.crushable = true;
            this.health = 3;
            this.hittable = true;
        }

        update(deltaTimeMillis: number) {
            super.update(deltaTimeMillis);

            if (!this.isInCooldown && this.bufferedMove) {
                console.log("buffered move time!");
                this.handleButtonInput(this.bufferedMove, ControllerButtonEvent.Pressed);
            }

            this.isInCooldown = this.cooldownTimer < MoveCooldown;
            if (this.isInCooldown)
                this.cooldownTimer = Math.min(this.cooldownTimer + deltaTimeMillis, MoveCooldown);
            
                
        }

        _setupButtonEvents() {
            // gotta do this for literally every event it seems. kill me
            // maybe there's a better way, but if there is I haven't found one
            this.ctrl.onButtonEvent(ControllerButton.Left, ControllerButtonEvent.Pressed, () => {
                this.handleButtonInput(ControllerButton.Left, ControllerButtonEvent.Pressed);
            });
            this.ctrl.onButtonEvent(ControllerButton.Right, ControllerButtonEvent.Pressed, () => {
                this.handleButtonInput(ControllerButton.Right, ControllerButtonEvent.Pressed);
            });
            this.ctrl.onButtonEvent(ControllerButton.Up, ControllerButtonEvent.Pressed, () => {
                this.handleButtonInput(ControllerButton.Up, ControllerButtonEvent.Pressed);
            });
            this.ctrl.onButtonEvent(ControllerButton.Down, ControllerButtonEvent.Pressed, () => {
                this.handleButtonInput(ControllerButton.Down, ControllerButtonEvent.Pressed);
            });
            this.ctrl.onButtonEvent(ControllerButton.A, ControllerButtonEvent.Pressed, () => {
                this.handleButtonInput(ControllerButton.A, ControllerButtonEvent.Pressed);
            });
            this.ctrl.onButtonEvent(ControllerButton.B, ControllerButtonEvent.Pressed, () => {
                this.handleButtonInput(ControllerButton.B, ControllerButtonEvent.Pressed);
            });
        }

        startTurn() {
            this.isMyTurn = true;
        }

        onTurnEnd(cb: () => void) {
            this.turnEndCallback = cb;
        }

        endTurn() {
            this.isMyTurn = false;
            this.cooldownTimer = 0;
            if( this.turnEndCallback ) this.turnEndCallback();
        }

        handleButtonInput(button: ControllerButton, event: ControllerButtonEvent) {
            if (this.controlsLocked) return;

            if (this.isInCooldown || this._action == SpriteAction.Hurt) {
                if (MoveCooldown - this.cooldownTimer <= MoveBuffer)
                    this.bufferedMove = button;
                return;
            }
            
            console.log("move time!");

            this.bufferedMove = null;

            switch(button) {
                case ControllerButton.Left:
                    this.step(Direction.Left);
                    break;
                case ControllerButton.Up:
                    this.step(Direction.Up);
                    break;
                case ControllerButton.Right:
                    this.step(Direction.Right);
                    break;
                case ControllerButton.Down:
                    this.step(Direction.Down);
                    break;
                case ControllerButton.A:
                    this.tryPrimaryAction();
                    break;
                case ControllerButton.B:
                    this.trySecondaryAction();
                    break;
            }
        }

        // step in a particular direction
        // if there is an immovable obstacle, face it but do not move
        step(dir: Direction) {
            this.setDirection(dir);
            const neighbor = this.getNeighboringLocation(dir);
            
            if (neighbor.isWall()){
                // it's a wall
                scene.cameraShake(2, 200);
            } else if (neighbor.isOccupied()) {
                // handle walking into a cell with another sprite
                neighbor.getSprite().push(dir);
                this._action = SpriteAction.Push;
            } else {
                // move
                placeOnTile(this, neighbor);
            }
            
            this.endTurn();

        }

        // attempts to interact using the A button. If the action fails, return false
        tryPrimaryAction() {
            //this.cooldownTimer = 0;
            const neighbor: Location = this.getNeighboringLocation(this.dir);
            const neighborTl: tiles.Location = neighbor.tl;
            
            if (neighbor.isWall() || neighbor.isOccupied())
                return;
            else if (tiles.tileAtLocationEquals(neighborTl, assets.image`blankTile`) && this.storedTile) {
                tiles.setTileAt(neighborTl, this.storedTile);
                this.storedTile = null;
                this.endTurn();
            } else if (!tiles.tileAtLocationEquals(neighborTl, assets.image`blankTile`) && !this.storedTile) {
                this.storedTile = tiles.getTileImage(neighborTl);
                tiles.setTileAt(neighborTl, assets.image`blankTile`);
                this.endTurn();
            }
        }

        trySecondaryAction() {
            const neighbor: Location = this.getNeighboringLocation(this.dir);
            if (neighbor.isOccupied()) {
                const s = neighbor.getSprite();
                if(s.hittable) {
                    this._action = SpriteAction.Push;
                    s.hit();
                    this.endTurn();
                }
            }
        }
    }
}

