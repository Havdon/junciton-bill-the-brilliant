
import 'phoenix_html'
import decomp from 'poly-decomp'


import createData from './Data';
import * as PIXI from 'pixi.js'
import { Engine, Events, Bounds, Render, World, Body, Bodies, Composites } from 'matter-js'
import { createCar, findBodyByLabe, getMousePosition } from './utils'
import Bus from './Bus';
import Terrain from './Terrain';

window.decomp = decomp;

window.onload = () => {
    const data = createData();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    var app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        antialias: true
    });
   // document.body.appendChild(app.view);


    // create an engine
    var engine = Engine.create();


    // create a renderer
    var render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: screenWidth,
            height: screenHeight,
            hasBounds: true,
            showAngleIndicator: false
        }
    });

    const bus = new Bus({
        x: screenWidth / 2,
        y: screenHeight / 2,
        stage: app.stage
    });
    //Body.setAngularVelocity(wheelA, 1);

    bus.addToWorld(engine.world);

    const terrain = new Terrain({
        world: engine.world,
        x: 0, y: screenHeight / 2 + 75,
        screenWidth,
        screenHeight,
        stage: app.stage
    })

    // run the engine
    Engine.run(engine);

    // run the renderer
    Render.run(render);
    
    function loop() {
        
        window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);

    Events.on(engine, 'beforeTick', function() {
        
        app.stage.pivot.x = bus.body.position.x;
        app.stage.pivot.y = bus.body.position.y;
        app.stage.position.x = screenWidth / 2;
        app.stage.position.y = screenHeight / 2;

        Bounds.shift(render.bounds, {
            x: bus.body.position.x - screenWidth / 2,
            y: bus.body.position.y - screenHeight / 2
        })
        //Bounds.translate(render.bounds, translate);
    });

    

    Events.on(engine, 'afterTick', function() {

        bus.update();
        terrain.update({ 
            busPosition: bus.body.position
        })

    })

    setInterval(() => {
        const y = getMousePosition().y;
        if (y > 0 && y < screenHeight) {
            terrain.setHeightValue(y)
        }
    }, 1000);

    


    
    
    var vy = 0;
    app.ticker.add(function(delta) {
        
    });
    
}