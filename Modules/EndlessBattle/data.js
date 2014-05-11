FrozenBattle.EndlessBattleSettings = function EndlessBattleSettings()
{
	this.disabled = false;
	this.updateInterval = 1000;
	this.logLimit = 100;
	
	// Enchanting
	this.enchantingEnabled = true;
	this.enchantingBaseChance = 0.5;
	this.enchantingBaseMultiplier = 0.3;
	
	// Auto sell
	this.autoSellActive = false;
	this.autoSellThreshold = 2;
	
	// Auto combat
	this.autoCombatActive = false;
	this.autoCombatKeepLevelDifference = true;
	this.autoCombatLastAttackTime = 0;
	this.autoCombatMaxLevelDifference = 5;
	this.autoCombatLevel = 1;
	
	// Stats bought
	this.statIncreaseStrength = 0;
	this.statIncreaseStamina = 0;
	this.statIncreaseAgi = 0;
	
	// misc
	this.improvedSalePriceEnabled = true;
	this.formatHealthBarNumbers = true;
	this.detailedLogging = true;
	this.numberFormatter = 1;
	this.levelsReset = 0;
	this.applyLevelResetBonus = true;
	this.skipTutorial = true;
	this.statsBought = 0;
	
	// Stats and other potentially big data
	this.log = [];
	
	this.stats = {};
	
	//---------------------------------------------------------------------------
	//loading / saving
	//---------------------------------------------------------------------------
	this.save = function()
	{
		if (typeof (Storage) == "undefined")
		{
			return;
		}
		
		localStorage.fb_disabled = this.disabled;
		localStorage.fb_updateInterval = this.updateInterval;
		localStorage.fb_logLimit = this.logLimit;
		
		localStorage.fb_enchantingEnabled = this.enchantingEnabled;
		localStorage.fb_enchantingBaseChance = this.enchantingBaseChance;
		localStorage.fb_enchantingBaseMultiplier = this.enchantingBaseMultiplier;
		
		localStorage.fb_autoSellActive = this.autoSellActive;
		localStorage.fb_autoSellThreshold = this.autoSellThreshold;
		
		localStorage.fb_autoCombatActive = this.autoCombatActive;
		localStorage.fb_autoCombatKeepLevelDifference = this.autoCombatKeepLevelDifference;
		localStorage.fb_autoCombatLastAttackTime = this.autoCombatLastAttackTime;
		localStorage.fb_autoCombatMaxLevelDifference = this.autoCombatMaxLevelDifference;
		localStorage.fb_autoCombatLevel = this.autoCombatLevel;
		
		localStorage.fb_statIncreaseStrength = this.statIncreaseStrength;
		localStorage.fb_statIncreaseStamina = this.statIncreaseStamina;
		localStorage.fb_statIncreaseAgi = this.statIncreaseAgi;
		
		localStorage.fb_improvedSalePriceEnable = this.improvedSalePriceEnabled;
		localStorage.fb_detailedLogging = this.detailedLogging;
		localStorage.fb_numberFormatter = this.numberFormatter;
		localStorage.fb_formatHealthBarNumbers = this.formatHealthBarNumbers;
		localStorage.fb_levelsReset = this.levelsReset;
		localStorage.fb_applyLevelResetBonus = this.applyLevelResetBonus;
		localStorage.fb_skipTutorial = this.skipTutorial;
		localStorage.fb_statsBought = this.statsBought;
		
		var statKeys = Object.keys(this.stats);
		localStorage.fb_statCount = statKeys.length;
		for(var i = 0; i < statKeys.length; i++) {
		    localStorage['fb_stat_name_'+i] = statKeys[i];
		    localStorage['fb_stat_value_'+i] = this.stats[statKeys[i]];
		}
	}
	
	this.load = function()
	{
		if (typeof (Storage) == "undefined") 
		{
			return;
		}
		
		this.disabled = FrozenUtils.loadBool("fb_disabled", false);
		this.updateInterval = FrozenUtils.loadInt("fb_updateInterval", 1000);
		this.logLimit = FrozenUtils.loadInt("fb_logLimit", 100);
		
		this.enchantingEnabled = FrozenUtils.loadBool("fb_enchantingEnabled", true);
		this.enchantingBaseChance = FrozenUtils.loadFloat("fb_enchantingBaseChance", 0.5);
		this.enchantingBaseMultiplier = FrozenUtils.loadFloat("fb_enchantingBaseMultiplier", 0.3);
		
		this.autoSellActive = FrozenUtils.loadBool("fb_autoSellActive", false);
		this.autoSellThreshold = FrozenUtils.loadInt("fb_autoSellThreshold", 2);
		
		this.autoCombatActive = FrozenUtils.loadBool("fb_autoCombatActive", false);
		this.autoCombatKeepLevelDifference = FrozenUtils.loadBool("fb_autoCombatKeepLevelDifference", true);
		this.autoCombatLastAttackTime = FrozenUtils.loadInt("fb_autoCombatLastAttackTime", 0);
		this.autoCombatMaxLevelDifference = FrozenUtils.loadInt("fb_autoCombatMaxLevelDifference", 5);
		this.autoCombatLevel = FrozenUtils.loadInt("fb_autoCombatLevel", 1);
		
		this.statIncreaseStrength = FrozenUtils.loadInt("fb_statIncreaseStrength", 0);
		this.statIncreaseStamina = FrozenUtils.loadInt("fb_statIncreaseStamina", 0);
		this.statIncreaseAgi = FrozenUtils.loadInt("fb_statIncreaseAgi", 0);
		
		this.improvedSalePriceEnable = FrozenUtils.loadBool("fb_improvedSalePriceEnable", true);
		this.detailedLogging = FrozenUtils.loadBool("fb_detailedLogging", true);
		this.numberFormatter = FrozenUtils.loadInt("fb_numberFormatter", 0);
		this.formatHealthBarNumbers = FrozenUtils.loadBool("fb_formatHealthBarNumbers", true);
		this.levelsReset = FrozenUtils.loadInt("fb_levelsReset", 0);
		this.applyLevelResetBonus = FrozenUtils.loadBool("fb_applyLevelResetBonus", true);
		this.skipTutorial = FrozenUtils.loadBool("fb_skipTutorial", true);
		this.statsBought = FrozenUtils.loadInt("fb_statsBought", 0);
		
		var statCount = FrozenUtils.loadInt("fb_statCount", 0);
		for(var i = 0; i < statCount; i++) {
		    var name = FrozenUtils.load("fb_stat_name_"+i, undefined);
		    var value = FrozenUtils.loadFloat("fb_stat_value_"+i, 0);
		    if(!name) {
		        continue;
		    }
		    this.stats[name] = value;
		}
	}
}