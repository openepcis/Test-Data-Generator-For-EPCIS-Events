var builder 			=	require('xmlbuilder');
var moment 				= 	require('moment-timezone');
var moment 				= 	require('moment');
const gs1 				= 	require('gs1');
var xml_json_functions	=	require('./XML_JSON_Functions');
								
exports.createXMLData	=	function(Query,Root,callback){
	var input			=	Query.input;
	var itemProcessed 	=	0;
	var File 			= 	'XML';
	var RecordTimeArray	=	[];
	var EventTimeArray	=	[];
	var ErrorTimeArray	=	[];
	var EventIDArray	=	[];
	var Domain			=	'https://gs1.org/';
	var SyntaxType		=	input.VocabSyntaxType;
	var XMLHeaders		=	[];
	var AESubExtension	=	"";
	var root			=	"";	

	//Assign the root node based on calling function							
	if(Query.XMLElement == 'Single')
	{
		var root		= 	builder.create('epcis:EPCISDocument')
								root.att('xmlns:epcis', "urn:epcglobal:epcis:xsd:1")
								root.att('xmlns:xsi', "http://www.w3.org/2001/XMLSchema-instance")
								root.att('xsi:schemaLocation',"urn:epcglobal:epcis:xsd:1 EPCglobal-epcis-2_0.xsd")
								
		//Call function to collect all the URLS from ILMD, Extension and Error Extension
		XMLHeaderFn();		
		
		//add the header elements from Extension, ILMD and Error Extension to XML Header
		for(var head=0; head<XMLHeaders.length; head++)
		{
			root.att('xmlns:'+XMLHeaders[head].xmlns,XMLHeaders[head].URL)
		}
		
		root.att('xmlns:cbvmda',"urn:epcglobal:cbv:mda")
		root.att('schemaVersion', "2.0")
		root.att('creationDate', moment().format())
		root	=	root.ele('EPCISBody')
		root	=	root.ele('EventList')
	}
	else
	{
		//Call function to collect all the URLS from ILMD, Extension and Error Extension
		XMLHeaderFn();
		
		Root = Root.up().up()
		
		//add the header elements from Extension, ILMD and Error Extension to XML Header
		for(var head=0; head<XMLHeaders.length; head++)
		{
			Root.att('xmlns:'+XMLHeaders[head].xmlns,XMLHeaders[head].URL)
		}	
		
		var root		=	Root;
	}
	
	//Function to Add all ILMD, Error Extension and Extension into an Arry
	function XMLHeaderFn()
	{
		//Get the elements from XML header for ILMD from XMLJSON function
		if(input.eventtype1 == "ObjectEvent" || input.eventtype1 == 'TransformationEvent')
		{
			if(Query.ILMD.length > 0)
			{
				//Call the function for ILMD
				xml_json_functions.schemaHeaders(Query.ILMD,function(ReturnXMLHeader){
					XMLHeaders	=	ReturnXMLHeader;
				});
			}
		}		
		
		//Get the elements from XML header for Extension from XMLJSON function
		if(Query.Extension.length > 0)
		{
			//Call function for Extension
			xml_json_functions.schemaHeaders(Query.Extension,function(ReturnXMLHeader){
				XMLHeaders	=	ReturnXMLHeader;
			});
		}
		
		//Get the elements for XML Header from Error Declaration Event
		if(input.eventtype2 == 'errordeclaration')
		{	
			if(Query.ErrorExtension.length > 0)
			{
				//Call the function for ILMD
				xml_json_functions.schemaHeaders(Query.ErrorExtension,function(ReturnXMLHeader){
					XMLHeaders	=	ReturnXMLHeader;
				});
			}
		}
	}
	
	for(var count=0; count<input.eventcount; count++)
	{
		var OuterExtension 	= "";
		var extension		= "";
		var baseExtension 	= "";
		
		//Add outer extension elements for Association Event		
		if(input.eventtype1 == "AssociationEvent")
		{
			var AEMainExtension = 	root.ele('extension')
			AESubExtension		=	AEMainExtension.ele('extension')
			var ObjectEvent		= 	AESubExtension.ele(input.eventtype1)
		}
		else if(input.eventtype1 == "TransformationEvent")
		{
			var TEMainExtension = 	root.ele('extension')
			var ObjectEvent		= 	TEMainExtension.ele(input.eventtype1)
		}
		else
		{
			var ObjectEvent 	=	root.ele(input.eventtype1)
		}
		
		//Check what type of EVENT TIME is required and fill the values accordingly
		if(input.EventTimeSelector != "" && input.EventTimeSelector != null && typeof input.EventTimeSelector != undefined)
		{
			//If Specific Event time has been selected
			if(input.EventTimeSelector == 'SpecificTime')
			{
				input.eventtimeSpecific		=	moment.utc(input.eventtimeSpecific).local().format('YYYY-MM-DDTHH:mm:SS.sss');
				ObjectEvent.ele('eventTime', input.eventtimeSpecific+input.EventTimeZone).up()
				RecordTime();
				ObjectEvent.ele('eventTimeZoneOffset', input.EventTimeZone).up()
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
				
				ObjectEvent.ele('eventTime', EventTimeArray[count]+input.EventTimeZone).up()
				RecordTime();
				ObjectEvent.ele('eventTimeZoneOffset', input.EventTimeZone).up()
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
							ObjectEvent.ele('recordTime', EventTimeArray[count]+input.EventTimeZone).up()
						}
						else if(input.EventTimeSelector == 'SpecificTime')
						{
							ObjectEvent.ele('recordTime', input.eventtimeSpecific+input.EventTimeZone).up()
						}					
					}
					else if(input.RecordTimeOptionType	== 'RecordTimeCurrentTime')
					{
						//If the current time is choosen
						ObjectEvent.ele('recordTime',moment().format()).up()
					}
				}
			}
		}
		
		//If error declaration has been set then add the below tags
		if(input.eventtype2 == 'errordeclaration' || input.EventIDOption == "yes")
		{
			//Add the error declaration if its populated
			if(input.EventIDOption == "yes")
			{
				baseExtension		=	ObjectEvent.ele('baseExtension')
				
				if(count == 0)
				{
					EventIDArray	=	[];
					xml_json_functions.RandomEventIDGenerator(File,input.eventcount,input.EventIDType,function(ReturnEventIDArray){
						EventIDArray	= ReturnEventIDArray;
					});	
				}
				
				baseExtension.ele('eventID',EventIDArray[count])
			}	
			
			//Add the error declaration if its populated
			if(input.eventtype2 == 'errordeclaration')
			{
				if(baseExtension == undefined || baseExtension == ""){
					baseExtension			=	ObjectEvent.ele('baseExtension')
				}
				
				var errorDeclaration	=	baseExtension.ele('errorDeclaration')
				
				//Check what type of error declaration has been choosen
				if(input.ErrorDeclarationTimeSelector != '')
				{
					if(input.ErrorDeclarationTimeSelector == 'SpecificTime')
					{
						//Add Error Declaration Time
						input.ErrorDeclarationTime		=	moment.utc(input.ErrorDeclarationTime).local().format('YYYY-MM-DDTHH:mm:SS.sss');
						errorDeclaration.ele('declarationTime',input.ErrorDeclarationTime+input.ErrorTimeZone)
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
						errorDeclaration.ele('declarationTime',ErrorTimeArray[count]+input.ErrorTimeZone)	
					}
				}
				
				//Add Error Reason type if its populated
				if(input.ErrorReasonType != "" && input.ErrorReasonType != null && typeof input.ErrorReasonType != undefined)
				{
					if(input.ErrorReasonType == 'Other')
					{
						errorDeclaration.ele('reason',input.ErrorReasonOther)
					}
					else
					{	
						if(SyntaxType == 'urn')
						{
							errorDeclaration.ele('reason','urn:epcglobal:cbv:er:'+input.ErrorReasonType)
						}
						else if(SyntaxType == 'webURI')
						{
							errorDeclaration.ele('reason',Domain+'voc/ER-'+input.ErrorReasonType)
						}
					}
				}
				
				//Loop and add the Corrective Event Ids
				if(Query.ErrorCorrection.length > 0)
				{
					var correctiveEventIDs	=	errorDeclaration.ele('correctiveEventIDs')
					for(var e=0; e<Query.ErrorCorrection.length; e++)
					{
						correctiveEventIDs.ele('correctiveEventID',Query.ErrorCorrection[e].CorrectiveText)
					}				
				}			
				
				//Loop and add the Extension for Error
				if(Query.ErrorExtension.length > 0)
				{
					var ErrorExtension	=	Query.ErrorExtension;
					
					for(var i=0; i<ErrorExtension.length; i++)
					{
						var NameSpace 	=	ErrorExtension[i].NameSpace;
						var LocalName 	=	ErrorExtension[i].LocalName;
						
						if(NameSpace.includes("http://") || NameSpace.includes("https://"))
						{
							NameSpace = NameSpace.split("/").slice(2);
							NameSpace = NameSpace[0].toString().substr(0, NameSpace[0].indexOf(".")); 
							errorDeclaration.ele(NameSpace+':'+LocalName,ErrorExtension[i].FreeText)
						}
						else
						{
							errorDeclaration.ele(NameSpace+':'+LocalName,ErrorExtension[i].FreeText)
						}
					}
				}
			}
			
		}
		
		//If the event is TransactionEvent then add Business Transacation List here
		if(input.eventtype1 == "TransactionEvent")
		{
			//Call the Business Transaction List function
			BusinessTrasactions();
		}
		
		//IF the event type is Object event
		if(input.eventtype1 == 'ObjectEvent')
		{
			var epcList 	= 	ObjectEvent.ele('epcList')
			
			if(Query.EPCs.length > 0)
			{			
				var EPCsArray	=	Query.EPCs[count];
				
				for(var e=0; e<EPCsArray.length; e++)
				{
					epcList.ele('epc',EPCsArray[e]).up
				}					
			}
		}
		else if(input.eventtype1 == "AggregationEvent")
		{				
			//Add the parent of AggregationEvent
			if(Query.ParentID.length > 0)
			{
				var AEParentID		=	Query.ParentID[count];
				ObjectEvent.ele('parentID',AEParentID[0]).up()				
			}
			
			
			//Add the CHILD EPCS of AggregationEvent
			var childEPCs		=	ObjectEvent.ele('childEPCs')
			
			if(Query.EPCs.length > 0)
			{
				var ChildEPCSURI	=	Query.EPCs[count];
				
				for(var c=0; c<ChildEPCSURI.length; c++)
				{
					childEPCs.ele('epc',ChildEPCSURI[c]).up()
				}			
			}		
		}
		else if(input.eventtype1 == "TransactionEvent")
		{
			//TransactionEvent Parent ID
			if(Query.ParentID.length >0)
			{
				var TEParentID		=	Query.ParentID[count];
				ObjectEvent.ele('parentID',TEParentID[0]).up()
			}
			
			//TransactionEvent EPCS
			var childEPCs	=	ObjectEvent.ele('epcList')
			
			if(Query.EPCs.length > 0)
			{
				var EPCs		=	Query.EPCs[count];
				
				
				for(var e=0; e<EPCs.length; e++)
				{						
					childEPCs.ele('epc',EPCs[e]).up()
				}				
			}
		}
		else if(input.eventtype1 == "TransformationEvent")
		{		
			//Add the Input EPCs
			if(Query.EPCs.length > 0)
			{
				var InputList	=	ObjectEvent.ele('inputEPCList')
				var InputEPCs	=	Query.EPCs[count];
				
				for(var i=0; i<InputEPCs.length; i++)
				{					
					InputList.ele('epc',InputEPCs[i]).up()
				}			
			}
			
			//Add the Input Quantities			
			if(Query.Quantities.length > 0)
			{
				var inputQuantityList	=	ObjectEvent.ele('inputQuantityList')				
				var InputQuantities		=	Query.Quantities[count];					
					
				for(var q=0; q<InputQuantities.length; q++)
				{	
					var quantityElement		=	inputQuantityList.ele('quantityElement')
					
					quantityElement.ele('epcClass',InputQuantities[q].URI)
					
					if(InputQuantities[q].QuantityType == 'Fixed Measure Quantity')
					{							
						quantityElement.ele('quantity',InputQuantities[q].Quantity)
					}
					else if(InputQuantities[q].QuantityType == 'Variable Measure Quantity')
					{
						quantityElement.ele('quantity',InputQuantities[q].Quantity)
						quantityElement.ele('uom',InputQuantities[q].QuantityUOM)
					}
				}
				
			}			
			//Add the Output EPC List			
			//Add the Output EPCs
			if(Query.OutputEPCs.length > 0)
			{
				var outputEPCList	=	ObjectEvent.ele('outputEPCList')
				var outputEPCs		=	Query.OutputEPCs[count];
				
				for(var i=0; i<outputEPCs.length; i++)
				{					
					outputEPCList.ele('epc',outputEPCs[i]).up()
				}			
			}
			
			//Add the Output Quantities			
			if(Query.OutputQuantities.length > 0)
			{
				var outputQuantityList	=	ObjectEvent.ele('outputQuantityList')
				var quantityElement		=	outputQuantityList.ele('quantityElement')
				var OutputQuantities	=	Query.OutputQuantities[count];					
					
				for(var q=0; q<OutputQuantities.length; q++)
				{	
					quantityElement.ele('epcClass',OutputQuantities[q].URI).up()
					
					if(OutputQuantities[q].QuantityType == 'Fixed Measure Quantity')
					{
						quantityElement.ele('quantity',OutputQuantities[q].Quantity).up()
					}
					else if(OutputQuantities[q].QuantityType == 'Variable Measure Quantity')
					{
						quantityElement.ele('quantity',OutputQuantities[q].Quantity).up()
						quantityElement.ele('uom',OutputQuantities[q].QuantityUOM).up()
					}
				}								
			}
		}
		else if(input.eventtype1 == "AssociationEvent")
		{	
			//Add the Parent for Association Event
			if(Query.ParentID.length > 0)
			{
				var AEParentIDs		=	Query.ParentID[count];
				ObjectEvent.ele('parentID',AEParentIDs[0]).up()
			}
			
			//Add the CHILD EPCS of AssociationEvent
			var childEPCs		=	ObjectEvent.ele('childEPCs')
			
			if(Query.EPCs.length > 0)
			{
				var ChildEPCSURI	=	Query.EPCs[count];
				
				for(var c=0; c<ChildEPCSURI.length; c++)
				{
					childEPCs.ele('epc',ChildEPCSURI[c]).up()
				}			
			}
			
			//Add the Child Quan of Association Event
			if(Query.Quantities.length > 0)
			{
				var quantityList		= 	ObjectEvent.ele('childQuantityList')			
				var ChildQuantitiesURI	=	Query.Quantities[count];
				
				for(c=0; c<ChildQuantitiesURI.length;c++)
				{
					var quantityElement	=	quantityList.ele('quantityElement')
					quantityElement.ele('epcClass',ChildQuantitiesURI[c].URI).up()
					
					if(ChildQuantitiesURI[c].QuantityType == 'Fixed Measure Quantity')
					{
						quantityElement.ele('quantity',ChildQuantitiesURI[c].Quantity).up()
					}
					else if(ChildQuantitiesURI[c].QuantityType == 'Variable Measure Quantity')
					{
						quantityElement.ele('quantity',ChildQuantitiesURI[c].Quantity).up()
						quantityElement.ele('uom',ChildQuantitiesURI[c].QuantityUOM).up()
					}
				}			
			}
		}
		
		//Âdd the action value if populated
		if(input.action != "" && input.action != null && typeof input.action != undefined && input.eventtype1 != "TransformationEvent")
		{
			ObjectEvent.ele('action', input.action)
		}
		
		//Check for BUSINESS STEP
		if(input.businessStep != '' && input.businessStep != null && typeof input.businessStep != undefined)
		{
			if(input.businessStep == 'BusinessStepEnter')
			{
				ObjectEvent.ele('bizStep',input.EnterBusinessStepText)
			}
			else
			{
				if(SyntaxType == 'urn')
				{
					ObjectEvent.ele('bizStep','urn:epcglobal:cbv:bizstep:'+input.businessStep)
				}
				else if(SyntaxType == 'webURI')
				{
					ObjectEvent.ele('bizStep',Domain+'voc/Bizstep-'+input.businessStep)
				}
			}
		}
		
		//Check for DISPOSITION
		if(input.disposition != '' && input.disposition != null && typeof input.disposition != undefined)
		{
			if(input.disposition == 'DispositionEnter')
			{
				ObjectEvent.ele('disposition',input.EnterDispositionText)
			}
			else
			{
				if(SyntaxType == 'urn')
				{
					ObjectEvent.ele('disposition','urn:epcglobal:cbv:disp:'+input.disposition)
				}
				else if(SyntaxType == 'webURI')
				{
					ObjectEvent.ele('disposition',Domain+'voc/Disp-'+input.disposition)
				}
			}
		}		
		
		//Check for ReadPoint and based on that set the Readpoint 
		if(input.readpointselector != '' && input.readpointselector != null && typeof input.readpointselector != undefined)
		{	
			if(input.readpointselector == 'manually')
			{
				var readPoint = ObjectEvent.ele('readPoint')
				readPoint.ele('id', input.readpoint).up()
			}
			else if(input.readpointselector == 'sgln')
			{
				//Find the check digit in 13th place
				input.readpointsgln1	=	input.readpointsgln1.substring(0,12) + gs1.checkdigit(input.readpointsgln1.substring(0,12));

				var readPoint = ObjectEvent.ele('readPoint')
				if(SyntaxType == 'urn')
				{
					xml_json_functions.ReadPointFormatter(input,File,function(data){
						readPoint.ele('id', 'urn:epc:id:sgln:'+data).up()
					});		
				}
				else if(SyntaxType == 'webURI')
				{
					var readPoint = readPoint.ele('id', 'https://id.gs1.org/414/'+input.readpointsgln1+'/254/'+input.readpointsgln2)
				}						
			}
		}
		
		//Check for the Business Location and set the Business Location
		if(input.businesslocationselector != '' && input.businesslocationselector != null && typeof input.businesslocationselector != undefined)
		{
			if(input.businesslocationselector == 'manually')
			{
				var businesslocation = ObjectEvent.ele('bizLocation')
				businesslocation.ele('id', input.businesslocation).up()
			}
			else if(input.businesslocationselector == 'sgln')
			{
				//Find the check digit in 13th place
				input.businesspointsgln1	=	input.businesspointsgln1.substring(0,12) + gs1.checkdigit(input.businesspointsgln1.substring(0,12));

				var businesslocation = ObjectEvent.ele('bizLocation')
				
				if(SyntaxType == 'urn')
				{
					xml_json_functions.BusinessLocationFormatter(input,File,function(data){
						businesslocation.ele('id', 'urn:epc:id:sgln:'+data).up()
					});
				}	
				else if(SyntaxType == 'webURI')
				{
					businesslocation.ele('id', 'https://id.gs1.org/414/'+input.businesspointsgln1+'/254/'+input.businesspointsgln2)
				}
			}
		}
		
		//Add Business Transacations for Object Event and Aggregation Event
		if(input.eventtype1 == "ObjectEvent" || input.eventtype1 == "AggregationEvent")
		{
			BusinessTrasactions();
		}
		
		//Check for the Quantity element and add it to the XML		
		if(input.eventtype1 == "ObjectEvent")
		{				
			if(Query.Quantities.length > 0)
			{	
				if(OuterExtension == undefined || OuterExtension == ""){
					OuterExtension	=	ObjectEvent.ele('extension')			
				}
				
				var QuantitiesURIs	=	Query.Quantities[count];
				var quantityList	= 	OuterExtension.ele('quantityList')			
				
				for(var q=0; q<QuantitiesURIs.length; q++)
				{
					var quantityElement	=	quantityList.ele('quantityElement')
					
					quantityElement.ele('epcClass',QuantitiesURIs[q].URI).up()
					
					if(QuantitiesURIs[q].QuantityType == 'Fixed Measure Quantity')
					{
						quantityElement.ele('quantity',QuantitiesURIs[q].Quantity).up()
					}
					else if(QuantitiesURIs[q].QuantityType == 'Variable Measure Quantity')
					{
						quantityElement.ele('quantity',QuantitiesURIs[q].Quantity).up()
						quantityElement.ele('uom',QuantitiesURIs[q].QuantityUOM).up()
					}
				}
					
			}	
		}
		else if(input.eventtype1 == "AggregationEvent")
		{	
			if(Query.Quantities.length > 0)
			{	
				if(OuterExtension == undefined || OuterExtension == ""){
					OuterExtension	=	ObjectEvent.ele('extension')				
				}
			
				var quantityList		= 	OuterExtension.ele('childQuantityList')	
				var ChildQuantitiesURI	=	Query.Quantities[count];				
					
				for(c=0; c<ChildQuantitiesURI.length;c++)
				{
					var quantityElement	=	quantityList.ele('quantityElement')
					quantityElement.ele('epcClass',ChildQuantitiesURI[c].URI).up()
					
					if(ChildQuantitiesURI[c].QuantityType == 'Fixed Measure Quantity')
					{
						quantityElement.ele('quantity',ChildQuantitiesURI[c].Quantity).up()
					}
					else if(ChildQuantitiesURI[c].QuantityType == 'Variable Measure Quantity')
					{
						quantityElement.ele('quantity',ChildQuantitiesURI[c].Quantity).up()
						quantityElement.ele('uom',ChildQuantitiesURI[c].QuantityUOM).up()
					}
				}			
			}
		}
		else if(input.eventtype1 == "TransactionEvent")
		{			
			if(Query.Quantities.length >0)
			{
				if(OuterExtension == undefined || OuterExtension == ""){
					OuterExtension	=	ObjectEvent.ele('extension')			
				}
				
				var quantityList	= 	OuterExtension.ele('quantityList')
				var Quantities 		=	Query.Quantities[count];					
				
				for(q=0; q<Quantities.length; q++)
				{
					var quantityElement	=	quantityList.ele('quantityElement')
					quantityElement.ele('epcClass',Quantities[q].URI).up()
					
					if(Quantities[q].QuantityType == 'Fixed Measure Quantity')
					{
						quantityElement.ele('quantity',Quantities[q].Quantity).up()
					}
					else if(Quantities[q].QuantityType == 'Variable Measure Quantity')
					{
						quantityElement.ele('quantity',Quantities[q].Quantity).up()
						quantityElement.ele('uom',Quantities[q].QuantityUOM).up()
					}
				}
			}
		}
		
		//If the event is AssociationEvent or TransformationEvent then add Business Transacation List here
		if(input.eventtype1 == "TransformationEvent" || input.eventtype1 == "AssociationEvent")
		{
			BusinessTrasactions();
		}
		
		//Populate The Business Transacation List
		function BusinessTrasactions()
		{
			if(Query.BTT.length > 0)
			{					
				var bizTransactionList	=	ObjectEvent.ele('bizTransactionList')
				
				for(var b=0; b<Query.BTT.length; b++)
				{
					var BTT 			=	Query.BTT[b]
					
					if(SyntaxType == 'urn')
					{
						var bizTransaction 	=	bizTransactionList.ele('bizTransaction','urn:epcglobal:cbv:bt:'+BTT.BTT.Value)
						bizTransaction.att('type','urn:epcglobal:cbv:btt:'+BTT.BTT.Type)
					}
					else if(SyntaxType == 'webURI')
					{
						var bizTransaction 	=	bizTransactionList.ele('bizTransaction',Domain+'BT-'+BTT.BTT.Value)
						bizTransaction.att('type',Domain+'BTT-'+BTT.BTT.Type)
					}
				}			
			}
		}	
		
		
		//Check for the Source and Source type
		if(input.eventtype1 != "TransformationEvent")
		{
			if(input.sourcesType != '' && input.sourcesType != null && input.sourcesType != undefined)
			{
				if(OuterExtension == undefined || OuterExtension == ""){
					if(input.eventtype1 != "AssociationEvent" && input.eventtype1 != "TransformationEvent"){
						OuterExtension	=	ObjectEvent.ele('extension')
					}else{
						OuterExtension	=	ObjectEvent;
					}				
				}
				
				var sourceList 	= OuterExtension.ele('sourceList')			
				
				if(input.sourcesType == 'owning_party' || input.sourcesType == 'processing_party' || input.sourcesType == 'location')
				{
					//Find the check digit in 13th place
					input.SourceGLN			=	input.SourceGLN.substring(0,12) + gs1.checkdigit(input.SourceGLN.substring(0,12));

					var Domain2				=	'https://id.gs1.org/';				
					var SourceGLN			=	input.SourceGLN;
					var SourceCompanyPrefix	=	input.SourcesCompanyPrefix;
					var FormattedData;
					
					xml_json_functions.SourceDestinationFormatter(SourceGLN,SourceCompanyPrefix,function(data)
					{	
						FormattedData	=	data;
					});

					if(input.sourcesType == 'owning_party' || input.sourcesType == 'processing_party')
					{
						//If PGLN then directly append
						if(input.SourceLNType == 'pgln')
						{						
							if(SyntaxType == 'urn')
							{
								var sources 	= 	sourceList.ele('source','urn:epc:id:pgln:'+FormattedData)
								sources.att('type','urn:epcglobal:cbv:sdt:'+input.sourcesType)
							}
							else if(SyntaxType == 'webURI')
							{
								var sources 	= 	sourceList.ele('source',Domain2+'417/'+input.SourceGLN)
								sources.att('type',Domain+'voc/SDT-'+input.sourcesType)
							}
													
						}
						else if(input.SourceLNType == 'sgln')
						{
							FormattedData	=	FormattedData + '.' + input.SourceGLNExtension;
							
							if(SyntaxType == 'urn')
							{
								var sources 	= 	sourceList.ele('source','urn:epc:id:sgln:'+FormattedData)
								sources.att('type','urn:epcglobal:cbv:sdt:'+input.sourcesType)	
							}
							else if(SyntaxType == 'webURI')
							{
								var sources 	= 	sourceList.ele('source',Domain2+'414/'+input.SourceGLN+'/254/'+input.SourceGLNExtension)
								sources.att('type',Domain+'voc/SDT-'+input.sourcesType)	
							}
							
						}
					}
					
					if(input.sourcesType == 'location')
					{
						FormattedData	=	FormattedData + '.' + input.SourceGLNExtension;
						
						if(SyntaxType == 'urn')
						{
							var sources 	= 	sourceList.ele('source','urn:epc:id:sgln:'+FormattedData)
							sources.att('type','urn:epcglobal:cbv:sdt:'+input.sourcesType)	
						}
						else if(SyntaxType == 'webURI')
						{
							var sources 	= 	sourceList.ele('source',Domain2+'414/'+input.SourceGLN+'/254/'+input.SourceGLNExtension)
							sources.att('type',Domain+'voc/SDT-'+input.sourcesType)
						}
						
					}				
				}
				else if(input.sourcesType == 'other')
				{
					var sources 	= sourceList.ele('source',input.OtherSourceURI2)
					sources.att('type',input.OtherSourceURI1)
				}
			}
		}
		
		
		//Check for the Destination and Destination type
		if(input.eventtype1 != "TransformationEvent")
		{
			if(input.destinationsType != '' && input.destinationsType != null && input.destinationsType != undefined)
			{
				if(OuterExtension == undefined || OuterExtension == ""){
					if(input.eventtype1 != "AssociationEvent" && input.eventtype1 != "TransformationEvent"){
						OuterExtension	=	ObjectEvent.ele('extension')
					}else{
						OuterExtension	=	ObjectEvent;
					}				
				}
				
				var destinationList 	= 	OuterExtension.ele('destinationList')
				
				if(input.destinationsType == 'owning_party' || input.destinationsType == 'processing_party' || input.destinationsType == 'location')
				{
					//Find the check digit in 13th place
					input.DestinationGLN			=	input.DestinationGLN.substring(0,12) + gs1.checkdigit(input.DestinationGLN.substring(0,12));

					var Domain2						=	'https://id.gs1.org/';	
					var destinationGLN				=	input.DestinationGLN;
					var destinationCompanyPrefix	=	input.DestinationCompanyPrefix;
					var FormattedData;
					
					xml_json_functions.SourceDestinationFormatter(destinationGLN,destinationCompanyPrefix,function(data)
					{	
						FormattedData	=	data;
					});
					
					if(input.destinationsType == 'owning_party' || input.destinationsType == 'processing_party')
					{
						//If PGLN then directly append
						if(input.DestinationLNType == 'pgln')
						{						
							if(SyntaxType == 'urn')
							{
								var destinations 	=	destinationList.ele('destination', 'urn:epc:id:pgln:'+FormattedData)
								destinations.att('type','urn:epcglobal:cbv:sdt:'+input.destinationsType)
							}
							else if(SyntaxType == 'webURI')
							{
								var destinations 	=	destinationList.ele('destination',Domain2+'417/'+input.DestinationGLN)
								destinations.att('type',Domain+'voc/SDT-'+input.destinationsType)
							}												
						}
						else if(input.DestinationLNType == 'sgln')
						{
							FormattedData		=	FormattedData + '.' + input.DestinationGLNExtension;						
							
							if(SyntaxType == 'urn')
							{
								var destinations 	= 	destinationList.ele('destination','urn:epc:id:sgln:'+FormattedData)
								destinations.att('type','urn:epcglobal:cbv:sdt:'+input.destinationsType)
							}
							else if(SyntaxType == 'webURI')
							{
								var destinations 	= 	destinationList.ele('destination',Domain2+'414/'+input.DestinationGLN + '/254/' + input.DestinationGLNExtension)
								destinations.att('type',Domain+'voc/SDT-'+input.destinationsType)
							}							
						}
					}
					
					if(input.destinationsType == 'location')
					{
						FormattedData		=	FormattedData + '.' + input.DestinationGLNExtension;
						
						
						if(SyntaxType == 'urn')
						{
							var destinations 	= 	destinationList.ele('destination','urn:epc:id:sgln:'+FormattedData)
							destinations.att('type','urn:epcglobal:cbv:sdt:'+input.destinationsType)
						}
						else if(SyntaxType == 'webURI')
						{
							var destinations 	= 	destinationList.ele('destination',Domain2+'414/'+input.DestinationGLN + '/254/' + input.DestinationGLNExtension)
							destinations.att('type',Domain+'voc/SDT-'+input.destinationsType)
						}
					}
				}
				else if(input.destinationsType == 'other')
				{
					var destinations 		=	destinationList.ele('destination', input.OtherDestinationURI2)
					destinations.att('type',input.OtherDestinationURI1)
				}
			}
		}	
		
		//For TransformationEvent add ILMD Here
		if(input.eventtype1 == "ObjectEvent" || input.eventtype1 == "TransformationEvent")
		{
			if(Query.ILMD.length > 0)
			{
				if(OuterExtension == undefined || OuterExtension == "")
				{
					if(input.eventtype1 == "ObjectEvent")
					{
						OuterExtension	=	ObjectEvent.ele('extension')
					}
					else if(input.eventtype1 == "TransformationEvent")
					{
						OuterExtension	=	ObjectEvent
					}
				}
				
				var ilmdList	=	Query.ILMD;				
				var ilmd 		= 	OuterExtension.ele('ilmd')
				
				for(var i=0; i<Query.ILMD.length; i++)
				{
					var NameSpace 	=	ilmdList[i].NameSpace;
					var LocalName 	=	ilmdList[i].LocalName;
					
					if(NameSpace.toLowerCase().includes("http://") || NameSpace.toLowerCase().includes("https://"))
					{
						NameSpace = NameSpace.split("/").slice(2);
						NameSpace = NameSpace[0].toString().substr(0, NameSpace[0].indexOf(".")); 
						ilmd.ele(NameSpace+':'+LocalName,ilmdList[i].FreeText)
					}
					else
					{
						ilmd.ele(NameSpace+':'+LocalName,ilmdList[i].FreeText)
					}
				}
			}
		}
		
		//Sensor Information
		if(Query.SensorForm.length > 0)
		{
			if(OuterExtension == "")
			{
				if(input.eventtype1 != "AssociationEvent" && input.eventtype1 != "TransformationEvent")
				{
					OuterExtension	=	ObjectEvent.ele('extension')
					extension		= 	OuterExtension.ele('extension')
				}
				else
				{
					if(input.eventtype1 == "AssociationEvent")
					{
						extension		=	ObjectEvent;
					}
					else if(input.eventtype1 == "TransformationEvent")
					{
						OuterExtension	=	ObjectEvent.ele('extension')
						extension		= 	OuterExtension
					}				
				}				
			}
			else
			{
				if(input.eventtype1 != "AssociationEvent" && input.eventtype1 != "TransformationEvent")
				{
					if(extension == "")
					{
						extension		= 	OuterExtension.ele('extension')
					}
				}
				else
				{
					if(input.eventtype1 == "AssociationEvent")
					{
						extension		=	ObjectEvent.ele('extension');
					}
					else if(input.eventtype1 == "TransformationEvent")
					{
						OuterExtension	=	ObjectEvent.ele('extension')
						extension		= 	OuterExtension
					}
				}							
			}
				
			var SensorForm			=	Query.SensorForm;
			var sensorElementList	=	extension.ele('sensorElementList')
			
			//Loop through the SensorForm and find the number of elements
			for(var sf=0; sf<SensorForm.length; sf++)
			{
				var sensorElement		=	sensorElementList.ele('sensorElement')	
				
				//Loop through Each sensor Element
				for(var t=0; t<SensorForm[sf].length; t++)
				{
					var sensorMetaData		=	sensorElement.ele('sensorMetaData')
					//sensorMetaData.att('time',moment(SensorForm[sf][t].Time).format())
					
					//Add the Sensor Metadata information if its populated
					SensorChecker(SensorForm[sf][t].Time,'time',sensorMetaData)
					SensorChecker(SensorForm[sf][t].StartTime,'startTime',sensorMetaData)
					SensorChecker(SensorForm[sf][t].EndTime,'endTime',sensorMetaData)
					SensorChecker(SensorForm[sf][t].DeviceID,'deviceID',sensorMetaData)
					SensorChecker(SensorForm[sf][t].DeviceMetadata,'deviceMetaData',sensorMetaData)
					SensorChecker(SensorForm[sf][t].RawData,'rawData',sensorMetaData)
					SensorChecker(SensorForm[sf][t].DataProcessingMethod,'dataProcessingMethod',sensorMetaData)
					SensorChecker(SensorForm[sf][t].BusinessRules,'bizRules',sensorMetaData)					
					
					var SensorElements		=	SensorForm[sf][t].SensorElements;
					//Loop through Each Sensor Report Data
					if(SensorElements != undefined)
					{						
						for(var e=0;e<SensorElements.length;e++)
						{
							//sensorReport.att('type','gs1:'+SensorType)
							var sensorReport	=	sensorElement.ele('sensorReport')
							
							var SensorType		=	SensorElements[e].SensorFields.Type;
							
							SensorChecker(SensorElements[e].SensorFields.Time,'time',sensorReport)
							
							if(SensorType != '' && SensorType != null && SensorType != undefined){
								sensorReport.att('type','gs1:'+SensorType)
							}
							
							//Check if the field is populated and add it to the sensor element list
							SensorChecker(SensorElements[e].SensorFields.DeviceID,'deviceID',sensorReport)
							SensorChecker(SensorElements[e].SensorFields.DeviceMetaData,'deviceMetaData',sensorReport)
							SensorChecker(SensorElements[e].SensorFields.RawData,'rawData',sensorReport)
							SensorChecker(SensorElements[e].SensorFields.DataProcessingMethod,'dataProcessingMethod',sensorReport)
							SensorChecker(SensorElements[e].SensorFields.Time,'time',sensorReport)
							SensorChecker(SensorElements[e].SensorFields.Microorganism,'microorganism',sensorReport)
							SensorChecker(SensorElements[e].SensorFields.ChemicalSubstance,'chemicalSubstance',sensorReport)							
							SensorChecker(SensorElements[e].SensorFields.Value,'value',sensorReport)
							SensorChecker(SensorElements[e].SensorFields.Component,'component',sensorReport)
							SensorChecker(SensorElements[e].SensorFields.StringValue,'stringValue',sensorReport)
							SensorChecker(SensorElements[e].SensorFields.BooleanValue,'booleanValue',sensorReport)
							SensorChecker(SensorElements[e].SensorFields.HexBinaryValue,'hexBinaryValue',sensorReport)
							SensorChecker(SensorElements[e].SensorFields.URIValue,'uriValue',sensorReport)		
							SensorChecker(SensorElements[e].SensorFields.MaxValue,'maxValue',sensorReport)							
							SensorChecker(SensorElements[e].SensorFields.MinValue,'minValue',sensorReport)							
							SensorChecker(SensorElements[e].SensorFields.MeanValue,'meanValue',sensorReport)						
							SensorChecker(SensorElements[e].SensorFields.StandardDeviation,'sDev',sensorReport)	
							SensorChecker(SensorElements[e].SensorFields.PercRank,'percRank',sensorReport)	
							SensorChecker(SensorElements[e].SensorFields.PercValue,'percValue',sensorReport)								
							SensorChecker(SensorElements[e].SensorFields.UOM,'uom',sensorReport)
							
						}
					}
				}
			}			
		}
		
		//Function to check if the field is populated for sensor elements
		function SensorChecker(field, attValue, sensorMetaData){
			if(field != '' && field != null && field != undefined)
			{
				sensorMetaData.att(attValue,field)
			}
		}
		
		//Check for the PERSISTENT DISPOSITION
		if(input.PersistentDisposition != '' && input.PersistentDisposition != null && typeof input.PersistentDisposition != undefined)
		{
			if(OuterExtension == undefined || OuterExtension == "")
			{				
				if(input.eventtype1 != "AssociationEvent" && input.eventtype1 != "TransformationEvent")
				{
					OuterExtension	=	ObjectEvent.ele('extension')
					extension		=	OuterExtension.ele('extension')
				}
				else
				{
					
					if(input.eventtype1 == "AssociationEvent")
					{
						extension		=	ObjectEvent;
					}
					else if(input.eventtype1 == "TransformationEvent")
					{
						OuterExtension	=	ObjectEvent.ele('extension')
						extension		= 	OuterExtension
					}
				}				
			}
			else
			{
				if(input.eventtype1 != "AssociationEvent" && input.eventtype1 != "TransformationEvent")
				{
					if(extension == "")
					{
						extension		= 	OuterExtension.ele('extension')
					}
				}
				else
				{
					if(input.eventtype1 == "AssociationEvent")
					{
						if(extension == "")
						{
							extension		=	ObjectEvent.ele('extension');
						}
						else
						{
							extension		=	extension;
						}
					}
					else if(input.eventtype1 == "TransformationEvent")
					{
						extension		= 	OuterExtension
					}
				}
			}
			
			var persistentDisposition	=	extension.ele('persistentDisposition')
			
			if(input.PersistentDisposition == 'DispositionEnter')
			{
				persistentDisposition.ele(input.PersistentDispositionType,input.EnterPersistentDispositionText)
			}
			else
			{
				if(SyntaxType == 'urn')
				{
					persistentDisposition.ele(input.PersistentDispositionType,'urn:epcglobal:cbv:disp:'+input.PersistentDisposition)
				}
				else if(SyntaxType == 'webURI')
				{
					persistentDisposition.ele(input.PersistentDispositionType,Domain+'voc/Disp-'+input.PersistentDisposition)
				}
			}
		}
		
		//Check if the extension field is filled and add the XML tags
		var Extension			=	Query.Extension;
		if(Extension.length > 0)
		{
			for(var ex=0; ex<Extension.length; ex++)
			{
				var NameSpace 	=	Extension[ex].NameSpace; 
				var LocalName 	=	Extension[ex].LocalName;
					
				if(Extension[ex].NameSpace.toLowerCase().includes("http://") || Extension[ex].NameSpace.toLowerCase().includes("https://"))
				{				
					NameSpace = NameSpace.split("/").slice(2);
					NameSpace = NameSpace[0].toString().substr(0, NameSpace[0].indexOf("."));
					ObjectEvent.ele(NameSpace+':'+LocalName,Extension[ex].FreeText).up()
				}
				else
				{
					ObjectEvent.ele(Extension[ex].NameSpace+':'+Extension[ex].LocalName,Extension[ex].FreeText).up()
				}
			}
		}
			
		itemProcessed++;
		
		//After creation of all the XML events return the data to index.js
		if(itemProcessed == input.eventcount)
		{
			xml 	= 	root.end({ pretty: true});
			callback(xml);
		}
	}
	
}