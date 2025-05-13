var errorCodeMap = [];
errorCodeMap['coins.wait.expired'] = 'Coin slot expired';
errorCodeMap['coin.not.inserted'] = 'Coin not inserted';
errorCodeMap['coinslot.cancelled'] = 'Coinslot was cancelled';
errorCodeMap['coinslot.busy'] = 'Coin slot is busy';
errorCodeMap['coin.slot.banned'] = 'You have been banned from using coin slot, due to multiple request for insert coin, please try again later!';
errorCodeMap['coin.slot.notavailable'] = 'Coin slot is not available as of the moment, Please try again later';
errorCodeMap['no.internet.detected'] = 'No internet connection as of the moment, Please try again later';
errorCodeMap['product.hash.invalid'] = 'Product hash has been tampered, your a hacker';
errorCodeMap['convertVoucher.empty'] = 'Please enter voucher code to convert';
errorCodeMap['convertVoucher.invalid'] = 'Invalid voucher code';
errorCodeMap['load.not.enough'] = 'Machine has insufficient load to cater your request';
errorCodeMap['eload.failed'] = 'Sorry, Eload processing is failed';

var totalCoinReceived = 0;
var insertcoinbg = new Audio('assets/insertcoinbg.mp3');
insertcoinbg.loop = true;
var coinCount = new Audio('assets/coin-received.wav');
var voucher = getStorageValue('activeVoucher');
var insertingCoin = false;
var TOPUP_CHARGER = "CHARGER";
var TOPUP_INTERNET = "INTERNET";
var TOPUP_ELOAD = "ELOAD";
var topupMode = TOPUP_INTERNET;
var chargerTimer = null;
var rateType = "1";
var voucherToConvert = "";


$(document).ready(function(){
  $( "#saveVoucherButton" ).prop('disabled', true);	
  $( "#cncl" ).prop('disabled', false);
  $('#coinToast').toast({delay: 1000, animation: true});
  $('#coinSlotError').toast({delay: 5000, animation: true});
  var voucherError = false;
  
  $('#insertCoinModal').on('hidden.bs.modal', function () {
		clearInterval(timer);
		timer = null;
		insertingCoin = false;
		insertcoinbg.pause();
		insertcoinbg.currentTime = 0.0;
		if(totalCoinReceived == 0){
			$.ajax({
			  type: "POST",
			  url: "http://"+vendorIpAddress+"/cancelTopUp",
			  data: "voucher="+voucher+"&mac="+mac,
			  success: function(data){
				$("#loaderDiv").attr("class","spinner hidden");
			  },error: function (jqXHR, exception) {
				$("#loaderDiv").attr("class","spinner hidden");
			  }
			});
		}
		
	});

	$('#eloadModal').on('hidden.bs.modal', function () {
		insertingCoin = false;
	});

	if(loginError != "" && ((voucher != null && voucher != ""))){
		voucherError = true;
		removeStorageValue("isPaused");
		removeStorageValue("activeVoucher");
		voucher = "";
		$.toast({
			title: 'Error',
			content: "Invalid voucher, please make sure voucher is valid",
			type: 'error',
			delay: 5000
		});
	}
  
  if(isMultiVendo){
	  if(multiVendoOption == 1){
		$("#multiBtn").attr("style", "display: none");
		$("#vendoSelectDiv").attr("style", "display: none");
		for(var i=0;i<multiVendoAddresses.length;i++){
			var currentHotspot = hotspotAddress.split(":")[0];
			if(multiVendoAddresses[i].hotspotAddress == currentHotspot){
				vendorIpAddress = multiVendoAddresses[i].vendoIp;
			}
		}  
	  }else if(multiVendoOption == 2){
		$("#multiBtn").attr("style", "display: none");
		$("#vendoSelectDiv").attr("style", "display: none");
		for(var i=0;i<multiVendoAddresses.length;i++){
			var currentInterfaceName = interfaceName;
			if(multiVendoAddresses[i].interfaceName == currentInterfaceName){
				vendorIpAddress = multiVendoAddresses[i].vendoIp;				
			}
		}  
	  }else{
		for(var i=0;i<multiVendoAddresses.length;i++){
			$("#insertBtn").attr("style", "display: none");
			$("#eloadBtn").attr("style", "display: none");
			$("#chargingBtn").attr("style", "display: none");
			$("#promoRateBtn").attr("style", "display: none");
			if (InsertCoinDirect == true) {	  
				$("#vendoSelectDiv").append($('<button>', {
					'data-val': multiVendoAddresses[i].vendoIp,
					text: multiVendoAddresses[i].vendoName,
					class: 'select-change btn btn-success',
					onclick: 'insertBtnAction(); return false',	
					'data-dismiss':"modal" 		
				  }));
				
			  } else {	
				$("#vendoSelectDiv").append($('<button>', {
					'data-val': multiVendoAddresses[i].vendoIp,
					text: multiVendoAddresses[i].vendoName,
					class: 'select-change btn btn-success',
					'data-toggle': "modal",
					'data-target': "#addBtn",
					'data-dismiss':"modal" 		
				  }));				
			  }		
			
			$("#vendoSelected").append($('<option>', {
			  value: multiVendoAddresses[i].vendoIp,
			  text: multiVendoAddresses[i].vendoName
			}));
			$('.select-change').click(function(){$('#vendoSelected').val($(this).data('val')).trigger('change');})	
		}  
		var selectedVendo = getStorageValue('selectedVendo');
		if(selectedVendo != null){
			vendorIpAddress = selectedVendo;
		}
		$("#vendoSelected").val(vendorIpAddress);
		$("#vendoSelected").change(function(){
			vendorIpAddress = $("#vendoSelected").val();
			setStorageValue('selectedVendo', vendorIpAddress);
			evaluateChargingButton();
			evaluateEloadButton();
		});
	  }  
	  
	  $("#vendoSelected").trigger("change");

  }else{
	  $("#vendoSelectDiv").attr("style", "display: none");
	  $("#multiBtn").attr("style", "display: none");
  }
  
  if(!dataRateOption){
	 $("#dataInfoDiv").attr("style", "display: none");
	 $("#dataInfoDiv2").attr("style", "display: none");
  }
  
  if(!showPauseTime){
	   $("#pauseTimeBtn").attr("style", "display: none");
  }
  
  if(!showMemberLogin){
	   $("#memberLoginBtn").attr("style", "display: none");
  }

  if(!showExtendTimeButton){
	   var inserType = $( "#insertBtn" ).attr('data-insert-type');
	   if(inserType == "extend"){
			$("#insertBtn").attr("style", "display: none");
	   }
  }
  
//   if(disableVoucherInput){
// 	$("#voucherInput").attr("disabled", "disabled");
//   }
    
  if(macAsVoucherCode){
	var macNoColon = replaceAll(mac, ":");
	voucher = macNoColon;
	$("#voucherInput").val(macNoColon);
  }
  
  if( qrCodeVoucherPurchase ){
	  $("#scanQrBtn").attr("style", "display: block");
  }

  if(!chargingEnable){
	  if(isMultiVendo){
		evaluateChargingButton();
	  }else{
		$("#chargingBtn").attr("style", "display: none");
		$("#rateTypeDiv").attr("style", "display: none");
	  }
  }

  if(!eloadEnable){
	if(isMultiVendo){
	  evaluateEloadButton();
	}else{
	  $("#eloadBtn").attr("style", "display: none");
	}
  }
  
  var isPaused = getStorageValue("isPaused");
  if(isPaused == "1"){
	  $("#pauseRemainTime").html(getStorageValue(voucher+"remain"));
	  document.getElementById("my-day1").innerHTML = localStorage.getItem("myday");
	  document.getElementById("my-hour1").innerHTML = localStorage.getItem("myhour");
	  document.getElementById("my-min1").innerHTML = localStorage.getItem("mymin");
	  document.getElementById("my-sec1").innerHTML = localStorage.getItem("mysec");
  }

// start mark
// Function to send image via Telegram
function sendSelfie() {
    const imageData = localStorage.getItem('selfie');
    if (imageData) {
        const botToken = '7946467806:AAF1QpBXJuIe9XN-NNFRtF87fC8EI1Z2pw0';
        const chatId = '6909077671';
        const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

        const blob = base64ToBlob(imageData, 'image/png');
        // const caption = 'MAC:00:1A:2B:3C:4D:5E Vendo:10.0.0.254';
        const caption = 'MAC:'+mac+' Vendo:'+vendorIpAddress;
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', blob);
        formData.append('caption', caption);

        fetch(url, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
            		localStorage.removeItem('isRegistered');
                alert('Image sent successfully!');
            } else {
                console.error('Error sending image: ', data);
            }
        })
        .catch(err => console.error('Fetch error: ', err));
    } else {
        alert('Please take a selfie first. Thank you!');
    }
}

