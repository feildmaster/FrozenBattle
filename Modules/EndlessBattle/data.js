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
	this.autoCombatLastAttackTime = 0;
	this.autoCombatMaxLevelDifference = 5;
	
	// misc
	this.improvedSalePriceEnabled = true;
	
	// Stats and other potentially big data
	this.log = [];
	
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
		localStorage.fb_autoCombatLastAttackTime = this.autoCombatLastAttackTime;
		localStorage.fb_autoCombatMaxLevelDifference = this.autoCombatMaxLevelDifference;
		
		localStorage.fb_improvedSalePriceEnable = this.improvedSalePriceEnable;
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
		this.autoCombatLastAttackTime = FrozenUtils.loadInt("fb_autoCombatLastAttackTime", 0);
		this.autoCombatMaxLevelDifference = FrozenUtils.loadInt("fb_autoCombatMaxLevelDifference", 5);
		
		this.improvedSalePriceEnable = FrozenUtils.loadBool("fb_improvedSalePriceEnable", true);
	}
}