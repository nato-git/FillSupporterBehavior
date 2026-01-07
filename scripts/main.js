import * as server from '@minecraft/server';
import * as ui from '@minecraft/server-ui';
import * as score from 'scoreboard-support';

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

    // 設置用メッセージ

    if (blockId) {
      player.sendMessage(`§bExecuting: ${blockId}`);
    } else {
      player.sendMessage(`§bExecuting: minecraft:air`);
    }

    const p1 = list[0];
    const p2 = list[1];

    const mode = score.get_score('fill_mode', player);
    const fillMode = ['', 'destroy', 'hollow', 'outline', 'keep', 'replace'];
    var command = '';
    var blockId_Second = '';
    if (!blockId) {
      command = `fill ${p1.x} ${p1.y} ${p1.z} ${p2.x} ${p2.y} ${p2.z} minecraft:air ${fillMode[mode]}`;
    }
    if (mode != 5) {
      command = `fill ${p1.x} ${p1.y} ${p1.z} ${p2.x} ${p2.y} ${p2.z} ${blockId} ${fillMode[mode]}`;
    } else {
      blockId_Second = getBlockFromSlot_Second(player);
      if (!blockId_Second) {
        player.sendMessage('§c第二ブロックが見つかりません');
        return;
      }
      command = `fill ${p1.x} ${p1.y} ${p1.z} ${p2.x} ${p2.y} ${p2.z} ${blockId} replace ${blockId_Second}`;
    }
    player
      .runCommandAsync(command)
      .then(() => {
        player.sendMessage('§aFill Success!');
      })
      .catch((err) => {
        if (mode != 5) {
          player.sendMessage(`§cError: '${blockId}'は無効なブロックIDです`);
          return;
        } else {
          player.sendMessage(
            `§cError: '${blockId}' 、もしくは${blockId_Second}は無効なブロックIDです`
          );
        }
      });
  } else if (item.typeId === 'fill:phone') {
    phoneUi(player);
  }
});

function phoneUi(player) {
  const form = new ui.ActionFormData();
  form.title('Fill Mode');
  const forms = ['Normal', 'Destroy', 'Hollow', 'Outline', 'Keep', 'Replace'];
  for (const modes of forms) {
    form.button(modes);
  }
  form.show(player).then((response) => {
    if (response.canceled) {
      return;
    } else {
      const mode = response.selection;
      player.sendMessage(`Selected mode: ${forms[mode]}`);
      player.runCommandAsync(`scoreboard players set @s fill_mode ${mode}`);
    }
  });
}

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
function getBlockFromSlot_Second(player) {
  const inventory = player.getComponent('minecraft:inventory').container;
  const slotItem = inventory.getItem(17);
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
      player.runCommandAsync(`give @s fill:phone`);
      player.runCommandAsync(`scoreboard objectives add fill_mode dummy`);
      player.runCommandAsync(`scoreboard players set @s fill_mode 0`);
      player.sendMessage(
        `§alocaterで位置を二か所指定してください
fill_toolで指定範囲を指定したブロックで埋めます
slotをオフハンドに、設置したいブロックをインベントリ左上に入れてください
phoneでモード変更ができます
replaceモードを使う場合、インベントリ右上に第二ブロックを入れてください`
      );
    }
  }
});