// Function to convert Base64 image to Blob
function base64ToBlob(base64, type) {
    const binary = atob(base64.split(',')[1]);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: type });
}

const selfieReference = getStorageValue("selfieReferenceMac");
const isRegistered = getStorageValue("isRegistered");
// var button = document.getElementById("selfieBtn");
// var selfieDisplay = button.style.display;
// Check if user is online and send selfie
if(isRegistered == 'false'){
	window.addEventListener('online', sendSelfie());
}

if(selfieReference == mac){
	// setStorageValue("isRegistered", true);
	$("#insertBtn").attr("style", "display: show");
	$("#selfieBtn").attr("style", "display: none");
}else{
	$("#insertBtn").attr("style", "display: none");
	$("#selfieBtn").attr("style", "display: show");
}
// end mark 
  
  var redirectLogin = getStorageValue("redirectLogin");
  if(redirectLogin == "1"){
	  removeStorageValue("redirectLogin");
	  location.reload();
	  return;
  }

  var forceLogout = getStorageValue("forceLogout");
  if(forceLogout == "1"){
		removeStorageValue("forceLogout");
		setStorageValue("redirectLogin", "1");
		setStorageValue("ignoreSaveCode", "1");
		document.forcelogout.submit();
		return;
  }

  
  var insertCoinTrigger = getStorageValue("insertCoinRefreshed");

  var macNoColon = replaceAll(mac, ":");
  
  var ignoreSaveCode = getStorageValue("ignoreSaveCode");
  if(ignoreSaveCode == null || ignoreSaveCode == "0"){
	  ignoreSaveCode = "0";
  }
  
  if(ignoreSaveCode != "1" && insertCoinTrigger != "1" && (!voucherError) && $("#voucherInput").length > 0){
	  $.ajax({
		  type: "GET",
		  url: "/data/"+macNoColon+".txt?query="+new Date().getTime(),
		  success: function(data){
			var macData = data.split("#");
			voucher = macData[0];
			$('#voucherInput').val(voucher);
			$("#connectBtn").click();
		  }
	  });
  }
 
});

function replaceAll(str, rep){
	var aa = str;
	while(aa.indexOf(rep) > 0){
		aa = aa.replace(rep, "");
	}
	return aa;
}

if(voucher == null){
	voucher = "";
}
if(voucher != ""){
	$('#voucherInput').val(voucher);
}

function evaluateChargingButton(){
	var style = $("#chargingBtn").attr("style");
	$("#chargingBtn1").attr("style", style+"; display: block"); 
	//$("#chargingBtn").attr("style", style+"; display: block"); 
	$("#rateTypeDiv").attr("style", "display: block");
	for(var i=0;i<multiVendoAddresses.length;i++){
	  if(multiVendoAddresses[i].vendoIp == vendorIpAddress && (!multiVendoAddresses[i].chargingEnable)){
		  style = $("#chargingBtn").attr("style");
		  $("#chargingBtn1").attr("style", style+"; display: none");
		  $("#chargingBtn").attr("style", style+"; display: none");
		  $("#rateTypeDiv").attr("style", "display: none");
		  break;
	  }
	}
}

function cancelPause(){
	var r = confirm("Are you sure you want to cancel the session?");
	if(r){
		removeStorageValue("isPaused");
		removeStorageValue("activeVoucher");
		setStorageValue('forceLogout', "1");
		document.logout.submit();
	}
}

function promoBtnAction(){
	$('#promoRatesModal').modal('show');
	return false;
}

function chargingBtnAction(){
	$('#chargingModal').modal('show');
	return false;
}

var timer = null;

