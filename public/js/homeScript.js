var app = angular.module('myApp', ['CopyToClipboard'], function() {});

app.controller('AppController', function($scope,$http,$location,$anchorScroll,$copyToClipboard,$rootScope){
	//Common
	$scope.formdata								=	{eventtype1:'', ElementssyntaxType:'urn', VocabSyntaxType:'urn', EventIDOption:'no', EventIDType: 'uuid', readpointsgln2:"0"};
	$scope.SensorForm							=	{Temperature:''};
	$scope.AddExtensionForm						=	{};
	$scope.EditExtensionForm					=	{};
	$scope.ChildTypeModal						=	{};
	$scope.ParentTypeModal						=	{};
	$scope.EventTypeRowSpan						= 	5;
	$scope.rowspanWHAT							=	1;
	$scope.rowspanWHY							=	4;
	$scope.OtherFields							=	2;
	$scope.OEQuantities							=	1;
	$scope.CommonExtensionsList					=	[];
	$scope.CommonExtensionsID					=	0;
	$scope.BusinessTransactionList				=	[];
	$scope.BusinessTransactionCount				=	0;
	$scope.BTT									=	{};
		
	//Object Event	
	$scope.ObjectEventEpcsURI					=	[];
	$scope.ObjectEventQuantitiesURI				=	[];
	$scope.ObjectEventILMDList					=	[];
	$scope.ObjectEventILMDID					=	0;
		
	//Aggregation Event		
	$scope.AggregationEventParentURI			=	[];
	$scope.AggregationEventChildEPCsURI			=	[];
	$scope.AggregationEventChildQuantitiesURI	=	[];
	
	//Transaction Event
	$scope.TransactionEventParentIDURI			=	[];
	$scope.TransactionEventEPCsURI				=	[];
	$scope.TransactionEventQuantitiesURI		=	[];
	
	//Transformation Event
	$scope.TransformationEventInputEPCsURI		=	[];
	$scope.TransformationEventInputQuantityURI	=	[];
	$scope.TransformationEventOutputEPCSURI		=	[];
	$scope.TransformationEventOutputQuantityURI	=	[];
	$scope.TransformationEventILMDList			=	[];
	$scope.TransformationEventILMDID			=	0;
	
	//Association Event variables
	$scope.AssociationEventParentURI			=	[];
	$scope.AssociationEventChildEPCsURI			=	[];
	$scope.AssociationEventChildQuantitiesURI	=	[];
	
	//Error Declaration Variables
	$scope.ErrorCorrectiveIds					=	[];
	$scope.ErrorExtensionList					=	[];
	$scope.ErrorCorrectiveElementID				=	0;
	$scope.ErrorExtensionID 					=	0;	
	
	//Based on Event type selection create fields for the WHAT dimention
	$scope.EventTypeChange = function() {
		
		//Add Number of rows to tabled based on Event Selection
		if($scope.formdata.eventtype1 == 'ObjectEvent')
		{
			$scope.rowspanWHAT 					= 	2;
			$scope.rowspanWHY					=	6;
			$scope.OtherFields					=	4;
			
			$scope.ObjectEventEpcsURI			=	[];
			$scope.AggregationEventParentURI	=	[];			
			$scope.ObjectEventEPCSbutton		= 	true;
			$scope.OEAddQuantitiesButton		=	true;
		}
		else if($scope.formdata.eventtype1 == 'AggregationEvent')
		{
			$scope.rowspanWHAT 	= 	3;
			$scope.rowspanWHY	=	6;
			$scope.OtherFields	=	3;
			
			$scope.ObjectEventEpcsURI			=	[];
			$scope.AggregationEventParentURI	=	[];	
			$scope.ParentButton					=	true;
			$scope.AEChildEPCButton				=	true;
			$scope.AEChildQuantitiesButton		=	true;
		}
		else if($scope.formdata.eventtype1 == 'TransactionEvent')
		{
			$scope.rowspanWHAT 						= 	3;
			$scope.rowspanWHY						=	6;
			$scope.OtherFields						=	3;
			
			$scope.TransactionEventParent			=	true;
			$scope.TransactionEventEPCSbutton		=	true;
			$scope.TransactionEventQuantitiesButton	=	true;
		}
		else if($scope.formdata.eventtype1 == 'TransformationEvent')
		{
			$scope.rowspanWHAT 									= 	4;
			$scope.rowspanWHY									=	4;
			$scope.OtherFields									=	4;
			
			$scope.TransformInputEPCsButton						=	true;
			$scope.TransformOutputEPCsButton					=	true;
			$scope.TransformationEventInputQuantitiesButton		=	true;
			$scope.TransformationEventOutputQuantitiesButton	=	true;	
		}
		else if($scope.formdata.eventtype1 == 'AssociationEvent')
		{
			$scope.rowspanWHAT 			= 	3;
			$scope.rowspanWHY			=	6;
			$scope.OtherFields			=	3;
			
			$scope.AssociationEventParentButton				=	true;
			$scope.AssociationEventChildEPCSButton			=	true;
			$scope.AssociationEventChildQuantitiesButton	=	true;
		}
	}
	
	/* OBJECT EVENT EPC AND QUANTITIES STARTS */
	
	//Show Modal for adding the Object Event EPCs
	$scope.ObjectEventEPCsAdd	=	function(){
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to add EPCs");
		}
		else
		{
			angular.element('#ParentTypeModal').modal('show');
			$scope.ObjectEventAddEPCsFlag	=	true;
			$scope.CommonForm				=	{AggregationEventParentID: ''}
		}
	}
	
	//Delete the Object Event EPCS on Delete Button Click
	$scope.ObjectEventEPCsDelete	=	function(){
		$scope.ObjectEventEpcsURI		=	[];
		$scope.ObjectEventEPCSbutton	= 	true;
	}
	
	//Object Event Quantities
	$scope.ObjectEventQuantitiesClick	=	function(){
		angular.element('#ChildTypeModal').modal('show');
		$scope.OEQuantitiesFlag			=	true;	
		$scope.CommonFormQuantity		=	{ObjectEventquantities: ''}
	}
	
	//Delete the Object Event Quantities
	$scope.OEQuantitiesDelete	=	function(){
		$scope.ObjectEventQuantitiesURI	=	[];
		$scope.OEAddQuantitiesButton	=	true;
	}
	
	/* OBJECT EVENT EPC AND QUANTITIES ENDS */
	
	/* AGGREGATION EVENT PARENT CHILD AND QUANTITIES STARTS */
	
	//Show Modal for Aggregation Event Parent
	$scope.AggregationEventParent	=	function(){
		
		//Check if number of events are provided before Parent ID
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to add Parent IDs");
		}
		else
		{
			angular.element('#ParentTypeModal').modal('show');
			$scope.AEParentEPCsFlag		=	true;
			$scope.CommonForm			=	{AggregationEventParentID: ''}
		}
	}
	
	//Delete Aggregation Parent on Button Click
	$scope.Delete_AggregateParent	=	function(){
		$scope.AggregationEventParentURI	=	[];
		$scope.ParentButton					=	true;
	}
	
	//Aggregation Event Child EPCS
	$scope.AggregationEventChildEPCs	=	function(){
		
		//Check if number of events are provided before Child EPCs
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to add child EPCs");
		}
		else
		{
			angular.element('#ParentTypeModal').modal('show');
			$scope.AEChildEPCSFlage		=	true;
			$scope.CommonForm			=	{AggregationEventParentID: ''}
		}
	}
	
	//Delete Aggregation Event Child EPCS on click
	$scope.AEChildEPCsDelete		=	function(){
		$scope.AggregationEventChildEPCsURI	=	[];
		$scope.AEChildEPCButton				=	true;
	}
	
	//Aggregation Event Child Quantities
	$scope.AggregationEventChildQuantities	=	function()
	{		
		//Check if number of events are provided before Child Quantities
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to add child Quantities");
		}
		else
		{
			angular.element('#ChildTypeModal').modal('show');
			$scope.AEChildQuantitiesFlag		=	true;
			$scope.CommonFormQuantity			=	{ObjectEventquantities: ''}			
		}
	}
	
	//Aggregation Event CHILD QUANTITIES DELETE
	$scope.AEChildQuantitiesDelete	=	function(){		
		$scope.AggregationEventChildQuantitiesURI 	=  [];
		$scope.AEChildQuantitiesButton				= 	true;	
	}
	
	/* AGGREGATION EVENT PARENT CHILD AND QUANTITIES ENDS */
	
	/* TRANSACTION EVENT PARENT ID EPCS AND QUANTITIES STARTS */
	$scope.TransactionEventParentId		=	function(){
		
		//Check if number of events are provided before Parent ID
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to add Parent IDs");
		}
		else
		{
			angular.element('#ParentTypeModal').modal('show');
			$scope.TransactionEventParentIDFlag	=	true;
			$scope.CommonForm			=	{AggregationEventParentID: ''}
		}		
	}
	
	//Delete the Transaction Event Parent ID on DELETE click
	$scope.Delete_TransactionParent	=	function(ID){
		for(var loop=0; loop<$scope.TransactionEventParentIDURI.length; loop++)
		{
			if($scope.TransactionEventParentIDURI[loop].ID == ID)
			{
				$scope.TransactionEventParentIDURI.splice(loop, 1);
				$scope.TransactionEventParent	=	true;
				break;
			}
		}
	}
	
	//Add the Transaction Event Child EPCS
	$scope.TransactionEventEPCS	=	function(){
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to add EPCs");
		}
		else
		{
			angular.element('#ParentTypeModal').modal('show');
			$scope.TransactionEventChildEPCS	=	true;
			$scope.CommonForm			=	{AggregationEventParentID: ''}
		}
	}
	
	//Delete CHILD EPCS from Transaction Event on Delete Button click
	$scope.TransactionEventChildEPCsDelete	=	function()
	{
		$scope.TransactionEventEPCsURI 		=	[];
		$scope.TransactionEventEPCSbutton	=	true;
	}
	
	//Show Transaction Event Quantities Modal
	$scope.TransactionEventQuantities	=	function()
	{
		//Check if number of events are provided before Quantities
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to add Quantities");
		}
		else
		{
			angular.element('#ChildTypeModal').modal('show');
			$scope.TransactionEventQuantitiesFlag	=	true;
			$scope.CommonFormQuantity				=	{ObjectEventquantities: ''}
		}
	}
	
	//Transaction Event Delete Quantities when DELETE button is clicked
	$scope.TransactionEventQuantitiesDelete	=	function(){
		$scope.TransactionEventQuantitiesURI	=	[];
		$scope.TransactionEventQuantitiesButton	=	true;
	}
	
	
	/* TRANSACTION EVENT PARENT ID EPCS AND QUANTITIES ENDS */
	
	/* TRANSAFORMATION EVENT EPCS, QUANTITIES OUTPUT EPCS OUTPUT QUANTITIES STARTS*/
	
	//TRANSFORMATION EVENT Show modal for adding the INPUT EPCS
	$scope.TransformationEventInputEPCs	=	function(){
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to add Input EPCs");
		}
		else
		{
			angular.element('#ParentTypeModal').modal('show');
			$scope.TransformationEventInputEPCsFlag	=	true;
			$scope.CommonForm			=	{AggregationEventParentID: ''}
		}
	}
	
	//Transformation Event Delete corresponding Input EPCS 
	$scope.TransformationEventInputEPCsDelete	=	function(){
		
		$scope.TransformationEventInputEPCsURI	=	[];
		$scope.TransformInputEPCsButton			=	true;
	}
	
	//TransformationEvent Show the modal for adding the Input QUANTITIES
	$scope.TransformationEventInputQuantities	=	function(){
		
		//Check if number of events are provided before Input Quantities
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to Input Quantities");
		}
		else
		{
			angular.element('#ChildTypeModal').modal('show');
			$scope.TransformationEventInputQuantitiesFlag	=	true;
			$scope.CommonFormQuantity						=	{ObjectEventquantities: ''}
		}
	}
	
	//TransformationEvent Delete the Input Quantities based on Delete click
	$scope.TransformationEventInputQuantitiesDelete	=	function(){
		
		$scope.TransformationEventInputQuantityURI		=	[];
		$scope.TransformationEventInputQuantitiesButton	=	true;
	}
	
	//Transformation Event show modal for adding Output EPCS
	$scope.TransformationEventOutputEPCs	=	function(){
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to add Output EPCs");
		}
		else
		{
			angular.element('#ParentTypeModal').modal('show');
			$scope.TransformationEventOutputEPCsFlag	=	true;
			$scope.CommonForm			=	{AggregationEventParentID: ''}
		}
	}
	
	//Transformation Event Delete Output EPCS on Delete button click
	$scope.TransformationEventOutputEPCsDelete	=	function(){
		$scope.TransformationEventOutputEPCSURI	=	[];
		$scope.TransformOutputEPCsButton		=	true;
	}
	
	//Show modal for adding Transformtion Event Output Quantities
	$scope.TransformationEventOutputQuantities	=	function()
	{	
		//Check if number of events are provided before Output Quantities
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to Output Quantities");
		}
		else
		{
			angular.element('#ChildTypeModal').modal('show');
			$scope.TransformationEventOutputQuantitiesFlag	=	true;
			$scope.CommonFormQuantity						=	{ObjectEventquantities: ''}
		}
	}
	
	$scope.TransformationEventOutputQuantitiesDelete	=	function(){
		$scope.TransformationEventOutputQuantityURI			=	[];
		$scope.TransformationEventOutputQuantitiesButton	=	true;
	}	
	
	/* TRANSAFORMATION EVENT EPCS, QUANTITIES OUTPUT EPCS OUTPUT QUANTITIES ENDS*/
	
	/*ASSOCIATION EVENT PARENT CHILD and CHILD QUANTITIES STARTS */
	
	//Show Modal for ASSOCIATION Event Parent
	$scope.AssociationEventParent	=	function()
	{
		//Check if number of events are provided before Parent ID
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to Parent ID");
		}
		else
		{
			angular.element('#ParentTypeModal').modal('show');
			$scope.AssociationEventParentFlag	=	true;
			$scope.CommonForm					=	{AggregationEventParentID: ''}
		}
	}
	
	//Delete Association EVENT Parent on Button Click
	$scope.AssociationEventParentDelete	=	function(){
		$scope.AssociationEventParentURI	=	[];
		$scope.AssociationEventParentButton	=	true;
	}
	
	//Association EVENT Child EPCS
	$scope.AssociationEventChildEPCS	=	function(){
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to add Child EPCs");
		}
		else
		{
			angular.element('#ParentTypeModal').modal('show');
			$scope.AssociationEventChildEPCSFlag		=	true;
			$scope.CommonForm			=	{AggregationEventParentID: ''}
		}
	}
	
	//Delete Association Event Child EPCS on click
	$scope.AssociationEventChildEPCsDelete		=	function(){
		$scope.AssociationEventChildEPCsURI		=	[];
		$scope.AssociationEventChildEPCSButton	=	true;
	}
	
	//Association Event Child Quantities Add
	$scope.AssociationEventChildQuantities	=	function(){
		//Check if number of events are provided before Parent ID
		if($scope.formdata.eventcount  == 0 || $scope.formdata.eventcount == undefined)
		{
			alertify.alert(" EPCIS Test Data Generator ","Please provide the Event Count to add Child Quantities");
		}
		else
		{
			angular.element('#ChildTypeModal').modal('show');
			$scope.CommonFormQuantity					=	{ObjectEventquantities: ''}
			$scope.AssociationEventChildQuantitiesFlag	=	true;
		}
	}
	
	//Association Event Child Quantities Delete
	$scope.AssociationEventChildQuantitiesDelete	=	function(){
		$scope.AssociationEventChildQuantitiesURI		=	[];
		$scope.AssociationEventChildQuantitiesButton	=	true;
	}
	
	/*ASSOCIATION EVENT PARENT CHILD and CHILD QUANTITIES ENDS */
	
	
	//Aggregation Event Parent Creation
	$scope.CommonEventFormat	=	function(){
		
		//Call the function to create the URI and Display it
		angular.element('#ParentTypeModal').modal('hide');
		var ItemCount			=	0;
		
		//Loop through the Event count to create random EPCs
		for(var eventEPC=0; eventEPC<$scope.formdata.eventcount; eventEPC++)
		{
			var data 				=	JSON.stringify({input:$scope.CommonForm, MultiValues: $scope.MultiValues, formdata:$scope.formdata, EventCount:eventEPC});
					
			$http({
				url		: 	"/CreateAggregationEventURI",
				method	: 	"POST",
				headers	: 	{'Content-Type': 'application/json'},
				data	:	data
			}).success(function(response){
				if($scope.AEParentEPCsFlag || $scope.TransactionEventParentIDFlag || $scope.AssociationEventParentFlag)
				{
					//Check for the loop completion
					ItemCount	=	ItemCount+1;
					
					//Aggregation Event PARENT ID has been clicked				
					if($scope.AEParentEPCsFlag)
					{
						$scope.AggregationEventParentURI.push(response);
					}
					
					//Transaction Event Parent has been clicked
					if($scope.TransactionEventParentIDFlag)
					{
						$scope.TransactionEventParentIDURI.push(response);
					}
					
					//AssociationEvent Parent
					if($scope.AssociationEventParentFlag)
					{
						$scope.AssociationEventParentURI.push(response);	
					}
					
					//After the loop set all values of the button and flag to false
					if(ItemCount == parseInt($scope.formdata.eventcount, 10))
					{	
						//Aggregation Event Parent ID
						$scope.AEParentEPCsFlag				=	false;
						$scope.ParentButton					=	false;						
						
						//Transaction Event Parent ID
						$scope.TransactionEventParentIDFlag	=	false;
						$scope.TransactionEventParent		=	false;						
						
						//Association Event Parent ID
						$scope.AssociationEventParentButton = 	false;
						$scope.AssociationEventParentFlag	=	false;
					}					
				}
				else
				{
					//Check for the loop completion
					ItemCount	=	ItemCount+1;
					
					//If Object Event EPCS has been clicked
					if($scope.ObjectEventAddEPCsFlag)
					{
						$scope.ObjectEventEpcsURI.push(response);
					}					
					
					//Aggregation Event Child EPCS has been clicked
					if($scope.AEChildEPCSFlage)
					{				
						$scope.AggregationEventChildEPCsURI.push(response);
					}
					
					//Transaction Event EPCs
					if($scope.TransactionEventChildEPCS)
					{				
						$scope.TransactionEventEPCsURI.push(response);
					}
					
					//Transformation Event Input EPCS
					if($scope.TransformationEventInputEPCsFlag)
					{				
						$scope.TransformationEventInputEPCsURI.push(response);
						
						//After the loop set all values of the button and flag to false
						if(ItemCount == parseInt($scope.formdata.eventcount, 10))
						{					
							$scope.TransformationEventInputEPCsFlag		=	false;
							$scope.TransformInputEPCsButton				=	false;	
						}
					}
					
					//Transformation Event Output EPCs
					if($scope.TransformationEventOutputEPCsFlag)
					{				
						$scope.TransformationEventOutputEPCSURI.push(response);
						
						//After the loop set all values of the button and flag to false
						if(ItemCount == parseInt($scope.formdata.eventcount, 10))
						{
							$scope.TransformationEventOutputEPCsFlag 	= 	false;
							$scope.TransformOutputEPCsButton			=	false;
						}
					}
					
					//Association Event Child EPCs
					if($scope.AssociationEventChildEPCSFlag)
					{
						$scope.AssociationEventChildEPCsURI.push(response);
					}
					
					//After the loop set all values of the button and flag to false								
					if(ItemCount == parseInt($scope.formdata.eventcount, 10))
					{
						//EPCs and Child EPCs section
						$scope.ObjectEventAddEPCsFlag				=	false;
						$scope.ObjectEventEPCSbutton				=	false;						
						
						$scope.AEChildEPCSFlage						=	false;
						$scope.AEChildEPCButton						=	false;				
						
						$scope.TransactionEventChildEPCS			=	false;
						$scope.TransactionEventEPCSbutton			=	false;
						
						$scope.AssociationEventChildEPCSButton		=	false;
						$scope.AssociationEventChildEPCSFlag		=	false;
					}					
				}	
					
			}).error(function(error){
				console.log(error)
			});
		}
	}
	
	//Object Event Quantities Submit call the URI function
	$scope.CommonEventQuantities	=	function(){
		
		var data 				=	JSON.stringify({input:$scope.CommonFormQuantity, formdata:$scope.formdata});
		var ItemCount			=	0;		
		angular.element('#ChildTypeModal').modal('hide');
		angular.element('#EventModalForm').modal('show');
		
		for(var eventEPC=0; eventEPC<$scope.formdata.eventcount; eventEPC++)
		{
			$http({
				url: "/CreateObjectEventQuantities",
				method: "POST",
				headers: {'Content-Type': 'application/json'},
				data:data
			}).success(function(response) {
				
				//Check if Output quantities filled as per Event count
				ItemCount	=	ItemCount+1;
				
				//IF OBJECT EVENT QUANTITIES CLICKED
				if($scope.OEQuantitiesFlag)
				{
					$scope.ObjectEventQuantitiesURI.push(response);					
				}
				
				//If AGGREGATION EVENT CHILD QUANTITIES CLICKED
				if($scope.AEChildQuantitiesFlag)
				{
					$scope.AggregationEventChildQuantitiesURI.push(response);
				}
				
				//Transaction Event Quantities
				if($scope.TransactionEventQuantitiesFlag)
				{
					$scope.TransactionEventQuantitiesURI.push(response);					
				}
				
				//Transformation Event Input Quantities
				if($scope.TransformationEventInputQuantitiesFlag)
				{
					$scope.TransformationEventInputQuantityURI.push(response);
					
					//Check if input quantities filled as per Event count
					if(ItemCount == parseInt($scope.formdata.eventcount, 10))
					{
						$scope.TransformationEventInputQuantitiesFlag	=	false;
						$scope.TransformationEventInputQuantitiesButton	=	false;
					}
				}
				
				//Transformation Output Quantities
				if($scope.TransformationEventOutputQuantitiesFlag)
				{				
					$scope.TransformationEventOutputQuantityURI.push(response);
					
					//Check if Output quantities filled as per Event count
					if(ItemCount == parseInt($scope.formdata.eventcount, 10))
					{
						$scope.TransformationEventOutputQuantitiesFlag	=	false;
						$scope.TransformationEventOutputQuantitiesButton=	false;
					}
				}
				
				//Association Event Child Quantities
				if($scope.AssociationEventChildQuantitiesFlag)
				{
					$scope.AssociationEventChildQuantitiesURI.push(response);
				}
				
				//After the loop set all values of the button and flag to false
				if(ItemCount == $scope.formdata.eventcount)
				{
					$scope.OEQuantitiesFlag							=	false;
					$scope.OEAddQuantitiesButton					=	false;					
							
					$scope.AEChildQuantitiesFlag					= 	false;
					$scope.AEChildQuantitiesButton					= 	false;					
							
					$scope.TransactionEventQuantitiesFlag 			=	false;
					$scope.TransactionEventQuantitiesButton			=	false;					
					
					$scope.AssociationEventChildQuantitiesFlag		=	false;
					$scope.AssociationEventChildQuantitiesButton	=	false;				
				}
			}).error(function(error) {
				console.log(error)
			});
			
		}
		
	}	
	
	/* ALL EVENT EXTENSIONS LIST STARTS*/
	
	//Show Modal for adding Extensions on Click of button
	$scope.AddExtensionsModalShow	=	function()
	{
		angular.element('#AddExtensionModal').modal('show');
		$scope.AddExtensionsFlag		=	true;
		$scope.AddExtensionForm			=	{AddExtensionXMLElement:'Element',AddExtensionDataType:'String'};
	}
	
	//On submission of the Modal Add Extensions or ILMD OR ERROR Declaration
	$scope.AddNewExtension	=	function(){
		
		angular.element('#AddExtensionModal').modal('hide');
		
		//Set the Extensions List
		if($scope.AddExtensionsFlag)
		{	
			var obj 					= 	new Object();
			obj.ExtensionXMLElement		=	$scope.AddExtensionForm.AddExtensionXMLElement;
			obj.NameSpace				=	$scope.AddExtensionForm.AddExtensionNamespaceURI;
			obj.LocalName				=	$scope.AddExtensionForm.AddExtensionLocalName;
			obj.DataType				=	$scope.AddExtensionForm.AddExtensionDataType;
			obj.ID						=	$scope.CommonExtensionsID;
			obj.FreeText				=	"";
			$scope.CommonExtensionsList.push(obj);
			$scope.CommonExtensionsID++;
			$scope.AddExtensionsFlag	=	false;
		}	
			
		//Set the ILMD List
		if($scope.AddILMDFlag)
		{
			//If Object Event Set the Object Event ILMD List
			if($scope.formdata.eventtype1 == 'ObjectEvent')
			{
				var obj 					= 	new Object();
				obj.ExtensionXMLElement		=	$scope.AddExtensionForm.AddExtensionXMLElement;
				obj.NameSpace				=	$scope.AddExtensionForm.AddExtensionNamespaceURI;
				obj.LocalName				=	$scope.AddExtensionForm.AddExtensionLocalName;
				obj.DataType				=	$scope.AddExtensionForm.AddExtensionDataType;
				obj.ID						=	$scope.ObjectEventILMDID;
				obj.FreeText				=	"";
				$scope.ObjectEventILMDList.push(obj);
				$scope.ObjectEventILMDID++;
				$scope.AddILMDFlag			=	false;
			}
			
			//If Transformation Event has been selected
			if($scope.formdata.eventtype1 == 'TransformationEvent')
			{
				var obj 					= 	new Object();
				obj.ExtensionXMLElement		=	$scope.AddExtensionForm.AddExtensionXMLElement;
				obj.NameSpace				=	$scope.AddExtensionForm.AddExtensionNamespaceURI;
				obj.LocalName				=	$scope.AddExtensionForm.AddExtensionLocalName;
				obj.DataType				=	$scope.AddExtensionForm.AddExtensionDataType;
				obj.ID						=	$scope.TransformationEventILMDID;
				obj.FreeText				=	"";
				$scope.TransformationEventILMDList.push(obj);
				$scope.TransformationEventILMDID++;
				$scope.AddILMDFlag			=	false;
			}
		}
		
		//Error Declaration EXTENSION LIST
		if($scope.AddErrorExtensionFlag)
		{
				var obj 					= 	new Object();
				obj.ExtensionXMLElement		=	$scope.AddExtensionForm.AddExtensionXMLElement;
				obj.NameSpace				=	$scope.AddExtensionForm.AddExtensionNamespaceURI;
				obj.LocalName				=	$scope.AddExtensionForm.AddExtensionLocalName;
				obj.DataType				=	$scope.AddExtensionForm.AddExtensionDataType;
				obj.ID						=	$scope.ErrorExtensionID;
				obj.FreeText				=	"";
				$scope.ErrorExtensionList.push(obj);
				$scope.ErrorExtensionID++;
				$scope.AddErrorExtensionFlag	=	false;
		}
	}
	
	//Delete Extension On the Click
	$scope.Delete_Extension		=	function(ID){
		
		//Loop and find which element needs to be deleted from Extension List
		for(var ex=0; ex<$scope.CommonExtensionsList.length; ex++)
		{
			if($scope.CommonExtensionsList[ex].ID == ID)
			{
				$scope.CommonExtensionsList.splice(ex, 1);
				break;
			}
		}
	}
	
	//Add FreeText for the corresponding Extension
	$scope.AddExtensionText		=	function(FreeText,ID){
		
		for(var ex=0; ex<$scope.CommonExtensionsList.length; ex++)
		{
			if($scope.CommonExtensionsList[ex].ID == ID)
			{
				$scope.CommonExtensionsList[ex].FreeText	=	FreeText;
				break;
			}
		}
	}
	
	//Onclick of EDIT Extension show the Modal for Editing the extension
	$scope.Edit_Extension			=	function(Edit_Id){
		
		//Loop and find the details related to the 
		for(var ex=0; ex<$scope.CommonExtensionsList.length; ex++)
		{			
			if($scope.CommonExtensionsList[ex].ID == Edit_Id)
			{	
				$scope.EditExtensionForm	=	{
													EditExtensionXMLElement		:	$scope.CommonExtensionsList[ex].ExtensionXMLElement,
													EditExtensionNamespaceURI	:	$scope.CommonExtensionsList[ex].NameSpace,
													EditExtensionLocalName		:	$scope.CommonExtensionsList[ex].LocalName,
													EditExtensionDataType		:	$scope.CommonExtensionsList[ex].DataType,
													EditInsertId				:	Edit_Id													
												};												
				angular.element('#EditExtensionModal').modal('show');
				$scope.EditExtensionFlag	=	true;
				break;
			}
		}
	}
	
	//On Submission of EDIT Extension Modal update the corresponding Extensions
	$scope.EditExtension	=	function(){
		
		//Edit the Extension
		if($scope.EditExtensionFlag)
		{
			for(var ex=0; ex<$scope.CommonExtensionsList.length; ex++)
			{
				if($scope.CommonExtensionsList[ex].ID == $scope.EditExtensionForm.EditInsertId)
				{
					$scope.CommonExtensionsList[ex].ExtensionXMLElement		=	$scope.EditExtensionForm.EditExtensionXMLElement;
					$scope.CommonExtensionsList[ex].NameSpace				=	$scope.EditExtensionForm.EditExtensionNamespaceURI;
					$scope.CommonExtensionsList[ex].LocalName				=	$scope.EditExtensionForm.EditExtensionLocalName;
					$scope.CommonExtensionsList[ex].ID						=	$scope.EditExtensionForm.EditInsertId
					$scope.CommonExtensionsList[ex].DataType				=	$scope.EditExtensionForm.EditExtensionDataType;
					angular.element('#EditExtensionModal').modal('hide');
					$scope.EditExtensionFlag								=	false;
					break;
				}	
			}
		}
		
		//Edit Submit of the ILMD on Edit Insert modification click
		if($scope.ObjectEventEditILMDFLag)
		{
			if($scope.formdata.eventtype1 == 'ObjectEvent')
			{
				for(var ex=0; ex<$scope.ObjectEventILMDList.length; ex++)
				{
					if($scope.ObjectEventILMDList[ex].ID == $scope.EditExtensionForm.EditInsertId)
					{
						$scope.ObjectEventILMDList[ex].ExtensionXMLElement		=	$scope.EditExtensionForm.EditExtensionXMLElement;
						$scope.ObjectEventILMDList[ex].NameSpace				=	$scope.EditExtensionForm.EditExtensionNamespaceURI;
						$scope.ObjectEventILMDList[ex].LocalName				=	$scope.EditExtensionForm.EditExtensionLocalName;
						$scope.ObjectEventILMDList[ex].ID						=	$scope.EditExtensionForm.EditInsertId
						$scope.ObjectEventILMDList[ex].DataType					=	$scope.EditExtensionForm.EditExtensionDataType;
						angular.element('#EditExtensionModal').modal('hide');
						$scope.ObjectEventEditILMDFLag							=	false;
						break;
					}	
				}
			}
		}
		
		//Edit Insert the Transformation Event ILMD
		if($scope.TransformationEventEditILMDFlag)
		{
			if($scope.formdata.eventtype1 == 'TransformationEvent')
			{
				for(var ex=0; ex<$scope.TransformationEventILMDList.length; ex++)
				{
					if($scope.TransformationEventILMDList[ex].ID == $scope.EditExtensionForm.EditInsertId)
					{
						$scope.TransformationEventILMDList[ex].ExtensionXMLElement		=	$scope.EditExtensionForm.EditExtensionXMLElement;
						$scope.TransformationEventILMDList[ex].NameSpace				=	$scope.EditExtensionForm.EditExtensionNamespaceURI;
						$scope.TransformationEventILMDList[ex].LocalName				=	$scope.EditExtensionForm.EditExtensionLocalName;
						$scope.TransformationEventILMDList[ex].ID						=	$scope.EditExtensionForm.EditInsertId
						$scope.TransformationEventILMDList[ex].DataType					=	$scope.EditExtensionForm.EditExtensionDataType;
						angular.element('#EditExtensionModal').modal('hide');
						$scope.TransformationEventEditILMDFlag							=	false;
						break;
					}	
				}
			}
		}
		
		//Edit Insert the Error Extension 
		if($scope.EditErrorExtensionFlag)
		{
			for(var ex=0; ex<$scope.ErrorExtensionList.length; ex++)
			{
				if($scope.ErrorExtensionList[ex].ID == $scope.EditExtensionForm.EditInsertId)
				{
					$scope.ErrorExtensionList[ex].ExtensionXMLElement		=	$scope.EditExtensionForm.EditExtensionXMLElement;
					$scope.ErrorExtensionList[ex].NameSpace					=	$scope.EditExtensionForm.EditExtensionNamespaceURI;
					$scope.ErrorExtensionList[ex].LocalName					=	$scope.EditExtensionForm.EditExtensionLocalName;
					$scope.ErrorExtensionList[ex].ID						=	$scope.EditExtensionForm.EditInsertId
					$scope.ErrorExtensionList[ex].DataType					=	$scope.EditExtensionForm.EditExtensionDataType;
					angular.element('#EditExtensionModal').modal('hide');
					$scope.EditErrorExtensionFlag							=	false;
					break;
				}	
			}
		}
	}

	/* ALL EVENT EXTENSIONS LIST ENDS*/
	
	/* ADDITION OF THE ILMD STARTS */
	
	//Show Modal for adding ILMD on Click of ADD ILMD button
	$scope.AddILMDModalShow	=	function()
	{
		angular.element('#AddExtensionModal').modal('show');
		$scope.AddILMDFlag		=	true;
		$scope.AddExtensionForm	=	{AddExtensionXMLElement:'Element',AddExtensionDataType:'String'};
	}
	
	//Delete the ILMD for Object Event on Delete Button Click
	$scope.DeleteObjectEventILMD	=	function(Delete_ILMD_ID){
		//Loop and find which element needs to be deleted from Extension List
		for(var ex=0; ex<$scope.ObjectEventILMDList.length; ex++)
		{
			if($scope.ObjectEventILMDList[ex].ID == Delete_ILMD_ID)
			{
				$scope.ObjectEventILMDList.splice(ex, 1);
				break;
			}
		}
	}
	
	//Edit the ILMD for Object Event on click of Edit button
	$scope.EditObjectEventILMD			=	function(Edit_ILMD_ID){
		
		//Loop and find the details related to the 
		for(var ex=0; ex<$scope.ObjectEventILMDList.length; ex++)
		{			
			if($scope.ObjectEventILMDList[ex].ID == Edit_ILMD_ID)
			{	
				$scope.EditExtensionForm	=	{
													EditExtensionXMLElement		:	$scope.ObjectEventILMDList[ex].ExtensionXMLElement,
													EditExtensionNamespaceURI	:	$scope.ObjectEventILMDList[ex].NameSpace,
													EditExtensionLocalName		:	$scope.ObjectEventILMDList[ex].LocalName,
													EditExtensionDataType		:	$scope.ObjectEventILMDList[ex].DataType,
													EditInsertId				:	Edit_ILMD_ID
												};												
				angular.element('#EditExtensionModal').modal('show');
				//Set the Flag edit submit ILMD
				$scope.EditExtensionFlag				=	false;
				$scope.EditErrorExtensionFlag			=	false;
				$scope.TransformationEventEditILMDFlag 	=	false;
				$scope.ObjectEventEditILMDFLag			=	true;
				break;
			}
		}
	}
	
	//Add FreeText for the corresponding Object Event ILMD 
	$scope.AddObjectEventILMDFreeText		=	function(FreeText,ID){		
		for(var ex=0; ex<$scope.ObjectEventILMDList.length; ex++)
		{
			if($scope.ObjectEventILMDList[ex].ID == ID)
			{
				$scope.ObjectEventILMDList[ex].FreeText	=	FreeText;
				break;
			}
		}
	}
	
	//Delete the Transformation Event ILMD
	$scope.DeleteTransformationEventILMD	=	function(Delete_ILMD_ID){
		//Loop and find which element needs to be deleted
		for(var ex=0; ex<$scope.TransformationEventILMDList.length; ex++)
		{
			if($scope.TransformationEventILMDList[ex].ID == Delete_ILMD_ID)
			{
				$scope.TransformationEventILMDList.splice(ex, 1);
				break;
			}
		}
	}
	
	//Edit the ILMD for Transformation Event on click of Edit button
	$scope.EditTransformationEventILMD		=	function(Edit_ILMD_ID){
		
		for(var ex=0; ex<$scope.TransformationEventILMDList.length; ex++)
		{			
			if($scope.TransformationEventILMDList[ex].ID == Edit_ILMD_ID)
			{	
				$scope.EditExtensionForm	=	{
													EditExtensionXMLElement		:	$scope.TransformationEventILMDList[ex].ExtensionXMLElement,
													EditExtensionNamespaceURI	:	$scope.TransformationEventILMDList[ex].NameSpace,
													EditExtensionLocalName		:	$scope.TransformationEventILMDList[ex].LocalName,
													EditExtensionDataType		:	$scope.TransformationEventILMDList[ex].DataType,
													EditInsertId				:	Edit_ILMD_ID										
												};												
				angular.element('#EditExtensionModal').modal('show');
				//Set the Flag edit submit ILMD
				$scope.EditExtensionFlag				=	false;
				$scope.ObjectEventEditILMDFLag			=	false;
				$scope.EditErrorExtensionFlag			=	false;
				$scope.TransformationEventEditILMDFlag 	=	true;
				break;
			}
		}
	}
	
	//Add the free text for the Transformation Event ILMD
	$scope.AddTransformationEventILMDFreeText		=	function(FreeText,ID){		
		for(var ex=0; ex<$scope.TransformationEventILMDList.length; ex++)
		{
			if($scope.TransformationEventILMDList[ex].ID == ID)
			{
				$scope.TransformationEventILMDList[ex].FreeText	=	FreeText;
				break;
			}
		}
	}
	
	/* ADDITION OF THE ILMD ENDS */
	
	/* ERROR DECLARATION FIELD SETTING STARTS */
	
	//Show the fields for adding the Error Declaration Corrective IDS
	$scope.AddErrorCorrectiveIds	=	function(){
		var obj 			= 	new Object();
		obj.ID				=	$scope.ErrorCorrectiveElementID;
		obj.CorrectiveText	=	"";
		$scope.ErrorCorrectiveIds.push(obj);
		$scope.ErrorCorrectiveElementID++;
	}
	
	//For every coorective field add the text to corresponding field
	$scope.AddCorrectiveText	=	function(CorrectiveText, CorrectiveID)
	{
		for(var corr=0; corr<$scope.ErrorCorrectiveIds.length; corr++)
		{
			if($scope.ErrorCorrectiveIds[corr].ID == CorrectiveID)
			{
				$scope.ErrorCorrectiveIds[corr].CorrectiveText	=	CorrectiveText;
				break;
			}
		}
	}
	
	//Delete Corrective Id's onclick of Delete button
	$scope.DeleteErrorCorrectiveID	=	function(DeleteID){
		for(var corr=0; corr<$scope.ErrorCorrectiveIds.length; corr++)
		{
			if($scope.ErrorCorrectiveIds[corr].ID == DeleteID)
			{
				$scope.ErrorCorrectiveIds.splice(corr, 1);				
				break;
			}
		}
	}
	
	//Show the Modal for Error Declaration Add
	$scope.ErrorExtensionAddModal	=	function()
	{
		angular.element('#AddExtensionModal').modal('show');
		$scope.AddErrorExtensionFlag	=	true;
		$scope.AddExtensionForm			=	{AddExtensionXMLElement:'Element',AddExtensionDataType:'String'};
	}
	
	//Delete the Error Exntension on click of Delete button
	$scope.DeleteErrorExtension	=	function(DeleteID){
		
		for(var corr=0; corr<$scope.ErrorExtensionList.length; corr++)
		{
			if($scope.ErrorExtensionList[corr].ID == DeleteID)
			{
				$scope.ErrorExtensionList.splice(corr, 1);		
				break;				
			}
		}
	}
	
	//Add text to corresponding Extension list on entering
	$scope.AddErrorExtensionText	=	function(FreeText, ID){	
		for(var corr=0; corr<$scope.ErrorExtensionList.length; corr++)
		{
			if($scope.ErrorExtensionList[corr].ID == ID)
			{
				$scope.ErrorExtensionList[corr].FreeText	=	FreeText;
				break;
			}
		}
	}
	
	//Show the modal for editing the error extension
	$scope.EditErrorExtension	=	function(Edit_Extension_ID){		
		for(var ex=0; ex<$scope.ErrorExtensionList.length; ex++)
		{			
			if($scope.ErrorExtensionList[ex].ID == Edit_Extension_ID)
			{	
				$scope.EditExtensionForm	=	{
													EditExtensionXMLElement		:	$scope.ErrorExtensionList[ex].ExtensionXMLElement,
													EditExtensionNamespaceURI	:	$scope.ErrorExtensionList[ex].NameSpace,
													EditExtensionLocalName		:	$scope.ErrorExtensionList[ex].LocalName,
													EditExtensionDataType		:	$scope.ErrorExtensionList[ex].DataType,
													EditInsertId				:	Edit_Extension_ID										
												};												
				angular.element('#EditExtensionModal').modal('show');
				//Set the Flag edit submit Error Extension
				$scope.EditExtensionFlag				=	false;
				$scope.ObjectEventEditILMDFLag			=	false;
				$scope.TransformationEventEditILMDFlag 	=	false;
				$scope.EditErrorExtensionFlag			=	true;
				break;
			}
		}
	}
	
	
	/* ERROR DECLARATION FIELD SETTING ENDS */
	
	/* BUSINESS TRANSACTION TYPE STARTS */
	
	//Increment the count for the array
	$scope.AddBTT	=	function(e){
		e.preventDefault();
		var BTTObj		=	new Object();
		BTTObj['ID']	=	$scope.BusinessTransactionCount;
		BTTObj['BTT']	=	{};
		$scope.BusinessTransactionList.push(BTTObj);
		$scope.BusinessTransactionCount++;
	}
	
	//Add the information into the BTT Array
	$scope.AddBTTInformation	=	function(BTTId){
		for(var b=0; b<$scope.BusinessTransactionList.length; b++)
		{
			if($scope.BusinessTransactionList[b].ID == BTTId)
			{
				$scope.BusinessTransactionList[b].BTT['Type']	=	$scope.BTT.BTTType[BTTId];
				$scope.BusinessTransactionList[b].BTT['Value']	=	$scope.BTT.BTTValue[BTTId];
				break;
			}
		}
	}
	
	//Remove the element from the BTT array
	$scope.DeleteBTT	=	function(Delete_BTT_ID){
		for(var b=0; b<$scope.BusinessTransactionList.length; b++)
		{
			if($scope.BusinessTransactionList[b].ID == Delete_BTT_ID)
			{
				$scope.BusinessTransactionList.splice(b,1);
				break;
			}
		}
	}
	/* BUSINESS TRANSACTION TYPE ENDS */
	
	//On load of the page populate the drop-downs
	$scope.init = function () {
		//call the MODALS.html file
		$scope.outputElements 		=	false;
		$scope.inputElements 		= 	true;
		$scope.isDisabled 			= 	false;
		$scope.ResetButtonDisplay	=	true;
		
		$http({
			url: "/populateFields",
			method: "GET"
		}).success(function(response) {
			$scope.businessSteps 		=	response.businessStep;
			$scope.eventType			=	response.eventType;	
			$scope.dispositions			=	response.dispositions;
			$scope.BusinessTransactions	=	response.BusinessTransactions;
			$scope.companyPrefixs		=	response.companyPrefixs;
			$scope.ObjectEventEpcsTypes	=	response.ObjectEventEpcsTypes;
			$scope.ObjectEventQuantities=	response.ObjectEventQuantities;
			$scope.UOMs					=	response.UOMs;
			$scope.SensorElements		=	response.SensorElements;
			$scope.AllUOMs				=	response.Temperatures;
			$scope.SensorUOMs			=	response.SensorUOMs;
			$scope.SensorValueTypes		=	response.SensorValueTypes;
			$scope.SensorMetaDatas		=	response.SensorMetaDatas;
			$scope.SensorReportDatas	=	response.SensorReportDatas;
			$scope.TimeZones			=	response.TimeZones;
			
		}).error(function(error) {
			console.log("Something went wrong in init")
			console.log(error);
		});
	};
	
	//If submit button is clicked then send data to Nodejs for XML and JSON creation
	$scope.createEvents	= 	function()
	{
		//Based on the Event type do the validations		
		if($scope.formdata.eventtype1 == 'ObjectEvent')
		{
			//Check if Object event contains the EPCs or Quantities
			if($scope.ObjectEventEpcsURI.length > 0 || $scope.ObjectEventQuantitiesURI.length > 0)
			{
				//Check if the count of Events and elements in EPCs/Quantities Match
				if(($scope.ObjectEventEpcsURI.length > 0 && $scope.formdata.eventcount != $scope.ObjectEventEpcsURI.length) || ($scope.ObjectEventQuantitiesURI.length > 0 && $scope.formdata.eventcount != $scope.ObjectEventQuantitiesURI.length))
				{
					alertify.alert("Test Data Generator", "The <b>Event count</b> and identifiers in <b>EPCs</b> or <b>Quantities</b> do not match")
				}
				else
				{
					var data 	=	JSON.stringify({	
													input			:	$scope.formdata,
													EPCs			:	$scope.ObjectEventEpcsURI,
													Quantities		:	$scope.ObjectEventQuantitiesURI,
													ILMD			:	$scope.ObjectEventILMDList,
													Extension		:	$scope.CommonExtensionsList,
													ErrorCorrection	:	$scope.ErrorCorrectiveIds,
													ErrorExtension	:	$scope.ErrorExtensionList,
													BTT				:	$scope.BusinessTransactionList,
													SensorForm		:	$rootScope.TotalSensorElementsArray,
													XMLElement		:	"Single",
													File			:	'ObjectEvent'
												});
					
					//Call the function to create function
					$scope.CreateEventFunctionHTTP(data);
				}
			}
			else
			{
				alertify.alert("Test Data Generator", "Object Event requires: <b>EPCs</b> or <b>Quantities</b>")
			}			
		}
		else if($scope.formdata.eventtype1 == 'AggregationEvent')
		{
			//Check if the count of Events and elements in ParentID/Child EPCs/Child Quantities Match
			if(($scope.AggregationEventParentURI.length > 0 && $scope.formdata.eventcount != $scope.AggregationEventParentURI.length) || ($scope.AggregationEventChildEPCsURI.length > 0 && $scope.formdata.eventcount != $scope.AggregationEventChildEPCsURI.length) || ($scope.AggregationEventChildQuantitiesURI.length > 0 && $scope.formdata.eventcount != $scope.AggregationEventChildQuantitiesURI.length))
			{
				alertify.alert("Test Data Generator", "The <b>Event count</b> and identifiers in <b>Parent IDs</b>/<b>Child EPCs</b>/<b>Child Quantities</b> do not match")
			}
			else
			{
				var data 	=	JSON.stringify({
												input			:	$scope.formdata,
												Extension		:	$scope.CommonExtensionsList,
												ParentID		:	$scope.AggregationEventParentURI,		
												EPCs	 		:	$scope.AggregationEventChildEPCsURI,			
												Quantities		:	$scope.AggregationEventChildQuantitiesURI,
												ErrorCorrection	:	$scope.ErrorCorrectiveIds,
												ErrorExtension	:	$scope.ErrorExtensionList,
												BTT				:	$scope.BusinessTransactionList,
												SensorForm		:	$rootScope.TotalSensorElementsArray,
												XMLElement		:	"Single",
												File			:	'AggregationEvent'
											});
											
				//Call the function to create function
				$scope.CreateEventFunctionHTTP(data);
			}
		}
		else if($scope.formdata.eventtype1 == 'TransactionEvent')
		{
			//Check if the count of Events and elements in Prent IDs/EPCs/Quantities Match
			if(($scope.TransactionEventParentIDURI.length > 0 && $scope.formdata.eventcount != $scope.TransactionEventParentIDURI.length) || ($scope.TransactionEventEPCsURI.length > 0 && $scope.formdata.eventcount != $scope.TransactionEventEPCsURI.length) || ($scope.TransactionEventQuantitiesURI.length > 0 && $scope.formdata.eventcount != $scope.TransactionEventQuantitiesURI.length))
			{
				alertify.alert("Test Data Generator", "The <b>Event count</b> and identifiers in <b>Parent IDs</b>/<b>EPCs</b>/<b>Quantities</b> do not match")
			}
			else
			{
				//Check if required values are available
				if($scope.BusinessTransactionList.length > 0)
				{
					var data	=	JSON.stringify({
													input			:	$scope.formdata,
													Extension		:	$scope.CommonExtensionsList,
													ParentID		:	$scope.TransactionEventParentIDURI,
													EPCs 			:	$scope.TransactionEventEPCsURI,
													Quantities		:	$scope.TransactionEventQuantitiesURI,
													ErrorCorrection	:	$scope.ErrorCorrectiveIds,
													ErrorExtension	:	$scope.ErrorExtensionList,
													BTT				:	$scope.BusinessTransactionList,
													SensorForm		:	$rootScope.TotalSensorElementsArray,
													XMLElement		:	"Single",
													File			:	'TransactionEvent'
												});
												
					//Call the function to create function
					$scope.CreateEventFunctionHTTP(data);
				}
				else
				{
					alertify.alert("Test Data Generator", "Transaction Event requires: <b>Business Transactions</b>")
				}
			}			
		}
		else if($scope.formdata.eventtype1 == 'TransformationEvent')
		{
			//Check if the count of Events and elements in Input EPCs/Quantities or Output EPCs/Quantities Match
			if(($scope.TransformationEventInputEPCsURI.length > 0 && $scope.formdata.eventcount != $scope.TransformationEventInputEPCsURI.length) || ($scope.TransformationEventInputQuantityURI.length > 0 && $scope.formdata.eventcount != $scope.TransformationEventInputQuantityURI.length) || ($scope.TransformationEventOutputEPCSURI.length > 0 && $scope.formdata.eventcount != $scope.TransformationEventOutputEPCSURI.length) || ($scope.TransformationEventOutputQuantityURI.length > 0 && $scope.formdata.eventcount != $scope.TransformationEventOutputQuantityURI.length))
			{
				alertify.alert("Test Data Generator", "The <b>Event count</b> and identifiers in <b>Input EPCs</b>/<b>Input Quantities</b>/<b>Output EPCs</b>/<b>Output Quantities</b> do not match")
			}
			else
			{
				var data	=	JSON.stringify({
													input			:	$scope.formdata,
													EPCs			:	$scope.TransformationEventInputEPCsURI,
													Quantities		:	$scope.TransformationEventInputQuantityURI,
													OutputEPCs		:	$scope.TransformationEventOutputEPCSURI,
													OutputQuantities:	$scope.TransformationEventOutputQuantityURI,
													ILMD			:	$scope.TransformationEventILMDList,
													Extension		:	$scope.CommonExtensionsList,
													ErrorCorrection	:	$scope.ErrorCorrectiveIds,
													ErrorExtension	:	$scope.ErrorExtensionList,
													BTT				:	$scope.BusinessTransactionList,
													SensorForm		:	$rootScope.TotalSensorElementsArray,
													XMLElement		:	"Single",
													File			:	'TransformationEvent'
												});
				
				//Call the function to create function
				$scope.CreateEventFunctionHTTP(data);
			}
		}
		else if($scope.formdata.eventtype1 == 'AssociationEvent')
		{
			//Check if the count of Events and elements in ParentID/Child EPCs/Child Quantities Match
			if(($scope.AssociationEventParentURI.length > 0 && $scope.formdata.eventcount != $scope.AssociationEventParentURI.length) || ($scope.AssociationEventChildEPCsURI.length > 0 && $scope.formdata.eventcount != $scope.AssociationEventChildEPCsURI.length) || ($scope.AssociationEventChildQuantitiesURI.length > 0 && $scope.formdata.eventcount != $scope.AssociationEventChildQuantitiesURI.length))
			{
				alertify.alert("Test Data Generator", "The <b>Event count</b> and identifiers in <b>Parent IDs</b>/<b>Child EPCs</b>/<b>Child Quantities</b> do not match")
			}
			else
			{
				var data 	=	JSON.stringify({
												input			:	$scope.formdata,
												Extension		:	$scope.CommonExtensionsList,
												ParentID		:	$scope.AssociationEventParentURI,		
												EPCs	 		:	$scope.AssociationEventChildEPCsURI,			
												Quantities		:	$scope.AssociationEventChildQuantitiesURI,
												ErrorCorrection	:	$scope.ErrorCorrectiveIds,
												ErrorExtension	:	$scope.ErrorExtensionList,
												BTT				:	$scope.BusinessTransactionList,
												SensorForm		:	$rootScope.TotalSensorElementsArray,
												XMLElement		:	"Single",
												File			:	'AssociationEvent'
											});	
				
				//Call the function to create function
				$scope.CreateEventFunctionHTTP(data);	
			}
		}
	}
	
	//Function to make final call for creating the events
	$scope.CreateEventFunctionHTTP	=	function(data)
	{
		$http({
			url: "/createEvents",
			method: "POST",
			headers: {'Content-Type': 'application/json'},
			data: data
		}).success(function(response) {
			console.log("RECEIEVED XML");
			$location.hash('mainBody');
			$anchorScroll();
			$scope.xmldata	=	"";
			$scope.xmldata 	=	response[0].XML;
			$scope.jsondata	=	JSON.stringify(JSON.parse(response[1].JSON), undefined, 4);	
			//Hide Table and Show the XML and JSON field
			$scope.outputElements 		= 	true;
			$scope.inputElements 		= 	false;
			$scope.isDisabled 			= 	true;
			$scope.ResetButtonDisplay	=	false;
		}).error(function(error) {
			console.log(error)
		});
	}
	
	//Go BACK and display the input fields again
	$scope.showInputData = function(){
		$location.hash('mainBody');
		$anchorScroll();
		$scope.outputElements 		= 	false;
		$scope.inputElements 		= 	true;
		$scope.isDisabled 			= 	false;
		$scope.ResetButtonDisplay	=	true;
	}
	
	//Parent ID and EPCS change event
	$scope.AggregationEventParentChange		=	function(){
		
		$scope.NoneValuesText 	=	$scope.RandomRange 			= 	$scope.NoneValuesShow = $scope.AEPCompanyDisp = $scope.AEPSGTINDisp	 = $scope.AEPSSCCDisp = $scope.AEPGRAIDisp = $scope.AEPGIAIDisp = $scope.AEPGSRNDisp = $scope.AEPGSRNPDisp = $scope.AEPGDTIDisp = $scope.AEPGSNDisp = $scope.AEPCPIDisp = $scope.AECGINCDisp  = $scope.AEPGSINDISP = $scope.AEPITIPDISP = $scope.AEPUPIUIDISP = $scope.AEPGIDDisp = $scope.AEPDSDODDisp = $scope.AEPADIDisp = $scope.AEPBICDisp = $scope.AEPIMOVNDisp = $scope.AEPManualURIDisp = $scope.AEPSSGLNDisp =  false;
		$scope.AutoGenerate		=	$scope.AutoGenerateRequired =	true;	
		
		//Check if Multiple values are required
		if($scope.ObjectEventAddEPCsFlag || $scope.AEChildEPCSFlage || $scope.TransactionEventChildEPCS || $scope.TransformationEventInputEPCsFlag || $scope.TransformationEventOutputEPCsFlag || $scope.AssociationEventChildEPCSFlag)
		{
			$scope.MultiValues 		= 	true;
		}
		
		if($scope.AEParentEPCsFlag || $scope.TransactionEventParentIDFlag || $scope.AssociationEventParentFlag)
		{
			$scope.MultiValues 		= 	false;
		}
			
		if($scope.CommonForm.AggregationEventParentID == 'SGTIN (Al 01 + Al 21)')
		{
			$scope.AEPSGTINDisp		=	true;
			$scope.AEPCompanyDisp	=	true;
			$scope.NoneValuesText	=	true;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'SSCC (Al 00)')
		{
			$scope.AEPSSCCDisp		= 	true;
			$scope.RandomRange		=	true;
			$scope.AutoGenerate		= 	$scope.AutoGenerateRequired	=	false;			
		}
		else if($scope.CommonForm.AggregationEventParentID == 'SGLN (Al 414 + Al 254)')
		{
			$scope.AEPSSGLNDisp		=	true;
			$scope.AEPCompanyDisp	=	true;
			$scope.NoneValuesShow	=	true;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'GRAI (Al 8003)')
		{
			$scope.AEPGRAIDisp		=	true;
			$scope.AEPCompanyDisp	=	true;
			$scope.NoneValuesText	=	true;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'GIAI (Al 8004)')
		{
			$scope.AEPGIAIDisp		=	true;
			$scope.NoneValuesText	=	true;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'GSRN (Al 8018)')
		{
			$scope.AEPGSRNDisp		=	true;
			$scope.RandomRange		=	true;
			$scope.AutoGenerate		= 	$scope.AutoGenerateRequired	=	false;	
		}
		else if($scope.CommonForm.AggregationEventParentID == 'GSRNP (Al 8017)')
		{
			$scope.AEPGSRNPDisp		=	true;
			$scope.RandomRange		=	true;
			$scope.AutoGenerate		= 	$scope.AutoGenerateRequired	=	false;	
		}
		else if($scope.CommonForm.AggregationEventParentID == 'GDTI (Al 253)')
		{
			$scope.AEPGDTIDisp		=	true;
			$scope.AEPCompanyDisp	=	true;
			$scope.NoneValuesText	=	true;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'GCN (Al 255)')
		{
			$scope.AEPGSNDisp		=	true;
			$scope.RandomRange		=	true;
			$scope.AEPCompanyDisp	=	true;
			$scope.AutoGenerate		= 	$scope.AutoGenerateRequired	=	false;	
		}
		else if($scope.CommonForm.AggregationEventParentID == 'CPI (Al 8010 8011)')
		{
			$scope.AEPCPIDisp		=	true;
			$scope.AEPCompanyDisp	=	true;
			$scope.RandomRange		=	true;
			$scope.AutoGenerate		= 	$scope.AutoGenerateRequired	=	false;	
		}
		else if($scope.CommonForm.AggregationEventParentID == 'GINC (Al 401)')
		{
			$scope.AECGINCDisp		=	true;
			$scope.NoneValuesText	=  	true;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'GSIN (Al 402)')
		{
			$scope.AEPGSINDISP		=	true;
			$scope.RandomRange		=	true;
			$scope.AutoGenerate		= 	$scope.AutoGenerateRequired	=	false;	
		}
		else if($scope.CommonForm.AggregationEventParentID == 'ITIP (Al 8006 + Al 21)')
		{
			$scope.AEPITIPDISP		=	true;
			$scope.AEPCompanyDisp	=	true;
			$scope.NoneValuesText	=	true;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'UPI_UI (Al 01 + Al 235)')
		{
			$scope.AEPUPIUIDISP		=	true;
			$scope.AEPCompanyDisp	=	true;
			$scope.NoneValuesText	=	true;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'GID')
		{
			$scope.AEPGIDDisp		=	true;
			$scope.RandomRange		=	true;
			$scope.NoneValuesShow	=  	$scope.AutoGenerate	= 	$scope.AutoGenerateRequired	=	false;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'USDoD')
		{
			$scope.AEPDSDODDisp		=	true;
			$scope.RandomRange		=	true;
			$scope.NoneValuesShow	=  	$scope.AutoGenerate	= 	$scope.AutoGenerateRequired	=	false;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'ADI')
		{
			$scope.AEPADIDisp		=	true;
			$scope.RandomRange		=	true;
			$scope.NoneValuesShow	=  	$scope.AutoGenerate	= 	$scope.AutoGenerateRequired	=	false;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'BIC')
		{
			$scope.AEPBICDisp		=	true;
			$scope.NoneValuesShow	=  	$scope.AutoGenerate	= 	$scope.AutoGenerateRequired	=	false;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'IMOVN')
		{
			$scope.AEPIMOVNDisp		=	true; 
			$scope.RandomRange		=	true;
			$scope.NoneValuesShow	=  	$scope.AutoGenerate	= 	$scope.AutoGenerateRequired	=	false;
		}
		else if($scope.CommonForm.AggregationEventParentID == 'Enter a URI Manually')
		{
			$scope.AEPManualURIDisp	=	true; 
			$scope.AutoGenerate	= $scope.AutoGenerateRequired = $scope.MultiValues = false
		}
		
		//If WEB URI is choosen then dont show Company Prefix Field
		if($scope.formdata.ElementssyntaxType == 'webURI')
		{
			$scope.AEPCompanyDisp	=	false;
		}
	}
	
	//Function to check for the changes based on the EVENT QUANTITIES
	$scope.ObjectEventQuantityChange	=	function()
	{
		$scope.QuantitiesCount = $scope.OEQuantityCPIDisplay	 = $scope.OEQuantityManualURIDisplay = $scope.OEQuantityCompanyPrefixDisplay = $scope.OEQuantityLGTINDisplay = $scope.OEQuantityGTINDisplay = $scope.OEQuantityGRAIDisplay = $scope.OEQuantityGDTIDisplay = $scope.OEQuantityGCNDisplay = $scope.OEQuantityITIPDisplay	 = $scope.OEQuantityUPUIDisplay = false;
		
		$scope.AutoGenerate		= 	$scope.AutoGenerateRequired =	$scope.MultiValues = $scope.NoneValuesShow = true;
		
		if($scope.CommonFormQuantity.ObjectEventquantities == 'LGTIN (Al 01 + Al 10)')
		{
			$scope.OEQuantityLGTINDisplay			=	true;
			$scope.OEQuantityCompanyPrefixDisplay	=	true;
		}
		else if($scope.CommonFormQuantity.ObjectEventquantities == 'GTIN, no serial (Al 01)')
		{			
			$scope.OEQuantityGTINDisplay			=	true;
			$scope.OEQuantityCompanyPrefixDisplay	=	true;
		}
		else if($scope.CommonFormQuantity.ObjectEventquantities == 'GRAI, no serial (Al 8003)')
		{
			$scope.OEQuantityGRAIDisplay			=	true;
			$scope.OEQuantityCompanyPrefixDisplay	=	true;
		}
		else if($scope.CommonFormQuantity.ObjectEventquantities == 'GDTI, no serial (Al 253)')
		{
			$scope.OEQuantityGDTIDisplay			=	true;
			$scope.OEQuantityCompanyPrefixDisplay	=	true;
		}
		else if($scope.CommonFormQuantity.ObjectEventquantities == 'GCN, no serial (Al 255)')
		{
			$scope.OEQuantityGCNDisplay				=	true;
			$scope.OEQuantityCompanyPrefixDisplay	=	true;
		}
		else if($scope.CommonFormQuantity.ObjectEventquantities == 'CPI, no serial (Al 801 0)')
		{
			$scope.OEQuantityCPIDisplay				=	true;
			$scope.OEQuantityCompanyPrefixDisplay	=	true;
			$scope.QuantitiesCount					=	true;
			
			$scope.AutoGenerate		= 	$scope.AutoGenerateRequired =	$scope.MultiValues = $scope.NoneValuesShow = false;
		}
		else if($scope.CommonFormQuantity.ObjectEventquantities == 'ITIP, no serial (Al 8006)')
		{
			$scope.OEQuantityITIPDisplay			=	true;
			$scope.OEQuantityCompanyPrefixDisplay	=	true;
		}
		else if($scope.CommonFormQuantity.ObjectEventquantities == 'UPUI, no TPX (Al 01)')
		{
			$scope.OEQuantityUPUIDisplay			=	true;
			$scope.OEQuantityCompanyPrefixDisplay	=	true;
		}
		else if($scope.CommonFormQuantity.ObjectEventquantities == 'Enter a URI Manually')
		{
			$scope.OEQuantityManualURIDisplay		=	true;			
			$scope.AutoGenerate		= 	$scope.AutoGenerateRequired =	$scope.MultiValues = $scope.NoneValuesShow = false;
		}
		
		//If WEB URI is choosen then dont show Company Prefix Field
		if($scope.formdata.ElementssyntaxType == 'webURI')
		{
			$scope.OEQuantityCompanyPrefixDisplay	=	false;
		}
	}	
});