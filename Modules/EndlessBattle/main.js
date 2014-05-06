function EndlessBattle()
{
	this.moduleActive = true;
	this.name = "EndlessBattle";
	this.version = 1.0;
	this.baseUrl = FrozenBattle.baseUrl + '/Modules/EndlessBattle';
	this.scripts = [ FrozenBattle.baseUrl + '/data.js', FrozenBattle.baseUrl + '/core.js' ];
	
	this.settings = undefined;
	
	this.lastUpdateTime = Date.now();
	this.lastAttackTime = Date.now();
	
	this.updateTimePassed = 0;
		
	this.updateLog = false;
	
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
		
		// Override with our own
		update = this.onUpdate;
		game.itemCreator.createRandomItem = this.onCreateRandomItem;
		game.save = this.onSave;
		game.load = this.onLoad;
		
		// Store some other variables from the core game
		this.minRarity = ItemRarity.COMMON;
		this.maxRarity = ItemRarity.LEGENDARY;
		
		this.initializeUI();
		
		FrozenUtils.log("Endless battle module version " + this.getFullVersionString());
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
	    
	    var attacks = 1 + (game.player.getAgility() / 100);
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
	    if(time < 1000)
	    {
	        return 1000;
	    }
	    
	    return time / multiplier;
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
	            
	            FrozenUtils.log("Auto-selling " + item.name + " for " + item.sellValue);
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
	    
	    FrozenUtils.log("Found " + item.name);
	    
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
	    
	    var multiplied = parseInt(item.sellValue * multiplier);
	    item.sellValue *= multiplied;
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
	
	this.getFullVersionString = function()
	{
		return FrozenBattle.version+'.'+this.version;
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
		
		$('#combatArea').append('<textarea id="logArea" style="background-color: #000; color: #fff; position: absolute; bottom:30px; left:5px; width:500px; height:200px;"/>');
		
		FrozenUtils.logCallback = this.onLog;
		
		this.updateUI();
	}
	
	this.onLog = function(message)
	{
		var time = '[' + FrozenUtils.timeDisplay(FrozenUtils.getDayTimeInSeconds(), false) + ']: ';
		
		var self = FrozenBattle.EndlessBattle;
		self.settings.log.splice(0, 0, time + message);
		while (self.settings.log.length > self.settings.logLimit)
		{
			self.settings.log.pop();
		}
		
		self.updateLog = true;
		self.updateUI();
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
	
	this.updateUI = function()
	{
		$("#autoCombatButton").text('Auto combat ' + this.getBoolDisplayText(this.settings.autoCombatActive));
		$("#autoSellButton").text('Auto sell ' + this.getBoolDisplayText(this.settings.autoSellActive));
		
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
		
		if (this.updateLog)
		{
			$('#logArea').text(this.settings.log.join("\n"));
			this.updateLog = false;
		}
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
		
		var includes = [ FrozenBattle.EndlessBattle.baseUrl + "/data.js" ];
		FrozenUtils.loadScripts(includes, 0, function() { FrozenBattle.EndlessBattle.init() } );
	}
}