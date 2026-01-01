import * as server from '@minecraft/server';

const playerPositions = new Map();

server.world.afterEvents.itemUse.subscribe((ev) => {
  const player = ev.source;
  const item = ev.itemStack;
  const playerId = player.id;
  if (item.typeId === 'fill:locater') {
    const loc = player.location;
    const currentPos = {
      x: Math.floor(loc.x),
      y: Math.floor(loc.y),
      z: Math.floor(loc.z),
    };
    let list = playerPositions.get(playerId) || [];
    list.push(currentPos);
    if (list.length > 2) {
      list.shift();
    }
    playerPositions.set(playerId, list);
    player.sendMessage(
      `§a[Locate ${list.length}] §f${currentPos.x}, ${currentPos.y}, ${currentPos.z}`
    );
  } else if (item.typeId === 'fill:fill_tool') {
    const list = playerPositions.get(playerId);

    if (!list || list.length < 2) {
      player.sendMessage('§c座標個数が足りません Insufficient coordinates');
      return;
    }
    const blockId = getBlockFromSlot(player);
    if (!blockId) {
      player.sendMessage(
        '§cスロット内にアイテムが見つかりません No found item in slot'
      );
      return;
    }
    const p1 = list[0];
    const p2 = list[1];
    player.runCommandAsync(
      `fill ${p1.x} ${p1.y} ${p1.z} ${p2.x} ${p2.y} ${p2.z} ${blockId}`
    );
  }
});

function getBlockFromSlot(player) {
  const inventory = player.getComponent('minecraft:inventory').container;

  for (let i = 0; i < inventory.size; i++) {
    const item = inventory.getItem(i);
    if (item && item.typeId === 'fill:slot') {
      const storage = item.getComponent('minecraft:storage_item');
      if (storage && storage.container) {
        const firstItem = storage.container.getItem(0);
        if (firstItem) return firstItem.typeId;
      }
    }
  }
  return null;
}

server.system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id === 'fill:open') {
    const player = ev.sourceEntity;
    if (player && player.typeId === 'minecraft:player') {
      player.runCommandAsync(`give @s fill:locater`);
      player.runCommandAsync(`give @s fill:fill_tool`);
      player.runCommandAsync(`give @s fill:slot`);
    }
  }
});
