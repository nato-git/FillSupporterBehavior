// scripts/main.js
import * as server2 from "@minecraft/server";
import * as ui from "@minecraft/server-ui";

// node_modules/scoreboard-support/index.js
import * as server from "@minecraft/server";
function get_score(score_name, player) {
  try {
    const scoreboard = server.world.scoreboard;
    let objective = scoreboard.getObjective(score_name);
    let score = objective.getScore(player.scoreboardIdentity);
    if (score != void 0) {
      return score;
    } else {
      return 0;
    }
  } catch {
    return 0;
  }
}

// scripts/main.js
var playerPositions = /* @__PURE__ */ new Map();
server2.world.afterEvents.itemUse.subscribe((ev) => {
  const player = ev.source;
  const item = ev.itemStack;
  const playerId = player.id;
  if (item.typeId === "fill:locater") {
    const loc = player.location;
    const currentPos = {
      x: Math.floor(loc.x),
      y: Math.floor(loc.y),
      z: Math.floor(loc.z)
    };
    let list = playerPositions.get(playerId) || [];
    list.push(currentPos);
    if (list.length > 2) {
      list.shift();
    }
    playerPositions.set(playerId, list);
    player.sendMessage(
      `\xA7a[Locate ${list.length}] \xA7f${currentPos.x}, ${currentPos.y}, ${currentPos.z}`
    );
  } else if (item.typeId === "fill:fill_tool") {
    const list = playerPositions.get(playerId);
    if (!list || list.length < 2) {
      player.sendMessage("\xA7c\u5EA7\u6A19\u500B\u6570\u304C\u8DB3\u308A\u307E\u305B\u3093 Insufficient coordinates");
      return;
    }
    const blockId = getBlockFromSlot(player);
    if (!blockId) {
      player.sendMessage("\xA7c\u30D6\u30ED\u30C3\u30AF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
      return;
    }
    player.sendMessage(`\xA7bExecuting: ${blockId}`);
    const p1 = list[0];
    const p2 = list[1];
    const mode = get_score("fill_mode", player);
    const fillMode = ["", "destroy", "hollow", "outline", "keep", "replace"];
    var command = "";
    var blockId_Second = "";
    if (mode != 5) {
      command = `fill ${p1.x} ${p1.y} ${p1.z} ${p2.x} ${p2.y} ${p2.z} ${blockId} ${fillMode[mode]}`;
    } else {
      blockId_Second = getBlockFromSlot_Second(player);
      if (!blockId_Second) {
        player.sendMessage("\xA7c\u7B2C\u4E8C\u30D6\u30ED\u30C3\u30AF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
        return;
      }
      command = `fill ${p1.x} ${p1.y} ${p1.z} ${p2.x} ${p2.y} ${p2.z} ${blockId} replace ${blockId_Second}`;
    }
    player.runCommandAsync(command).then(() => {
      player.sendMessage("\xA7aFill Success!");
    }).catch((err) => {
      if (mode != 5) {
        player.sendMessage(`\xA7cError: '${blockId}'\u306F\u7121\u52B9\u306A\u30D6\u30ED\u30C3\u30AFID\u3067\u3059`);
        return;
      } else {
        player.sendMessage(
          `\xA7cError: '${blockId}' \u3001\u3082\u3057\u304F\u306F${blockId_Second}\u306F\u7121\u52B9\u306A\u30D6\u30ED\u30C3\u30AFID\u3067\u3059`
        );
      }
    });
  } else if (item.typeId === "fill:phone") {
    phoneUi(player);
  }
});
function phoneUi(player) {
  const form = new ui.ActionFormData();
  form.title("Fill Mode");
  const forms = ["Normal", "Destroy", "Hollow", "Outline", "Keep", "Replace"];
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
  const inventory = player.getComponent("minecraft:inventory").container;
  const slotItem = inventory.getItem(9);
  const offhand = player.getComponent("minecraft:equippable").getEquipment("Offhand");
  if (slotItem && offhand.typeId === "fill:slot") {
    return slotItem.typeId;
  } else {
    return null;
  }
}
function getBlockFromSlot_Second(player) {
  const inventory = player.getComponent("minecraft:inventory").container;
  const slotItem = inventory.getItem(17);
  const offhand = player.getComponent("minecraft:equippable").getEquipment("Offhand");
  if (slotItem && offhand.typeId === "fill:slot") {
    return slotItem.typeId;
  } else {
    return null;
  }
}
server2.system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id === "fill:open") {
    const player = ev.sourceEntity;
    if (player && player.typeId === "minecraft:player") {
      player.runCommandAsync(`give @s fill:locater`);
      player.runCommandAsync(`give @s fill:fill_tool`);
      player.runCommandAsync(`give @s fill:slot`);
      player.runCommandAsync(`give @s fill:phone`);
      player.runCommandAsync(`scoreboard objectives add fill_mode dummy`);
      player.runCommandAsync(`scoreboard players set @s fill_mode 0`);
      player.sendMessage(
        `\xA7alocater\u3067\u4F4D\u7F6E\u3092\u4E8C\u304B\u6240\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044
fill_tool\u3067\u6307\u5B9A\u7BC4\u56F2\u3092\u6307\u5B9A\u3057\u305F\u30D6\u30ED\u30C3\u30AF\u3067\u57CB\u3081\u307E\u3059
slot\u3092\u30AA\u30D5\u30CF\u30F3\u30C9\u306B\u3001\u8A2D\u7F6E\u3057\u305F\u3044\u30D6\u30ED\u30C3\u30AF\u3092\u30A4\u30F3\u30D9\u30F3\u30C8\u30EA\u5DE6\u4E0A\u306B\u5165\u308C\u3066\u304F\u3060\u3055\u3044
phone\u3067\u30E2\u30FC\u30C9\u5909\u66F4\u304C\u3067\u304D\u307E\u3059
replace\u30E2\u30FC\u30C9\u3092\u4F7F\u3046\u5834\u5408\u3001\u30A4\u30F3\u30D9\u30F3\u30C8\u30EA\u53F3\u4E0A\u306B\u7B2C\u4E8C\u30D6\u30ED\u30C3\u30AF\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044`
      );
    }
  }
});
