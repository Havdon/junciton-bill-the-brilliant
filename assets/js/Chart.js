
import { lerp } from './utils';

export default class Chart {

    constructor({ parent, screenHeight, screenWidth, x = screenWidth / 2, y = screenHeight / 2}) {
        this.parent = parent;
        this.screenHeight = screenHeight;
        this.screenWidth = screenWidth; 
        this.visible = false;
        this.widthFixed = false;

        this.build(x, y);
    }


    build(x, y) {
        const shiftX = -300;
        const shiftY = -50;

        var container = new PIXI.Container();
        container.position.x = x;
        container.position.y = y + 100;
        container.scale.x = 1 / 3;
        container.scale.y = 1 / 3;
        this.container = container;
        this.container.alpha = 0;
        this.parent.addChild(container);

        this.containerX = container.position.x;
        this.containerY = container.position.y;

        var staticTxt = PIXI.Texture.fromImage('svgs/chart_static.svg', undefined, undefined, 3);
        this.staticSprite = new PIXI.Sprite(staticTxt);
        this.staticSprite.position.x = shiftX;
        this.staticSprite.position.y = shiftY;
        this.staticSprite.anchor.x = this.staticSprite.width / 2;
        this.staticSprite.anchor.y = this.staticSprite.height / 2;
        container.addChild(this.staticSprite);
        

        const left = 600;
        const right = 1200;
        const bottom = 250;
        const top = 500;

        var debugGraphics = new PIXI.Graphics();
        debugGraphics.position.x = shiftX;
        debugGraphics.position.y = shiftY
        debugGraphics.clear()
            .lineStyle(2, 0xffffff, 1)
            .beginFill(0xffffff, 1);
        debugGraphics.moveTo( - left,  + top);
        debugGraphics.lineTo( + right,  + top);
        debugGraphics.lineTo( + right,  - bottom);
        debugGraphics.lineTo( - left,  - bottom);
        debugGraphics.lineTo( - left,  + top);
        debugGraphics.alpha = 0.5;
        //this.debugGraphics = debugGraphics;
        container.addChild(debugGraphics);

        var dynamicTxt = PIXI.Texture.fromImage('svgs/chart_info.svg', undefined, undefined, 1);
        this.dynamicSprite = new PIXI.Sprite(dynamicTxt);
        this.dynamicSprite.position.x = shiftX;
        this.dynamicSprite.position.y = 471 + shiftY;
        this.dynamicSprite.anchor.x = this.dynamicSprite.width / 2;
        this.dynamicSprite.anchor.y = this.dynamicSprite.height;
        this.dynamicSprite.mask = debugGraphics;
        container.addChild(this.dynamicSprite);

        
        
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }


    update({ busSpeed }) {
        if (this.visible) {
            this.container.alpha = lerp(this.container.alpha, 1, 0.05);
            this.container.position.y = lerp(this.container.position.y, this.containerY, 0.1);
            this.dynamicSprite.position.x -= busSpeed * this.container.scale.x;
        }
        else {
            this.container.alpha = lerp(this.container.alpha, 0, 0.1);
            this.container.position.y = lerp(this.container.position.y, this.containerY + 50, 0.1);
            if (this.container.alpha < 0.01) {
                this.dynamicSprite.position.x = 0;
            }
        }
        if (this.container.width > 1 && !this.widthFixed) {
            this.widthFixed = true;
            
            if (this.screenWidth < this.screenHeight) {
                const PADDING = 90;
                const targetWidth = this.screenWidth - PADDING * 2;
                const scale = targetWidth / 550;
                //console.log(this.container.width, this.screenWidth, scale);
                this.container.scale.x *= scale;
                this.container.scale.y *= scale;
                
            }
            else {
                const PADDING = 35;
                const targetHeight = this.screenHeight - PADDING * 2;
                const scale = Math.min(targetHeight / 400, 2);

                this.container.scale.x *= scale;
                this.container.scale.y *= scale;
                this.containerY -= PADDING;
            }
        }
        
    }
}