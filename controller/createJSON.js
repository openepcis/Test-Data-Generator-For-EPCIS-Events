var moment 				= 	require('moment-timezone');
var moment 				= 	require('moment');
var xml_json_functions	=	require('./XML_JSON_Functions');

exports.createJSONData	=	function(Query,callback){
	var input			=	Query.input;
	var today 		= 	new Date();
	let date 			= 	today.toISOString().slice(0, 10).replace(/-/g,"_");
	var time 			= 	(today.getHours()+1) + ":" + today.getMinutes() + ":" + today.getSeconds();
			time			= 	time.replace(/:/g,"_");
	var now 			=		date+"T"+time;
	var offset		= 	today.getTimezoneOffset()/60+':00';
	var data			=		{};

	var jsonData	=		[];

	var readPoint 			=	"";
	var businessLocation	=	"";
	var BusinessStep 		=	"";
	var Disposition 		=	"";
	var EventTime			=	"";
	var RecordTime			=	"";
	var EpcLists			=	[];
	var File 				= 	'JSON';
	var SourceType			=	"";
	var DestinationType		=	"";
	var Source 				=	"";
	var Destination			=	"";
	var itemProcessed 		=	0;
	var RecordTimeArray		=	[];	
	var EventTimeArray		=	[];

	//Create the initial strucutre for the JSON data

	var JSONschemaParse 				=	{
												"@context"		: 	"https://id.gs1.org/epcis-context.jsonld",
												"isA"			:	"EPCISDocument",
												"creationDate"	:	now,
												"schemaVersion"	: 	1.2,
												"format"		: 	"application/ld+json",
												"epcisBody"		:	{}
											}

	var MainObject 	=	JSONschemaParse.epcisBody['EventList'] = {};
	var MainArray	=	[];
	

	//Loop through the event count and create append to JSON data
	for(var count=1; count<=input.eventcount; count++)
	{
		var ObjectEvent	=	{};
		
		//var ObjectEvent = JSONschemaParse.epcisBody.EventList[input.eventtype1] = {};
		
		//Check what type of EVENT TIME is required and fill the values accordingly
		if(input.EventTimeSelector != "" && input.EventTimeSelector != null && typeof input.EventTimeSelector != undefined)
		{
			//If Specific Event time has been selected
			if(input.EventTimeSelector == 'SpecificTime')
			{
				input.eventtimeSpecific				= 	new Date(input.eventtimeSpecific);
				input.eventtimeSpecific				= 	moment(input.eventtimeSpecific).format();
				ObjectEvent['eventTime']			=	input.eventtimeSpecific;
				ObjectEvent['eventTimeZoneOffset']	=	offset;
			}
			else if(input.EventTimeSelector == 'TimeRange')
			{
				var From			=	input.EventTimeFrom;
				var To				=	input.EventTimeTo;
				var EventCount		=	input.eventcount;
				
				if(count == 1)
				{
					EventTimeArray	=	[];
					xml_json_functions.RandomEventTimeGenerator(From,To,EventCount,File,function(ReturnEventTime){
						EventTimeArray	= ReturnEventTime;
					});
				}
				
				ObjectEvent['eventTime']			=	EventTimeArray[count-1];
				ObjectEvent['eventTimeZoneOffset']	=	offset;
			}

		}
		
		//Check what type of RECORD TIME is required and fill the values accordingly
		if(input.RecordTimeSelector != "" && input.RecordTimeSelector != null && typeof input.RecordTimeSelector != undefined)
		{
			//If specific Record Time has been selected
			if(input.RecordTimeSelector == 'SpecificTime')
			{
				input.recordtimeSpecific	= 	new Date(input.recordtimeSpecific);
				input.recordtimeSpecific	= 	moment(input.recordtimeSpecific).format();
				ObjectEvent['recordtime']	=	input.recordtimeSpecific;
			}
			else if(input.RecordTimeSelector == 'TimeRange')
			{				
				//If Range of time Record Time has been selected
				var From			=	input.RecordTimeFrom;
				var To				=	input.RecordTimeTo;
				var EventCount		=	input.eventcount;
				
				if(count == 1)
				{	
					RecordTimeArray	=	[];					
					xml_json_functions.RandomRecordTimeGenerator(From,To,EventCount,File,function(data){
						RecordTimeArray = data;
					});	
				}
				
				ObjectEvent['recordtime']	=	RecordTimeArray[count-1];				
			}

		}

		//If error declaration has been set then add the below tags
		if(input.eventtype2 == 'errordeclaration' || input.EventId != "")
		{
			//Add the EVENT ID if its populated
			if(input.EventId != "" && input.EventId != null && typeof input.EventId != undefined)
			{
				ObjectEvent['baseExtension']			=	{};
				ObjectEvent.baseExtension['eventID']	=	input.EventId;
			}

			//Add the error declaration if its populated
			if(input.eventtype2 == 'errordeclaration')
			{
				ObjectEvent['baseExtension']			=	{};
				var ErrorValue = ObjectEvent.baseExtension['errorDeclaration']	=	{};

				//Change the format of the Declaration time
				input.ErrorDeclarationTime 			= 	moment(input.ErrorDeclarationTime).format();

				//Add Error Declaration Time
				ObjectEvent.baseExtension.errorDeclaration['declarationTime']		=	input.ErrorDeclarationTime;

				//Add Error Reason
				if(input.ErrorReasonType == 'Other')
				{
					ObjectEvent.baseExtension.errorDeclaration['reason']	=	input.ErrorReasonOther;
				}
				else
				{
					ObjectEvent.baseExtension.errorDeclaration['reason']	=	'urn:epcglobal:cbv:er:'+input.ErrorReasonType;
				}
				

				if(Query.ErrorCorrection.length > 0)
				{
						ObjectEvent.baseExtension.errorDeclaration['correctiveEventIDs']	=	{};
						var CorrectionText			=	[];
						for(var e=0; e<Query.ErrorCorrection.length; e++)
						{
							CorrectionText.push(Query.ErrorCorrection[e].CorrectiveText);
						}

						ObjectEvent.baseExtension.errorDeclaration.correctiveEventIDs['correctiveEventID']	=	CorrectionText;
				}

				//Loop and add the Extension for Error and Add the Error Extension
				if(Query.ErrorExtension.length > 0)
				{
					var ErrorExtension	=	Query.ErrorExtension;
					
					for(var i=0; i<ErrorExtension.length; i++)
					{
						var NameSpace 	=	ErrorExtension[i].NameSpace;
						var LocalName 	=	ErrorExtension[i].LocalName;

						if(NameSpace.includes("http://") || NameSpace.includes("https://"))
						{
							NameSpace 			= 	NameSpace.split("/").slice(2);
							NameSpace 			= 	NameSpace[0].toString().substr(0, NameSpace[0].indexOf("."));
							var value			=	NameSpace+':'+LocalName;
							ErrorValue[value]	=	ErrorExtension[i].FreeText
						}
						else
						{
							var value			=	NameSpace+':'+LocalName;
							ErrorValue[value]	=	ErrorExtension[i].FreeText
						}
					}
				}
			}
		}

		//IF the event type is Object event
		if(input.eventtype1 == 'ObjectEvent')
		{
			if(Query.EPCs.length > 0)
			{
				var NewEPCS		=	 [];

				for(var o=0; o<Query.EPCs.length; o++)
				{
					var OEEPCS	=	Query.EPCs[o];

					for(var e=0; e<OEEPCS.length; e++)
					{
						NewEPCS.push(OEEPCS[e]);
					}
				}

				ObjectEvent['epcList'] = NewEPCS;
			}
		}
		else if(input.eventtype1 == "AggregationEvent")
		{
			//Add the parent of AggregationEvent
			if(Query.ParentID != null)
			{
				ObjectEvent['parentID']	=	Query.ParentID[0];
			}
			//Add the CHILD EPCS of AggregationEvent
			if(Query.ChildEPCS != null)
			{
				ObjectEvent['childEPCs']	=	  {};
				var ChildEPCSURI	=	Query.ChildEPCS;
				var AllChildEpcs	=	[];
				
				for(var o=0; o<ChildEPCSURI.length; o++)
				{
					for(var c=0; c<ChildEPCSURI[o].length; c++)
					{
						AllChildEpcs.push(ChildEPCSURI[o][c]);
					}
				}
				
				ObjectEvent.childEPCs['epc']	=	AllChildEpcs;
			}	
		}
		else if(input.eventtype1 == "TransactionEvent")
		{
			//TransactionEvent Parent ID
			if(Query.Parent.length >0)
			{
				ObjectEvent['parentID']		=	Query.Parent[0];
			}
			
			//TransactionEvent EPCS
			if(Query.EPCs.length > 0)
			{
				ObjectEvent['epcList']	=	{};
				var EPCs				=	Query.EPCs;
				var AllChildEpcs		=	[];
				
				for(var o=0; o<EPCs.length; o++)
				{
					for(var e=0; e<EPCs[o].length; e++)
					{
						AllChildEpcs.push(EPCs[o][e]);
					}
				}

				ObjectEvent.epcList['epc']	=	AllChildEpcs;					
			}
		}
		else if(input.eventtype1 == "TransformationEvent")
		{
			//Transformation Event Input EPCs
			if(Query.InputEPCs.length > 0)
			{
				ObjectEvent['inputEPCList']		=	{};
				var InputEPCs					=	[];
				
				for(var o=0; o<Query.InputEPCs.length; o++)
				{
					for(var i=0; i<Query.InputEPCs[o].length; i++)
					{
						InputEPCs.push(Query.InputEPCs[o][i]);
					}
				}
				
				ObjectEvent.inputEPCList['epc']		=	InputEPCs;
			}
			
			//Transformation Event Input Quantities
			if(Query.InputQuantities.length > 0)
			{
				ObjectEvent['inputQuantityList']	=	{};
				var QuantityArray					=	[];
				
				for(var i=0; i<Query.InputQuantities.length; i++)
				{					
					var InputQuantities		=	Query.InputQuantities[i];
					
					for(var q=0; q<InputQuantities.length; q++)
					{	
						var obj 			= 	new Object();
						obj.epcClass		=	InputQuantities[q].URI;						
						
						if(InputQuantities[q].QuantityType == 'Fixed Measure Quantity')
						{
							obj.quantity	=	InputQuantities[q].Quantity;
							QuantityArray.push(obj);
						}
						else if(InputQuantities[q].QuantityType == 'Variable Measure Quantity')
						{
							obj.quantity	=	InputQuantities[q].Quantity;
							obj.uom			=	InputQuantities[q].QuantityUOM;
							QuantityArray.push(obj);
						}
						else
						{
							QuantityArray.push(obj);
						}
					}
				}				
				ObjectEvent.inputQuantityList['quantityElement']	=	QuantityArray;
			}
			
			//Transformation Event output EPCS
			if(Query.OutputEPCs.length > 0)
			{
				ObjectEvent['outputEPCList']	=	{};
				var OutputEPCsArray					=	[];
				
				for(var o=0; o<Query.OutputEPCs.length; o++)
				{
					for(var i=0; i<Query.OutputEPCs[o].length; i++)
					{		
						OutputEPCsArray.push(Query.OutputEPCs[o][i]);
					}
				}	
				ObjectEvent.outputEPCList['epc']		=	OutputEPCsArray;
			}
			
			//Transformation Event Output Quantities
			if(Query.OutputQuantities.length > 0)
			{
				ObjectEvent['outputQuantityList']	=	{};
				var OutputQuantitiesArray			=	[];				
				
				for(var o=0; o<Query.OutputQuantities.length; o++)
				{
					var OutputQuantities	=	Query.OutputQuantities[o];
					
					for(var q=0; q<OutputQuantities.length; q++)
					{	
						var obj 			= 	new Object();
						obj.epcClass		=	OutputQuantities[q].URI;	
						
						if(OutputQuantities[q].QuantityType == 'Fixed Measure Quantity')
						{
							obj.quantity	=	OutputQuantities[q].Quantity;
							OutputQuantitiesArray.push(obj);
						}
						else if(OutputQuantities[q].QuantityType == 'Variable Measure Quantity')
						{
							obj.quantity	=	OutputQuantities[q].Quantity;
							obj.uom			=	OutputQuantities[q].QuantityUOM;
							OutputQuantitiesArray.push(obj);
						}
						else
						{
							OutputQuantitiesArray.push(obj);
						}
					}	
				}
				
				ObjectEvent.outputQuantityList['quantityElement']	=	OutputQuantitiesArray;
			}
		}
		else if(input.eventtype1 == "AssociationEvent")
		{
			//Add the Parent for Association Event
			if(Query.ParentID != null)
			{
				ObjectEvent['parentID']	=	Query.ParentID[0];
			}
			
			//Add the CHILD EPCS of AssociationEvent
			if(Query.ChildEPCS != null)
			{
				var ChildEPCSURI			=	Query.ChildEPCS;
				ObjectEvent['childEPCs']	=	  {};
				var AllChildEpcs			=	[];
				
				for(var o=0; o<ChildEPCSURI.length; o++)
				{
					for(var c=0; c<ChildEPCSURI[o].length; c++)
					{
						AllChildEpcs.push(ChildEPCSURI[o][c]);
					}
				}
				
				ObjectEvent.childEPCs['epc']	=	AllChildEpcs;
			}
			
			//Add the Child Quan of Association Event
			if(Query.ChildQuantities.length > 0)
			{
				var QuantityEPCs	=	[];				
				
				for(var o=0; o<Query.ChildQuantities.length; o++)
				{
					var ChildQuantitiesURI	=	Query.ChildQuantities[o];
					
					for(c=0; c<ChildQuantitiesURI.length;c++)
					{
						var obj 			= 	new Object();
						obj.epcClass		=	ChildQuantitiesURI[c].URI;
						
						if(ChildQuantitiesURI[c].QuantityType == 'Fixed Measure Quantity')
						{
							obj.quantity	=	ChildQuantitiesURI[c].Quantity;
							QuantityEPCs.push(obj);
						}
						else if(ChildQuantitiesURI[c].QuantityType == 'Variable Measure Quantity')
						{
							obj.quantity	=	ChildQuantitiesURI[c].Quantity;
							obj.uom			=	ChildQuantitiesURI[c].QuantityUOM;
							QuantityEPCs.push(obj);
						}
						else
						{
							QuantityEPCs.push(obj);
						}
					}	
				}
				ObjectEvent['quantityList']	=	QuantityEPCs;
			}
		}

		//Check for action element and add it
		if(input.action != "" && input.action != null && typeof input.action != undefined)
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
				ObjectEvent['bizStep']  = 'urn:epcglobal:cbv:bizstep:'+input.businessStep;
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
				ObjectEvent['disposition']	=	'urn:epcglobal:cbv:disp:'+input.disposition;
			}
		}

		//Check and create the readpoint and Busimess Location
		if(input.readpointselector != '' && input.readpointselector != null && typeof input.readpointselector != undefined)
		{
			if(input.readpointselector == 'manually')
			{
					ObjectEvent["readPoint"]		=	{};
					var readPoint 							= 	input.readpoint;
					ObjectEvent.readPoint['id']	=	readPoint;
			}
			else if(input.readpointselector == 'sgln')
			{
					xml_json_functions.ReadPointFormatter(input,File,function(data){
						ObjectEvent["readPoint"]		=	{};
						var readPoint 					= 	'urn:epc:id:sgln:'+data;
						ObjectEvent.readPoint['id']	=	readPoint;
					});
			}
		}

		//Check for the Business Location and set the Business Location
		if(input.businesslocationselector != '' && input.businesslocationselector != null && typeof input.businesslocationselector != undefined)
		{
			ObjectEvent['bizLocation']		=	{};

			if(input.businesslocationselector == 'manually')
			{
				var businesslocation			= 	input.businesslocation
				ObjectEvent.bizLocation['id'] 	=	businesslocation;
			}
			else if(input.businesslocationselector == 'sgln')
			{
				xml_json_functions.BusinessLocationFormatter(input,File,function(data)
				{
					var businesslocation			= 	'urn:epc:id:sgln:'+data
					ObjectEvent.bizLocation['id'] 	=	businesslocation;
				});
			}
		}


		//Check for the Quantity element and add it to the JSON
		var extension		=	ObjectEvent['extension']  	= 	{};
		
		if(input.eventtype1 == "ObjectEvent")
		{	
			//OBJECT EVENT CHILD Quantities
			if(Query.Quantities.length > 0)
			{				
				var QuantitiesURIs	=	Query.Quantities;
				var QuantityArray	=	[];

				for(var o=0; o<QuantitiesURIs.length; o++)
				{
					for(var q=0; q<QuantitiesURIs[o].length; q++)
					{
						var obj 			= 	new Object();
						obj.epcClass		=	QuantitiesURIs[o][q].URI;

						if(QuantitiesURIs[o][q].QuantityType == 'Fixed Measure Quantity')
						{
							obj.quantity	=	QuantitiesURIs[o][q].Quantity;
							QuantityArray.push(obj);
						}
						else if(QuantitiesURIs[o][q].QuantityType == 'Variable Measure Quantity')
						{
							obj.quantity	=	QuantitiesURIs[o][q].Quantity;
							obj.uom			=	QuantitiesURIs[o][q].QuantityUOM;
							QuantityArray.push(obj);
						}
						else
						{
							QuantityArray.push(obj);
						}
					}
				}
				ObjectEvent.extension['quantityList']	=	QuantityArray;
			}
		}
		else if(input.eventtype1 == "AggregationEvent")
		{
			//AGGREGATION EVENT CHILD Quantities			
			if(Query.ChildQuantities.length > 0)
			{
				var QuantityEPCs	=	[];
				
				for(var o=0; o<Query.ChildQuantities.length; o++)
				{
					var ChildQuantitiesURI	=	Query.ChildQuantities[o];
					
					for(c=0; c<ChildQuantitiesURI.length;c++)
					{
						var obj 			= 	new Object();
						obj.epcClass		=	ChildQuantitiesURI[c].URI;
						
						if(ChildQuantitiesURI[c].QuantityType == 'Fixed Measure Quantity')
						{
							obj.quantity	=	ChildQuantitiesURI[c].Quantity;
							QuantityEPCs.push(obj);
						}
						else if(ChildQuantitiesURI[c].QuantityType == 'Variable Measure Quantity')
						{
							obj.quantity	=	ChildQuantitiesURI[c].Quantity;
							obj.uom			=	ChildQuantitiesURI[c].QuantityUOM;
							QuantityEPCs.push(obj);
						}
						else
						{
							QuantityEPCs.push(obj);
						}
					}	
				}
				
				ObjectEvent.extension['quantityList']	=	QuantityEPCs;
			}
		}
		else if(input.eventtype1 == "TransactionEvent")
		{
			//TRANSACTION EVENT CHILD QUANTITIES
			if(Query.Quantities.length >0)
			{
				var QuantityEPCs	=	[];
				
				for(var o=0; o<Query.Quantities.length; o++)
				{
					var Quantities 		=	Query.Quantities[o];
				
					for(q=0; q<Quantities.length; q++)
					{
						var obj 			= 	new Object();
						obj.epcClass		=	Quantities[q].URI;
						
						if(Quantities[q].QuantityType == 'Fixed Measure Quantity')
						{
							obj.quantity	=	Quantities[q].Quantity;
						}
						else if(Quantities[q].QuantityType == 'Variable Measure Quantity')
						{
							obj.quantity	=	Quantities[q].Quantity;
							obj.uom			=	Quantities[q].QuantityUOM;
							QuantityEPCs.push(obj);
						}
						else
						{
							QuantityEPCs.push(obj);
						}
					}
				}
				
				ObjectEvent.extension['quantityList']	=	QuantityEPCs;				
			}
		}

		//Check for the Source and Source type
		if(input.sourcesType != '' && input.sourcesType != null && input.sourcesType != undefined)
		{
			ObjectEvent['sourceList']		=	{};
			
			if(input.sourcesType == 'owning_party' || input.sourcesType == 'processing_party')
			{
				ObjectEvent.sourceList['type']	=	'urn:epcglobal:cbv:sdt:'+input.sourcesType;
				var SourceGLN			=	input.SourceGLN;
				var SourceCompanyPrefix	=	input.SourcesCompanyPrefix;
				
				xml_json_functions.SourceDestinationFormatter(SourceGLN,SourceCompanyPrefix,function(data)
				{				
					//If PGLN then directly append
					if(input.SourceLNType == 'pgln')
					{						
						ObjectEvent.sourceList['source']	=	data;
											
					}
					else if(input.SourceLNType == 'sgln')
					{
						data								=	data + '.' + input.SourceGLNExtension;
						ObjectEvent.sourceList['source']	=	data;							
					}
				});
			}
			else if(input.sourcesType == 'location')
			{
				ObjectEvent.sourceList['type']		=	'urn:epcglobal:cbv:sdt:'+input.sourcesType;
				ObjectEvent.sourceList['source']	=	input.SourceLocationURI;				
			}
			else if(input.sourcesType == 'other')
			{
				ObjectEvent.sourceList['type']		=	input.OtherSourceURI1;
				ObjectEvent.sourceList['source']	=	input.OtherSourceURI2;
			}
		}

		//Check for the Destination and Destination type
		if(input.destinationsType != '' && input.destinationsType != null && input.destinationsType != undefined)
		{
			ObjectEvent['destinationList']		=	{};

			if(input.destinationsType == 'owning_party' || input.destinationsType == 'processing_party')
			{
				var destinationGLN				=	input.DestinationGLN;
				var destinationCompanyPrefix	=	input.DestinationCompanyPrefix;
				
				xml_json_functions.SourceDestinationFormatter(destinationGLN,destinationCompanyPrefix,function(data)
				{
					//If PGLN then directly append
					if(input.DestinationLNType == 'pgln')
					{
						ObjectEvent.destinationList['destination']	=	data
						ObjectEvent.destinationList['type']			=	'urn:epcglobal:cbv:sdt:'+input.destinationsType;		
					}
					else if(input.DestinationLNType == 'sgln')
					{
						data				=	data + '.' + input.DestinationGLNExtension;
						ObjectEvent.destinationList['destination']	=	data
						ObjectEvent.destinationList['type']	=	'urn:epcglobal:cbv:sdt:'+input.destinationsType;	
					}
				});
			}
			else if(input.destinationsType == 'location')
			{
				ObjectEvent.destinationList['type']			=	'urn:epcglobal:cbv:sdt:'+input.destinationsType;
				ObjectEvent.destinationList['destination']	=	input.DestinationLocationURI;
			}
			else if(input.destinationsType == 'other')
			{
				ObjectEvent.destinationList['type']			=	input.OtherDestinationURI1;
				ObjectEvent.destinationList['destination']	=	input.OtherDestinationURI2;
			}
		}

		//Check for the ILMD and add it to the JSON
		if(input.eventtype1 == "ObjectEvent" || input.eventtype1 == "TransformationEvent")
		{
			if(Query.ILMD.length > 0)
			{
				var ilmd 		= 	ObjectEvent.extension['ilmd']	=	{};
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
		
		//Check for sensor Elements and populate the data
		if(Query.SensorForm.length > 0)
		{
			var SensorForm				=	Query.SensorForm;
			var SensorElementList		=	[];
			
			//Loop through the SensorForm and find the number of elements
			for(var sf=0; sf<SensorForm.length; sf++)
			{
				var SensorElementObj				=	new Object();				
				SensorElementObj.sensorElement		=	{};
				//Loop through Each sensor Element
				for(var t=0; t<SensorForm[sf].length; t++)
				{
					var SensorReportArray								=	[];									
					//Add the Sensor Metadata information
					if(SensorForm[sf][t].CheckBox){
						SensorElementObj.sensorElement.sensorMetaData			=	{};	
						SensorElementObj.sensorElement.sensorMetaData.time		=	moment(SensorForm[sf][t].Time).format()
						SensorElementObj.sensorElement.sensorMetaData.startTime	=	moment(SensorForm[sf][t].StartTime).format()
						SensorElementObj.sensorElement.sensorMetaData.endTime	=	moment(SensorForm[sf][t].EndTime).format()
					}
					
					var SensorElements		=	SensorForm[sf][t].SENSORELEMENTS;
					
					//Loop through Each Sensor Report Data
					for(var e=0;e<SensorElements.length;e++){
						
						var SensorReportObj	=	new Object();
						
						var SensorType		=	SensorElements[e].SensorFields.Type;
						var SensorValue		=	SensorElements[e].SensorFields.Value;
						var SensorUOM		=	SensorElements[e].SensorFields.UOM;
						
						if(SensorType != '' && SensorType != null && SensorType != undefined){							
							SensorReportObj.type 	= 	'gs1:'+SensorType;
						}
						
						if(SensorValue != '' && SensorValue != null && SensorValue != undefined){
							SensorReportObj.value	=	'gs1:'+SensorValue;
						}
							
						if(SensorUOM != '' && SensorUOM != null && SensorUOM != undefined){
							SensorReportObj.uom	=	'gs1:'+SensorUOM;
						}
						SensorReportArray.push(SensorReportObj);
					}	
					if(SensorReportArray.length > 0)
					{
						SensorElementObj.sensorElement.sensorReport	= SensorReportArray;
					}
					SensorElementList.push(SensorElementObj);					
				}
			}
			extension['sensorElementList']	=	SensorElementList;
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

		//Increment the count and push the each event to an array
		itemProcessed++;
		if(input.eventtype1 == "ObjectEvent")
		{
			MainArray.push({'ObjectEvent':ObjectEvent});
		}
		else if(input.eventtype1 == "AggregationEvent")
		{
			MainArray.push({'AggregationEvent':ObjectEvent});
		}
		else if(input.eventtype1 == "TransactionEvent")
		{
			MainArray.push({'TransactionEvent':ObjectEvent});
		}
		else if(input.eventtype1 == "TransformationEvent")
		{
			MainArray.push({'TransformationEvent':ObjectEvent});
		}
		else if(input.eventtype1 == "AssociationEvent")
		{
			MainArray.push({'AssociationEvent':ObjectEvent});
		}
	
		if(itemProcessed == input.eventcount)
		{
			if(input.eventtype1 == "AssociationEvent")
			{
				JSONschemaParse.epcisBody.EventList['extension']			=	{};
				JSONschemaParse.epcisBody.EventList.extension['extension']	=	MainArray;
			}
			else
			{
				JSONschemaParse.epcisBody['EventList']	=	MainArray
			}
			
			callback(JSON.stringify(JSONschemaParse));
		}
	}
};