import { Engine, Render, World, Bodies, Composites, Body, Composite, Constraint } from 'matter-js'
import { lerp } from './utils';
import { BUS_TARGET_SPEED, 
         BUS_SPEED_ERROR, 
         BUS_TORQUE_MOD_FACTOR, 
         BUS_WHEEL_RADIUS, MIN_SCALE, MAX_SCALE,
        WHEEL_MASS, BUS_WIDTH, BUS_SPRITE_SCALE_OFFSET,
        BUG_SVG_LEFT_WHEEL_POSITION_RATIO,
        BUG_SVG_RIGHT_WHEEL_POSITION_RATIO, 
        DARK_BLUE,
        LIGHT_BLUE} from './constants'

class Bus {

    constructor({ x, y, stage }) {
        this.leftWheel = null;
        this.rightWheel = null;
        this.body = null;
        this.composite = null;
        this.torque = 0.04;
        this.stage = stage;

        
        if (Math.round((MAX_SCALE - MIN_SCALE) / 0.1 * 100) % 1 !== 0) {
            console.log((MAX_SCALE - MIN_SCALE) / 0.1)
            throw new Error('Min and max scales have to be divisible by 0.1');
        }
        

        for (var i = MIN_SCALE; Math.round(i * 100) / 100 <= MAX_SCALE; i += 0.1) {
            i = Math.round(i * 100) / 100;
            var texture = PIXI.Texture.fromImage('svgs/bus2.svg?q=' + i, undefined, undefined, BUS_SPRITE_SCALE_OFFSET + i * 1.5);
            console.log(`bus_${i}`)
            PIXI.Texture.addToCache(texture, `bus_${i}`)
        }

        let container = new PIXI.Container();
        this.sprite = PIXI.Sprite.fromFrame(`bus_${MAX_SCALE}`);
        this.sprite.anchor.x = this.sprite.width / 2;
        this.sprite.anchor.y = this.sprite.height / 2;

        this.graphics = new PIXI.Graphics();

        container.addChild(this.sprite);
        container.addChild(this.graphics);
        this.stage.addChild(container);
        this.container = container;

        this.blinkStartAt = -1;

        this.init(x, y);

        var debugGraphics = new PIXI.Graphics();
        this.debugGraphics = debugGraphics;
        //this.stage.addChild(this.debugGraphics);

        let bussNumber = new PIXI.Text('18 ', {
            fontFamily : 'Averta Bold', 
            fontSize: 30, 
            fill : LIGHT_BLUE, 
            align : 'center'
        });
        bussNumber.position.y = -222;
        bussNumber.position.x = BUS_WIDTH / 2 - 80 + 140 / 2 - 15;
        this.container.addChild(bussNumber);

        setInterval(() => {
            console.log('triggerBlink');
            this.blinkStartAt = new Date().getTime() / 1000;
        }, 10000);
    }

    init(xx, yy) {
        const width = BUS_WIDTH, 
              height = 2,
              wheelSize = BUS_WHEEL_RADIUS;

        var group = Body.nextGroup(true),
            wheelBase = wheelSize,
            wheelAOffset = -width * 0.5,
            wheelBOffset = width * 0.5,
            wheelCOffset = 0,
            wheelYOffset = 0;

        var car = Composite.create({ label: 'Car' }),
            body = Bodies.rectangle(xx, yy, width, height, {
                collisionFilter: {
                    group: group
                },
                chamfer: {
                    radius: height * 0.5
                },
                density: 0.0002
            });

        var wheelA = Bodies.circle(xx + wheelAOffset, yy + wheelYOffset, wheelSize, {
            collisionFilter: {
                group: group
            },
            friction: 0.9,
            mass: WHEEL_MASS,
            label: 'wheelA',
            slop: 0.2
        });
        

        var wheelB = Bodies.circle(xx + wheelBOffset, yy + wheelYOffset, wheelSize, {
            collisionFilter: {
                group: group
            },
            friction: 0.9,
            mass: WHEEL_MASS,
            label: 'wheelB',
            slop: 0.2
        });

        var wheelC = Bodies.circle(xx + wheelCOffset, yy + wheelYOffset, wheelSize, {
            collisionFilter: {
                group: group
            },
            friction: 0.9,
            mass: 0,
            label: 'wheelB',
            slop: 0.2
        });
        
        
        var axelA = Constraint.create({
            bodyB: body,
            pointB: { x: wheelAOffset, y: wheelYOffset },
            bodyA: wheelA,
            stiffness: 0.9,
            length: 0
        });

        var axelB = Constraint.create({
            bodyB: body,
            pointB: { x: wheelBOffset, y: wheelYOffset },
            bodyA: wheelB,
            stiffness: 0.9,
            length: 0
        });

        var axelC = Constraint.create({
            bodyB: body,
            pointB: { x: wheelCOffset, y: wheelYOffset },
            bodyA: wheelC,
            stiffness: 0.4,
            length: 0
        });

        Composite.addBody(car, body);
        Composite.addBody(car, wheelA);
        Composite.addBody(car, wheelB);
        Composite.addConstraint(car, axelA);
        Composite.addConstraint(car, axelB);

        //Composite.addBody(car, wheelC);
        //Composite.addConstraint(car, axelC);

        this.composite = car;
        this.leftWheel = wheelA;
        this.rightWheel = wheelB;
        this.middleWheel = wheelC;
        this.body = body;
    }

    getComposite() {
        return this.composite;
    }

    

