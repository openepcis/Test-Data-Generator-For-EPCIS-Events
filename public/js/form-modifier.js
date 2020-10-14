app.controller('AppController2', function($scope,$http,$location,$anchorScroll,$copyToClipboard,$window,$rootScope){
	
	//On enter of the Qunatity UOM show the suggestions
	/*$scope.QuantityUOMAutoComplete	=	function(enteredData){
		$scope.hidethis = false;  
		var OutPut 	=	[];
		angular.forEach($scope.UOMs, function(uom){
			if(uom.text.toLowerCase().indexOf(enteredData.toLowerCase()) >= 0)
			{
				OutPut.push(uom);
			}
		});
		
		$scope.QuantityUOMsList = OutPut;  
	}
	
	$scope.fillQUantityUOMTextbox = function(UOMText){  
           $scope.CommonFormQuantity.ObjectEventQuantityQuantityUOM = UOMText;  
           $scope.hidethis = true;  
      } */
	
	
	//Set the default values for some of the fields
	
	//Set the date fields with current values
	$scope.formdata.EventTimeSelector			=	"SpecificTime";
	$scope.formdata.RecordTimeOption			=	"no";
	$scope.formdata.eventtimeSpecific			=	new Date();
	$scope.formdata.EventTimeFrom				=	new Date();
	$scope.formdata.ErrorDeclarationTime		=	new Date();
	$scope.formdata.ErrorDeclarationTimeFrom	=	new Date();
	var h 										= 	$scope.formdata.eventtimeSpecific.getHours();
	var m 										= 	$scope.formdata.eventtimeSpecific.getMinutes();
	
	$scope.formdata.eventtimeSpecific.setHours(h,m,0,0);
	$scope.formdata.EventTimeFrom.setHours(h,m,0,0);
	$scope.formdata.ErrorDeclarationTime.setHours(h,m,0,0);
	$scope.formdata.ErrorDeclarationTimeFrom.setHours(h,m,0,0);
	
	var tomorrow								=	new Date();
	tomorrow.setDate(new Date().getDate()+1);

	$scope.formdata.EventTimeTo					=	tomorrow;
	$scope.formdata.ErrorDeclarationTimeTo		=	tomorrow;
	$scope.formdata.EventTimeTo.setHours(h,m,0,0);
	$scope.formdata.ErrorDeclarationTimeTo.setHours(h,m,0,0);
	
	//Set the default values for timezone field
	$scope.formdata.EventTimeZone				=	"+02:00";
	$scope.formdata.ErrorTimeZone				=	"+02:00";
	
	//Set default value for action field
	$scope.formdata.action						=	"ADD";
	
	//Set initial default value for EventCount as 1
	$scope.formdata.eventcount					=	1;
	
	  
	//Reset all the fields onclick of Reset Button
	$scope.ReloadTable	=	function(){
		//console.log("JRJRJ");
		$window.location.reload();
		//$route.reload();
	}

	//Show the SGLN option in Events only for association event
	$scope.FilterSGLNType	=	function(InputType){
		console.log(InputType);
	}
	 
	
	//Copy to Clipboard the XML and JSON data
	$scope.copytoclipboard = function(toCopy){
		if(toCopy == 'XML')
		{
			$copyToClipboard.copy($scope.xmldata).then(function(){
				alertify.alert(" Test Data Generator ",toCopy + ' content copied to clipboard');
			});
		}
		else if(toCopy == 'JSON')
		{
			$copyToClipboard.copy($scope.jsondata).then(function(){
				alertify.alert(" Test Data Generator ",toCopy + ' content copied to clipboard');
			});
		}
	}
	
	//Export the contents of XML to text file
	$scope.ExportData	=	function(Content, type)
	{
		var DateTime	= 	new Date().toISOString().replace('Z', ' ').replace('T', ' ');
		var FileName	=	"";
		var DatasetName	=	$scope.DatasetName;
		
		if(type == 'XML')
		{
			if(DatasetName == '' || DatasetName == undefined || DatasetName == null)
			{
				FileName	=	"EPCIS_Events_"+DateTime+".xml";
			}
			else
			{
				FileName	=	DatasetName+".xml";
			}
			
			var blob = new Blob([Content], {type: "text/xml"});
			if (window.navigator && window.navigator.msSaveOrOpenBlob)
			{
				window.navigator.msSaveOrOpenBlob(blob, FileName);
			}
			else
			{
				var e 					= 	document.createEvent('MouseEvents'),
				a						= 	document.createElement('a');
				a.download 				= 	FileName;
				a.href 					= 	window.URL.createObjectURL(blob);
				a.dataset.downloadurl 	= 	['text/json', a.download, a.href].join(':');
				e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				a.dispatchEvent(e);
			}			
		}
		else if(type == 'JSON')
		{
			if(DatasetName == '' || DatasetName == undefined || DatasetName == null)
			{
				FileName	=	"EPCIS_Events_"+DateTime+".json";
			}
			else
			{
				FileName	=	DatasetName+".json";
			}
			
			var blob = new Blob([Content], {type: "text/json"});
			if (window.navigator && window.navigator.msSaveOrOpenBlob)
			{
				window.navigator.msSaveOrOpenBlob(blob, FileName);
			}
			else
			{
				var e 					= 	document.createEvent('MouseEvents'),
				a						= 	document.createElement('a');
				a.download 				= 	FileName;
				a.href 					= 	window.URL.createObjectURL(blob);
				a.dataset.downloadurl 	= 	['text/json', a.download, a.href].join(':');
				e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				a.dispatchEvent(e);
			}
		}		
	}
	
	/* SENSOR INFORMATION START*/
	
	//Sensor information variables
	$rootScope.TotalSensorElementsArray			=	[];
	$scope.SensorElementsArray					=	[];
	$scope.SensorElementCount					=	0;
	$scope.ToalSensorElementCount				=	0;
	
	//Show the Sensor Data Modal on click of the button	
	$scope.AddSensorData	=	function(){
		$scope.SensorForm	=	{};
		angular.element("#SelectReqMetaData").val('default');
		angular.element('#SelectReqMetaData').selectpicker("refresh");
		angular.element('#SelectReqReport').val('default');
		angular.element('#SelectReqReport').selectpicker("refresh");
		angular.element('#SensorInformation').modal('show');
	}
	
	//Show fields for adding new sensor Element
	$scope.AddSensorElement		=	function(e){
		e.preventDefault();
		item 					= 	{};
		item["ID"]				=	$scope.SensorElementCount;
		item["SensorFields"]	=	{};
		$scope.SensorElementsArray.push(item);
		$scope.SensorElementCount++;
	}
	
	//For each click on Save, Save the information related to partoicular Sensor modal
	$scope.SensorInformationSubmit	=	function(){
		angular.element('#SensorInformation').modal('hide');		
		var TemporaryArray				=	[];
		var MetaDataItem				=	{};
		
		if($scope.SensorForm.SelectReqMetaData != undefined)
		{
			if($scope.SensorForm.SelectReqMetaData.includes('Time'))
			{
				MetaDataItem["Time"]		=	$scope.SensorForm.MetaDataDateTime;
			}
			
			if($scope.SensorForm.SelectReqMetaData.includes('Start Time'))
			{
				MetaDataItem["StartTime"]	=	$scope.SensorForm.MetaDataStartTime;
			}
			
			if($scope.SensorForm.SelectReqMetaData.includes('End Time'))
			{
				MetaDataItem["EndTime"]	=	$scope.SensorForm.MetaDataEndTime;
			}
			
			if($scope.SensorForm.SelectReqMetaData.includes('Device ID'))
			{
				MetaDataItem["DeviceID"]	=	$scope.SensorForm.MetaDataDeviceID;
			}
			
			if($scope.SensorForm.SelectReqMetaData.includes('Device Metadata'))
			{
				MetaDataItem["DeviceMetadata"]	=	$scope.SensorForm.MetaDataDeviceMetadata;
			}
			
			if($scope.SensorForm.SelectReqMetaData.includes('Raw Data'))
			{
				MetaDataItem["RawData"]		=	$scope.SensorForm.MetaDataRawData;
			}		
			
			if($scope.SensorForm.SelectReqMetaData.includes('Data Processing Method'))
			{
				MetaDataItem["DataProcessingMethod"]	=	$scope.SensorForm.MetaDataDataProcessingMethod;
			}
			
			if($scope.SensorForm.SelectReqMetaData.includes('Business Rules'))
			{
				MetaDataItem["BusinessRules"]		=	$scope.SensorForm.MetaDataBusinessRules;
			}
		}
		
		MetaDataItem['SensorElements']			=	$scope.SensorElementsArray;	
		TemporaryArray.push(MetaDataItem);
		//TemporaryArray.push($scope.SensorElementsArray);
		$rootScope.TotalSensorElementsArray.push(TemporaryArray)
		$scope.ToalSensorElementCount++;
		$scope.SensorElementsArray		=	[];
		$scope.SensorElementCount		=	0;		
		console.log($rootScope.TotalSensorElementsArray)
	}
	
	//For Every Sensor Element addition populate the corresponding Array
	$scope.SensorElementPopulator	=	function(SensorElementID, Type){
		
		for(var s=0;s<$scope.SensorElementsArray.length;s++)
		{
			if($scope.SensorElementsArray[s].ID ==	SensorElementID)
			{
				if(Type == 'Type')
				{
					$scope.SensorElementsArray[s].SensorFields["Type"]				=	$scope.SensorForm.SensorReportType[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Device ID') && Type == 'Device ID')
				{
					$scope.SensorElementsArray[s].SensorFields["DeviceID"]			=	$scope.SensorForm.SensorReportDeviceID[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Device MetaData') && Type == 'Device MetaData')
				{
					$scope.SensorElementsArray[s].SensorFields["DeviceMetaData"]	=	$scope.SensorForm.SensorReportDeviceMetadata[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Raw Data') && Type == 'Raw Data')
				{
					$scope.SensorElementsArray[s].SensorFields["RawData"]			=	$scope.SensorForm.SensorReportRawData[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Data Processing Method') && Type == 'Data Processing Method')
				{
					$scope.SensorElementsArray[s].SensorFields["DataProcessingMethod"]	=	$scope.SensorForm.SensorReportDataProcessingMethod[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Time') && Type == 'Time')
				{
					$scope.SensorElementsArray[s].SensorFields["Time"]	=	$scope.SensorForm.SensorReportDataTime[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Microorganism') && Type == 'Microorganism')
				{
					$scope.SensorElementsArray[s].SensorFields["Microorganism"]	=	$scope.SensorForm.SensorReportMicroorganism[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Chemical Substance') && Type == 'Chemical Substance')
				{
					$scope.SensorElementsArray[s].SensorFields["ChemicalSubstance"]	=	$scope.SensorForm.SensorReportChemicalSubstance[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Value') && Type == 'Value')
				{
					$scope.SensorElementsArray[s].SensorFields["Value"]	=	$scope.SensorForm.SensorReportValue[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Component') && Type == 'Component')
				{
					$scope.SensorElementsArray[s].SensorFields["Component"]	=	$scope.SensorForm.SensorReportComponent[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('String Value') && Type == 'String Value')
				{
					$scope.SensorElementsArray[s].SensorFields["StringValue"]	=	$scope.SensorForm.SensorReportStringValue[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Boolean Value') && Type == 'Boolean Value')
				{
					$scope.SensorElementsArray[s].SensorFields["BooleanValue"]	=	$scope.SensorForm.SensorReportBooleanValue[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Hex Binary Value') && Type == 'Hex Binary Value')
				{
					$scope.SensorElementsArray[s].SensorFields["HexBinaryValue"]	=	$scope.SensorForm.SensorReportHexBinaryValue[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('URI Value') && Type == 'URI Value')
				{
					$scope.SensorElementsArray[s].SensorFields["URIValue"]	=	$scope.SensorForm.SensorReportURIValue[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Max Value') && Type == 'Max Value')
				{
					$scope.SensorElementsArray[s].SensorFields["MaxValue"]	=	$scope.SensorForm.SensorReportMaxValue[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Min Value') && Type == 'Min Value')
				{
					$scope.SensorElementsArray[s].SensorFields["MinValue"]	=	$scope.SensorForm.SensorReportMinValue[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Mean Value') && Type == 'Mean Value')
				{
					$scope.SensorElementsArray[s].SensorFields["MeanValue"]	=	$scope.SensorForm.SensorReportMeanValue[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Standard Deviation') && Type == 'Standard Deviation')
				{
					$scope.SensorElementsArray[s].SensorFields["StandardDeviation"]	=	$scope.SensorForm.SensorReportStandardDeviation[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Perc Rank') && Type == 'Perc Rank')
				{
					$scope.SensorElementsArray[s].SensorFields["PercRank"]	=	$scope.SensorForm.SensorReportPercRank[SensorElementID];
				}
				
				if($scope.SensorForm.SelectReqReport.includes('Perc Value') && Type == 'Perc Value')
				{
					$scope.SensorElementsArray[s].SensorFields["PercValue"]	=	$scope.SensorForm.SensorReportPercValue[SensorElementID];
				}
				
				if(Type == 'UOM')
				{
					$scope.SensorElementsArray[s].SensorFields["UOM"]			=	$scope.SensorForm.SensorElementUOM[SensorElementID];
				}			
				break;
			}
		}	
	}
	
	//Remove the sensor element on click
	$scope.RemoveSensorElement	=	function(Delete_ID,e){
		e.preventDefault();
		for(var d=0; d<$scope.SensorElementsArray.length; d++)
		{
			if($scope.SensorElementsArray[d].ID ==	Delete_ID)
			{
				$scope.SensorElementsArray.splice(d, 1);		
				break;	
			}
		}
	}
	
	//Remove the Element from TOTALSENSORELEMENTARRAY displayed on INDEX.html
	$scope.DeleteTotalSensorElement	=	function(Delete_Sensor_Id){
		$rootScope.TotalSensorElementsArray.splice(Delete_Sensor_Id, 1);
	}
	
	/* SENSOR INFORMATION ENDS*/
	
});
