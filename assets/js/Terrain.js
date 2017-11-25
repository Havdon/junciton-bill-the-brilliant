import { Engine, Events, Bounds, Render, World, 
         Body, Bodies, Composites, Composite,
         Vertices } from 'matter-js'
import { lerp } from './utils';
import * as PIXI from 'pixi.js'

import { MAX_TERRAIN_HEIGHT, MIN_TERRAIN_HEIGHT, TERRAIN_SEGMENT_LENGTH, EDGE_BUFFER } from './constants'

class Terrain {

    constructor({ world, x, y, screenWidth, screenHeight, stage }) {
        this.mWorld = world;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.prevValue = MIN_TERRAIN_HEIGHT;
        this.value = MIN_TERRAIN_HEIGHT;
        this.lines = [];
        this.stage = stage;
        
        this.addLine({ x, y }, { x: x + screenWidth, y: y });

        this.currentX = x + screenWidth;
        this.currentY = y;

        var ground = new PIXI.Graphics();
        
        this.stage.addChild(ground);
        this.ground = ground;
    }

    setHeightValue(value) {
        this.value = MIN_TERRAIN_HEIGHT + value;
    }

    addLineFrom(start, angle, length) {
        if(angle < 0){
            angle += 360;
        }
        const endX = start.x + Math.sin(angle * 0.0174533) * length;
        const endY = start.y + Math.cos(angle * 0.0174533) * length;
        this.addLine(start, { x: endX, y: endY });
    }

    addLine(start, end) {
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;
        const diffX = end.x - start.x;
        const diffY = end.y - start.y;
        const distance = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
        const normalX = diffX / distance;
        const normalY = diffY / distance;
        let angle = Math.atan2(diffY, diffX) * 57.2958;
        if(angle < 0){
            angle += 360;
        }
        const localStart = {x: start.x - centerX, y: start.y - centerY };
        const localEnd = {x: end.x - centerX, y: end.y - centerY };
        const verticies = Vertices.clockwiseSort([
            start,
            end,
            { x: end.x, y: Math.max(end.y, start.y) + 50 },
            { x: start.x, y: Math.max(end.y, start.y) + 50 }
        ])
        
        const center = Vertices.centre(verticies);

        const line = Bodies.fromVertices(center.x, center.y, verticies, { 
            isStatic: true
        });
        this.lines.push({
            body: line,
            start,
            end,
            normal: { x: normalX, y: normalY },

        });
        World.add(this.mWorld, line);
    }

    update({ busPosition }) {
        const rightEdge = busPosition.x + this.screenWidth / 2;
        const leftEdge = busPosition.x - this.screenWidth / 2;

        // Create new line
        if (this.currentX - rightEdge < EDGE_BUFFER) {
            const y = lerp(this.currentY, this.value, 0.2);
            const x = rightEdge + TERRAIN_SEGMENT_LENGTH;
            this.addLine({ 
                x: this.currentX, 
                y: this.currentY 
            }, 
            { 
                x, 
                y 
            });
            this.currentX = x;
            this.currentY = y;
        }

        // Remove out of bounds lines
        if (this.lines.length > 0) {
            const { body, end } = this.lines[0];
            if (end.x < leftEdge - EDGE_BUFFER) {
                Composite.remove(this.mWorld, body);
                this.lines.shift();
            }
        }

        if (this.lines.length > 0) {
            let first = this.lines[0].start;
            const verticies = [new PIXI.Point(first.x, first.y)].concat(
                this.lines.map(({ start, end }) => new PIXI.Point(end.x, end.y))
            );
            const firstPoint = verticies[0];
            const lastPoint = verticies[verticies.length - 1];
            verticies.push(new PIXI.Point(lastPoint.x, lastPoint.y + 1000))
            verticies.push(new PIXI.Point(firstPoint.x, lastPoint.y + 1000))
            verticies.push(new PIXI.Point(firstPoint.x, firstPoint.y))

            this.ground.clear()
                        .lineStyle(2, 0xffffff, 1)
                        .beginFill(0xffffff, 1)
                        .drawShape(new PIXI.Polygon(verticies));
            this.ground.endFill();

           // console.log(verticies);

        }
    }
}

export default Terrain;