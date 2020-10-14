var moment 				= 	require('moment-timezone');
var moment 				= 	require('moment');
const gs1 				= 	require('gs1');
var xml_json_functions	=	require('./XML_JSON_Functions');

exports.createJSONData	=	function(Query,JSONHeader,callback){
	var input				=	Query.input;
	var data				=	{};
	var jsonData			=	[];
	var EpcLists			=	[];
	var File 				= 	'JSON';
	var itemProcessed 		=	0;
	var RecordTimeArray		=	[];	
	var EventTimeArray		=	[];
	var EventIDArray		=	[];
	var MainArray			=	[];
	var currentTime 		=	moment().format();
	var SyntaxType			=	input.VocabSyntaxType;
	var Domain				=	'https://gs1.org/';
	var JSONHeaders			=	[];
	
	if(Query.XMLElement == 'Single')
	{
		//Create the initial strucutre for the JSON data
		var JSONschemaParse =	{
									"@context"		: 	"https://id.gs1.org/epcis-context.jsonld",
									"isA"			:	"EPCISDocument",
									"format"		: 	"application/ld+json",
								}
								
		//Call function to collect all the URLS from ILMD, Extension and Error Extension
		JSONHeaderFn();
		
		//add the header elements from Extension and ILMD to XML Header
		for(var head=0; head<JSONHeaders.length; head++)
		{
			JSONschemaParse[JSONHeaders[head].xmlns]	=	JSONHeaders[head].URL;
		}
		
		JSONschemaParse["schemaVersion"]		=	"2.0";
		JSONschemaParse["creationDate"]			=	currentTime;
		JSONschemaParse["epcisBody"]			=	{};	
	}
	else
	{
		//Call function to collect all the URLS from ILMD, Extension and Error Extension
		JSONHeaderFn();
		
		var JSONschemaParse		=	JSONHeader;
	}	
	
	
	function JSONHeaderFn()
	{
		//Get the elements from XML header for ILMD from XMLJSON function
		if(input.eventtype1 == "ObjectEvent" || input.eventtype1 == 'TransformationEvent')
		{
			if(Query.ILMD.length > 0)
			{
				//Call the function for ILMD
				xml_json_functions.schemaHeaders(Query.ILMD,function(ReturnJSONHeader){
					JSONHeaders	=	ReturnJSONHeader;
				});
			}
		}
		
		//Get the elements from XML header for Extension from XMLJSON function
		if(Query.Extension.length > 0)
		{
			//Call function for Extension
			xml_json_functions.schemaHeaders(Query.Extension,function(ReturnJSONHeader){
				JSONHeaders	=	ReturnJSONHeader;
			});
		}
		
		//Get the elements for XML Header from Error Declaration Event
		if(input.eventtype2 == 'errordeclaration')
		{	
			if(Query.ErrorExtension.length > 0)
			{
				//Call the function for ILMD
				xml_json_functions.schemaHeaders(Query.ErrorExtension,function(ReturnJSONHeader){
					JSONHeaders	=	ReturnJSONHeader;
				});
			}
		}
	}
	
	//Loop through the event count and create append to JSON data
	for(var count=0; count<input.eventcount; count++)
	{
		var ObjectEvent		=	{};
		
		//Type of event
		ObjectEvent['isA']	=	input.eventtype1;
		
		//Check what type of EVENT TIME is required and fill the values accordingly
		if(input.EventTimeSelector != "" && input.EventTimeSelector != null && typeof input.EventTimeSelector != undefined)
		{
			//If Specific Event time has been selected
			if(input.EventTimeSelector == 'SpecificTime')
			{
				ObjectEvent['eventTime']			=	input.eventtimeSpecific + "Z";
				RecordTime();
				ObjectEvent['eventTimeZoneOffset']	=	input.EventTimeZone;
			}
			else if(input.EventTimeSelector == 'TimeRange')
			{
				var From			=	input.EventTimeFrom;
				var To				=	input.EventTimeTo;
				var EventCount		=	input.eventcount;
				
				if(count == 0)
				{
					EventTimeArray	=	[];
					xml_json_functions.RandomEventTimeGenerator(From,To,EventCount,File,function(ReturnEventTime){
						EventTimeArray	= ReturnEventTime;
					});
				}
				
				ObjectEvent['eventTime']			=	EventTimeArray[count]+input.EventTimeZone;
				RecordTime();
				ObjectEvent['eventTimeZoneOffset']	=	input.EventTimeZone;
			}

		}
		
		//function to add record time after the Event Time before Event timezoneoffset
		function RecordTime(){
			//Check what type of RECORD TIME is required and fill the values accordingly
			if(input.RecordTimeOption != "" && input.RecordTimeOption != null && typeof input.RecordTimeOption != undefined)
			{
				//Check if the Record Time Option is YES
				if(input.RecordTimeOption == 'yes')
				{
					//Check if Record Time Option is Same as Event TIME
					if(input.RecordTimeOptionType	== 'RecordTimeSameAsEventTime')
					{
						if(input.EventTimeSelector == 'TimeRange')
						{
							ObjectEvent['recordTime'] 	=		EventTimeArray[count]+input.EventTimeZone;
						}
						else if(input.EventTimeSelector == 'SpecificTime')
						{
							ObjectEvent['recordTime'] 	=		input.eventtimeSpecific+input.EventTimeZone;
						}					
					}
					else if(input.RecordTimeOptionType	== 'RecordTimeCurrentTime')
					{
						//If the current time is choosen
						ObjectEvent['recordTime'] 	=		currentTime;
					}
				}
			}
		}

		//If error declaration has been set then add the below tags
		if(input.eventtype2 == 'errordeclaration' || input.EventIDOption == "yes")
		{
			//Add the EVENT ID if its populated
			if(input.EventIDOption == "yes")
			{				
				if(count == 0)
				{
					EventIDArray	=	[];
					xml_json_functions.RandomEventIDGenerator(File,input.eventcount,input.EventIDType,function(ReturnEventIDArray){
						EventIDArray	= ReturnEventIDArray;
					});	
				}
				
				ObjectEvent['eventID']	=	EventIDArray[count];
			}

			//Add the error declaration if its populated
			if(input.eventtype2 == 'errordeclaration')
			{		
				ObjectEvent['errorDeclaration']	=	{};
				
				//Check what type of error declaration has been choosen
				if(input.ErrorDeclarationTimeSelector != '')
				{
					if(input.ErrorDeclarationTimeSelector == 'SpecificTime')
					{
						//Add Error Declaration Time
						ObjectEvent.errorDeclaration['declarationTime']		=	input.ErrorDeclarationTime+input.ErrorTimeZone;
					}
					else if(input.ErrorDeclarationTimeSelector == 'TimeRange')
					{
						var From			=	input.ErrorDeclarationTimeFrom;
						var To				=	input.ErrorDeclarationTimeTo;
						var EventCount		=	input.eventcount;
						
						//Call the random function to generate the random date
						if(count == 0)
						{
							ErrorTimeArray	=	[];
							xml_json_functions.RandomEventTimeGenerator(From,To,EventCount,File,function(RandomErrorTime){
								ErrorTimeArray	= RandomErrorTime;
							});	
						}
						
						ObjectEvent.errorDeclaration['declarationTime']		=	ErrorTimeArray[count]+input.ErrorTimeZone;	
					}
				}

				//Add Error Reason
				if(input.ErrorReasonType != "" && input.ErrorReasonType != null && typeof input.ErrorReasonType != undefined)
				{
					if(input.ErrorReasonType == 'Other')
					{
						ObjectEvent.errorDeclaration['reason']	=	input.ErrorReasonOther;
					}
					else
					{
						if(SyntaxType == 'urn')
						{
							ObjectEvent.errorDeclaration['reason']	=	'urn:epcglobal:cbv:er:'+input.ErrorReasonType;
						}
						else if(SyntaxType == 'webURI')
						{
							ObjectEvent.errorDeclaration['reason']	=	Domain+'voc/ER-'+input.ErrorReasonType;
						}
						
					}
				}				
				
				//Loop and add the Corrective Event Ids
				if(Query.ErrorCorrection.length > 0)
				{
					ObjectEvent.errorDeclaration['correctiveEventIDs']	=	[];
					
					for(var e=0; e<Query.ErrorCorrection.length; e++)
					{
						ObjectEvent.errorDeclaration["correctiveEventIDs"].push(Query.ErrorCorrection[e].CorrectiveText);
					}
				}

				//Loop and add the Extension for Error and Add the Error Extension
				if(Query.ErrorExtension.length > 0)
				{
					var ErrorExtension	=	Query.ErrorExtension;
					
					for(var i=0; i<ErrorExtension.length; i++)
					{
						var NameSpace 	=	ErrorExtension[i].NameSpace;
						var LocalName 	=	ErrorExtension[i].LocalName;

						if(NameSpace.toLowerCase().includes("http://") || NameSpace.toLowerCase().includes("https://"))
						{
							NameSpace 							= 	NameSpace.split("/").slice(2);
							NameSpace 							= 	NameSpace[0].toString().substr(0, NameSpace[0].indexOf("."));
							var value							=	NameSpace+':'+LocalName;
							ObjectEvent.errorDeclaration[value]	=	ErrorExtension[i].FreeText
						}
						else
						{
							var value							=	NameSpace+':'+LocalName;
							ObjectEvent.errorDeclaration[value]	=	ErrorExtension[i].FreeText
						}
					}
				}
			}
		}
		
		//If the event is TransactionEvent then add Business Transacation List here
		if(input.eventtype1 == "TransactionEvent")
		{
			BusinessTrasactions();
		}

		//IF the event type is Object event
		if(input.eventtype1 == 'ObjectEvent')
		{			
			if(Query.EPCs.length > 0)
			{
				var NewEPCS		=	 [];
				var OEEPCS		=	Query.EPCs[count];

				for(var e=0; e<OEEPCS.length; e++)
				{
					NewEPCS.push(OEEPCS[e]);
				}			

				ObjectEvent['epcList'] = NewEPCS;
			}
		}
		else if(input.eventtype1 == "AggregationEvent")
		{
			//Add the parent of AggregationEvent
			if(Query.ParentID.length > 0)
			{
				var AEParentID			=	Query.ParentID[count];
				ObjectEvent['parentID']	=	AEParentID[0];
			}
			
			//Add the CHILD EPCS of AggregationEvent			
			if(Query.EPCs.length > 0)
			{
				ObjectEvent['childEPCs']	=	[];
				var ChildEPCSURI			=	Query.EPCs[count];
				
				for(var o=0; o<ChildEPCSURI.length; o++)
				{					
					ObjectEvent['childEPCs'].push(ChildEPCSURI[o]);					
				}
			}	
		}
		else if(input.eventtype1 == "TransactionEvent")
		{
			//TransactionEvent Parent ID
			if(Query.ParentID.length >0)
			{
				var TEParentID				=	Query.ParentID[count];
				ObjectEvent['parentID']		=	TEParentID[0];
			}
			
			//TransactionEvent EPCS			
			if(Query.EPCs.length > 0)
			{
				ObjectEvent['epcList']	=	{};
				var EPCs				=	Query.EPCs[count];
				var AllChildEpcs		=	[];
				
				for(var o=0; o<EPCs.length; o++)
				{
					AllChildEpcs.push(EPCs[o]);					
				}

				ObjectEvent.epcList['epc']	=	AllChildEpcs;					
			}
		}
		else if(input.eventtype1 == "TransformationEvent")
		{
			//Transformation Event Input EPCs
			if(Query.EPCs.length > 0)
			{
				ObjectEvent['inputEPCList']	=	[];
				var InputQueryEPCs			=	Query.EPCs[count];				
				
				for(var i=0; i<InputQueryEPCs.length; i++)
				{
					ObjectEvent['inputEPCList'].push(InputQueryEPCs[i]);
				}
			}
			
			//Transformation Event Input Quantities
			if(Query.Quantities.length > 0)
			{
				ObjectEvent['inputQuantityList']	=	[];
				var InputQuantities					=	Query.Quantities[count];									
					
				for(var q=0; q<InputQuantities.length; q++)
				{	
					var obj 			= 	new Object();
					obj["epcClass"]		=	InputQuantities[q].URI;						
					
					if(InputQuantities[q].QuantityType == 'Fixed Measure Quantity')
					{
						obj["quantity"]	=	InputQuantities[q].Quantity;
					}
					else if(InputQuantities[q].QuantityType == 'Variable Measure Quantity')
					{
						obj["quantity"]	=	InputQuantities[q].Quantity;
						obj["uom"]		=	InputQuantities[q].QuantityUOM;
					}
					
					ObjectEvent['inputQuantityList'].push(obj);
				}
			}
			
			//Transformation Event output EPCS
			if(Query.OutputEPCs.length > 0)
			{
				ObjectEvent['outputEPCList']	=	[];
				var outputEPCs					=	Query.OutputEPCs[count];
				
				for(var i=0; i<outputEPCs.length; i++)
				{		
					ObjectEvent['outputEPCList'].push(outputEPCs[i]);
				}
			}
			
			//Transformation Event Output Quantities
			if(Query.OutputQuantities.length > 0)
			{
				ObjectEvent['outputQuantityList']	=	[];
				var OutputQuantities				=	Query.OutputQuantities[count];				
					
				for(var q=0; q<OutputQuantities.length; q++)
				{	
					var obj 			= 	new Object();
					obj["epcClass"]		=	OutputQuantities[q].URI;	
					
					if(OutputQuantities[q].QuantityType == 'Fixed Measure Quantity')
					{
						obj["quantity"]	=	OutputQuantities[q].Quantity;
					}
					else if(OutputQuantities[q].QuantityType == 'Variable Measure Quantity')
					{
						obj["quantity"]	=	OutputQuantities[q].Quantity;
						obj["uom"]		=	OutputQuantities[q].QuantityUOM;
					}
					
					ObjectEvent['outputQuantityList'].push(obj);
				}
			}
		}
		else if(input.eventtype1 == "AssociationEvent")
		{			
			//Add the Parent for Association Event
			if(Query.ParentID.length > 0)
			{
				var AEParentID			=	Query.ParentID[count];
				ObjectEvent['parentID']	=	AEParentID[0];
			}
			
			//Add the CHILD EPCS of AssociationEvent			
			if(Query.EPCs.length > 0)
			{
				var ChildEPCSURI			=	Query.EPCs[count];
				ObjectEvent['childEPCs']	=	[];
				
				for(var c=0; c<ChildEPCSURI.length; c++)
				{
					ObjectEvent['childEPCs'].push(ChildEPCSURI[c]);
				}
			}
			
			//AGGREGATION EVENT CHILD Quantities			
			if(Query.Quantities.length > 0)
			{
				ObjectEvent['childQuantityList']	=	[];
				var ChildQuantitiesURI		=	Query.Quantities[count];									
					
				for(c=0; c<ChildQuantitiesURI.length;c++)
				{
					var obj 			= 	new Object();
					obj["epcClass"]		=	ChildQuantitiesURI[c].URI;
					
					if(ChildQuantitiesURI[c].QuantityType == 'Fixed Measure Quantity')
					{
						obj["quantity"]	=	ChildQuantitiesURI[c].Quantity;
					}
					else if(ChildQuantitiesURI[c].QuantityType == 'Variable Measure Quantity')
					{
						obj["quantity"]	=	ChildQuantitiesURI[c].Quantity;
						obj["uom"]		=	ChildQuantitiesURI[c].QuantityUOM;
					}
					ObjectEvent['childQuantityList'].push(obj);
				}
			}
		}

		//Check for action element and add it
		if(input.action != "" && input.action != null && typeof input.action != undefined && input.eventtype1 != "TransformationEvent")
		{
			ObjectEvent['action']	=	input.action;
		}

		//Check for BUSINESS STEP
		if(input.businessStep != '' && input.businessStep != null && typeof input.businessStep != undefined)
		{
			if(input.businessStep == 'BusinessStepEnter')
			{
				ObjectEvent['bizStep']  = input.EnterBusinessStepText;
			}
			else
			{
				if(SyntaxType == 'urn')
				{
					ObjectEvent['bizStep']  =	'urn:epcglobal:cbv:bizstep:'+input.businessStep;
				}
				else if(SyntaxType == 'webURI')
				{
					ObjectEvent['bizStep']  =	Domain+'voc/Bizstep-'+input.businessStep;
				}				
			}
		}

		//Check for DISPOSITION
		if(input.disposition != '' && input.disposition != null && typeof input.disposition != undefined)
		{
			if(input.disposition == 'DispositionEnter')
			{
				ObjectEvent['disposition']	=	input.EnterDispositionText;
			}
			else
			{
				if(SyntaxType == 'urn')
				{
					ObjectEvent['disposition']	=	'urn:epcglobal:cbv:disp:'+input.disposition;
				}
				else if(SyntaxType == 'webURI')
				{
					ObjectEvent['disposition'] 	=	Domain+'voc/Disp-'+input.disposition;
				}	
			}
		}

		//Check and create the READPOINT
		if(input.readpointselector != '' && input.readpointselector != null && typeof input.readpointselector != undefined)
		{
			input.readpointsgln1	=	input.readpointsgln1.substring(0,12) + gs1.checkdigit(input.readpointsgln1.substring(0,12));

			ObjectEvent["readPoint"]	=	{};
			
			if(input.readpointselector == 'manually')
			{					
				ObjectEvent.readPoint["id"]	=	input.readpoint;
			}
			else if(input.readpointselector == 'sgln')
			{
				if(SyntaxType == 'urn')
				{
					xml_json_functions.ReadPointFormatter(input,File,function(data){
						ObjectEvent.readPoint["id"]		=	'urn:epc:id:sgln:'+data;
					});
				}
				else if(SyntaxType == 'webURI')
				{
					ObjectEvent.readPoint["id"]			=	'https://id.gs1.org/414/'+input.readpointsgln1+'/254/'+input.readpointsgln2;
				}					
			}
		}

		//Check for the Business Location and set the Business Location
		if(input.businesslocationselector != '' && input.businesslocationselector != null && typeof input.businesslocationselector != undefined)
		{
			ObjectEvent['bizLocation']		=	{};
			
			if(input.businesslocationselector == 'manually')
			{
				ObjectEvent.bizLocation['id']	 	=	input.businesslocation;
			}
			else if(input.businesslocationselector == 'sgln')
			{
				if(SyntaxType == 'urn')
				{
					xml_json_functions.BusinessLocationFormatter(input,File,function(data)
					{ 	
						ObjectEvent.bizLocation['id'] 	=	'urn:epc:id:sgln:'+data;
					});
				}
				else if(SyntaxType == 'webURI')
				{
					ObjectEvent.bizLocation['id'] 		=	'https://id.gs1.org/414/'+input.businesspointsgln1+'/254/'+input.businesspointsgln2;
				}				
			}
		}
		
		//Add Business Transacations for Object Event and Aggregation Event
		if(input.eventtype1 == "ObjectEvent" || input.eventtype1 == "AggregationEvent")
		{
			BusinessTrasactions();
		}


		//Check for the Quantity element and add it to the JSON		
		if(input.eventtype1 == "ObjectEvent")
		{	
			//OBJECT EVENT CHILD Quantities
			if(Query.Quantities.length > 0)
			{				
				var QuantitiesURIs			=	Query.Quantities[count];
				ObjectEvent["quantityList"]	=	[];

				for(var q=0; q<QuantitiesURIs.length; q++)
				{
					var obj 			= 	new Object();
					obj["epcClass"]		=	QuantitiesURIs[q].URI;

					if(QuantitiesURIs[q].QuantityType == 'Fixed Measure Quantity')
					{
						obj["quantity"]	=	QuantitiesURIs[q].Quantity;
					}
					else if(QuantitiesURIs[q].QuantityType == 'Variable Measure Quantity')
					{
						obj["quantity"]	=	QuantitiesURIs[q].Quantity;
						obj["uom"]		=	QuantitiesURIs[q].QuantityUOM;
					}
					
					ObjectEvent["quantityList"].push(obj);
				}
			}
		}
		else if(input.eventtype1 == "AggregationEvent" || input.eventtype1 == "AssociationEvent")
		{
			//AGGREGATION EVENT CHILD Quantities			
			if(Query.Quantities.length > 0)
			{
				ObjectEvent['childQuantityList']	=	[];
				var ChildQuantitiesURI		=	Query.Quantities[count];									
					
				for(c=0; c<ChildQuantitiesURI.length;c++)
				{
					var obj 			= 	new Object();
					obj["epcClass"]		=	ChildQuantitiesURI[c].URI;
					
					if(ChildQuantitiesURI[c].QuantityType == 'Fixed Measure Quantity')
					{
						obj["quantity"]	=	ChildQuantitiesURI[c].Quantity;
					}
					else if(ChildQuantitiesURI[c].QuantityType == 'Variable Measure Quantity')
					{
						obj["quantity"]	=	ChildQuantitiesURI[c].Quantity;
						obj["uom"]		=	ChildQuantitiesURI[c].QuantityUOM;
					}
					ObjectEvent['childQuantityList'].push(obj);
				}
			}
		}
		else if(input.eventtype1 == "TransactionEvent")
		{
			//TRANSACTION EVENT CHILD QUANTITIES
			if(Query.Quantities.length >0)
			{
				ObjectEvent["quantityList"]		=	[];
				var Quantities 					=	Query.Quantities[count];
			
				for(q=0; q<Quantities.length; q++)
				{
					var obj 			= 	new Object();
					obj["epcClass"]		=	Quantities[q].URI;
					
					if(Quantities[q].QuantityType == 'Fixed Measure Quantity')
					{
						obj["quantity"]		=	Quantities[q].Quantity;
					}
					else if(Quantities[q].QuantityType == 'Variable Measure Quantity')
					{
						obj["quantity"]		=	Quantities[q].Quantity;
						obj["uom"]			=	Quantities[q].QuantityUOM;
					}
					
					ObjectEvent["quantityList"].push(obj);
				}				
			}
		}
		
		//If the event is TransformationEvent or AssociationEvent then add Business Transacation List here
		if(input.eventtype1 == "TransformationEvent" || input.eventtype1 == "AssociationEvent")
		{
			BusinessTrasactions();
		}
		
		//Populate the Business Transaction List 
		function BusinessTrasactions()
		{
			if(Query.BTT.length > 0)
			{
				var BTTArray	=	 [];
				for(var b=0; b<Query.BTT.length; b++)
				{
					var BTT 					=	Query.BTT[b];
					var BTTObj					=	new Object();
					
					if(SyntaxType == 'urn')
					{	
						BTTObj['type']				=	"urn:epcglobal:cbv:btt:"+BTT.BTT.Type;
						BTTObj['bizTransaction']	=	'urn:epcglobal:cbv:bt:'+BTT.BTT.Value;	
					}
					else if(SyntaxType == 'webURI')
					{
						BTTObj['type']				=	Domain+'BTT-'+BTT.BTT.Type;
						BTTObj['bizTransaction']	=	Domain+'BT-'+BTT.BTT.Value;
					}				
					
					BTTArray.push(BTTObj)
				}
				ObjectEvent['bizTransactionList']		=	BTTArray;			
			}
		}

		//Check for the Source and Source type
		if(input.sourcesType != '' && input.sourcesType != null && input.sourcesType != undefined)
		{				
			ObjectEvent['sourceList']		=	[];
			
			if(input.sourcesType == 'owning_party' || input.sourcesType == 'processing_party' || input.sourcesType == 'location')
			{
				//Find the check digit in 13th place
				input.SourceGLN					=	input.SourceGLN.substring(0,12) + gs1.checkdigit(input.SourceGLN.substring(0,12));

				var SourceListObj				=	new Object();
				var Domain2						=	'https://id.gs1.org/';				
				var SourceGLN					=	input.SourceGLN;
				var SourceCompanyPrefix			=	input.SourcesCompanyPrefix;
				var FormattedSource;
			
				xml_json_functions.SourceDestinationFormatter(SourceGLN,SourceCompanyPrefix,function(data)
				{	
					FormattedSource	=	data;
				});				
				
				if(input.sourcesType == 'owning_party' || input.sourcesType == 'processing_party')
				{
					//If PGLN then directly append
					if(input.SourceLNType == 'pgln')
					{
						if(SyntaxType == 'urn')
						{
							SourceListObj['type']		=	'urn:epcglobal:cbv:sdt:'+input.sourcesType;
							SourceListObj['source']		=	'urn:epc:id:pgln:'+FormattedSource;
						}
						else if(SyntaxType == 'webURI')
						{
							SourceListObj['type']		=	Domain+'voc/SDT-'+input.sourcesType;
							SourceListObj['source']		=	Domain2+'417/'+input.SourceGLN;
						}
					}
					else if(input.SourceLNType == 'sgln')
					{
						if(SyntaxType == 'urn')
						{
							SourceListObj['type']		=	'urn:epcglobal:cbv:sdt:'+input.sourcesType;
							SourceListObj['source']		=	'urn:epc:id:sgln:'+ FormattedSource + '.' + input.SourceGLNExtension;
						}
						else if(SyntaxType == 'webURI')
						{
							SourceListObj['type']		=	Domain+'voc/SDT-'+input.sourcesType;
							SourceListObj['source']		=	Domain2+'414/'+input.SourceGLN+'/254/'+input.SourceGLNExtension;
						}												
					}
				}

				if(input.sourcesType == 'location')
				{
					FormattedSource							=	FormattedSource + '.' + input.SourceGLNExtension;
					
					if(SyntaxType == 'urn')
					{
						SourceListObj['type']		=	'urn:epcglobal:cbv:sdt:'+input.sourcesType;
						SourceListObj['source']		=	'urn:epc:id:sgln:'+FormattedSource;
					}
					else if(SyntaxType == 'webURI')
					{
						SourceListObj['type']		=	Domain+'voc/SDT-'+input.sourcesType;
						SourceListObj['source']		=	Domain2+'414/'+input.SourceGLN+'/254/'+input.SourceGLNExtension;
					}
				}
			}
			else if(input.sourcesType == 'other')
			{
				SourceListObj['type']		=	input.OtherSourceURI1;
				SourceListObj['source']		=	input.OtherSourceURI2;
			}
			
			ObjectEvent['sourceList'].push(SourceListObj)
		}

		//Check for the Destination and Destination type
		if(input.destinationsType != '' && input.destinationsType != null && input.destinationsType != undefined)
		{
			if(input.destinationsType == 'owning_party' || input.destinationsType == 'processing_party' || input.destinationsType == 'location')
			{
				//Find the check digit in 13th place
				input.DestinationGLN				=	input.DestinationGLN.substring(0,12) + gs1.checkdigit(input.DestinationGLN.substring(0,12));

				ObjectEvent['destinationList']		=	[];
				var Domain2							=	'https://id.gs1.org/';	
				var destinationListObj				=	new Object();
				var destinationGLN					=	input.DestinationGLN;
				var destinationCompanyPrefix		=	input.DestinationCompanyPrefix;
				var FormattedDestination;
			
				xml_json_functions.SourceDestinationFormatter(destinationGLN,destinationCompanyPrefix,function(data)
				{
					FormattedDestination	=	data;
				});
				
				if(input.destinationsType == 'owning_party' || input.destinationsType == 'processing_party')
				{
					//If PGLN then directly append
					if(input.DestinationLNType == 'pgln')
					{
						if(SyntaxType == 'urn')
						{
							destinationListObj['type']			=	'urn:epcglobal:cbv:sdt:'+input.destinationsType;
							destinationListObj['destination']	=	'urn:epc:id:pgln:' + FormattedDestination	
						}
						else if(SyntaxType == 'webURI')
						{
							destinationListObj['type']			=	Domain+'voc/SDT-'+input.destinationsType;
							destinationListObj['source']		=	Domain2+'414/'+input.DestinationGLN;
						}
													
					}
					else if(input.DestinationLNType == 'sgln')
					{
						if(SyntaxType == 'urn')
						{
							FormattedDestination				=	FormattedDestination + '.' + input.DestinationGLNExtension;
							destinationListObj['type']			=	'urn:epcglobal:cbv:sdt:'+input.destinationsType;
							destinationListObj['destination']	=	'urn:epc:id:pgln:' + FormattedDestination	
						}
						else if(SyntaxType == 'webURI')
						{
							destinationListObj['type']			=	Domain+'voc/SDT-'+input.destinationsType;
							destinationListObj['source']		=	Domain2+'414/'+input.DestinationGLN+'/254/'+input.DestinationGLNExtension;
						}												
					}	
				}
				
				if(input.destinationsType == 'location')
				{
					if(SyntaxType == 'urn')
					{
						FormattedDestination					=	FormattedDestination + '.' + input.DestinationGLNExtension;
						destinationListObj['type']				=	'urn:epcglobal:cbv:sdt:'+input.destinationsType;
						destinationListObj['destination']		=	'urn:epc:id:pgln:' + FormattedDestination	
					}
					else if(SyntaxType == 'webURI')
					{
						destinationListObj['type']				=	Domain+'voc/SDT-'+input.destinationsType;
						destinationListObj['source']			=	Domain2+'414/'+input.DestinationGLN+'/254/'+input.DestinationGLNExtension;
					}									
				}					
			}
			else if(input.destinationsType == 'other')
			{
				destinationListObj['type']			=	input.OtherDestinationURI1;
				destinationListObj['destination']	=	input.OtherDestinationURI2;
			}
			
			ObjectEvent['destinationList'].push(destinationListObj);
		}
		
		//Add ILMD for Object and Transformation Events
		if(input.eventtype1 == "ObjectEvent" || input.eventtype1 == "TransformationEvent")
		{
			if(Query.ILMD.length > 0)
			{
				var ilmd 		= 	ObjectEvent['ilmd']	=	{};
				var ilmdList	=	Query.ILMD;

				for(var i=0; i<Query.ILMD.length; i++)
				{
					var NameSpace 	=	ilmdList[i].NameSpace;
					var LocalName 	=	ilmdList[i].LocalName;

					if(NameSpace.includes("http://") || NameSpace.includes("https://"))
					{
						NameSpace 	= 	NameSpace.split("/").slice(2);
						NameSpace 	= 	NameSpace[0].toString().substr(0, NameSpace[0].indexOf("."));
						var value	=	NameSpace+':'+LocalName;
						ilmd[value]	=	ilmdList[i].FreeText
					}
					else
					{
						var value	=	NameSpace+':'+LocalName;
						ilmd[value]	=	ilmdList[i].FreeText
					}
				}
			}
		}
		
		//Sensor Information
		if(Query.SensorForm.length > 0)
		{				
			var SensorForm							=	Query.SensorForm;
			ObjectEvent['sensorElementList']		=	[];	
			
			//Loop through the SensorForm and find the number of elements
			for(var sf=0; sf<SensorForm.length; sf++)
			{	
				var SensorMetaOuterObj		=	new Object();
				
				//Loop through Each sensor Element
				for(var t=0; t<SensorForm[sf].length; t++)
				{
					var SensorMetadatObj	=	new Object();
					
					//Add the Sensor Metadata information if its populated
					SensorChecker(SensorForm[sf][t].Time,'time',SensorMetadatObj)
					SensorChecker(SensorForm[sf][t].StartTime,'startTime',SensorMetadatObj)
					SensorChecker(SensorForm[sf][t].EndTime,'endTime',SensorMetadatObj)
					SensorChecker(SensorForm[sf][t].DeviceID,'deviceID',SensorMetadatObj)
					SensorChecker(SensorForm[sf][t].DeviceMetadata,'deviceMetaData',SensorMetadatObj)
					SensorChecker(SensorForm[sf][t].RawData,'rawData',SensorMetadatObj)
					SensorChecker(SensorForm[sf][t].DataProcessingMethod,'dataProcessingMethod',SensorMetadatObj)
					SensorChecker(SensorForm[sf][t].BusinessRules,'bizRules',SensorMetadatObj)
					
					if(Object.keys(SensorMetadatObj).length != 0)
					{
						SensorMetaOuterObj["sensorMetaData"]	=	SensorMetadatObj;
					}				
					
					var SensorElements		=	SensorForm[sf][t].SensorElements;
					
					if(SensorElements.length > 0)
					{
						SensorMetaOuterObj["sensorReport"]		=	[];
						
						for(var e=0;e<SensorElements.length;e++)
						{
							var SensorReportElement	=	new Object();
							var SensorType			=	SensorElements[e].SensorFields.Type;
							
							SensorChecker(SensorElements[e].SensorFields.Time,'time',SensorReportElement)
							
							if(SensorType != '' && SensorType != null && SensorType != undefined){
								SensorReportElement['type']	=	'gs1:'+SensorType;
							}
							
							//Check if the field is populated and add it to the sensor element list
							SensorChecker(SensorElements[e].SensorFields.DeviceID,'deviceID',SensorReportElement)
							SensorChecker(SensorElements[e].SensorFields.DeviceMetaData,'deviceMetaData',SensorReportElement)
							SensorChecker(SensorElements[e].SensorFields.RawData,'rawData',SensorReportElement)
							SensorChecker(SensorElements[e].SensorFields.DataProcessingMethod,'dataProcessingMethod',SensorReportElement)
							SensorChecker(SensorElements[e].SensorFields.Time,'time',SensorReportElement)
							SensorChecker(SensorElements[e].SensorFields.Microorganism,'microorganism',SensorReportElement)
							SensorChecker(SensorElements[e].SensorFields.ChemicalSubstance,'chemicalSubstance',SensorReportElement)							
							SensorChecker(SensorElements[e].SensorFields.Value,'value',SensorReportElement)
							SensorChecker(SensorElements[e].SensorFields.Component,'component',SensorReportElement)
							SensorChecker(SensorElements[e].SensorFields.StringValue,'stringValue',SensorReportElement)
							SensorChecker(SensorElements[e].SensorFields.BooleanValue,'booleanValue',SensorReportElement)
							SensorChecker(SensorElements[e].SensorFields.HexBinaryValue,'hexBinaryValue',SensorReportElement)
							SensorChecker(SensorElements[e].SensorFields.URIValue,'uriValue',SensorReportElement)		
							SensorChecker(SensorElements[e].SensorFields.MaxValue,'maxValue',SensorReportElement)							
							SensorChecker(SensorElements[e].SensorFields.MinValue,'minValue',SensorReportElement)							
							SensorChecker(SensorElements[e].SensorFields.MeanValue,'meanValue',SensorReportElement)						
							SensorChecker(SensorElements[e].SensorFields.StandardDeviation,'sDev',SensorReportElement)	
							SensorChecker(SensorElements[e].SensorFields.PercRank,'percRank',SensorReportElement)	
							SensorChecker(SensorElements[e].SensorFields.PercValue,'percValue',SensorReportElement)								
							SensorChecker(SensorElements[e].SensorFields.UOM,'uom',SensorReportElement)
							
							SensorMetaOuterObj["sensorReport"].push(SensorReportElement);
						}
					}
				}
				
				ObjectEvent['sensorElementList'].push(SensorMetaOuterObj);				
			}		
		}
		
		//Function to check if the field is populated for sensor elements
		function SensorChecker(field, attValue, SensorMetadatObj){
			if(field != '' && field != null && field != undefined)
			{
				SensorMetadatObj[attValue]	=	field;
			}
		}
		
		//Check for the PERSISTENT DISPOSITION
		if(input.PersistentDisposition != '' && input.PersistentDisposition != null && typeof input.PersistentDisposition != undefined)
		{
			ObjectEvent['persistentDisposition']	=	{};	
			
			if(input.PersistentDisposition == 'DispositionEnter')
			{
				ObjectEvent.persistentDisposition[input.PersistentDispositionType]	=	input.EnterPersistentDispositionText;	
			}
			else
			{
				if(SyntaxType == 'urn')
				{
					ObjectEvent.persistentDisposition[input.PersistentDispositionType]	=	'urn:epcglobal:cbv:disp:'+input.PersistentDisposition;
				}
				else if(SyntaxType == 'webURI')
				{
					ObjectEvent.persistentDisposition[input.PersistentDispositionType]	=	Domain+'voc/Disp-'+input.PersistentDisposition;
				}
			}
		}		
		
		//Check if the extension field is filled and add the JSON
		var Extension			=	Query.Extension;
		if(Extension.length > 0)
		{
			for(var ex=0; ex<Extension.length; ex++)
			{
				var NameSpace 	=	Extension[ex].NameSpace; 
				var LocalName 	=	Extension[ex].LocalName;
					
				if(Extension[ex].NameSpace.includes("http://") || Extension[ex].NameSpace.includes("https://"))
				{		
					NameSpace 			= 	NameSpace.split("/").slice(2);
					NameSpace 			= 	NameSpace[0].toString().substr(0, NameSpace[0].indexOf("."));
					var value			=	NameSpace+':'+LocalName;
					ObjectEvent[value]	=	Extension[ex].FreeText
					//ObjectEvent.ele(NameSpace+':'+LocalName,Extension[ex].FreeText).up()
				}
				else
				{
					var value			=	NameSpace+':'+LocalName;
					ObjectEvent[value]	=	Extension[ex].FreeText
					//ObjectEvent.ele(Extension[ex].NameSpace+Extension[ex].LocalName,Extension[ex].FreeText).up()
				}
			}
		}
		
		MainArray.push(ObjectEvent)
		
		//Increment the count and push the each event to an array
		itemProcessed++;
	
		if(itemProcessed == input.eventcount)
		{
			if(Query.XMLElement == 'Single')
			{
				JSONschemaParse.epcisBody['eventList'] 	= 	[];
				JSONschemaParse.epcisBody['eventList']	=	MainArray;
				callback(JSON.stringify(JSONschemaParse));
			}
			else
			{
				JSONschemaParse.epcisBody['eventList'] = JSONschemaParse.epcisBody['eventList'].concat(MainArray);
				callback(JSON.stringify(JSONschemaParse));
			}
		}
	}
};
