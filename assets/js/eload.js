var eloadRatesData = [];
var eloadStep = 0;
var productHash = "";
var productPrice = 0;
var productCode = "";
var eloadRates = [];

function eloadBtnAction(){
	insertingCoin = true;
	productHash = "";
	eloadStep = 0;
	buyEloadAction();
	$("#mobileNo").val("");
	return false;
}

function buyEloadAction(){
	eloadStep++;
	renderEloadView();
}

function buyEloadPrevAction(){
	eloadStep--;
	renderEloadView();
}

function renderEloadView(){
	if(eloadStep == 0){
		$('#eloadModal').modal('hide');
	}
	else if(eloadStep == 1){
		$("#loadTypeDiv").attr("style", "display: none");
		$("#productTypeDiv").attr("style", "display: none");
		$("#loadTypeSelected").prop("disabled", false);
		$("#eloadConfirm2").attr("style", "display: none");
		$("#mobileNo").prop("disabled", false);
		$("#productTypeSelected").prop("disabled", false);
		$("#buyEloadPrevBtn").html("Close");
		
		
		$.ajax({
			  type: "GET",
			  url: "http://"+vendorIpAddress+"/eload/rates?date="+(new Date().getTime())
		}).done((rawData) => { 
			if(rawData == "disabled"){
				$.toast({
					title: 'Error',
					content: "Eload is currently not available, please try again later",
					type: 'error',
					delay: 5000
				});
				return;
			}
			eloadRatesData = [];
			var data = pako.ungzip(rawData, { to: 'string' });
			var rows = data.split("\n");  
			for(var i=0;i<rows.length;i++){
				var cols = rows[i].split(",");
				var group = cols[3];
				if(group !== undefined){
					var groupData = eloadRatesData[group];
					if(groupData == null){
						eloadRatesData[group] = [];
					}
					eloadRatesData[group].push(cols);
					eloadRates.push(cols);
				}
			}
			$('#eloadModal').modal('show');
		});
	}else if(eloadStep == 2){
		if($("#mobileNo").val() == ""){
			eloadStep--;
			return;
		}
		$("#productTypeSelected").html("");
		$("#loadTypeSelected").html("");
		for(k in eloadRatesData){
		  $("#loadTypeSelected").append($('<option>', {
				value: k,
				text: k
			}));
		}
		$("#buyEloadPrevBtn").html("Prev");
		$("#mobileNo").prop("disabled", false);
		$("#loadTypeSelected").prop("disabled", false);
		$("#productTypeSelected").prop("disabled", false);
		$("#loadTypeDiv").attr("style", "display: block");
		$("#productTypeDiv").attr("style", "display: block");
		$("#eloadConfirm").attr("style", "display: none");
		$("#eloadConfirm2").attr("style", "display: none");
		$("#loadTypeSelected").change();
		
	}else if(eloadStep == 3){
		$("#eloadConfirm").attr("style", "display: block");
		$("#eloadConfirm2").attr("style", "display: block");
		$("#mobileNo").prop("disabled", true);
		$("#loadTypeSelected").prop("disabled", true);
		$("#productTypeSelected").prop("disabled", true);
	}else if(eloadStep == 4){
		topupMode = TOPUP_ELOAD;
		$('#eloadModal').modal('hide');
		topUpEload();
	}
}

// declare all characters
const characters ='abcdefghijklmnopqrstuvwxyz0123456789';