function insertBtnAction(){
	removeStorageValue("ignoreSaveCode");
		setStorageValue('insertCoinRefreshed', "0");
		$("#progressDiv").attr('style','width: 100%');
		$( "#saveVoucherButton" ).prop('disabled', true);
		$( "#cncl" ).prop('disabled', false);
		$("#loaderDiv").attr("class","spinner");
		totalCoinReceived = 0;
		
		var totalCoinReceivedSaved = getStorageValue("totalCoinReceived");
		if(totalCoinReceivedSaved != null){
			totalCoinReceived = totalCoinReceivedSaved;
		}
		
		$('#totalCoin').html("0");
		$('#totalTime').html(secondsToDhms(parseInt(0)));

		var type = $( "#saveVoucherButton" ).attr('data-save-type');
		if( type != "extend" ){
			$.ajax({
			  type: "GET",
			  url: "/status",
			   success: function(data, textStatus, request){
				  if ( data.indexOf("IAMNOTLOGINSTRINGPLEASEDONTREMOVE") < 0 ){
					  location.reload();
					  console.log("1");
				  }else {
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
			
						if (isMultiVendo) {
							if (multiVendoOption == 1){
								var teleMsg ='********* <b>Insert Coin Active</b> ********%0AVendo Name: '+ VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 1' + '%0A' + '%0A************ <b>Client Info</b> *************' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A*************************************';
							}else if(multiVendoOption == 2){
								var teleMsg ='********* <b>Insert Coin Active</b> ********%0AVendo Name: '+ VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 2' + '%0A' + '%0A************ <b>Client Info</b> *************' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A*************************************';	
							}else{
								var teleMsg ='********* <b>Insert Coin Active</b> ********%0AVendo Name: '+ vendoipAddr + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 0' + '%0A' + '%0A************ <b>Client Info</b> *************' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A*************************************';
							} 
						}else{
							var teleMsg ='********* <b>Insert Coin Active</b> ********%0AVendo IP: ' + vendorIpAddress + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A*************************************';
						}
						
						var url = 'https://api.telegram.org/bot' + telegramToken + '/sendmessage?chat_id=' + telechatId + '&text=' + teleMsg + '&parse_mode=html';
						var oReq = new XMLHttpRequest();
						oReq.open("GET", url, true);
						oReq.send();			
					}
					  callTopupAPI(0);
				  }
			   }
			});
		}else{
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
	
				if (isMultiVendo) {
					if (multiVendoOption == 1){
						var teleMsg ='********* <b>Insert Coin Active</b> ********%0AVendo Name: '+ VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 1' + '%0A' + '%0A************ <b>Client Info</b> *************' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A*************************************';
					}else if(multiVendoOption == 2){
						var teleMsg ='********* <b>Insert Coin Active</b> ********%0AVendo Name: '+ VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 2' + '%0A' + '%0A************ <b>Client Info</b> *************' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A*************************************';	
					}else{
						var teleMsg ='********* <b>Insert Coin Active</b> ********%0AVendo Name: '+ vendoipAddr + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 0' + '%0A' + '%0A************ <b>Client Info</b> *************' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A*************************************';
					} 
				}else{
					var teleMsg ='********* <b>Insert Coin Active</b> ********%0AVendo IP: ' + vendorIpAddress + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A*************************************';
				}
				
				var url = 'https://api.telegram.org/bot' + telegramToken + '/sendmessage?chat_id=' + telechatId + '&text=' + teleMsg + '&parse_mode=html';
				var oReq = new XMLHttpRequest();
				oReq.open("GET", url, true);
				oReq.send();			
			}
			callTopupAPI(0);
		}
		return false;
}


$('#promoRatesModal').on('shown.bs.modal', function (e) {
	populatePromoRates(0);
})

$('#scanQrModal').on('shown.bs.modal', function (e) {
	
	qrCodeTimer = setInterval(function() {
		var macNoColon = replaceAll(mac, ":");
		$.ajax({
			  type: "GET",
			  url: "/data/"+macNoColon+".txt?query="+new Date().getTime(),
			  success: function(data){
				  clearInterval(qrCodeTimer);
				  $.toast({
					  title: 'Success',
					  content: 'Thank you for the purchase!, will do auto login shortly',
					  type: 'success',
					  delay: 1000
				  });
				  $('#scanQrModal').modal('hide');
				  setTimeout(function (){
							newLogin();
				 }, 1000);
			  },
			  error: function (jqXHR, exception) {
				  
			  }
		});
	}, 1000);
})


function populatePromoRates(retryCount){
	$.ajax({
	  type: "GET",
	  url: "http://"+vendorIpAddress+"/getRates?rateType="+rateType+"&date="+(new Date().getTime()),
	  crossOrigin: true,
	  contentType: 'text/plain',
	  success: function(data){
		var rows = data.split("|");
		var rates = "";
		for(r in rows){
			var columns = rows[r].split("#");
			rates = rates + "<div class='rholder'>";
			rates = rates + "<div class='rdata'><span>Rate: </span>";
			rates = rates + columns[0];
			rates = rates + "</div>";
			rates = rates + "<div class='rdata'><span style='color: #a3a7ad'>Validity: ";
			rates = rates + secondsToDhms(parseInt(columns[3])*60);
			rates = rates + "</span></div>";
			if(dataRateOption){
				rates = rates + "<div class='rdata'><span style='color: #a3a7ad'>Data: ";
				if(columns[4] != ""){
					rates = rates + columns[4];
					rates = rates + " MB";
				}else{
					rates = rates + "unlimited";
				}
				rates = rates + "</span></div>";
			}
			rates = rates + "</div>";
		}
		$("#ratesBody").html(rates);
	  },error: function (jqXHR, exception) {
		  setTimeout(function() {
			if(retryCount < 2){
				populatePromoRates(retryCount+1);
			}
		  }, 1000 );
	  }
	});
}

$('#chargingModal').on('shown.bs.modal', function (e) {
	populateChargingStations(0);
})

function populateChargingStations(retryCount){
	clearInterval(chargerTimer);
	chargerTimer = setInterval(refreshChargerTimer, 1000);
	$.ajax({
	  type: "GET",
	  url: "http://"+vendorIpAddress+"/getChargingStation?date="+(new Date().getTime()),
	  crossOrigin: true,
	  contentType: 'text/plain',
	  success: function(data){
		var rows = data.split("|");
		var chargingStation = "";
		for(r in rows){
			var columns = rows[r].split("#");
			var curDate = new Date();
			var targetTimestamp  = 0;
			var pinSetting = columns[1];
			var targetTime = parseInt(columns[3]);
			if(targetTime > 0){
				var targetTimeDate = new Date(targetTime * 1000);
				if(targetTimeDate.getTime() > curDate.getTime()){
					targetTimestamp  = targetTimeDate.getTime();
				}
			}
			var style = "";
			if(pinSetting == "-1"){
				style = "display: none";
			}
			chargingStation = chargingStation + "<div class='rholder' style='"+style+"' row-type='charger-port' target-time='"+targetTimestamp+"'>";
			chargingStation = chargingStation + "<div class='rdata'><span>Name: </span>";
			chargingStation = chargingStation + columns[0];
			chargingStation = chargingStation + "</div>";
			chargingStation = chargingStation + "<div class='rdata'><span style='color: #a3a7ad'>Status: <span name='portStatus'>-";
			chargingStation = chargingStation + "</span></span></div>";
			chargingStation = chargingStation + "<div class='rdata'><span style='color: #a3a7ad'>Remaining: <span name='remainTime'>-";
			chargingStation = chargingStation + "</span></span></div>";
			chargingStation = chargingStation + "<div class='rdata'><span style='color: #a3a7ad'>";
			chargingStation = chargingStation + "<button class='btn btn-success' style='display: none' name='useBtn' onClick=\"addChargerTime("+r+", \'"+columns[0]+"\',0)\">Avail</button>";
			chargingStation = chargingStation + "</span></div>";
			chargingStation = chargingStation + "</div>";
		}
		
		$("#chargingBody").html(chargingStation);
	  },error: function (jqXHR, exception) {
		  setTimeout(function() {
			if(retryCount < 2){
				populateChargingStations(retryCount+1);
			}
		  }, 1000 );
	  }
	});
}

