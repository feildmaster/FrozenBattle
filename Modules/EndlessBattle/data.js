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
}