FrozenCore = {
}

//---------------------------------------------------------------------------
//module handling
//---------------------------------------------------------------------------
FrozenCore.initModules = function()
{
	this.loadedModules = {};
	for(var i = 0; i < CoreData.modules.length; i++)
	{
		var id = CoreData.modules[i].id;
		this.loadedModules[id] = new FrozenBattle[id]();
		this.loadedModules[id].main();
	}
}

//---------------------------------------------------------------------------
//init
//---------------------------------------------------------------------------
FrozenCore.main = function()
{
	FrozenUtils.log("Initializing core...");
	
	var moduleScripts = [];
	for(var i = 0; i < CoreData.modules.length; i++)
	{
		moduleScripts.push(FrozenBattle.baseUrl + "/" + CoreData.modules[i].path + "/main.js");
	}
	
	FrozenUtils.loadScripts(moduleScripts, 0, function() { FrozenCore.initModules() });
}