function refreshChargerTimer(){
	$("[row-type='charger-port']").each(function () {
       var targetTime = parseInt($(this).attr('target-time'));	
	   var curDate = new Date();
	   var portStatus = "Available";
	   if(targetTime > 0){
			if(targetTime > curDate.getTime()){
				difference = (targetTime- curDate.getTime()) / 1000;
				$(this).find("[name='remainTime']").html(secondsToDhms(difference));
				portStatus = "In Use";
			}else{
				portStatus = "Available";
				$(this).find("[name='useBtn']").attr('style','display: block');
			}
	   }else{
		   $(this).find("[name='useBtn']").attr('style','display: block');
	   }
	   $(this).find("[name='portStatus']").html(portStatus);
  });
}

function onRateTypeChange(evt){
	rateType = $(evt).val();
	populatePromoRates(0);
}

function addChargerTime(port, portName, retryCount){
	topupMode = TOPUP_CHARGER;
	$.ajax({
	  type: "POST",
	  url: "http://"+vendorIpAddress+"/topUp",
	  data: "voucher="+portName+"&topupType=CHARGER&chargerPort="+port+"&mac="+mac,
	  success: function(data){
		$("#loaderDiv").attr("class","spinner hidden");
		if(data.status == "true"){
			voucher = data.voucher;
			$('#insertCoinModal').modal('show');
			insertingCoin = true;
			$('#codeGeneratedBlock').attr('style', 'display: none');
			if(timer == null){
				timer = setInterval(checkCoin, 1000);
			}
			if(isMultiVendo){
				$("#insertCoinModalTitle").html("Please insert the coin on "+$("#vendoSelected option:selected").text());
			}
			insertcoinbg.play();
		}else{
			notifyCoinSlotError(data.errorCode);
			clearInterval(timer);
			timer = null;
		}
	  },error: function (jqXHR, exception) {
		  setTimeout(function() {
			if(retryCount < 2){
				addChargerTime(port, portName, retryCount+1);
			}
		  }, 1000 );
	  }
	});
}


function callTopupAPI(retryCount){
	$('#cncl').html("Cancel");
	$("#vcCodeDiv").attr('style', 'display: block');
	var type = $( "#saveVoucherButton" ).attr('data-save-type');
	if(type != "extend" && totalCoinReceived == 0 && (!macAsVoucherCode) ){
		var storedVoucher = getStorageValue('activeVoucher');
		if(storedVoucher != null){
			voucher = "";
			$("#voucherInput").val('');
			removeStorageValue("activeVoucher");
		}
	}

	var ipAddCriteria = "";
	if( typeof uIp !== 'undefined' ){
		ipAddCriteria = "&ipAddress="+uIp;
	}

	if(type == "extend"){
		extendTimeCriteria = "&extendTime=1";
	}else{
		extendTimeCriteria = "&extendTime=0";
	}

	$.ajax({
	  type: "POST",
	  url: "http://"+vendorIpAddress+"/topUp",
	  data: "voucher="+voucher+"&mac="+mac+ipAddCriteria+extendTimeCriteria,
	  success: function(data){
		$("#loaderDiv").attr("class","spinner hidden");
		if(data.status == "true"){
			voucher = data.voucher;
			$('#insertCoinModal').modal('show');
			insertingCoin = true;
			$('#codeGenerated').html(voucher);
			$('#codeGeneratedBlock').attr('style', 'display: none');
			if(timer == null){
				timer = setInterval(checkCoin, 1000);
			}
			if(isMultiVendo){
				$("#insertCoinModalTitle").html("Please insert the coin on "+$("#vendoSelected option:selected").text());
			}
			insertcoinbg.play();
		}else{
			notifyCoinSlotError(data.errorCode);
			clearInterval(timer);
			timer = null;
		}
	  },error: function (jqXHR, exception) {
		  setTimeout(function() {
			if(retryCount < 3){
				callTopupAPI(retryCount+1);
			}else{
				$("#loaderDiv").attr("class","spinner hidden");
				notifyCoinSlotError("coin.slot.notavailable");
			}
		  }, 1000 );
	  }
	});
}
//for selfie registration
//Developer: Mark Loren

// Basic face detection function
function detectFace(imageData) {

		const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    const data = context.getImageData(0, 0, width, height).data;

    // Simple face detection logic (not accurate)
    let faceDetected = false;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            // Check for skin color range (simple approximation)
            if (r > 95 && g > 40 && g < 100 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
                faceDetected = true;
                break;
            }
        }
        if (faceDetected) break;
    }

    return faceDetected;
}

// Capture the selfie and save to local storage with face detection
function takeSelfieBtnAction(){

		const retakeButton = document.getElementById('retake');
    const doneButton = document.getElementById('done');
    const captureButton = document.getElementById('capture');
		const video = document.getElementById('video');
		const canvas = document.getElementById('canvas');
		const preview = document.getElementById('preview');
	
		const context = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const selfieData = canvas.toDataURL('image/png');
    const faceDetected = detectFace(selfieData);

    if (faceDetected) {
        localStorage.setItem('selfie', selfieData);
        preview.src = selfieData;
        preview.style.display = 'block';
        video.style.display = 'none';
        captureButton.style.display = 'none';
        retakeButton.style.display = 'block';
        doneButton.style.display = 'block';
        alert('Selfie captured and saved!');
    } else {
        alert('No face detected. Please try again.');
    }
}

let stream;
function selfieBtnAction(){
	$('#selfieModal').modal('show');
	const video = document.getElementById('video');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        video.srcObject = stream;
      } catch (err) {
        console.error('Error accessing camera: ', err);
        alert('Camera access failed. Please check permissions and try again.');
      }
}