    showText() {
        if (this.textContainer != null) {
            this.container.removeChild(this.textContainer);
        }
        const rightEdge = 140;
        const middle = rightEdge / 2 - 15;
        const faceMiddle = BUS_WIDTH / 2 - 10;

        this.textContainer = new PIXI.Container();
        this.textContainer.position.x = BUS_WIDTH / 2 - 80;
        this.textContainer.position.y = -210;

        var graphics = new PIXI.Graphics();
        this.textContainer.addChild(graphics);


        let thisStop = new PIXI.Text('Next Stop:', {
                    fontFamily : 'Averta Semibold', 
                    fontSize: 12, 
                    fill : LIGHT_BLUE, 
                    align : 'center'
                });
        thisStop.position.y = 40;
        thisStop.position.x = -10;
        this.textContainer.addChild(thisStop);

        let stop = new PIXI.Text('Københavns \nUniversitet', {
                    fontFamily : 'Averta Bold', 
                    fontSize: 26, 
                    fill : LIGHT_BLUE,
                    lineHeight: 26.5
                });
        stop.position.y = 50;
        stop.position.x = -10;
        this.textContainer.addChild(stop);
        
        this.container.addChild(this.textContainer);

    }

    update(stageScale) {
       // console.log(this.body.speed - TARGET_SPEED, this.torque)
        if (Math.abs(this.body.speed - BUS_TARGET_SPEED) > BUS_SPEED_ERROR) {
            if (this.body.speed < BUS_TARGET_SPEED) {
                this.torque *= 1 + BUS_TORQUE_MOD_FACTOR
            }
            if (this.body.speed > BUS_TARGET_SPEED) {
                this.torque *= 1 - BUS_TORQUE_MOD_FACTOR
            }
        }
        this.leftWheel.torque = this.torque;
        this.middleWheel.torque = this.torque;
        this.rightWheel.torque = this.torque;
        
        const roundScale = Math.round(stageScale * 10) / 10;
        
        this.sprite.texture = PIXI.utils.TextureCache[`bus_${roundScale}`]
        
        if (this.textContainer != null) {
            const fadeStart = MAX_SCALE - (MAX_SCALE - MIN_SCALE) * 0.90;
            if (stageScale < fadeStart) {
                this.textContainer.alpha = lerp(this.textContainer.alpha, 0, 0.1);
            }
            else {
                this.textContainer.alpha = lerp(this.textContainer.alpha, 1, 0.1);
            }
            
        }

        if (this.sprite.texture.width != 1) {
            if (this.textContainer == null)
                this.showText();
            
            const textureW = this.sprite.texture.width;
            const textureWAtWheels = textureW - textureW * BUG_SVG_LEFT_WHEEL_POSITION_RATIO
                                        - (textureW - textureW * BUG_SVG_RIGHT_WHEEL_POSITION_RATIO);
            const scale = BUS_WIDTH / textureWAtWheels;
            
            this.sprite.scale.x = scale;
            this.sprite.scale.y = scale;

            this.debugGraphics.clear()
                .lineStyle(2, 0xffffff, 1)
                .beginFill(0xffffff, 1);
            this.debugGraphics.drawCircle(this.leftWheel.position.x, this.leftWheel.position.y, BUS_WHEEL_RADIUS)
            this.debugGraphics.drawCircle(this.rightWheel.position.x, this.rightWheel.position.y, BUS_WHEEL_RADIUS)
            this.debugGraphics.drawCircle(this.sprite.position.x, this.sprite.position.y, 10)


            this.graphics.clear()
                .lineStyle(2, DARK_BLUE, 1)
                .beginFill(DARK_BLUE, 1);
            const faceMiddle = BUS_WIDTH / 2 - 10;

            const leftEye = {
                x: faceMiddle - 65,
                y: -40
            }

            const rightEye = {
                x: faceMiddle + 65,
                y: -40
            }

            this.graphics.drawCircle(leftEye.x, leftEye.y, 5)
            this.graphics.drawCircle(rightEye.x, rightEye.y, 5)


            if (this.blinkStartAt >= 0) {
                const currentTime = new Date().getTime() / 1000;
                const secSinceStart = currentTime - this.blinkStartAt;
                
                const BLINK_TIME = 0.1;

                let y = 0;
                if (secSinceStart <= BLINK_TIME) {
                    y = (leftEye.y - 5) + 5 * secSinceStart / BLINK_TIME;
                }
                else if (secSinceStart <= BLINK_TIME * 2 ) {
                    y = leftEye.y;
                }
                else if (secSinceStart <= BLINK_TIME * 3) {
                    y = (leftEye.y) - 5 * secSinceStart / BLINK_TIME;
                }

                if (secSinceStart <= BLINK_TIME * 3) {
                    this.graphics.lineStyle(2, LIGHT_BLUE, 1)
                        .beginFill(LIGHT_BLUE, 1);
                    this.graphics.drawRect(leftEye.x - 5, y - 5, 10, 10);
                    this.graphics.drawRect(rightEye.x - 5, y - 5, 10, 10);
                    //this.graphics.drawCircle(faceMiddle + 65, y, 5)
                }
            }

        }
        //console.log('texture width', this.sprite.texture.width);

        this.container.position.x = this.body.position.x;
        this.container.position.y = this.body.position.y;
        this.container.rotation = this.body.angle;
        this.sprite.position.y = -100;
        this.sprite.position.x = -10;
        
        
        
        
        
    }

    addToWorld(world) {
        World.add(world, this.composite);
    }
}

export default Bus;