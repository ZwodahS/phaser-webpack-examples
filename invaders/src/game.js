const PIXI = require("pixi");
const p2 = require("p2");
const Phaser = require("phaser");

class DefaultState extends Phaser.State{
    constructor(game) {
        super();
        this.game = game;
        this.player = null;
        this.aliens = null;
        this.bullets = null;
        this.bulletTime = 0;
        this.cursors = null;
        this.fireButton = null;
        this.explosions = null;
        this.starfield = null;
        this.score = 0;
        this.scoreString = '';
        this.scoreText = null;
        this.lives = null;
        this.enemyBullets = null;
        this.firingTimer = 0;
        this.stateText = null;
    }
    create() {
        let game = this.game;
        game.physics.startSystem(Phaser.Physics.ARCADE);

        //  The scrolling starfield background
        this.starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');

        //  Our bullet group
        this.bullets = game.add.group();
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.bullets.createMultiple(30, 'bullet');
        this.bullets.setAll('anchor.x', 0.5);
        this.bullets.setAll('anchor.y', 1);
        this.bullets.setAll('outOfBoundsKill', true);
        this.bullets.setAll('checkWorldBounds', true);

        // The enemy's bullets
        this.enemyBullets = game.add.group();
        this.enemyBullets.enableBody = true;
        this.enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.enemyBullets.createMultiple(30, 'enemyBullet');
        this.enemyBullets.setAll('anchor.x', 0.5);
        this.enemyBullets.setAll('anchor.y', 1);
        this.enemyBullets.setAll('outOfBoundsKill', true);
        this.enemyBullets.setAll('checkWorldBounds', true);

        //  The hero!
        this.player = game.add.sprite(400, 500, 'ship');
        this.player.anchor.setTo(0.5, 0.5);
        game.physics.enable(this.player, Phaser.Physics.ARCADE);

        //  The baddies!
        this.aliens = game.add.group();
        this.aliens.enableBody = true;
        this.aliens.physicsBodyType = Phaser.Physics.ARCADE;

        this.createAliens();

        //  The score
        this.scoreString = 'Score : ';
        this.scoreText = game.add.text(10, 10, this.scoreString + this.score,
            { font: '34px Arial', fill: '#fff' });

        //  Lives
        this.lives = game.add.group();
        game.add.text(game.world.width - 100, 10, 'Lives : ',
            { font: '34px Arial', fill: '#fff' });

        //  Text
        this.stateText = game.add.text(game.world.centerX, game.world.centerY, ' ',
            { font: '84px Arial', fill: '#fff' });
        this.stateText.anchor.setTo(0.5, 0.5);
        this.stateText.visible = false;

        for (let i = 0; i < 3; i++)
        {
            let ship = this.lives.create(game.world.width - 100 + (30 * i), 60, 'ship');
            ship.anchor.setTo(0.5, 0.5);
            ship.angle = 90;
            ship.alpha = 0.4;
        }

        //  An explosion pool
        this.explosions = game.add.group();
        this.explosions.createMultiple(30, 'kaboom');
        this.explosions.forEach(this.setupInvader, this);

        //  And some controls to play the game with
        this.cursors = game.input.keyboard.createCursorKeys();
        this.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    }
    createAliens() {
        for (let y = 0; y < 4; y++)
        {
            for (let x = 0; x < 10; x++)
            {
                let alien = this.aliens.create(x * 48, y * 50, 'invader');
                alien.anchor.setTo(0.5, 0.5);
                alien.animations.add('fly', [ 0, 1, 2, 3 ], 20, true);
                alien.play('fly');
                alien.body.moves = false;
            }
        }

        this.aliens.x = 100;
        this.aliens.y = 50;

        //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
        let tween = this.game.add.tween(this.aliens).to( { x: 200 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

        //  When the tween loops it calls descend
        tween.onLoop.add(this.descend, this);
    }
    setupInvader(invader) {
        invader.anchor.x = 0.5;
        invader.anchor.y = 0.5;
        invader.animations.add('kaboom');
    }
    descend() {
        this.aliens.y += 10;
    }
    update() {
        //  Scroll the background
        this.starfield.tilePosition.y += 2;

        if (this.player.alive)
        {
            //  Reset the player, then check for movement keys
            this.player.body.velocity.setTo(0, 0);

            if (this.cursors.left.isDown)
            {
                this.player.body.velocity.x = -200;
            }
            else if (this.cursors.right.isDown)
            {
                this.player.body.velocity.x = 200;
            }

            //  Firing?
            if (this.fireButton.isDown)
            {
                this.fireBullet();
            }

            if (this.game.time.now > this.firingTimer)
            {
                this.enemyFires();
            }

            //  Run collision
            this.game.physics.arcade.overlap(this.bullets, this.aliens, this.collisionHandler, null, this);
            this.game.physics.arcade.overlap(this.enemyBullets, this.player, this.enemyHitsPlayer, null, this);
        }
    }
    collisionHandler(bullet, alien) {

        //  When a bullet hits an alien we kill them both
        bullet.kill();
        alien.kill();

        //  Increase the score
        this.score += 20;
        this.scoreText.text = this.scoreString + this.score;

        //  And create an explosion :)
        let explosion = this.explosions.getFirstExists(false);
        explosion.reset(alien.body.x, alien.body.y);
        explosion.play('kaboom', 30, false, true);

        if (this.aliens.countLiving() == 0)
        {
            this.score += 1000;
            this.scoreText.text = this.scoreString + this.score;

            this.enemyBullets.callAll('kill',this);
            this.stateText.text = " You Won, \n Click to restart";
            this.stateText.visible = true;

            //the "click to restart" handler
            this.game.input.onTap.addOnce(this.restart, this);
        }

    }
    enemyHitsPlayer(player,bullet) {
        bullet.kill();
        let live = this.lives.getFirstAlive();
        if (live)
        {
            live.kill();
        }
        //  And create an explosion :)
        let explosion = this.explosions.getFirstExists(false);
        explosion.reset(player.body.x, player.body.y);
        explosion.play('kaboom', 30, false, true);

        // When the player dies
        if (this.lives.countLiving() < 1)
        {
            player.kill();
            this.enemyBullets.callAll('kill');

            this.stateText.text=" GAME OVER \n Click to restart";
            this.stateText.visible = true;

            //the "click to restart" handler
            this.game.input.onTap.addOnce(this.restart, this);
        }

    }
    enemyFires() {
        //  Grab the first bullet we can from the pool
        let enemyBullet = this.enemyBullets.getFirstExists(false);
        let livingEnemies = [];
        this.aliens.forEachAlive(function(alien){
            // put every living enemy in an array
            livingEnemies.push(alien);
        });

        if (enemyBullet && livingEnemies.length > 0)
        {
            let random = this.game.rnd.integerInRange(0, livingEnemies.length-1);
            // randomly select one of them
            let shooter = livingEnemies[random];
            // And fire the bullet from this enemy
            enemyBullet.reset(shooter.body.x, shooter.body.y);

            this.game.physics.arcade.moveToObject(enemyBullet, this.player, 120);
            this.firingTimer = this.game.time.now + 2000;
        }

    }
    fireBullet() {
        //  To avoid them being allowed to fire too fast we set a time limit
        if (this.game.time.now > this.bulletTime)
        {
            //  Grab the first bullet we can from the pool
            let bullet = this.bullets.getFirstExists(false);

            if (bullet)
            {
                //  And fire it
                bullet.reset(this.player.x, this.player.y + 8);
                bullet.body.velocity.y = -400;
                this.bulletTime = this.game.time.now + 200;
            }
        }
    }
    resetBullet(bullet) {
        //  Called if the bullet goes out of the screen
        bullet.kill();
    }
    restart() {
        //resets the life count
        this.lives.callAll('revive');
        //  And brings the aliens back from the dead :)
        this.aliens.removeAll();
        this.createAliens();

        //revives the player
        this.player.revive();
        //hides the text
        this.stateText.visible = false;
    }
    preload() {
        this.game.load.image('bullet', 'assets/games/invaders/bullet.png');
        this.game.load.image('enemyBullet', 'assets/games/invaders/enemy-bullet.png');
        this.game.load.spritesheet('invader', 'assets/games/invaders/invader32x32x4.png', 32, 32);
        this.game.load.image('ship', 'assets/games/invaders/player.png');
        this.game.load.spritesheet('kaboom', 'assets/games/invaders/explode.png', 128, 128);
        this.game.load.image('starfield', 'assets/games/invaders/starfield.png');
        this.game.load.image('background', 'assets/games/starstruck/background2.png');
    }
    render() {}
}

class Game extends Phaser.Game {
    constructor(parent) {
        super(800, 600, Phaser.AUTO, parent, null);
        this.state.add("default", new DefaultState());
        this.state.start("default");
    }
}

export default Game;