function generateString(length) {
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

function topUpEload(retryCount){
	var mobileNo = $("#mobileNo").val();
	$("#vcCodeDiv").attr('style', 'display: none');
	productCode = $("#productTypeSelected").val();
	$("#loaderDiv").attr("class","spinner");
	var trxNo = generateString(15);
	$('#cncl').html("Cancel");
	
	$.ajax({
		  type: "POST",
		  url: "http://"+vendorIpAddress+"/eload/topUp",
		  data: "mobile="+mobileNo+"&amt="+productPrice+"&mac="+mac+"&hash="+productHash+"&code="+productCode+"&trxNo="+trxNo+"&trxTime="+new Date().getTime(),
		  success: function(data){
			$("#loaderDiv").attr("class","spinner hidden");
			if(data.status == "true"){
				voucher = data.voucher;
				$("#convertVoucherBlockDiv").attr('style', 'display: block');
				$('#insertCoinModal').modal('show');
				insertingCoin = true;
				$('#codeGeneratedBlock').attr('style', 'display: none');
				if(timer == null){
					timer = setInterval(eloadCheckCoin, 1000);
				}
				if(isMultiVendo){
					$("#insertCoinModalTitle").html("Please insert the coin on "+$("#vendoSelected option:selected").text());
				}
				insertcoinbg.play();
				$("#totalTimeDiv").attr("style", "display: none");
				$("#expectedCoinDiv").attr("style", "display: block");
				$("#expectedCoin").html(productPrice+".00 Php");
				$('#expHolder').attr("style", "display: none");

				if(EnableTelegram == true) {
					var dev_ip = $('#ipc').html();
					vendoipAddr = $("#vendoSelected option:selected" ).text();
					var VendoLoc = [];
					var loc;
							for(var i=0;i<multiVendoAddresses.length;i++){
									VendoLoc.push({ip: multiVendoAddresses[i].vendoIp, name: multiVendoAddresses[i].vendoName});
									if (VendoLoc[i].ip == vendorIpAddress) {
											loc = i;
											break;
									}
							}
							
					var selectedProduct = $( "#productTypeSelected option:selected" ).text();	
											
					if (isMultiVendo) {
						if (multiVendoOption == 1){	
								var teleMsg ='********** <b>Buy Eload Active</b> *********%0AExpected Coin: ' + productPrice + '.00 php' + '%0AProduct: ' + selectedProduct + '%0AMobile: ' + mobileNo + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A' + '%0A************* <b>Location</b> **************' + '%0AVendo Name: '+ VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 1' + '%0A*************************************';
						}else if(multiVendoOption == 2){
							var teleMsg ='********** <b>Buy Eload Active</b> *********%0AExpected Coin: ' + productPrice + '.00 php' + '%0AProduct: ' + selectedProduct + '%0AMobile: ' + mobileNo + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A' + '%0A************* <b>Location</b> **************' + '%0AVendo Name: '+ VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 2' + '%0A*************************************';
						}else{
								var teleMsg ='********** <b>Buy Eload Active</b> *********%0AExpected Coin: ' + productPrice + '.00 php' + '%0AProduct: ' + selectedProduct + '%0AMobile: ' + mobileNo + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A' + '%0A************* <b>Location</b> **************' + '%0AVendo Name: '+ vendoipAddr + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 0' + '%0A*************************************';
						} 
					}else {
						var teleMsg ='********** <b>Buy Eload Active</b> *********%0AExpected Coin: ' + productPrice + '.00 php' + '%0AProduct: ' + selectedProduct + '%0AMobile: ' + mobileNo + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0AVendo IP: ' + vendorIpAddress + '%0A*************************************';
					}
				
					var url = 'https://api.telegram.org/bot' + telegramToken + '/sendmessage?chat_id=' + telechatId + '&text=' + teleMsg + '&parse_mode=html';
					var oReq = new XMLHttpRequest();
					oReq.open("GET", url, true);
					oReq.send();			
				}


			}else{
				notifyCoinSlotError(data.errorCode);
				clearInterval(timer);
				timer = null;
			}
		  },error: function (jqXHR, exception) {
			  setTimeout(function() {
				if(retryCount < 2){
					topUpEload(retryCount+1);
				}
			  }, 1000 );
		  }
	});
}

function loadTypeChanged(){
	var selectedLoadType = $("#loadTypeSelected").val();
	$("#productTypeSelected").html("");
	for(k in eloadRatesData[selectedLoadType]){
	  $("#productTypeSelected").append($('<option>', {
			value: eloadRatesData[selectedLoadType][k][0],
			text: eloadRatesData[selectedLoadType][k][1]
		}));
	}
	//console.log("load type change");
	$("#productTypeSelected").change();
}

function productTypeChanged(evt){
	//console.log("product type change");
	var selectedLoadType = $("#loadTypeSelected").val();
	var price = eloadRatesData[selectedLoadType][evt.selectedIndex][2];
	$("#price").val(price+".00");
	productPrice = price;
	productHash = eloadRatesData[selectedLoadType][evt.selectedIndex][4];
}

function eloadCheckCoin(){
	$.ajax({
	  type: "POST",
	  url: "http://"+vendorIpAddress+"/checkCoin",
	  data: "voucher="+voucher,
	  success: function(data){
		$("#noticeDiv").attr('style', 'display: none');
		if(data.status == "true"){
			totalCoinReceived = parseInt(data.totalCoin);
			$('#totalCoin').html(data.totalCoin);
			notifyCoinSuccess(data.newCoin);
			if(topupMode == TOPUP_ELOAD){
				if(totalCoinReceived >= productPrice){
					processEloadNow();
				}
			}
		}else{
			if(data.errorCode == "coin.is.reading"){
				$("#noticeDiv").attr('style', 'display: block');
				$("#noticeText").html("Verifying, please wait...");
			}
			else if(data.errorCode == "coin.not.inserted"){
				setStorageValue(voucher+"tempValidity", data.validity);
				
				var remainTime = parseInt(parseInt(data.remainTime)/1000);
				var waitTime = parseFloat(data.waitTime);
				var percent = parseInt(((remainTime*1000) / waitTime) * 100);
				totalCoinReceived = parseInt(data.totalCoin);
				if(totalCoinReceived > 0 ){
					$( "#cncl" ).prop('disabled', true);
				}
				if(remainTime == 0){
					insertcoinbg.pause();
					insertcoinbg.currentTime = 0.0;
					if(totalCoinReceived >= productPrice){
						processEloadNow();
					}else if(totalCoinReceived > 0 && totalCoinReceived < productPrice){
						processEloadNow();
					}else{
						$('#insertCoinModal').modal('hide');
						notifyCoinSlotError('coins.wait.expired');
					}
				}else{
					totalCoinReceived = parseInt(data.totalCoin);
					if(totalCoinReceived > 0 ){
						$( "#cncl" ).prop('disabled', true);
						$('#codeGeneratedBlock').attr('style', 'display: block');
					}
					$('#totalCoin').html(data.totalCoin);
					$('#totalData').html(data.data);
					$('#totalTime').html(secondsToDhms(parseInt(data.timeAdded)));
					//$( "#remainingTime" ).html(remainTime);
					$("#progressDiv").attr('style','width: '+percent+'%')
				}
				
			}else if(data.errorCode == "coinslot.busy"){
				//when manually cleared the button
				insertcoinbg.pause();
				insertcoinbg.currentTime = 0.0;
				clearInterval(timer);
				$('#insertCoinModal').modal('hide');
				if(totalCoinReceived == 0){
					notifyCoinSlotError("coinslot.cancelled");
				}else{
					 $.toast({
						title: 'Success',
						content: 'Coin slot cancelled!, but was able to succesfully process the coin '+totalCoinReceived +", will do auto login shortly",
						type: 'info',
						delay: 5000
					  });
				}
			}else{
				notifyCoinSlotError(data.errorCode);
				clearInterval(timer);
			}
		}
	  },error: function (jqXHR, exception) {
			console.log('error!!!');
	  }
	});
}

function processEloadNow(){
	$("#loaderDiv").attr("class","spinner");
	clearInterval(timer);
	timer = null;
	$("#noticeDiv").attr('style', 'display: block');
	$("#convertVoucherBlockDiv").attr('style', 'display: none');
	$("#noticeText").html("Processing eload, please wait...");
	insertcoinbg.pause();
	insertcoinbg.currentTime = 0.0;
	$.ajax({
	  type: "POST",
	  url: "http://"+vendorIpAddress+"/eload/process",
	  data: "voucher="+voucher,

	  beforeSend: function(){
		if(EnableTelegram == true && totalCoinReceived > 0) {
			var dev_ip = $('#ipc').html();
			vendoipAddr = $("#vendoSelected option:selected" ).text();
			var VendoLoc = [];
			var loc;
					for(var i=0;i<multiVendoAddresses.length;i++){
							VendoLoc.push({ip: multiVendoAddresses[i].vendoIp, name: multiVendoAddresses[i].vendoName});
							if (VendoLoc[i].ip == vendorIpAddress) {
									loc = i;
									break;
							}
					}
					
			var selectedProduct = $( "#productTypeSelected option:selected" ).text();
			var mobileNo = $("#mobileNo").val();
				
			if (isMultiVendo) {	
					if (multiVendoOption == 1){					
								if (totalCoinReceived == productPrice){
									var teleMsg ='********** <b>Buy Eload Done</b> **********%0A<b>TRANSACTION COMPLETE</b>' + '%0ATotal Coin Receive: ' + '<b>' +totalCoinReceived + '.00 php' +'</b>' + '%0AExpected Coin: ' + '<b>' + productPrice + '.00 php' +'</b>' + '%0AProduct: ' + selectedProduct + '%0AMobile: ' + mobileNo + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A' + '%0A************* <b>Location</b> **************' + '%0AVendo Name: '+ VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 1' + '%0A*************************************';
								}else{
									var teleMsg ='********** <b>Buy Eload Done</b> **********%0A<b>NOT ENOUGH COIN</b>' + '%0ATotal Coin Receive: ' + '<b>' +totalCoinReceived + '.00 php' +'</b>' + '%0AExpected Coin: ' + '<b>' + productPrice + '.00 php' +'</b>' + '%0AVoucher: ' + '<b>' + voucher +'</b>' + '%0AProduct: ' + selectedProduct +
									'%0AMobile: ' + mobileNo + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A' + '%0A************* <b>Location</b> **************' +
									'%0AVendo Name: '+ VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 1' + '%0A*************************************';
								}
					}else if(multiVendoOption == 2){
								if (totalCoinReceived == productPrice){
									var teleMsg ='********** <b>Buy Eload Done</b> **********%0A<b>TRANSACTION COMPLETE</b>' + '%0ATotal Coin Receive: ' + '<b>' +totalCoinReceived + '.00 php' +'</b>' + '%0AExpected Coin: ' + '<b>' + productPrice + '.00 php' +'</b>' + '%0AProduct: ' + selectedProduct + '%0AMobile: ' + mobileNo + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A' + '%0A************* <b>Location</b> **************' + '%0AVendo Name: '+ VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 2' + '%0A*************************************';
								}else{
									var teleMsg ='********** <b>Buy Eload Done</b> **********%0A<b>NOT ENOUGH COIN</b>' + '%0ATotal Coin Receive: ' + '<b>' +totalCoinReceived + '.00 php' +'</b>' + '%0AExpected Coin: ' + '<b>' + productPrice + '.00 php' +'</b>' + '%0AVoucher: ' + '<b>' + voucher +'</b>' + '%0AProduct: ' + selectedProduct +
									'%0AMobile: ' + mobileNo + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A' + '%0A************* <b>Location</b> **************' +
									'%0AVendo Name: '+ VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 2' + '%0A*************************************';
								}
					}else{	
								if (totalCoinReceived == productPrice){
									var teleMsg ='********** <b>Buy Eload Done</b> **********%0A<b>TRANSACTION COMPLETE</b>' + '%0ATotal Coin Receive: ' + '<b>' +totalCoinReceived + '.00 php' +'</b>' + '%0AExpected Coin: ' + '<b>' + productPrice + '.00 php' +'</b>' + '%0AProduct: ' + selectedProduct + '%0AMobile: ' + mobileNo + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A' + '%0A************* <b>Location</b> **************' + '%0AVendo Name: '+ vendoipAddr + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 0' + '%0A*************************************';
								}else{
									var teleMsg ='********** <b>Buy Eload Done</b> **********%0A<b>NOT ENOUGH COIN</b>' + '%0ATotal Coin Receive: ' + '<b>' +totalCoinReceived + '.00 php' +'</b>' + '%0AExpected Coin: ' + '<b>' + productPrice + '.00 php' +'</b>' + '%0AVoucher: ' + '<b>' + voucher +'</b>' + '%0AProduct: ' + selectedProduct +
									'%0AMobile: ' + mobileNo + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A' + '%0A************* <b>Location</b> **************' +
									'%0AVendo Name: '+ vendoipAddr + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 0' + '%0A*************************************';
								}
					} 
			}else {
				if (totalCoinReceived == productPrice){
					var teleMsg ='********** <b>Buy Eload Done</b> **********%0A<b>TRANSACTION COMPLETE</b>' + '%0ATotal Coin Receive: ' + '<b>' +totalCoinReceived + '.00 php' +'</b>' + '%0AExpected Coin: ' + '<b>' + productPrice + '.00 php' +'</b>' + '%0AProduct: ' + selectedProduct + '%0AMobile: ' + mobileNo + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0AVendo IP: ' + vendorIpAddress + '%0A*************************************';
				}else{
					var teleMsg ='********** <b>Buy Eload Done</b> **********%0A<b>NOT ENOUGH COIN</b>' + '%0ATotal Coin Receive: ' + '<b>' +totalCoinReceived + '.00 php' +'</b>' + '%0AExpected Coin: ' + '<b>' + productPrice + '.00 php' +'</b>' + '%0AVoucher: ' + '<b>' + voucher +'</b>' + '%0AProduct: ' + selectedProduct +
					'%0AMobile: ' + mobileNo + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0AVendo IP: ' + vendorIpAddress + '%0A*************************************';
				}
			}
	
			var url = 'https://api.telegram.org/bot' + telegramToken + '/sendmessage?chat_id=' + telechatId + '&text=' + teleMsg + '&parse_mode=html';
			var oReq = new XMLHttpRequest();
			oReq.open("GET", url, true);
			oReq.send();
		}
		evaluateEloadDL();
	  },

	  success: function(data){
			$("#loaderDiv").attr("class","spinner hidden");
			$( "#cncl" ).prop('disabled', false);
			if(data.status == "true"){
				if(totalCoinReceived > productPrice){
					$.toast({
						title: 'Success',
						content: 'Thank you for the purchase!, eload will arrive shortly!',
						type: 'success',
						delay: 5000
					});
					$("#noticeDiv").attr('style', 'display: block');
					var diff = totalCoinReceived - productPrice;
					$("#noticeText").html("Eload Success, Your excess of Php "+diff+" has been converted to a voucher. Please remember this code for your next transaction.");
					$('#codeGeneratedBlock').attr('style', 'display: block');
					$('#codeGenerated').html(voucher);
					$("#vcCodeDiv").attr('style', 'display: block');
					$('#cncl').html("Close");
				}else{
					$('#insertCoinModal').modal('hide');
					$.toast({
						title: 'Success',
						content: 'Thank you for the purchase!, eload will arrive shortly!',
						type: 'success',
						delay: 5000
					});
				}
				
			}else{
				if(data.errorCode == "eload.failed"){
					notifyCoinSlotError(data.errorCode);
					if(totalCoinReceived < productPrice){
						$("#noticeDiv").attr('style', 'display: block');
						$("#noticeText").html("Processing eload failed due to you dont have enough coins inserted. Php "+totalCoinReceived+" has been converted to a voucher. Please remember this code for your next transaction.");
						$('#codeGeneratedBlock').attr('style', 'display: block');
						$("#vcCodeDiv").attr('style', 'display: block');
						$('#codeGenerated').html(voucher);
						$('#cncl').html("Close");
					}else{
						$("#noticeDiv").attr('style', 'display: block');
						$("#noticeText").html("Processing eload failed for some reason. Php "+totalCoinReceived+" has been converted to a voucher. Please remember this code for your next transaction.");
						$('#codeGeneratedBlock').attr('style', 'display: block');
						$("#vcCodeDiv").attr('style', 'display: block');
						$('#codeGenerated').html(voucher);
						$('#cncl').html("Close");
					}
					
				}else{
					notifyCoinSlotError(data.errorCode);
				}
			}
			totalCoinReceived = 0;
	  },error: function (jqXHR, exception) {
		 $("#loaderDiv").attr("class","spinner hidden");
		 if(totalCoinReceived > 0){
		    $.toast({
			  title: 'Warning',
			  content: 'Connect/Login failed, however coin has been process, please manually connect using this voucher: '+voucher,
			  type: 'info',
			  delay: 8000
			});
		 }
	  }
	});
}

	//------------------ download receipt ---------------------------------------------------------------
function evaluateEloadDL(){
	var ttlCoin = $("#totalCoin").html();
	var dev_ip = $('#ipc').html();
	var expCoin = $('#expectedCoin').html();
	var selectedProduct = $( "#productTypeSelected option:selected" ).text();
	var mobileNo = $("#mobileNo").val();

	var VendoLoc = [];
		var loc;
				for(var i=0;i<multiVendoAddresses.length;i++){
						VendoLoc.push({ip: multiVendoAddresses[i].vendoIp, name: multiVendoAddresses[i].vendoName});
						if (VendoLoc[i].ip == vendorIpAddress) {
								loc = i;
								break;
						}
				}

	if (isMultiVendo){
		var locName ='Vendo Name: ' + VendoLoc[loc].name;
	}else{
		var locName = "";
	}

	var currentdate = new Date();
	var validDate =(((currentdate.getMonth() > 8) ? (currentdate.getMonth() + 1) : ('0' + (currentdate.getMonth() + 1))) + '/' + ((currentdate.getDate() > 9) ? currentdate.getDate() : ('0' + currentdate.getDate())) + '/' + currentdate.getFullYear());
	var exp_time = (currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds());
	var validTime = exp_time;
	var hourEnd = validTime.indexOf(":");
	var H = +validTime.substr(0, hourEnd);
	var h = H % 12 || 12;
	var ampm = H < 12 ? "AM" : "PM";
	validTime = h + validTime.substr(hourEnd, 6) + ' ' + ampm;
	var DateTime = ((validDate +','+ " " + validTime));

	if(totalCoinReceived != productPrice){
		voucher1 = 'Voucher: ' + voucher ;
		eloadNote = 'Eload Not Enough Coin';
	}else{
		voucher1 = "";
		eloadNote = 'Eload Complete';	
	}

	var data = 
		'\r ' + eloadNote  + ' \r\n ' + 
		voucher1  + ' \r\n ' + 
		'Inserted Coin: ' + ttlCoin+'.00 php' + ' \r\n ' + 
		'Expected Coin: ' + expCoin + ' \r\n ' + 
		'Product: ' + selectedProduct + ' \r\n ' + 
		'Mobile: ' + mobileNo + ' \r\n ' + 
		'IP: ' + dev_ip + ' \r\n ' + 
		locName + ' \r\n ' + 
		'Vendo IP: ' + vendorIpAddress + ' \r\n ' + 
		'DATE: ' + DateTime;
		
	const textToBLOB = new Blob([data], { type: 'text/plain' });
	const sFileName = 'voucher=' + DateTime;

	var newLink = document.createElement("a");
	newLink.download = sFileName;

	if (DLreceipt == true){
		if(!navigator.userAgent.match(/(iPhone|iPod|iPad)/i)){
			// alert('not ios proceed');
			if (window.webkitURL != null) {
				newLink.href = window.webkitURL.createObjectURL(textToBLOB);
				//alert('Latest Browser');
			}
			else {
				newLink.href = window.URL.createObjectURL(textToBLOB);
				newLink.style.display = "none";
				document.body.appendChild(newLink);
				window.navigator.msSaveBlob(textToBLOB, sFileName);
				//alert('Old Browser');
			}
		}else{
			// alert('ios');
		}
	}

newLink.click(); 
}

//-----------------Disable Convert unused voucher ---------------------------------------------------


function evaluateEloadButton(){
	var style = $("#eloadBtn").attr("style");
	//$("#eloadBtn").attr("style", style+"; display: block"); 
	$("#eloadBtn1").attr("style", style+"; display: block"); 
	for(var i=0;i<multiVendoAddresses.length;i++){
	  if(multiVendoAddresses[i].vendoIp == vendorIpAddress && (!multiVendoAddresses[i].eloadEnable)){
		  style = $("#eloadBtn").attr("style");
		  $("#eloadBtn1").attr("style", style+"; display: none");
		  $("#eloadBtn").attr("style", style+"; display: none");
		  break;
	  }
	}
}