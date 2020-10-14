var moment 				= 	require('moment-timezone');
var moment 				= 	require('moment');
var uuid 				= 	require('uuid');
var randomArray 		= 	[];
var RecordTimeArray		=	[];
var EventTimeArray		=	[];
var EventIDArray		=	[];
var HeaderArray			=	[];


//Extensions and ILMD elements to add to JSON and XML header
exports.schemaHeaders		=	function(InputData,callback)
{
	
	//Add the Elements from ILMD to XML Header
	for(var i=0; i<InputData.length; i++)
	{
		var NameSpace 	=	InputData[i].NameSpace;
		
		if(NameSpace.toLowerCase().includes("http://") || NameSpace.toLowerCase().includes("https://"))
		{
			NameSpace = NameSpace.split("/").slice(2);
			NameSpace = NameSpace[0].toString().substr(0, NameSpace[0].indexOf("."));
			
			if(!HeaderArray.some(item => item.URL === InputData[i].NameSpace))
			{	
				var obj 		= 	new Object();
				obj.xmlns		=	NameSpace;
				obj.URL			=	InputData[i].NameSpace;
				HeaderArray.push(obj);
			}
		}			
	}	
	callback(HeaderArray);
}

//Format the readpoint
exports.ReadPointFormatter	=	function(input,File,callback){

	var ReadPointCompany	=	input.readpointsgln1;
	var ReadPointObject		=	input.readpointsgln2;
	var ReadPrefixPoint		=	input.ReadPointCompanyPrefix;
	
	var CompanyPrefix 		=	companyPrefixNormal(ReadPointCompany, ReadPrefixPoint);
	var ReadpointFinal 		=	CompanyPrefix+'.'+ReadPointObject;

	callback(ReadpointFinal);
}

//Format the Business Point
exports.BusinessLocationFormatter	=	function(input,File,callback){
	var BusinessPointCompany	=	input.businesspointsgln1;
	var BusinessPointObject		=	input.businesspointsgln2;
	var BusinessPrefixPoint		=	input.BusinessLocationPrefix;
	
	var CompanyPrefix 			=	companyPrefixNormal(BusinessPointCompany, BusinessPrefixPoint);
	var BusinesspointFinal 		=	CompanyPrefix+'.'+BusinessPointObject;
	callback(BusinesspointFinal);
}

//Source or Destination Fromatter
exports.SourceDestinationFormatter	=	function(GLN, companyPrefix,callback){
	var CompanyPrefix 			=	companyPrefixNormal(GLN, companyPrefix);
	callback(CompanyPrefix)
}


//Company Prefix append without switch of first character
function companyPrefixNormal(companyPrefixInput, companyPrefixPoint)
{
	for(var x=6; x<=12;x++)	
	{	
		if(x == companyPrefixPoint)
		{	
			companyPrefixInput = [companyPrefixInput.slice(0, x), ".", companyPrefixInput.slice(x,companyPrefixInput.length-1)].join('');
			break;
		}
	}
	return companyPrefixInput;
}

//Randome EVENT TIME Generator Based on the From and To date time
exports.RandomEventTimeGenerator	=	function(DateFrom,DateTo,Count,File,callback){
	var DateFrom			= 	new Date(DateFrom);
	var DateTo				= 	new Date(DateTo);
	
	if(File == 'XML')
	{
		EventTimeArray		=	[];
		
		for(var r=0; r<Count; r++)
		{
			var RandomEventTime		=	new Date(DateFrom.getTime() + Math.random() * (DateTo.getTime() - DateFrom.getTime()));
			RandomEventTime			=	RandomEventTime.toISOString();
			RandomEventTime			=	RandomEventTime.substring(0,RandomEventTime.length-1);
			EventTimeArray.push(RandomEventTime)
		}
		callback(EventTimeArray);	
	}
	else if(File == 'JSON')
	{
		callback(EventTimeArray);
	}	
}

//Random EventID generator based on the count of event
exports.RandomEventIDGenerator		=	function(File,Count,Type,callback){
	
	if(File == 'XML')
	{
		EventIDArray	=	[];
		
		if(Type == 'uuid')
		{
			for(var re=0; re<Count; re++)
			{
				var RandomUUID 	=	uuid.v4(); 
					RandomUUID	=	'urn:uuid:'+RandomUUID;
				EventIDArray.push(RandomUUID);
			}
		}		
		callback(EventIDArray);
	}
	else if(File == 'JSON')
	{
		callback(EventIDArray);
	}
}