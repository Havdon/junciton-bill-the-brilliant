import { Engine, Events, Bounds, Render, World, 
         Body, Bodies, Composites, Composite,
         Vertices } from 'matter-js'
import { lerp } from './utils';
import * as PIXI from 'pixi.js'

import { MAX_TERRAIN_HEIGHT, MIN_TERRAIN_HEIGHT, 
         TERRAIN_SEGMENT_LENGTH, EDGE_BUFFER, ASSUMED_MAX_BUS_REAL_SPEED,
         LIGHT_BLUE, DARK_BLUE } from './constants'

import Chart from './Chart';

import R from 'ramda';

const SIGN_DEFAULT_SCALE = 0.5;

class Terrain {

    constructor({ world, x, y, screenWidth, screenHeight, stage, staticContainer }) {
        this.mWorld = world;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.prevValue = MIN_TERRAIN_HEIGHT;
        this.value = MIN_TERRAIN_HEIGHT;
        this.lines = [];
        this.stage = stage;
        
        

        this.currentX = x + screenWidth;
        this.currentY = y;

        var ground = new PIXI.Graphics();
        
        this.stage.addChild(ground);
        this.ground = ground;

        this.chart = new Chart({
            parent: staticContainer,
            screenHeight,
            screenWidth
        });

        this.seenValues = [];
        this.lastCreatedSpeedSign = -1;
        this.signs = [];

        this.addLine({ x, y }, { x: x + screenWidth, y: y });
    }

    addSpeedSprite(x, y, speed) {
        /*
        var debugGraphics = new PIXI.Graphics();
        debugGraphics.clear()
            .lineStyle(2, 0xffffff, 1)
            .beginFill(0xffffff, 1);
        debugGraphics.drawCircle(0, 0, 10);
        debugGraphics.position.x = x;
        debugGraphics.position.y = y;
        this.ground.addChild(debugGraphics);
        */

        var signTexture = PIXI.Texture.fromImage('svgs/speed_sign.svg', undefined, undefined, 2);
        
        const signSprite = new PIXI.Sprite(signTexture);
        signSprite.position.x = x;
        signSprite.posY = y;
        signSprite.speed = speed;
        signSprite.position.y = y + 10;
        signSprite.alpha = 0;
        signSprite.pivot.x = signSprite.width / 2;
        this.ground.addChild(signSprite);

        let speedText = new PIXI.Text('' + speed, {
            fontFamily : 'Averta Bold', 
            fontSize: 70,
            fill : DARK_BLUE, 
            align : 'center'
        });
        speedText.anchor = new PIXI.Point(0.5, 0.5);
        speedText.position.y = 95;
        speedText.position.x = 75;
        signSprite.addChild(speedText);


        this.signs.push(signSprite);
    }

    speedToHeight(speed) {
        return MIN_TERRAIN_HEIGHT + (MAX_TERRAIN_HEIGHT - MIN_TERRAIN_HEIGHT) * (speed / ASSUMED_MAX_BUS_REAL_SPEED);
    }

    heightToSpeed(height) {
        return (height - MIN_TERRAIN_HEIGHT) / (MAX_TERRAIN_HEIGHT - MIN_TERRAIN_HEIGHT) * ASSUMED_MAX_BUS_REAL_SPEED;;
    }

    setHeightValue(value) {
        this.value = this.speedToHeight(value);
        
        const roundSpeed = 20 * Math.floor(value/20);
        const found = !R.isNil(R.find(R.propEq('speed', roundSpeed), this.seenValues));
        if (found) {
            this.seenValues.push({
                speed: roundSpeed,
                value: this.value
            })
        }
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
            end
        });
        World.add(this.mWorld, line);

        const speed = Math.round(this.heightToSpeed(end.y));
        const roundSpeed = Math.floor(speed / 20) * 20;
        
        if (roundSpeed !== this.lastCreatedSpeedSign) {
            if (Math.abs(speed - roundSpeed) < 5) {
                this.addSpeedSprite(end.x, end.y, roundSpeed);
                this.lastCreatedSpeedSign = roundSpeed;
                
            }
        }
        /*
        if (this.seenValues.length > 0) {
            const first = this.seenValues[0];
            if (diffY > 0) {
                if (first.y > first.value) {
                    console.log('Passed', first.value);
                }
            } else {
                if (first.y < first.value) {
                    
                }
            }
        }*/
    }

    buildBody() {
        if (this.body) {
            Composite.remove(this.mWorld, this.body);
        }
        let first = this.lines[0].start;
        let last = this.lines[this.lines.length - 1].end;
        let verticies = [first].concat(
            this.lines.map(({ start, end }) => end)
        )
        .concat([
            {x: last.x, y: last.y + 1000},
            {x: first.x, y: last.y + 1000}
        ])
        
        const center = Vertices.centre(verticies);
        verticies = verticies.map(({ x, y }) => 
            ({ x: x - center.x, y: y - center.y })
        )

        this.body = Bodies.fromVertices(center.x, center.y, verticies, { 
            isStatic: true
        });
        World.add(this.mWorld, this.body);
    }

    update({ busPosition, stageScale, heightScale, busSpeed }) {
        const rightEdge = busPosition.x + this.screenWidth / 2 / stageScale;
        const leftEdge = busPosition.x - this.screenWidth / 2 / stageScale;
        
        // Create new line
        if (this.currentX - rightEdge < EDGE_BUFFER * stageScale) {
            let diff = this.value - this.currentY;
            const sign = Math.sign(diff);
            diff = Math.sign(diff) * Math.min(10, Math.abs(diff));
            
            const y = this.currentY + diff;
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
            if (end.x < leftEdge - 10000 * stageScale) {
                Composite.remove(this.mWorld, body);
                this.lines.shift();
            }
        }

        if (heightScale > 0.75) {
            this.chart.show();
        }
        else {
            this.chart.hide();
        }
        
        

        if (this.lines.length > 0) {
            //this.buildBody();

            // Draw
            let first = this.lines[0].start;
            const verticies = [new PIXI.Point(first.x, first.y)].concat(
                this.lines.map(({ start, end }) => new PIXI.Point(end.x, end.y))
            );
            const firstPoint = verticies[0];
            const lastPoint = verticies[verticies.length - 1];
            verticies.push(new PIXI.Point(lastPoint.x, lastPoint.y + 1000 / stageScale))
            verticies.push(new PIXI.Point(firstPoint.x, lastPoint.y + 1000 / stageScale))
            verticies.push(new PIXI.Point(firstPoint.x, firstPoint.y))

            this.ground.clear()
                        .lineStyle(2, DARK_BLUE, 1)
                        .beginFill(DARK_BLUE, 1)
                        .drawShape(new PIXI.Polygon(verticies));
            this.ground.endFill();

           // console.log(verticies);

        }

        this.chart.update({
            busSpeed
        });


        for (var i in this.signs) {
            const sign = this.signs[i];
            if (sign.scale) {
                sign.scale.x = SIGN_DEFAULT_SCALE * 1 / stageScale;
                sign.scale.y = SIGN_DEFAULT_SCALE * 1 / stageScale;
                sign.position.y = sign.posY + 15 * stageScale;
                if (sign.speed > 0) {
                    sign.alpha = lerp(sign.alpha, 1, 0.1);
                }
            }
        }
    }
}

export default Terrain;