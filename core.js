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
//Formatting
//---------------------------------------------------------------------------
FrozenCore.formatEveryThirdPower = function(notations) 
{
  return function (value)
  {
	  
    var base = 0;
    var notationValue = '';
    if (value >= 1000000 && Number.isFinite(value))
    {
      value /= 1000;
      while(Math.round(value) >= 1000)
      {
        value /= 1000;
        base++;
      }
      
      if (base > notations.length)
      {
        return 'Infinity';
      } 
      else 
      {
        notationValue = notations[base];
      }
    }

    return ( Math.round(value * 1000) / 1000.0 ) + notationValue;
  };
}

FrozenCore.formatScientificNotation = function(value)
{
  if (value === 0 || !Number.isFinite(value) || (Math.abs(value) > 1 && Math.abs(value) < 100))
  {
    return FrozenCore.formatRaw(value);
  }
  
  var sign = value > 0 ? '' : '-';
  value = Math.abs(value);
  var exp = Math.floor(Math.log(value)/Math.LN10);
  var num = Math.round((value/Math.pow(10, exp)) * 100) / 100;
  var output = num.toString();
  if (num === Math.round(num)) 
  {
    output += '.00';
  } 
  else if (num * 10 === Math.round(num * 10))
  {
    output += '0';
  }
  
  return sign + output + '*10^' + exp;
}

FrozenCore.formatRaw = function(value)
{
  return Math.round(value * 1000) / 1000;
}

FrozenCore.FormatterKeys = ['Off', 'Raw', 'Name', 'ShortName', 'ShortName2', 'Scientific'];
FrozenCore.Formatters = {
		'Off': undefined,
		'Raw': FrozenCore.formatRaw,
		'Name': FrozenCore.formatEveryThirdPower(['', ' million', ' billion', ' trillion', ' quadrillion',
		                                          ' quintillion', ' sextillion', ' septillion', ' octillion',
		                                          ' nonillion', ' decillion'
		                                        ]),
		'ShortName': FrozenCore.formatEveryThirdPower(['', ' M', ' B', ' T', ' Qa', ' Qi', ' Sx',' Sp', ' Oc', ' No', ' De' ]),
		'ShortName2': FrozenCore.formatEveryThirdPower(['', ' M', ' G', ' T', ' P', ' E', ' Z', ' Y']),
		'Scientific': FrozenCore.formatScientificNotation,
}

//---------------------------------------------------------------------------
//init
//---------------------------------------------------------------------------
FrozenCore.main = function()
{
	// Setup default notification style
	$.noty.defaults.layout = 'bottom';
	$.noty.defaults.timeout = 5000;
	
	FrozenUtils.notyEnabled = true;
		
	FrozenUtils.log("Initializing core...");
	
	var moduleScripts = [];
	for(var i = 0; i < CoreData.modules.length; i++)
	{
		moduleScripts.push(FrozenBattle.baseUrl + "/" + CoreData.modules[i].path + "/main.js");
	}
	
	FrozenUtils.loadScripts(moduleScripts, 0, function() { FrozenCore.initModules() });
}