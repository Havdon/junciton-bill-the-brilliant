import { Engine, Render, World, Bodies, Composites, Body, Composite, Constraint } from 'matter-js'

import { BUS_TARGET_SPEED, BUS_SPEED_ERROR, BUS_TORQUE_MOD_FACTOR, BUS_WHEEL_RADIUS } from './constants'

class Bus {

    constructor({ x, y, stage }) {
        this.leftWheel = null;
        this.rightWheel = null;
        this.body = null;
        this.composite = null;
        this.torque = 0.04;
        this.stage = stage;

        var graphics = new PIXI.Graphics();
        this.stage.addChild(graphics);
        this.graphics = graphics;

        this.init(x, y);
    }

    init(xx, yy) {
        const width = 200, 
              height = 10,
              wheelSize = BUS_WHEEL_RADIUS;

        var group = Body.nextGroup(true),
            wheelBase = 20,
            wheelAOffset = -width * 0.5 + wheelBase,
            wheelBOffset = width * 0.5 - wheelBase,
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
            label: 'wheelA',
            slop: 0.1
        });

        var wheelB = Bodies.circle(xx + wheelBOffset, yy + wheelYOffset, wheelSize, {
            collisionFilter: {
                group: group
            },
            friction: 0.9,
            label: 'wheelB',
            slop: 0.1
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

        Composite.addBody(car, body);
        Composite.addBody(car, wheelA);
        Composite.addBody(car, wheelB);
        Composite.addConstraint(car, axelA);
        Composite.addConstraint(car, axelB);

        this.composite = car;
        this.leftWheel = wheelA;
        this.rightWheel = wheelB;
        this.body = body;
    }

    getComposite() {
        return this.composite;
    }

    update() {
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
        this.rightWheel.torque = this.torque;

        this.graphics.clear()
            .lineStyle(2, 0xffffff, 1)
            .beginFill(0xffffff, 1);
        this.graphics.drawCircle(this.leftWheel.position.x, this.leftWheel.position.y, BUS_WHEEL_RADIUS + 4)
        this.graphics.drawCircle(this.rightWheel.position.x, this.rightWheel.position.y, BUS_WHEEL_RADIUS + 4)
    }

    addToWorld(world) {
        World.add(world, this.composite);
    }
}

export default Bus;