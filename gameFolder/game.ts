import prompts from 'prompts';

// Base Character class
class Character {
  name: string;
  hitPoints: number;
  attackDamage: number;
  attackChance: number;

  constructor(name: string, hitPoints: number, attackDamage: number, attackChance: number) {
    this.name = name;
    this.hitPoints = hitPoints;
    this.attackDamage = attackDamage;
    this.attackChance = attackChance;
  }

  attack(target: Character): string {
    if (Math.random() < this.attackChance) {
      target.hitPoints -= this.attackDamage;
      return `${this.name} hits ${target.name} for ${this.attackDamage} damage!`;
    }
    return `${this.name} misses ${target.name}!`;
  }

  isAlive(): boolean {
    return this.hitPoints > 0;
  }
}

// Player class
class Player extends Character {
  currentRoom: Room;

  constructor() {
    super('Hero', 10, 2, 0.75);
  }

  moveTo(room: Room): void {
    this.currentRoom = room;
  }
}

// Enemy classes
class SewerRat extends Character {
  constructor() {
    super('Sewer Rat', 2, 1, 0.5);
  }
}

class GiantDragon extends Character {
  constructor() {
    super('Giant Dragon', 4, 8, 0.9);
  }
}

// Room class
class Room {
  name: string;
  description: string;
  exits: Room[];
  enemies: Character[];

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.exits = [];
    this.enemies = [];
  }

  addExit(room: Room): void {
    this.exits.push(room);
  }

  addEnemy(enemy: Character): void {
    this.enemies.push(enemy);
  }
}

// Game class
class DungeonGame {
  private player: Player;
  private rooms: Room[];
  private isGameOver: boolean = false;

  constructor() {
    // Initialize rooms
    const entrance = new Room('Dungeon Entrance', 'A dark and damp entrance to the dungeon');
    const hallway = new Room('Hallway', 'A long, narrow hallway with strange markings on the walls');
    const chamber = new Room('Chamber', 'A large chamber filled with treasure and danger');
    const portal = new Room('Portal', 'A glowing portal that leads to freedom');

    // Set up room connections
    entrance.addExit(hallway);
    hallway.addExit(entrance);
    hallway.addExit(chamber);
    chamber.addExit(hallway);
    chamber.addExit(portal);

    // Add enemies
    hallway.addEnemy(new SewerRat());
    chamber.addEnemy(new GiantDragon());

    this.rooms = [entrance, hallway, chamber, portal];
    this.player = new Player();
    this.player.moveTo(entrance);
  }

  async startGame(): Promise<void> {
    console.log('Welcome to the DUNGEONS OF LORD OBJECT ORIENTUS!');
    
    while (!this.isGameOver) {
      await this.promptAction();
    }
  }

  private async promptAction(): Promise<void> {
    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { title: 'Look around', value: 'look' },
        { title: 'Move to another room', value: 'move' },
        { title: 'Attack an enemy', value: 'attack' },
        { title: 'Quit game', value: 'quit' }
      ]
    });

    switch (action) {
      case 'look':
        this.lookAround();
        break;
      case 'move':
        await this.moveToRoom();
        break;
      case 'attack':
        await this.attackEnemy();
        break;
      case 'quit':
        this.isGameOver = true;
        console.log('Thanks for playing!');
        break;
    }
  }

  private lookAround(): void {
    const room = this.player.currentRoom;
    console.log(`\nYou are in the ${room.name}`);
    console.log(room.description);

    if (room.enemies.length > 0) {
      console.log('Enemies present:');
      room.enemies.forEach(enemy => {
        console.log(`- ${enemy.name} (${enemy.hitPoints} HP)`);
      });
    }

    console.log('Exits:');
    room.exits.forEach(exit => {
      console.log(`- ${exit.name}`);
    });
  }

  private async moveToRoom(): Promise<void> {
    const room = this.player.currentRoom;
    const { destination } = await prompts({
      type: 'select',
      name: 'destination',
      message: 'Where would you like to go?',
      choices: room.exits.map(exit => ({
        title: exit.name,
        value: exit
      }))
    });

    this.player.moveTo(destination);
    console.log(`\nYou move to the ${destination.name}`);

    // Handle enemy attacks when entering a room
    destination.enemies.forEach(enemy => {
      if (enemy.isAlive()) {
        console.log(`\n${enemy.name} attacks you!`);
        console.log(enemy.attack(this.player));
      }
    });

    this.checkGameOver();
  }

  private async attackEnemy(): Promise<void> {
    const room = this.player.currentRoom;
    const aliveEnemies = room.enemies.filter(enemy => enemy.isAlive());

    if (aliveEnemies.length === 0) {
      console.log('\nThere are no enemies to attack!');
      return;
    }

    const { target } = await prompts({
      type: 'select',
      name: 'target',
      message: 'Which enemy would you like to attack?',
      choices: aliveEnemies.map(enemy => ({
        title: `${enemy.name} (${enemy.hitPoints} HP)`,
        value: enemy
      }))
    });

    console.log(`\nYou attack the ${target.name}!`);
    console.log(this.player.attack(target));

    if (target.isAlive()) {
      console.log(`\n${target.name} counterattacks!`);
      console.log(target.attack(this.player));
    } else {
      console.log(`\nYou defeated the ${target.name}!`);
    }

    this.checkGameOver();
  }

  private checkGameOver(): void {
    const room = this.player.currentRoom;
    
    // Check if player is dead
    if (!this.player.isAlive()) {
      this.isGameOver = true;
      console.log('\nYou have been defeated! Game over.');
      return;
    }

    // Check if player reached the portal
    if (room.name === 'Portal') {
      this.isGameOver = true;
      console.log('\nYou reached the portal and escaped the dungeon! You win!');
    }
  }
}

// Start the game
const game = new DungeonGame();
game.startGame();