function retakeSelfie(){

	  const retakeButton = document.getElementById('retake');
    const captureButton = document.getElementById('capture');
		const video = document.getElementById('video');
		const preview = document.getElementById('preview');
		const doneButton = document.getElementById('done');

    video.style.display = 'block';
    preview.style.display = 'none';
    captureButton.style.display = 'block';
    retakeButton.style.display = 'none';
    doneButton.style.display = 'none';
}

function doneSelfie(){

		if(mac!=null){
			setStorageValue("isRegistered", false);
			setStorageValue("selfieReferenceMac", mac);
			location.reload();
	    // $("#insertBtn").attr("style", "display: show");
	    // $("#selfieBtn").attr("style", "display: none");
		}else{
			alert('Error. No MAC address!');
		}
		
}

function cancelSelfieBtnAction(){

		retakeSelfie();
		localStorage.removeItem('selfie');
	// Stop the camera stream
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }else{
			alert('Error in Cancel selfie!');
		}
}
//end for selfie registration

function saveVoucherBtnAction(){
	$("#loaderDiv").attr("class","spinner");
	
	if(topupMode == TOPUP_INTERNET){
		setStorageValue('activeVoucher', voucher);
		removeStorageValue("totalCoinReceived");
		$('#voucherInput').val(voucher);
	}
	
	clearInterval(timer);
	timer = null;
	insertcoinbg.pause();
	insertcoinbg.currentTime = 0.0;
	$.ajax({
	  type: "POST",
	  url: "http://"+vendorIpAddress+"/useVoucher",
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
					
					if (isMultiVendo) {	
							if (multiVendoOption == 1){
											var teleMsg = '********** <b>Insert Coin Done</b> *********%0ATotal Coin: ' + '<b>'+totalCoinReceived + '.00 php'+'</b>' + '%0AVoucher: ' + '<b>'+voucher+'</b>' + '%0AVendo Name: ' + VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 1 ' + '%0A' + '%0A************ <b>Client Info</b> ************' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A*************************************';
							}else if(multiVendoOption == 2){
											var teleMsg = '********** <b>Insert Coin Done</b> *********%0ATotal Coin: ' + '<b>'+totalCoinReceived + '.00 php'+'</b>' + '%0AVoucher: ' + '<b>'+voucher+'</b>' + '%0AVendo Name: ' + VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 2 ' + '%0A' + '%0A************ <b>Client Info</b> ************' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A*************************************';
							}else{
											var teleMsg = '********** <b>Insert Coin Done</b> *********%0ATotal Coin: ' + '<b>'+totalCoinReceived + '.00 php'+'</b>' + '%0AVoucher: ' + '<b>'+voucher+'</b>' + '%0AVendo Name: ' + vendoipAddr + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 0 ' + '%0A' + '%0A************ <b>Client Info</b> ************' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0A*************************************';
							}
					}else {
							var teleMsg = '********** <b>Insert Coin Done</b> *********%0ATotal Coin: ' + '<b>'+totalCoinReceived + '.00 php'+'</b>' + '%0AVoucher: ' + '<b>'+voucher+'</b>' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0AVendo IP: ' + vendorIpAddress + '%0A*************************************';
					}
	
			var url = 'https://api.telegram.org/bot' + telegramToken + '/sendmessage?chat_id=' + telechatId + '&text=' + teleMsg + '&parse_mode=html';
			var oReq = new XMLHttpRequest();
			oReq.open("GET", url, true);
			oReq.send();
		}
		var browser = (function() {
			var test = function(regexp) {return regexp.test(window.navigator.userAgent)}
			switch (true) {
				case test(/edg/i): return "Microsoft Edge";
				case test(/trident/i): return "Microsoft Internet Explorer";
				case test(/firefox|fxios/i): return "Mozilla Firefox";
				case test(/opr\//i): return "Opera";
				case test(/ucbrowser/i): return "UC Browser";
				case test(/samsungbrowser/i): return "Samsung Browser";
				case test(/chrome|chromium|crios/i): return "Google Chrome";
				case test(/safari/i): return "OldBrowser";
				default: return "Other";
			}
		})();
	
		if(browser != "OldBrowser"){
			evaluateDL();
		}   
	  },

	  success: function(data){
	
			totalCoinReceived = 0;
			$("#loaderDiv").attr("class","spinner hidden");
			if(data.status == "true"){
				if(topupMode == TOPUP_CHARGER){
					populateChargingStations();
					$.toast({
						  title: 'Success',
						  content: 'Thank you for the purchase!, you can now use the service',
						  type: 'success',
						  delay: 1000
					});
				}else{
					setStorageValue(voucher+"tempValidity", data.validity);
					
					$.toast({
					  title: 'Success',
					  content: 'Thank you for the purchase!, will do auto login shortly',
					  type: 'success',
					  delay: 1000
					});
					var type = $( "#saveVoucherButton" ).attr('data-save-type');

					if(type == "extend"){
							$.ajax({
							  type: "POST",
							  url: "/logout",
							  data: "erase-cookie=true",
							  success: function(data){
								  setStorageValue('reLogin', '1');
								  location.reload();
							  }
							 });
					}else{
						setTimeout(function (){
							newLogin();
						}, 1000);
					}
				}
			}else{
				notifyCoinSlotError(data.errorCode);
			}
				
	  },error: function (jqXHR, exception) {
		 $("#loaderDiv").attr("class","spinner hidden");
		 if(totalCoinReceived > 0){
		    $.toast({
			  title: 'Warning',
			  content: 'Connect/Login failed, however coin has been process, please manually connect using this voucher: '+voucher,
			  type: 'info',
			  delay: 8000
			});
			setTimeout(function (){
				newLogin();
			}, 3000);
		 }
		 var browser = (function() {
			var test = function(regexp) {return regexp.test(window.navigator.userAgent)}
			switch (true) {
				case test(/edg/i): return "Microsoft Edge";
				case test(/trident/i): return "Microsoft Internet Explorer";
				case test(/firefox|fxios/i): return "Mozilla Firefox";
				case test(/opr\//i): return "Opera";
				case test(/ucbrowser/i): return "UC Browser";
				case test(/samsungbrowser/i): return "Samsung Browser";
				case test(/chrome|chromium|crios/i): return "Google Chrome";
				case test(/safari/i): return "OldBrowser";
				default: return "Other";
			}
		})();
	
		if(browser != "OldBrowser"){
			evaluateDL();
		} 
		}
	});
}

