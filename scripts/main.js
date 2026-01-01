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
    player.sendMessage(`§e[Debug] インベントリを検索中...`);
    const blockId = getBlockFromSlot(player);
    if (!blockId) {
      player.sendMessage(
        '§cブロックが見つかりません (fill:slotの中にブロックを入れてください)'
      );
      return;
    }

    // 設置用メッセージ
    player.sendMessage(`§bExecuting: ${blockId}`);

    const p1 = list[0];
    const p2 = list[1];

    const command = `fill ${p1.x} ${p1.y} ${p1.z} ${p2.x} ${p2.y} ${p2.z} ${blockId}`;
    player
      .runCommandAsync(command)
      .then(() => {
        player.sendMessage('§aFill Success!');
      })
      .catch((err) => {
        player.sendMessage(`§cError: '${blockId}' は無効なブロックIDです`);
      });
  }
});

function getBlockFromSlot(player) {
  const inventory = player.getComponent('minecraft:inventory').container;
  const slotItem = inventory.getItem(9);
  const offhand = player
    .getComponent('minecraft:equippable')
    .getEquipment('Offhand');
  if (slotItem && offhand.typeId === 'fill:slot') {
    return slotItem.typeId;
  } else {
    return null;
  }
}

server.system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id === 'fill:open') {
    const player = ev.sourceEntity;
    if (player && player.typeId === 'minecraft:player') {
      player.runCommandAsync(`give @s fill:locater`);
      player.runCommandAsync(`give @s fill:fill_tool`);
      player.runCommandAsync(`give @s fill:slot`);
      player.sendMessage('§alocaterで位置を二か所指定してください');
      player.sendMessage('§afill_toolで指定範囲を指定したブロックで埋めます');
      player.sendMessage(
        '§aslotをオフハンドに、設置したいブロックをインベントリ左上に入れてください'
      );
    }
  }
});
