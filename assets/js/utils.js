import { Engine, Render, World, Bodies, Composites, Body, Composite, Constraint } from 'matter-js'

Array.prototype.flatMap = function(lambda) { 
    return Array.prototype.concat.apply([], this.map(lambda)); 
};

export function createCar(xx, yy, width, height, wheelSize) {
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
        friction: 0.8,
        label: 'wheelA'
    });

    var wheelB = Bodies.circle(xx + wheelBOffset, yy + wheelYOffset, wheelSize, {
        collisionFilter: {
            group: group
        },
        friction: 0.8,
        label: 'wheelB'
    });


    var axelA = Constraint.create({
        bodyB: body,
        pointB: { x: wheelAOffset, y: wheelYOffset },
        bodyA: wheelA,
        stiffness: 1,
        length: 0
    });

    var axelB = Constraint.create({
        bodyB: body,
        pointB: { x: wheelBOffset, y: wheelYOffset },
        bodyA: wheelB,
        stiffness: 1,
        length: 0
    });

    Composite.addBody(car, body);
    Composite.addBody(car, wheelA);
    Composite.addBody(car, wheelB);
    Composite.addConstraint(car, axelA);
    Composite.addConstraint(car, axelB);

    return car
}

export function findBodyByLabe(composite, label) {
    var objects = Composite.allBodies(composite);

    if (!objects)
        return null;

    const object = objects.filter(function (object) {
        return object.label === label;
    });

    return object.length === 0 ? null : object[0];
}

export function lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t;
}

var mousePos = { x: 0, y: 0 };

document.onmousemove = handleMouseMove;
setInterval(getMousePosition, 100); // setInterval repeats every X ms

function handleMouseMove(event) {
    var dot, eventDoc, doc, body, pageX, pageY;

    event = event || window.event; // IE-ism

    // If pageX/Y aren't available and clientX/Y are,
    // calculate pageX/Y - logic taken from jQuery.
    // (This is to support old IE)
    if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = event.clientX +
            (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
            (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = event.clientY +
            (doc && doc.scrollTop || body && body.scrollTop || 0) -
            (doc && doc.clientTop || body && body.clientTop || 0);
    }

    mousePos = {
        x: event.pageX,
        y: event.pageY
    };
}
export function getMousePosition() {
    return mousePos;
}