namespace animation {
    
    // Represents a single animation
    interface AnimationData {
        frames: Image[];
        interval: number;
        loop: boolean;
    }

    // maps a state name to an array of animations, one for each direction 
    interface CharacterAnimationSet {
        [state: string]: AnimationData[];
    }

    // put in a character name, get all its animations
    interface AllAnimations {
        [name: string]: CharacterAnimationSet;
    }

    const allAnimations: AllAnimations = {
        witch: {
            idle: [{ frames: assets.animation`witchIdleForward`, interval: 200, loop: true }],
            move: [
                { frames: assets.animation`witchLeft`, interval: 200, loop: true },
                { frames: assets.animation`witchBack`, interval: 200, loop: true },
                { frames: assets.animation`witchRight`, interval: 200, loop: true },
                { frames: assets.animation`witchForward`, interval: 200, loop: true }
            ],
            hurt: [{ frames: assets.animation`witchHurt`, interval: 200, loop: false}],
            fall: [{ frames: assets.animation`witchFall`, interval: 150, loop: false}],
            win: [{ frames: assets.animation`witchWin`, interval: 200, loop: false }],
            push: [
                { frames: assets.animation`witchPushLeft`, interval: 500, loop: false },
                { frames: assets.animation`witchPushBack`, interval: 500, loop: false },
                { frames: assets.animation`witchPushRight`, interval: 500, loop: false },
                { frames: assets.animation`witchPushForward`, interval: 500, loop: false }
            ]
        },
        boulder: {
            idle: [{ frames: assets.animation`boulder`, interval: 200, loop: true }],
            hurt: [{ frames: assets.animation`boulderCracked`, interval: 200, loop: true }],
            fall: [{ frames: assets.animation`boulderFall`, interval: 200, loop: false }]
        }
    }

    export function getStateAnimations(character: string, state: string): Animation[] {
        if (!allAnimations[character]) return [];

        const data : AnimationData[] = allAnimations[character][state];
        if (!data) return [];

        let anims: Animation[] = []
        for (const d of data) {
            anims.push(new Animation(d.frames, d.interval, d.loop));
        }
        return anims;
    }

}