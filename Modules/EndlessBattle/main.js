function EndlessBattle()
{
	this.moduleActive = true;
	this.name = "EndlessBattle";
	this.version = 1.3;
	this.baseUrl = FrozenBattle.baseUrl + '/Modules/EndlessBattle';
	this.scripts = [ FrozenBattle.baseUrl + '/data.js', FrozenBattle.baseUrl + '/core.js' ];
	
	this.settings = undefined;
	
	this.lastUpdateTime = Date.now();
	this.lastAttackTime = Date.now();
	
	this.updateTimePassed = 0;
		
	//---------------------------------------------------------------------------
	// main code
	//---------------------------------------------------------------------------
	this.init = function()
	{
		FrozenUtils.log("Loading Endless battle module");
		this.settings = new FrozenBattle.EndlessBattleSettings();
		this.settings.load();
		
		if(game == undefined || game.itemCreator == undefined || game.itemCreator.createRandomItem == undefined)
		{
			FrozenUtils.log("Endless battle was not detected, disabling module!");
			this.moduleActive = false;
			return;
		}
		
		// Store the native methods
		game.native_update = update;
		game.native_createRandomItem = game.itemCreator.createRandomItem;
		game.native_save = game.save;
		game.native_load = game.load;
		game.player.native_getCritChance = game.player.getCritChance;
		game.mercenaryManager.native_purchaseMercenary = game.mercenaryManager.purchaseMercenary;
		
		// Override with our own
		update = this.onUpdate;
		game.itemCreator.createRandomItem = this.onCreateRandomItem;
		game.save = this.onSave;
		game.load = this.onLoad;
		game.player.getCritChance = this.onGetCritChance;
		game.mercenaryManager.purchaseMercenary = this.onPurchaseMercenary;
		
		// Override item tooltips
		this.native_equipItemHover = equipItemHover;
		this.native_inventoryItemHover = inventoryItemHover;
		equipItemHover = this.onEquipItemHover;
		inventoryItemHover = this.onInventoryItemHover;
		
		// Override the formatter
		this.native_formatMoney = Number.prototype.formatMoney;
		Number.prototype.formatMoney = this.onFormatMoney;
		
		// Store some other variables from the core game
		this.minRarity = ItemRarity.COMMON;
		this.maxRarity = ItemRarity.LEGENDARY;
		
		this.initializeUI();
		
		this.temp_fixPlayerHealth();
		
		FrozenUtils.log("Endless battle module version " + this.getFullVersionString());
	}
	
	this.onPurchaseMercenary = function(type) {
		game.mercenaryManager.native_purchaseMercenary(type);
		FrozenBattle.EndlessBattle.updateUI();
	}
	
	this.onGetCritChance = function() {
		var chance = game.player.native_getCritChance();
		if(chance > 90){
			return 90;
		}
		
		return chance;
	}
	
	this.onUpdate = function()
	{
		FrozenBattle.EndlessBattle.update();
	}
	
	this.onSave = function()
	{
		FrozenBattle.EndlessBattle.save();
	}
	
	this.onLoad = function()
	{
		FrozenBattle.EndlessBattle.load();
	}
	
	this.onFormatMoney = function(c, d, t)
	{
		var self = FrozenBattle.EndlessBattle;
		var formatterKey = FrozenCore.FormatterKeys[self.settings.numberFormatter];
		if(FrozenCore.Formatters[formatterKey] != undefined)
		{
			var formatter = FrozenCore.Formatters[formatterKey];
			return formatter(parseInt(this)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		} 
		else
		{
			return self.nativeFormatMoney(this, c, d, t);
		}
	}
	
	this.onEquipItemHover = function(obj, index)
	{
		var self = FrozenBattle.EndlessBattle;
		self.native_equipItemHover(obj, index);		
		
		var item = game.inventory.slots[index - 1];
		if(!item)
		{
			return;
		}
				
		$("#itemTooltipSellValue").html(item.sellValue.formatMoney());
	}
	
	this.onInventoryItemHover = function(obj, index)
	{
		var self = FrozenBattle.EndlessBattle;
		self.native_inventoryItemHover(obj, index);		
		
		var item = game.inventory.slots[index - 1];
		if(!item)
		{
			return;
		}
		
		$("#itemTooltipSellValue").html(item.sellValue.formatMoney(2));
		var equippedSlot = self.getItemSlotNumber(item.type);
		var item2 = game.equipment.slots[equippedSlot];
		if(item2)
		{
			$("#itemCompareTooltipSellValue").html(item2.sellValue.formatMoney(2));
		}
	}
	
	this.save = function()
	{
		game.native_save();
		
		this.settings.save();
		
		localStorage.fb_version = this.version;
	}
	
	this.load = function()
	{
		game.native_load();
		
		this.settings.load();
	}
	
	this.update = function()
	{
		game.native_update();
		
		if(!this.moduleActive || this.settings.disabled)
		{
			return;
		}
		
	    var currentTime = Date.now();
	    this.updateTimePassed += (currentTime - this.lastUpdateTime);
	    if(this.updateTimePassed >= this.settings.updateInterval)
	    {
	    	this.finishMonster(currentTime);
	        this.autoCombat(currentTime);
	        this.autoSell(currentTime);
	        this.updateTimePassed -= this.settings.updateInterval;
	    }
	    
	    lastUpdateTime = currentTime;
	}
	
	this.finishMonster = function(time)
	{
		// This will only go into effect if the monster shows as 0 health to fix floating health issues
		if (!game.inBattle || !game.monster.alive || game.monster.health >= 1)
		{
			return;
		}
		
		// Force the game to attack to resolve the dead monster
		game.monster.alive = false;
		game.attack();
	}
	
	this.autoCombat = function(time)
	{
		if (!this.settings.autoCombatActive)
		{
			return;
		}
		
	    var autoAttackTime = this.getAutoAttackTime();
	    if(time - this.lastAttackTime < autoAttackTime)
	    {
	        return;
	    }
	    
	    this.lastAttackTime = time;
	    
	    // If we don't have enough health don't auto attack
	    var healthThreshold = game.player.getMaxHealth() / 2;
	    if(game.player.health < healthThreshold)
	    {
	        return;
	    }
	    
	    // Ensure that we fight on the minimum level
	    var currentDiff = game.player.level - game.battleLevel;
	    if(currentDiff > this.settings.autoCombatMaxLevelDifference)
	    {
	        if(game.inBattle == true)
	        {
	            game.leaveBattle();
	        }
	        while(currentDiff > this.settings.autoCombatMaxLevelDifference)
	        {
	        	game.increaseBattleLevel();
	            currentDiff--;
	        }
	    }
	    
	    // Enter battle
	    if (game.inBattle == false && game.player.alive)
	    {
	        game.enterBattle();
	    }
	    
	    var doubleHitChance = this.getDoubleHitChance();
	    var attacks = 1;
	    if(Math.random() < doubleHitChance)
	    {
	    	attacks++;
	    }
	    
	    while(attacks >= 1)
	    {
	        game.attack();
	        attacks--;
	    }
	}
	
	this.getAutoAttackTime = function()
	{
	    var time = 10000;
	    time -= game.mercenaryManager.footmenOwned * 10;
	    time -= game.mercenaryManager.clericsOwned * 15;
	    time -= game.mercenaryManager.magesOwned * 20;
	    time -= game.mercenaryManager.thiefsOwned * 25;
	    time -= game.mercenaryManager.warlocksOwned * 30;
	    var multiplier = 1.0 + game.mercenaryManager.commandersOwned * 0.1;
	    time /= multiplier;
	    if(time < 10)
	    {
	        return 10;
	    }
	    
	    return time / multiplier;
	}
	
	this.getDoubleHitChance = function()
	{
		var baseChance = 0.01;
		var chance = game.player.native_getCritChance();
		if(chance > 90)
		{
			baseChance += (chance - 90) / 1000;
		}
		
		return baseChance;
	}
	
	this.autoSell = function(time)
	{
		if (!this.settings.autoSellActive)
		{
			return;
		}
		
	    // Check the inventory
	    var freeSlots = 0;
	    for (var slot = 0; slot < game.inventory.slots.length; slot++) 
	    {
	        if (game.inventory.slots[slot] != null) 
	        {
	            var item = game.inventory.slots[slot];
	            var rarity = this.getRarityNumber(item.rarity);
	            if (rarity >= this.settings.autoSellThreshold)
	            {
	                continue;
	            }
	            
	            if(this.settings.detailedLogging)
	            {
	            	FrozenUtils.log("sold " + this.getRarityString(rarity) + " " + item.name + " for " + item.sellValue.formatMoney(2));
	            }
	            
	            game.inventory.sellItem(slot);
	        }
	        else
	        {
	            freeSlots++;
	        }
	    }
	    
	    if(freeSlots == 0)
	    {
	    	FrozenUtils.log("Inventory full, selling all items!");
	        game.inventory.sellAll();
	    }
	}
	
	this.onCreateRandomItem = function(level, rarity)
	{
		return FrozenBattle.EndlessBattle.createRandomItem(level, rarity);
	}
	
	this.createRandomItem = function(level, rarity)
	{		
	    var item = game.native_createRandomItem(level, rarity);
	    if(item == null)
	    {
	        return null;
	    }
	    
	    if (this.settings.enchantingEnabled)
	    {
	    	this.enchantItem(item);
	    }
	    
	    if (this.settings.improvedSalePriceEnabled)
	    {
	    	this.updateSalePrice(item);
	    }
	    
	    if(this.settings.detailedLogging)
        {
	    	FrozenUtils.log("Found " + item.name);
        }
	    
	    return item;
	}
	
	this.enchantItem = function(item)
	{
		var enchantChance = this.settings.enchantingBaseChance;
	    var bonus = 0;
	    while(Math.random() <= enchantChance)
	    {
	        bonus++;
	        enchantChance /= 1.5;
	    }
	    
	    if(bonus > 0)
	    {
	        item.name += " +" + bonus;
	        item.enchantLevel = bonus;
	        var multiplier = 1 + (this.settings.enchantingBaseMultiplier * bonus);
	        
	        item.minDamage = parseInt(item.minDamage * multiplier);
	    	item.maxDamage = parseInt(item.maxDamage * multiplier);
	    	item.damageBonus = parseInt(item.damageBonus * multiplier);

	    	item.strength = parseInt(item.strength * multiplier);
	    	item.agility = parseInt(item.agility * multiplier);
	    	item.stamina = parseInt(item.stamina * multiplier);

	    	item.health = parseInt(item.health * multiplier);
	    	item.hp5 = parseInt(item.hp5 * multiplier);
	    	item.armour = parseInt(item.armour * multiplier);
	    	item.armourBonus = parseInt(item.armourBonus * multiplier);

	    	item.critChance = parseInt(item.critChance * multiplier);
	    	item.critDamage = parseInt(item.critDamage * multiplier);

	    	item.goldGain = parseInt(item.goldGain * multiplier);
	    	item.experienceGain = parseInt(item.experienceGain * multiplier);
	    }
	}
	
	this.updateSalePrice = function(item)
	{
		baseSaleValue = Math.pow(item.level / 2, 3);
		item.sellValue = 0;
		
	    var multiplier = 1;
	    multiplier += this.updateSalePriceFor(item, item.damageBonus, 1, 0.15);
	        
	    multiplier += this.updateSalePriceFor(item, item.strength, 0.1, 0.1);
	    multiplier += this.updateSalePriceFor(item, item.agility, 0.1, 0.1);
	    multiplier += this.updateSalePriceFor(item, item.stamina, 0.1, 0.05);
	    
	    multiplier += this.updateSalePriceFor(item, item.health, 0.05, 0.01);
	    multiplier += this.updateSalePriceFor(item, item.hp5, 0.05, 0.02);
	    multiplier += this.updateSalePriceFor(item, item.armour, 0.05, 0.01);
	    multiplier += this.updateSalePriceFor(item, item.armourBonus, 0.1, 0.05);
	    
	    multiplier += this.updateSalePriceFor(item, item.critChance, 1, 0.15);
	    multiplier += this.updateSalePriceFor(item, item.critDamage, 0.5, 0.05);
	    
	    multiplier += this.updateSalePriceFor(item, item.goldGain, 0.01, 0.01);
	    multiplier += this.updateSalePriceFor(item, item.experienceGain, 0.01, 0.01);
	    
	    multiplier += this.updateSalePriceFor(item, item.enchantLevel, 0, 0.2);
	    
	    if(multiplier == NaN)
	    {
	        return;
	    }
	    
	    var multipliedBaseValue = parseInt(baseSaleValue * multiplier);
	    item.sellValue += multipliedBaseValue;
	}

	this.updateSalePriceFor = function(item, value, multiplierAdd, multiplierQuality)
	{
	    var current = item.sellValue;
	    if(value == NaN || value == undefined || value == 0)
	    {
	        return 0;
	    }
	    
	    current += parseInt(value * multiplierAdd);
	    item.sellValue = current;
	    return multiplierQuality;
	}
	
	this.getRarityNumber = function(rarity)
	{
	    switch (rarity) 
	    {
	    	case ItemRarity.COMMON: return 0;
	        case ItemRarity.UNCOMMON: return 1;
	        case ItemRarity.RARE: return 2;
	        case ItemRarity.EPIC: return 3;
	        case ItemRarity.LEGENDARY: return 4;
	    }
	}
	
	this.getRarityString = function(rarityNumber)
	{
		switch(rarityNumber)
		{
			case 0: return "Common";
			case 1: return "Uncommon";
			case 2: return "Rare";
			case 3: return "Epic";
			case 4: return "Legendary";
		}
	}
	
	this.getItemSlotNumber = function(type)
	{
		switch(type)
		{
			case ItemType.HELM: return 0;
			case ItemType.SHOULDERS: return 1;
			case ItemType.CHEST: return 2;
			case ItemType.LEGS: return 3;
			case ItemType.WEAPON: return 4;
			case ItemType.GLOVES: return 5;
			case ItemType.BOOTS: return 6;
			case ItemType.TRINKET: return 7;
			case ItemType.OFF_HAND: return 9;
		}
	}
	
	this.getFullVersionString = function()
	{
		return FrozenBattle.version+'.'+this.version;
	}
	
	// thanks to feildmaster @ http://feildmaster.com/feildmaster/scripts/EndlessImprovement/1.1/
	this.temp_fixPlayerHealth = function()
	{
		FrozenUtils.log("Applying player health fix (thanks to feildmaster)");
		
		game.player.baseHealthLevelUpBonus = 0;
		game.player.baseHp5LevelUpBonus = 0;
		    
		// Add stats to the player for leveling up
		for (var x = 1; x < game.player.level; x++) {
		    game.player.baseHealthLevelUpBonus += Math.floor(game.player.healthLevelUpBonusBase * (Math.pow(1.15, x)));
		    game.player.baseHp5LevelUpBonus += Math.floor(game.player.hp5LevelUpBonusBase * (Math.pow(1.15, x)));
		}
		
		game.player.health = game.player.getMaxHealth();
	}
	
	this.sortInventory = function()
	{
		var order = {}
		for (var slot = 0; slot < game.inventory.slots.length; slot++) 
	    {
	        if (game.inventory.slots[slot] != null) 
	        {
	            var item = game.inventory.slots[slot];
	            var orderValue = (this.getItemSlotNumber(item.type) * 100) + this.getRarityNumber(item.rarity);
	            if(!order[orderValue])
	            {
	            	order[orderValue] = [];
	            }
	            
	            order[orderValue].push(item);
	        }
	    }
		
		var keys = Object.keys(order);
		keys.sort();
		var currentSlot = 0;
		for (var i = 0; i < keys.length; i++)
		{
			for(var n = 0; n < order[keys[i]].length; n++)
			{
				game.inventory.slots[currentSlot++] = order[keys[i]][n];
			}
		}
		
		for(var slot = currentSlot; slot < game.inventory.slots.length; slot++)
		{
			game.inventory.slots[slot] = null;
		}
		
		this.refreshInventoryDisplay();
	}
	
	this.refreshInventoryDisplay = function()
	{
		for (var slot = 0; slot < game.inventory.slots.length; slot++) 
	    {
			if (game.inventory.slots[slot] != null) 
	        {
				var item = game.inventory.slots[slot];
				$("#inventoryItem" + (slot + 1)).css('background', 'url("includes/images/itemSheet2.png") ' + item.iconSourceX + 'px ' + item.iconSourceY + 'px');
				
	        }
			else
	        {
				$("#inventoryItem" + (slot + 1)).css('background', 'url("includes/images/NULL.png")');
	        }
			
			// Fix the positioning, sometimes this can go wonky...
			var row = parseInt(slot / 5);
			var column = slot - (row * 5);
			$("#inventoryItem" + (slot + 1)).css('left', 4 + column * 41);
			$("#inventoryItem" + (slot + 1)).css('top', 29 + row * 41);
	    }
	}
	
	this.nativeFormatMoney = function(n, c, d, t)
	{
		var c = isNaN(c = Math.abs(c)) ? 2 : c, 
			d = d == undefined ? "." : d, 
			t = t == undefined ? "," : t, 
			s = n < 0 ? "-" : "", 
			i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
			j = (j = i.length) > 3 ? j % 3 : 0;
		return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
	}
	
	//---------------------------------------------------------------------------
	// User interface
	//---------------------------------------------------------------------------
	this.initializeUI = function()
	{
		$('#version').after($('<div id="fbVersion" style="color: #808080; padding: 5px 0px 5px 10px; float: left"/>').html('FB ' + this.getFullVersionString()));
		
		$('#stats').after(
				$('<div id="autoCombatButton" class="navBarText" style="padding: 5px 10px 5px 10px; float: left"/>').addClass('button')
					.html('Auto combat ERR')
				    .click(this.onToggleAutoCombat)
				);
		
		$('#autoCombatButton').after(
				$('<div id="autoSellButton" class="navBarText" style="padding: 5px 10px 5px 10px; float: left"/>').addClass('button')
					.html('Auto sell ERR')
				    .click(this.onToggleAutoSell)
				);
		
		$('#autoSellButton').after(
				$('<div id="autoSellThresholdButton" class="navBarText" style="padding: 5px 10px 5px 10px; float: left"/>').addClass('button')
					.html('Auto sell below ERR')
				    .click(this.onToggleAutoSellThreshold)
				);
		
		$('#inventoryWindowSellAllButton').after(
				$('<div id="inventoryWindowSortButton" class="button" style="font-family: \'Gentium Book Basic\'; position: absolute; left: 175px; top: 241px; line-height: 16px; color: #fff; font-size: 16px; text-shadow: 2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 1px 1px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;"/>').addClass('button')
				.html('Sort')
			    .click(this.onSortInventory)
				);
		
		// Extended options
		$('#expBarOption').after(
				$('<div id="fbOptionNumberFormatting" class="optionsWindowOption"/>')
				.click(this.onToggleOptionNumberFormatting)
				);
		$('#fbOptionNumberFormatting').after(
				$('<div id="fbOptionDetailedLogging" class="optionsWindowOption"/>')
				.click(this.onToggleOptionDetailedLogging)
				);
		$('#fbOptionDetailedLogging').after(
				$('<div id="fbOptionEnchanting" class="optionsWindowOption"/>')
				.click(this.onToggleOptionEnchanting)
				);
		$('#fbOptionEnchanting').after(
				$('<div id="fbOptionImprovedSalePrice" class="optionsWindowOption"/>')
				.click(this.onToggleOptionImprovedSalePrice)
				);
		
		FrozenUtils.logCallback = this.onLog;
		
		this.updateUI();
	}
		
	this.onToggleAutoCombat = function()
	{
		var self = FrozenBattle.EndlessBattle;
		self.settings.autoCombatActive = !self.settings.autoCombatActive;
		self.updateUI();
	}
	
	this.onToggleAutoSell = function()
	{
		var self = FrozenBattle.EndlessBattle;
		self.settings.autoSellActive = !self.settings.autoSellActive;		
		self.updateUI();
	}
	
	this.onToggleAutoSellThreshold = function()
	{
		var self = FrozenBattle.EndlessBattle;
		if (self.settings.autoSellThreshold <= self.getRarityNumber(self.maxRarity))
		{
			self.settings.autoSellThreshold++;
		} else
		{
			self.settings.autoSellThreshold = self.getRarityNumber(self.minRarity);
		}
		self.updateUI();
	}
	
	this.onToggleOptionDetailedLogging = function()
	{
		var self = FrozenBattle.EndlessBattle;
		self.settings.detailedLogging = !self.settings.detailedLogging;
		
		self.updateUI();
	}
	
	this.onToggleOptionEnchanting = function()
	{
		var self = FrozenBattle.EndlessBattle;
		self.settings.enchantingEnabled = !self.settings.enchantingEnabled;
		
		self.updateUI();
	}
	
	this.onToggleOptionImprovedSalePrice = function()
	{
		var self = FrozenBattle.EndlessBattle;
		self.settings.improvedSalePriceEnabled = !self.settings.improvedSalePriceEnabled;
		
		self.updateUI();
	}
	
	this.onToggleOptionNumberFormatting = function()
	{
		var self = FrozenBattle.EndlessBattle;
		if(self.settings.numberFormatter >= FrozenCore.FormatterKeys.length - 1)
		{
			self.settings.numberFormatter = 0;
		}
		else
		{
			self.settings.numberFormatter++;
		}
		
		self.updateMercenarySalePrices();
		self.updateUI();
	}
	
	this.onSortInventory = function()
	{
		FrozenBattle.EndlessBattle.sortInventory();
	}
	
	this.updateMercenarySalePrices = function()
	{
		$("#footmanCost").text(game.mercenaryManager.footmanPrice.formatMoney(0));
		$("#clericCost").text(game.mercenaryManager.clericPrice.formatMoney(0));
		$("#commanderCost").text(game.mercenaryManager.commanderPrice.formatMoney(0));
		$("#mageCost").text(game.mercenaryManager.magePrice.formatMoney(0));
		$("#thiefCost").text(game.mercenaryManager.thiefPrice.formatMoney(0));
		$("#warlockCost").text(game.mercenaryManager.warlockPrice.formatMoney(0));
	}
	
	this.updateUI = function()
	{
		if(this.settings.autoCombatActive){
			var attackTime = FrozenUtils.timeDisplay(this.getAutoAttackTime(), true);
			$("#autoCombatButton").text('Auto combat ' + this.getBoolDisplayText(this.settings.autoCombatActive) + ' (every '+attackTime+')');
		} else {
			$("#autoCombatButton").text('Auto combat ' + this.getBoolDisplayText(this.settings.autoCombatActive));
		}
		
		$("#autoSellButton").text('Auto sell ' + this.getBoolDisplayText(this.settings.autoSellActive));
		$("#fbOptionDetailedLogging").text("Detailed logging " + this.getBoolDisplayText(this.settings.detailedLogging));
		$("#fbOptionEnchanting").text("Enchanting " + this.getBoolDisplayText(this.settings.enchantingEnabled));
		$("#fbOptionImprovedSalePrice").text("Improved sale price " + this.getBoolDisplayText(this.settings.improvedSalePriceEnabled));
		$("#fbOptionNumberFormatting").text("Format numbers " + FrozenCore.FormatterKeys[this.settings.numberFormatter]);
		
		var autoSellThresholdText = "N/A";
		if(this.settings.autoSellActive)
		{
			if (this.settings.autoSellThreshold > this.getRarityNumber(this.maxRarity))
			{
				autoSellThresholdText = "All";
			} 
			else
			{
				autoSellThresholdText = 'below ' + this.getRarityString(this.settings.autoSellThreshold);
			}
		}
		$("#autoSellThresholdButton").text('Auto sell ' + autoSellThresholdText);
	}
	
	this.getBoolDisplayText = function(value)
	{
		return value ? 'ON' : 'OFF';
	}
}

//---------------------------------------------------------------------------
// module initialization
//---------------------------------------------------------------------------
FrozenBattle.EndlessBattleModule = function EndlessBattleModule()
{
	this.main = function()
	{
		FrozenBattle.EndlessBattle = new EndlessBattle();
		
		var includes = [ FrozenBattle.EndlessBattle.baseUrl + "/data.js", FrozenBattle.EndlessBattle.baseUrl + '/layout.css' ];
		FrozenUtils.loadScripts(includes, 0, function() { FrozenBattle.EndlessBattle.init() } );
	}
}