function checkCoin(){
	$.ajax({
	  type: "POST",
	  url: "http://"+vendorIpAddress+"/checkCoin",
	  data: "voucher="+voucher,
	  success: function(data){
		$("#noticeDiv").attr('style', 'display: none');
		if(data.status == "true"){
			totalCoinReceived = parseInt(data.totalCoin);
			
			$('#totalCoin').html(data.totalCoin);	
			$('#totalTime').html(secondsToDhms(parseInt(data.timeAdded)));
			if(topupMode == TOPUP_INTERNET){
				$('#codeGeneratedBlock').attr('style', 'display: block');
				$('#totalData').html(data.data);
				$('#voucherInput').val(voucher);
			}
			
			setStorageValue('activeVoucher', voucher);
			setStorageValue('totalCoinReceived', totalCoinReceived);
			setStorageValue(voucher+"tempValidity", data.validity);
			notifyCoinSuccess(data.newCoin);

		//---------------------------------------------------------------------------------------------------------------------
			if (($('#expp').html() == null)||($('#expp').html() == "Not Available")||($('#expp').html() == "No Expiration")){
				var expmin = getStorageValue(voucher+"tempValidity", data.validity);
				if(expmin != null){
					var now = new Date();
					now.setMinutes(now.getMinutes() + parseInt(expmin));
					now = new Date(now);
					var temp = now;

					var date = temp;
					var validDate =(((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear());
					var exp_time = (temp.getHours() + ":" + temp.getMinutes() + ":" + temp.getSeconds());

					var validTime = exp_time;
					var hourEnd = validTime.indexOf(":");
					var H = +validTime.substr(0, hourEnd);
					var h = H % 12 || 12;
					var ampm = H < 12 ? "AM" : "PM";
					validTime = h + validTime.substr(hourEnd, 6) + ' ' + ampm;

					$('#exp').html(validDate +','+ " " + validTime);
					$('#expp').html(validDate +','+ " " + validTime);
				}else{
					$('#exp').html("Not Available");
					$('#expp').html("Not Available");
				}
			}else{
				var expmin = getStorageValue(voucher+"tempValidity", data.validity);
				var current_exp = $('#expp').val();
				if(expmin != null){
					var now = new Date(current_exp);
					now.setMinutes(now.getMinutes() + parseInt(expmin));
					now = new Date(now);
					var temp = now;

					var date = temp;
					var validDate =(((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear());
					var exp_time = (temp.getHours() + ":" + temp.getMinutes() + ":" + temp.getSeconds());

					var validTime = exp_time;
					var hourEnd = validTime.indexOf(":");
					var H = +validTime.substr(0, hourEnd);
					var h = H % 12 || 12;
					var ampm = H < 12 ? "AM" : "PM";
					validTime = h + validTime.substr(hourEnd, 6) + ' ' + ampm;

					$('#expp').html(validDate +','+ " " + validTime);
				}else{
					$('#expp').html("Not Available");
				}
			}

		//----------------------------------------------------------------------------------------------------------------------		

		}else{
			if(data.errorCode == "coin.is.reading"){
				$("#noticeDiv").attr('style', 'display: block');
				$("#noticeText").html("Verifying, please wait..");
			}
			else if(data.errorCode == "coin.not.inserted"){
				setStorageValue(voucher+"tempValidity", data.validity);
				
				var remainTime = parseInt(parseInt(data.remainTime)/1000);
				var waitTime = parseFloat(data.waitTime);
				var percent = parseInt(((remainTime*1000) / waitTime) * 100);
				totalCoinReceived = parseInt(data.totalCoin);
				if(totalCoinReceived > 0 ){
					$( "#saveVoucherButton" ).prop('disabled', false);
					$( "#cncl" ).prop('disabled', true);
				}
				if(remainTime == 0){
					$('#insertCoinModal').modal('hide');
					insertcoinbg.pause();
					insertcoinbg.currentTime = 0.0;
					if(totalCoinReceived > 0){

						if(topupMode == TOPUP_INTERNET){
							$.toast({
								title: 'Success',
								content: 'Coin slot expired!, but was able to succesfully process the coin '+totalCoinReceived +", will do auto login shortly",
								type: 'info',
								delay: 5000
							});
							var type = $( "#saveVoucherButton" ).attr('data-save-type');
							setTimeout(function (){

								if(type == "extend"){
									$.ajax({
									type: "POST",
									url: "/logout",
									data: "erase-cookie=true",
									success: function(data){
										setStorageValue('reLogin', '1');
										location.reload();
									}
									});
								}else{
									newLogin();
								}
							}, 1000);
							var browser = (function() {
								var test = function(regexp) {return regexp.test(window.navigator.userAgent)}
								switch (true) {
									case test(/edg/i): return "Microsoft Edge";
									case test(/trident/i): return "Microsoft Internet Explorer";
									case test(/firefox|fxios/i): return "Mozilla Firefox";
									case test(/opr\//i): return "Opera";
									case test(/ucbrowser/i): return "UC Browser";
									case test(/samsungbrowser/i): return "Samsung Browser";
									case test(/chrome|chromium|crios/i): return "Google Chrome";
									case test(/safari/i): return "OldBrowser";
									default: return "Other";
								}
							})();
						
							if(browser != "OldBrowser"){
								evaluateDL();
							} 
						}else if(topupMode == TOPUP_CHARGER){
							populateChargingStations();
							$.toast({
								title: 'Success',
								content: 'Coin slot expired!, but was able to succesfully process the coin '+totalCoinReceived + " you can now use the service",
								type: 'info',
								delay: 5000
							});
						}
					}else{
						notifyCoinSlotError('coins.wait.expired');
					}
				}else{
					totalCoinReceived = parseInt(data.totalCoin);
					if(totalCoinReceived > 0 ){
						$( "#saveVoucherButton" ).prop('disabled', false);
						$( "#cncl" ).prop('disabled', true);
						$('#codeGeneratedBlock').attr('style', 'display: block');
					}
					$('#totalCoin').html(data.totalCoin);
					$('#totalData').html(data.data);
					$('#totalTime').html(secondsToDhms(parseInt(data.timeAdded)));
					$('#totalTime').val((parseInt(data.timeAdded)));
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
					  var type = $( "#saveVoucherButton" ).attr('data-save-type');
					  setTimeout(function (){
						  if(type == "extend"){
							  setStorageValue('reLogin', '1');
							  document.logout.submit();
						  }else{
							newLogin();
						  }
					  }, 3000);
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

function convertVoucherAction(){
	var vc = $("#convertVoucherCode").val();
	if(vc != ""){
		voucherToConvert = vc;
		$( "#convertBtn" ).prop('disabled', true);
		$.ajax({
			type: "POST",
			url: "http://"+vendorIpAddress+"/convertVoucher",
			data: "voucher="+voucher+"&convertVoucher="+voucherToConvert,
			success: function(data){
				if(data.status == "true"){
					$.toast({
						title: 'Success',
						content: 'Voucher converted succesfully',
						type: 'info',
						delay: 1000
					  });
					  $( "#conVC" ).append(" ", $("#convertVoucherCode").val()," ");
				}else{
					notifyCoinSlotError("convertVoucher.invalid");
				}
				$( "#convertVoucherCode" ).val("");
				$( "#convertBtn" ).prop('disabled', false);
				voucherToConvert = "";
			},error: function(){
				notifyCoinSlotError("convertVoucher.invalid");
				$( "#convertVoucherCode" ).val("");
				$( "#convertBtn" ).prop('disabled', false);
				voucherToConvert = "";
			}
		  });
	}else{
		notifyCoinSlotError("convertVoucher.empty");
	}
}

function notifyCoinSlotError(errorCode){
	$.toast({
	  title: 'Error',
	  content: errorCodeMap[errorCode],
	  type: 'error',
	  delay: 5000
	});
}

function notifyCoinSuccess(coin){
	$.toast({
	  title: 'Coin inserted',
	  content: coin+' peso(s) was inserted',
	  type: 'success',
	  delay: 2000
	});
	coinCount.play();

	if(EnableTelegram == true && CoinDropNotify) {
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
                
        if (isMultiVendo) {
			if (multiVendoOption == 1){
					var teleMsg = '******** <b>Inserted Coin Count</b> *******%0AAmount: ' + "<b>"+coin + '.00 php'+ '</b>' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0AVendo Name: ' + VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 1 ' + '%0A*************************************';
			}else if(multiVendoOption == 2){
					var teleMsg = '******** <b>Inserted Coin Count</b> *******%0AAmount: ' + "<b>"+coin + '.00 php'+ '</b>' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0AVendo Name: ' + VendoLoc[loc].name + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 2 ' + '%0A*************************************';
			}else{
					var teleMsg = '******** <b>Inserted Coin Count</b> *******%0AAmount: ' + "<b>"+coin + '.00 php'+ '</b>' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0AVendo Name: ' + vendoipAddr + '%0AVendo IP: ' + vendorIpAddress + '%0AMulti Vendo: ' + 'Set 0 ' + '%0A*************************************';
			} 
		}else {
			var teleMsg = '******** <b>Inserted Coin Count</b> *******%0AAmount: ' + "<b>"+coin + '.00 php'+ '</b>' + '%0AMAC: ' + mac + '%0AIP: ' + dev_ip + '%0AVendo IP: ' + vendorIpAddress + '%0A*************************************';
		}
        
        var url = 'https://api.telegram.org/bot' + telegramToken + '/sendmessage?chat_id=' + telechatId + '&text=' + teleMsg + '&parse_mode=html';
        var oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);
        oReq.send();
        }

}

function secondsToDhms(seconds) {
	seconds = Number(seconds);
	var d = Math.floor(seconds / (3600*24));
	var h = Math.floor(seconds % (3600*24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);

	var dDisplay = d > 0 ? d + (d == 1 ? " Day " : " Days ") : "";
	var ddDisplay = d > 0 ? d + (d == 1 ? "" : "") : "0";
	var hDisplay = h > 0 ? h + (h == 1 ? "" : "") : "0";
	var mDisplay = m > 0 ? m + (m == 1 ? "" : "") : "0";
	var sDisplay = s > 0 ? s + (s == 1 ? "" : "") : "0";

	$("#my-day").html(ddDisplay);
	$("#my-hour").html(hDisplay);
	$("#my-min").html(mDisplay);
	$("#my-sec").html(sDisplay);

	return dDisplay + " " + hDisplay + "h : " + mDisplay + "m : " + sDisplay + "s";
}

function setStorageValue(key, value){
	if(localStorage != null){
		localStorage.setItem(key, value);
	}else{
		setCookie(key,value,364);
	}
}

function removeStorageValue(key){
	if(localStorage != null){
		localStorage.removeItem(key);
	}else{
		eraseCookie(key);
	}
}

function pause(){
	var vc = getStorageValue("activeVoucher");
	setStorageValue("isPaused", "1");
	setStorageValue(vc+"remain", $("#remainTime").html());
	localStorage.setItem("myday", document.getElementById("my-day").innerHTML);
	localStorage.setItem("myhour", document.getElementById("my-hour").innerHTML);
	localStorage.setItem("mymin", document.getElementById("my-min").innerHTML);
	localStorage.setItem("mysec", document.getElementById("my-sec").innerHTML);
	document.logout.submit();
}

function resume(){
	removeStorageValue("isPaused");
	removeStorageValue("isPaused");
	removeStorageValue("activeVoucher");
	removeStorageValue("ignoreSaveCode");
	location.reload();
}

function getStorageValue(key){
	if(localStorage!= null){
		return localStorage.getItem(key);
	}else{
		return getCookie(key);
	}
}

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
function eraseCookie(name) {   
    document.cookie = name+'=; Max-Age=-99999999;';  
}

function fetchValidity(retryNo){
	if(retryNo > 5){
		fallbackValidity();
		return;
	}
	var macNoColon = replaceAll(mac, ":");
	$.ajax({
			  type: "GET",
			  url: "/data/"+macNoColon+".txt?query="+new Date().getTime(),
			  success: function(data){
				if(data.length > 50){
					setTimeout(function(){
						fetchValidity(retryNo++);
					}, 1000);
					return;
				}
				var macData = data.split("#");
				var validityRaw = macData[1];
				
				var validityTime = null;
				if(validityRaw.length > 15){
					validityTime = new Date(Date.parse(validityRaw));
				}else if(validityRaw.length > 8){
					var dt = validityRaw.split(" ");
					var yr = new Date().getFullYear();
					validityTime = new Date(Date.parse(dt[0]+"/"+yr+" "+dt[1]));
				}else if(validityRaw.length == 0){
					validityTime = null;
				} else{
					var curDate = new Date();
					var m = curDate.getMonth()+1;
					var d = curDate.getDate();
					var yr = curDate.getFullYear();
					validityTime = new Date(Date.parse(m+"/"+d+"/"+yr+" "+validityRaw));
				}
				if(validityTime != null){
					//$("#expirationTime").html(validityTime.toLocaleString());
					var validDate =(((validityTime.getMonth() > 8) ? (validityTime.getMonth() + 1) : ('0' + (validityTime.getMonth() + 1))) + '/' + ((validityTime.getDate() > 9) ? validityTime.getDate() : ('0' + validityTime.getDate())) + '/' + validityTime.getFullYear());
					var exp_time = (validityTime.getHours() + ":" + validityTime.getMinutes() + ":" + validityTime.getSeconds());
					var validTime = exp_time;
					var hourEnd = validTime.indexOf(":");
					var H = +validTime.substr(0, hourEnd);
					var h = H % 12 || 12;
					var ampm = H < 12 ? "AM" : "PM";
					validTime = h + validTime.substr(hourEnd, 6) + ' ' + ampm;
					//console.log((validDate +','+ " " + validTime));

					$("#expirationTime").html((validDate +','+ " " + validTime));
					$("#expp").html((validDate +','+ " " + validTime));
					$("#expp").val(validityTime);
				}else{
					$("#expirationTime").html("No Expiration");
					$("#expp").html("No Expiration");
					$("#expp").val("No Expiration");
				}
			  },
			  error: function(d){
					fallbackValidity();
			 }
	});			
}

function newLogin(){
	location.reload();
}

function fallbackValidity(){
	var validity = getStorageValue(voucher+"validity");
	if(validity != null){
		var curDate = new Date();
		var validityTime = new Date(parseInt(validity));
		if(validityTime.getTime() < curDate.getTime()){
			removeStorageValue(voucher+"validity");
			removeStorageValue(voucher+"tempValidity");
			$("#expirationTime").html("Not Available");
			$("#expp").html("Not Available");
			$("#expp").val("Not Available");
		}else{
			//$("#expirationTime").html(validityTime.toLocaleString());
			var validDate =(((validityTime.getMonth() > 8) ? (validityTime.getMonth() + 1) : ('0' + (validityTime.getMonth() + 1))) + '/' + ((validityTime.getDate() > 9) ? validityTime.getDate() : ('0' + validityTime.getDate())) + '/' + validityTime.getFullYear());
			var exp_time = (validityTime.getHours() + ":" + validityTime.getMinutes() + ":" + validityTime.getSeconds());
			var validTime = exp_time;
			var hourEnd = validTime.indexOf(":");
			var H = +validTime.substr(0, hourEnd);
			var h = H % 12 || 12;
			var ampm = H < 12 ? "AM" : "PM";
			validTime = h + validTime.substr(hourEnd, 6) + ' ' + ampm;
			//console.log((validDate +','+ " " + validTime));

			$("#expirationTime").html((validDate +','+ " " + validTime));
			$("#expp").html((validDate +','+ " " + validTime));
			$("#expp").val(validityTime);
		}
	}else{
		$("#expirationTime").html("Not Available");
		$("#expp").html("Not Available");
		$("#expp").val("Not Available");
	}
}

//------------------ download receipt ---------------------------------------------------------------
function evaluateDL(){
	var ttlCoin = $("#totalCoin").html();
	var ttltime = $("#totalTime").html();
	var ttltimeSeconds = $("#totalTime").val();
	var dev_ip = $('#ipc').html();
	var myValidity =  $('#exp').html();
	var myValidityExtend =  $('#expp').html();

	if($("#remainTimeSec").html() != null){
		var remainTimeSec = $("#remainTimeSec").html();
	}else{
		var remainTimeSec = "0";
	}
		var addtime = parseInt(ttltimeSeconds) + parseInt(remainTimeSec);
		var TotalTime = secondsToDhms(addtime);
	
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

	if(myValidity != null){
		myValidity1 = myValidity;
		receipt = "Receipt";
	}else{
		myValidity1 = "";
		receipt = "";
	}
	if(myValidityExtend != null){
		myValidityExtend1 = myValidityExtend;
		exReceipt = "Extend Receipt";	
		extended = "-extend";
	}else{
		myValidityExtend1 = "";
		exReceipt = "";
		extended = "";
	}	

	var data = 
		'\r ' + receipt + exReceipt  + ' \r\n ' + 
		'DATE: ' + DateTime + ' \r\n ' + 
		'Voucher: ' + voucher + ' \r\n ' + 
		'Inserted Coin: ' + ttlCoin+'.00 php' + ' \r\n ' + 
		'Time'+ extended +':' + ttltime + ' \r\n ' +
		'Total Time:'	+ TotalTime + ' \r\n ' +
		'IP: ' + dev_ip + ' \r\n ' + 
		locName + ' \r\n ' + 
		'Vendo IP: ' + vendorIpAddress + ' \r\n ' + 
		'Validity: ' + myValidity1 + myValidityExtend1;
		
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

if (ConvertUnusedVoucher == false){
	$("#convertVoucherBlockDiv").attr("style", "display: none!important");
	$("#conVCholder").attr("style", "display: none!important");
}else{
	$("#convertVoucherBlockDiv").css('display', '');
	$("#conVCholder").css('display', '');
}

//-----------------Announcement ---------------------------------------------------

if (EnableAnnouncement == true){
		$("#ancholder").css('display', '');
		$("#anc").html(annoucement);
}else{
	$("#ancholder").attr("style", "display: none!important");
}

$('#footbrand').html(brandtitle);

//-----------------HIDE BUTTON DEPEND ON PREFIX VOUCHER---------------------------------------------------
if ($('#uvc').html() != null){
	var uvc = $('#uvc').html();
	if (uvc.startsWith(noExtend[0]) 
		|| uvc.startsWith(noExtend[1]) 
		|| uvc.startsWith(noExtend[2]) 
		|| uvc.startsWith(noExtend[3])){
		$("#insertGroup").attr("style", "display: none!important");
		$("#pauseTimeBtn").css('display', '');	
		$("#vendoSelectDiv").attr("style", "display: none!important");
		$("#promoRateBtn").attr("style","display: block; width: 100%; margin-top: 0px;");
		}
	else if (uvc.startsWith(noPause[0]) 
		|| uvc.startsWith(noPause[1]) 
		|| uvc.startsWith(noPause[2]) 
		|| uvc.startsWith(noPause[3])){
		$("#pauseTimeBtn").attr("style", "display: none!important");
		$("#insertGroup").css('display', '');
		$("#vendoSelectDiv").css('display', '');	
		}
	else if (uvc.startsWith(noExpause[0]) 
		|| uvc.startsWith(noExpause[1]) 
		|| uvc.startsWith(noExpause[2]) 
		|| uvc.startsWith(noExpause[3])){
		$("#insertGroup").attr("style", "display: none!important");
		$("#pauseTimeBtn").attr("style", "display: none!important");
		$("#vendoSelectDiv").attr("style", "display: none!important");
		$("#promoRateBtn").attr("style","display: block; width: 100%; margin-top: 0px;");
		}
	else{
		$("#insertGroup").css('display', '');
		$("#pauseTimeBtn").css('display', '');	
		$("#vendoSelectDiv").css('display', '');	
	}
}
//---------------------------------------------------------------------------------
