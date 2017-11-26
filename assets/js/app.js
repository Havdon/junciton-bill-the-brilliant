
import 'phoenix_html'
import { createCar, findBodyByLabe, getMousePosition, lerp } from './utils'
import { MAX_TERRAIN_HEIGHT, MIN_TERRAIN_HEIGHT, MIN_SCALE, MAX_SCALE, LIGHT_BLUE } from './constants';

import createData from './Data';
import * as PIXI from 'pixi.js'
import { Runner, Engine, Events, Bounds, Render, World, Body, Bodies, Composites } from 'matter-js'
import Bus from './Bus';
import Terrain from './Terrain';
import FontFaceObserver from 'fontfaceobserver'
import BezierEasing from 'bezier-easing'

var easing = BezierEasing(0.34, 0.01, 0.91, 0.21);

window.onload = () => {
    var font = new FontFaceObserver('Averta Semibold');


    font.load().then(() => {
        var fontB = new FontFaceObserver('Averta Bold');
        return fontB.load();
    }).then(() => {
        init();
    })

}

const init = () => {


    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    var app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        antialias: true,
        backgroundColor: LIGHT_BLUE
    });
    document.body.appendChild(app.view);

    function start() {
        const data = createData();

        var movingContainer = new PIXI.Container();
        app.stage.addChild(movingContainer);

        var staticContainer = new PIXI.Container();
        app.stage.addChild(staticContainer);

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
            y: MIN_TERRAIN_HEIGHT - 100,
            stage: movingContainer
        });
        //Body.setAngularVelocity(wheelA, 1);

        bus.addToWorld(engine.world);

        const terrain = new Terrain({
            world: engine.world,
            x: -100, y: MIN_TERRAIN_HEIGHT,
            screenWidth,
            screenHeight,
            stage: movingContainer,
            staticContainer
        })

        // run the engine
        Engine.run(engine);

        // run the renderer
        Render.run(render);

        function loop() {

            window.requestAnimationFrame(loop);
        }
        window.requestAnimationFrame(loop);

        Events.on(engine, 'afterTick', function () {
            const heightScale = (bus.body.position.y - MIN_TERRAIN_HEIGHT) / (MAX_TERRAIN_HEIGHT - MIN_TERRAIN_HEIGHT);
            const targetScale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * easing(1 - heightScale);
            movingContainer.scale.x = lerp(movingContainer.scale.x, targetScale, 0.1);
            movingContainer.scale.y = lerp(movingContainer.scale.y, targetScale, 0.1);

            bus.update(movingContainer.scale.x);
            terrain.update({
                busPosition: bus.body.position,
                stageScale: targetScale,
                heightScale,
                busSpeed: bus.body.speed
            })
            //console.log(heightScale);

            movingContainer.pivot.x = bus.body.position.x;
            movingContainer.pivot.y = bus.body.position.y;
            movingContainer.position.x = screenWidth / 2;
            movingContainer.position.y = (screenHeight * 0.75) - ((screenHeight * 0.75 - screenHeight * 0.10) * heightScale);


            // Matter js
            Bounds.shift(render.bounds, {
                x: bus.body.position.x - screenWidth / 2,
                y: bus.body.position.y - screenHeight / 2
            })

        })

        setInterval(() => {
            terrain.setHeightValue(data.speed);
            /*
            const y = getMousePosition().y;
            if (y > 0 && y < screenHeight) {
                terrain.setHeightValue(y)
            }
            */
        }, 1000);

    }

    let started = false;
    let spaceDown = false;
    document.body.onkeyup = function(e){
        if (e.keyCode === 32) {
            if (!started) {
                start();            
                started = true;
            }
        }
    };

    


}