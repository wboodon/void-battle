namespace vb {
    let _map: VBMap;

    interface TileSpriteMap {
        [key: string]: VBSprite;
    }

    export class Location {
        constructor(public column: number, public row: number) { }

        get key() {
            return makeMapKey(this);
        }

        get tl() {
            return tiles.getTileLocation(this.column, this.row);
        }

        isWall(): boolean {
            return this.tl.isWall();
        }

        isOccupied() : boolean {
            return currentMap().isTileOccupied(this);
        }

        getNeighbor(direction: Direction): Location {
            switch (direction) {
                case Direction.Up:
                    return new Location(this.column, this.row - 1);
                case Direction.Right:
                    return new Location(this.column + 1, this.row);
                case Direction.Down:
                    return new Location(this.column, this.row + 1);
                case Direction.Left:
                    return new Location(this.column - 1, this.row);
            }
        }
    }

    export class VBMap {
        spriteMap: TileSpriteMap = {};
        
        constructor() { }

        /**  
         * attempts to place the sprite at the given location
         * returns true if the sprite was successfully placed
         * returns false otherwise, e.g. the spot wasn't empty
         */ 
        placeOnTile(sprite: VBSprite, location: Location): boolean {
            // hey man you're already here. guess that's a success for you
            if (location == sprite.location)
                return true;
            
            // error: there's already a sprite at this location!
            if (this.isTileOccupied(location))
                return false;

            // remove the old location's key, but not if the sprite was already
            // at this location
            const oldLocation: Location = this.findSpriteLocation(sprite);
            if (oldLocation != location)
                this.removeAtLocation(oldLocation);
            
            // store the sprite at the new location's key
            const key = location.key;
            this.spriteMap[location.key] = sprite;
            tiles.placeOnTile(sprite, location.tl);
            sprite.location = location;
            

            return true;
        }


        removeFromMap(sprite: VBSprite) {
            const loc = this.findSpriteLocation(sprite);
            
            // the sprite isn't being tracked by the map
            if (loc === null) return;
            
            this.removeAtLocation(loc);
        }

        /**
         * Returns the location associated with this sprite in the sprite map
         * if it exists. May not be the same as the sprite's actual location if 
         * you've been messing around with the vbsprite's internal location property.
         * Returns null if no location is associated with the sprite.
         */
        findSpriteLocation(sprite: VBSprite): Location {
            const spriteLoc = sprite.location;

            // note: if the sprite doesn't have a set location, we still need to go
            // through the spriteMap just in case it's already in there for some
            // reason

            // the sprite's stored location is accurate
            if (sprite == this.spriteMap[spriteLoc.key])
                return spriteLoc;
            
            // there has been a desync. we must find the location we believe the sprite is at
            for(const k of Object.keys(this.spriteMap)) { 
                const s = this.spriteMap[k];

                if(sprite == this.spriteMap[k]) {
                    return locationFromKey(k);
                }
            }

            // this sprite is not in our system
            return null;
        }

        /**
         * removes a sprite from a location in the internal data structure
         * please call this when you destroy a sprite bro otherwise it's gonna
         * think your sprite is still at this location
         */
        private removeAtLocation(location: Location) {
            if (!location) return;
            const oldKey = location.key;
            if (this.spriteMap[oldKey] === undefined) return;
            delete this.spriteMap[oldKey];
        }

        /**
         * returns true if there is a sprite at the specified location
         */
        isTileOccupied(location: Location): boolean {
            const s: VBSprite = this.spriteMap[location.key];
            if (s === undefined) return false;

            // clean up if it's determined there is a destroyed sprite being stored here
            if (s.flags & sprites.Flag.Destroyed) {
                this.removeAtLocation(location);
                return false;
            }

            return true;
        }

        /**
         * returns the sprite at a given location if it exists
         * and isn't destroyed, returns null otherwise
         */
        getSpriteAtTile(location: Location): VBSprite {
            if (this.isTileOccupied(location))
                return this.spriteMap[location.key];
            else
                return null;
        }

        /**
         * just a wrapper for tiles.tileAtLocationIsWall()
         */
        isWall(location: Location): boolean {
            return tiles.tileAtLocationIsWall(location.tl);
        }

        /**
         * 
         */
    }

    export function currentMap(): VBMap {
        init();
        return _map;
    }

    function init() {
        if (!_map) {
            _map = new VBMap();
        }
    }

    export function makeMapKey(location: Location): string {
        return location.column + "," + location.row;
    }

    /**
     * Returns the equivalent location for a given key with format
     * "column,row", e.g. "1,7"
     * Returns null if the key is ill-formated.
     */
    export function locationFromKey(key: string): Location {
        const nums = key.split(",");
        
        // ill-formated key
        if(nums.length != 2)
            return null;

        return new Location(parseInt(nums[0]), parseInt(nums[1]));
    }

    export function setTilemap(tilemap: tiles.TileMapData) {
        scene.setTileMapLevel(tilemap);
    }

    export function location(column: number, row: number): Location {
        return new Location(column, row);
    }

    export function placeOnTile(sprite: VBSprite, location: Location): boolean {
        return currentMap().placeOnTile(sprite, location);
    }
}
