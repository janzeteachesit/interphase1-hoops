var Hoops = {
    showDebug: false
};

Hoops.Preloader = function () {};

Hoops.Preloader.prototype = {

    init: function () {

        this.input.maxPointers = 1;

        this.scale.pageAlignHorizontally = true;

        this.physics.startSystem(Phaser.Physics.P2JS);

    },

    preload: function () {

        this.load.path = 'assets/';

        this.load.atlas('player');

        this.load.physics('basket');

        this.load.bitmapFont('fat-and-tiny');

        this.load.images([ 'logo', 'ball', 'basket', 'board' ]);

    },

    create: function () {

        this.state.start('Hoops.MainMenu');

    }

};

Hoops.MainMenu = function () {};

Hoops.MainMenu.prototype = {

    create: function () {

        this.stage.backgroundColor = 0x100438;

        var logo = this.add.image(this.world.centerX, 80, 'logo');
        logo.anchor.x = 0.5;

        var start = this.add.bitmapText(this.world.centerX, 460, 'fat-and-tiny', 'CLICK TO PLAY', 64);
        start.anchor.x = 0.5;
        start.smoothed = false;

        this.input.onDown.addOnce(this.start, this);

    },

    start: function () {

        this.state.start('Hoops.Game');

    }

};

Hoops.Game = function () {

    this.score = 0;
    this.scoreText = null;

    this.shotsLeft = 10;
    this.shotsLeftText = null;

    this.player1 = null;
    this.player2 = null;
    this.player3 = null;
    this.player4 = null;
    this.player5 = null;

    this.balls = null;

    this.board = null;
    this.basket = null;

    this.boardSpeed = 80;

    this.pauseKey = null;
    this.debugKey = null;

};

Hoops.Game.prototype = {

    init: function () {

        this.physics.p2.gravity.y = 300;
        this.physics.p2.restitution = 0.8;

        this.score = 0;
        this.shotsLeft = 10;

    },

    create: function () {

        this.stage.backgroundColor = 0x100438;

        this.board = this.add.sprite(400, 120, 'board');

        this.physics.p2.enable(this.board, Hoops.showDebug);

        this.board.body.static = true;
        this.board.body.clearShapes();
        this.board.body.loadPolygon('basket', 'basket');

        var circle = this.board.body.addCircle(12, 0, 90);
        circle.sensor = true;

        this.board.body.data.gravityScale = 0;
        this.board.body.velocity.x = this.boardSpeed;

        this.board.body.onBeginContact.add(this.checkBall, this);

        this.balls = this.add.physicsGroup(Phaser.Physics.P2JS);
        this.balls.enableBodyDebug = Hoops.showDebug;

        this.basket = this.add.sprite(400, 120, 'basket');
        this.basket.anchor.set(0.5);

        this.player1 = this.add.sprite(60, 430, 'player', 'player1down');
        this.player2 = this.add.sprite(190, 410, 'player', 'player2down');
        this.player3 = this.add.sprite(320, 390, 'player', 'player3down');
        this.player4 = this.add.sprite(450, 410, 'player', 'player4down');
        this.player5 = this.add.sprite(580, 430, 'player', 'player5down');

        for (var i = 1; i <= 5; i++)
        {
            this['player' + i].name = i;
            this['player' + i].inputEnabled = true;
            this['player' + i].events.onInputDown.add(this.shoot, this);
        }

        //  Score
        this.scoreText = this.add.bitmapText(16, 0, 'fat-and-tiny', 'SCORE: 0', 32);
        this.scoreText.smoothed = false;

        this.shotsLeftText = this.add.bitmapText(660, 0, 'fat-and-tiny', 'SHOTS: ' + this.shotsLeft, 32);
        this.shotsLeftText.smoothed = false;

        //  Press P to pause and resume the game
        this.pauseKey = this.input.keyboard.addKey(Phaser.Keyboard.P);
        this.pauseKey.onDown.add(this.togglePause, this);

        //  Press D to toggle the debug display
        this.debugKey = this.input.keyboard.addKey(Phaser.Keyboard.D);
        this.debugKey.onDown.add(this.toggleDebug, this);

    },

    togglePause: function () {

        this.game.paused = (this.game.paused) ? false : true;

    },

    toggleDebug: function () {

        Hoops.showDebug = (Hoops.showDebug) ? false : true;

        this.state.restart();

    },

    checkBall: function (body, bodyB, shapeA, shapeB, equation) {

        if (shapeA.type === 1 && shapeB.type === 1)
        {
            //  We've got 2 circles, work out which one is the sensor
            var ball = shapeA.body;

            if (shapeA.sensor)
            {
                ball = shapeB.body;
            }

            if (ball.velocity[1] > 0)
            {
                //  Ball is going UP through the net, so it's a foul
                ball.parent.sprite.foul = true;
            }
            else
            {
                if (!ball.parent.sprite.foul)
                {
                    this.score++;
                    this.scoreText.text = "SCORE: " + this.score;
                }
            }
        }

    },

    shoot: function (sprite) {

        if (this.shotsLeft === 0)
        {
            return;
        }

        var ball = this.balls.getFirstDead();

        if (ball)
        {
            ball.reset(sprite.x + 80, sprite.y);
        }
        else
        {
            ball = this.balls.create(sprite.x + 80, sprite.y, 'ball');
            ball.body.setCircle(28);
            ball.body.fixedRotation = true;
        }

        ball.foul = false;

        ball.body.applyImpulseLocal([ 0, 26 ], 0, 0);

        sprite.frameName = 'player' + sprite.name + 'up';

        var tween = this.add.tween(sprite).to( { y: "-32" }, 250, "Sine.easeInOut", true, 0, 0, true);
        tween.onComplete.add(this.jumpOver, this);

        this.shotsLeft--;
        this.shotsLeftText.text = "SHOTS: " + this.shotsLeft;

    },

    jumpOver: function (sprite) {

        sprite.frameName = 'player' + sprite.name + 'down';

    },

    update: function () {

        this.balls.forEachAlive(this.checkY, this);

        if (this.board.x >= 715 && this.board.body.velocity.x > 0)
        {
            this.board.body.velocity.x = -this.boardSpeed;
        }
        else if (this.board.x <= 85 && this.board.body.velocity.x < 0)
        {
            this.board.body.velocity.x = this.boardSpeed;
        }

    },

    checkY: function (ball) {

        if (ball.y > 550)
        {
            ball.kill();

            if (this.shotsLeft === 0)
            {
                this.gameOver();
            }
        }

    },

    preRender: function () {

        this.basket.x = this.board.x;
        this.basket.y = this.board.y;

    },

    gameOver: function () {

        this.state.start('Hoops.MainMenu');

   }

};

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'game');

game.state.add('Hoops.Preloader', Hoops.Preloader);
game.state.add('Hoops.MainMenu', Hoops.MainMenu);
game.state.add('Hoops.Game', Hoops.Game);

game.state.start('Hoops.Preloader');
