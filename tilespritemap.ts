namespace vb {
    let _map: VBMap;

    interface TileSpriteMap {
        [key: string]: Sprite;
    }

    export class Location {
        constructor(public column: number, public row: number) { }

        get key() {
            return makeMapKey(this);
        }

        get tl() {
            return tiles.getTileLocation(this.column, this.row);
        }
    }

    export class VBMap {
        spriteMap: TileSpriteMap;
        
        /** 
         * attempts to place the sprite at the given location
         * returns true if the sprite was successfully placed
         * returns false otherwise, e.g. the spot was empty
         */ 
        placeOnTile(sprite: Sprite, location: Location): boolean {
            if(this.isTileOccupied(location))
                return false;
            
            const key = location.key;
            this.spriteMap[key] = sprite;
            tiles.placeOnTile(sprite, location.tl);
            return true;
        }

        /**
         * removes a sprite from a location in the internal data structure
         * please call this when you destroy a sprite bro otherwise it's gonna
         * think your sprite is still at this location
         */
        removeFromTile(location: Location) {
            const oldKey = location.key;
            if (this.spriteMap[oldKey] === undefined)
                return;
            delete this.spriteMap[oldKey];
        }

        /**
         * attempts to move a sprite at the old location to the new location 
         * returns true if successfully moved
         */
        moveFromTile(oldLocation: Location, newLocation: Location): boolean {
            const oldKey = oldLocation.key;
            const newKey = newLocation.key;
            
            // error: there's no sprite at this tile!
            if (!this.isTileOccupied(oldLocation)) return false;

            let success = this.placeOnTile(this.spriteMap[oldKey], newLocation);
            
            // error: there's already a sprite at the new tile!
            if(!success) return false;

            this.removeFromTile(oldLocation);
            return true;
        }

        /**
         * returns true if there is a sprite at the specified location
         */
        isTileOccupied(location: Location): boolean {
            const s: Sprite = this.spriteMap[location.key];
            if (s === undefined) return false;

            // clean up if it's determined there is a destroyed sprite being stored here
            if (s.flags & sprites.Flag.Destroyed) {
                this.removeFromTile(location);
                return false;
            }

            return true;
        }

        /**
         * returns the sprite at a given location if it exists
         * and isn't destroyed, returns null otherwise
         */
        getSpriteAtTile(location: Location): Sprite {
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

    export function setTilemap(tilemap: tiles.TileMapData) {
        scene.setTileMapLevel(tilemap);
    }
}
