"use strict";
var chartContainer = document.getElementById('chart');
var dataArray = [];
var chartOptions = {};
var dataTable;
function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm + ' (IST)';
  return strTime;
}
function loadData(xhttp, tableBody, isCustom) {
	xhttp.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 200) {
			var response_data = xhttp.responseText;
			var response_obj = JSON.parse(response_data);
			if("Error Message" in response_obj) {
				console.log("The symbol does not exists. Plz check the name and try again");
				if(isCustom) {
					$('#inputCustomStockSearch').popover({content:"Invalid Symbol. Plz try agian"});
			        $('#inputCustomStockSearch').popover("show");
			        	setTimeout(function() {
			        $('#inputCustomStockSearch').popover('dispose');	
			        }, 2000);
				}
		        return 0;
			}
			else {
				var metaData = response_obj["Meta Data"];
				var dateStr = metaData["3. Last Refreshed"].split(/-| |:/g);
				var curDate = new Date(Number(dateStr[0]), Number(dateStr[1] - 1), Number(dateStr[2]), Number(dateStr[3]), Number(dateStr[4]), Number(dateStr[5]));
				curDate = new Date(curDate.getTime() + 10.5 * 3600000);
				var quotes = response_obj["Time Series (" + metaData["4. Interval"] + ")"];
				var data = [];
				var flag = 0;
				for(var quote in quotes) {
					var dateStr = quote.split(/-| |:/g);
					var date = new Date(Number(dateStr[0]), Number(dateStr[1] - 1), Number(dateStr[2]), Number(dateStr[3]), Number(dateStr[4]), Number(dateStr[5]));
					date = new Date(date.getTime() + 10.5 * 3600000);
					if(flag == 0) {
						data.push(metaData["2. Symbol"]);
						data.push(Number(Number(quotes[quote]["1. open"]).toFixed(2)));
						data.push(formatAMPM(date));
						flag = 1;
					}
					if(curDate.getDate() != date.getDate()) {
						data.push( ((Number(Number(quotes[quote]["4. close"]).toFixed(2)) - data[1]) * 100 / data[1]).toFixed(2) + '%(' + ((Number(quotes[quote]["4. close"]).toFixed(2)) - data[1]).toFixed(2) + ')');
						break;
					}
				}
				var rows = tableBody.children;
				for(var i = 0; i < rows.length; i++) {
					var cells = rows[i].children;
					if(cells[0].innerHTML == data[0]) {
						cells[1].innerHTML = data[1];
						cells[2].innerHTML = data[2];
						cells[3].innerHTML = data[3];
						flag = 0;
						break;		
					}
				}
				if(flag) {
					var row = tableBody.insertRow(-1);
					var cell = row.insertCell(-1);
					cell.innerHTML = data[0];
					cell = row.insertCell(-1);
					cell.innerHTML = data[1];
					cell = row.insertCell(-1);
					cell.innerHTML = data[2];
					cell = row.insertCell(-1);
					if(data[3].charAt(0) == '-') {
						cell.style.color = '#f00';
					}
					else {
						cell.style.color = '#2ECC71';
					}
					cell.innerHTML = data[3];
				}	
			}	
		}			
	}
}
function loadCurrencyExchangeRate(xhttp, tableBody, isCustom) {
	xhttp.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 200) {
			var response_data = xhttp.responseText;
			var response_obj = JSON.parse(response_data);
			if("Error Message" in response_obj) {
				console.log("The symbol does not exists. Plz check the name and try again");
				if(isCustom) {
					$('#inputCustomCurrencySearch').popover({content:"Invalid Symbol. Plz try agian"});
			        $('#inputCustomCurrencySearch').popover("show");
			        	setTimeout(function() {
			        $('#inputCustomCurrencySearch').popover('dispose');	
			        }, 2000);
				}
			}
			else {
				var metaData = response_obj["Realtime Currency Exchange Rate"];
				var dateStr = metaData["6. Last Refreshed"].split(/-| |:/g);
				var curDate = new Date(Number(dateStr[0]), Number(dateStr[1] - 1), Number(dateStr[2]), Number(dateStr[3]), Number(dateStr[4]), Number(dateStr[5]));
				curDate = new Date(curDate.getTime() + 5.5 * 3600000);	
				var flag = 0;
				var rows = tableBody.children;
				for(var i = 0; i < rows.length; i++) {
					var cells = rows[i].children;
					if(cells[0].innerHTML == metaData["2. From_Currency Name"] + "(" + metaData["1. From_Currency Code"] + ")") {
						cells[1].innerHTML = Number(metaData["5. Exchange Rate"]).toFixed(2);
						cells[2].innerHTML = formatAMPM(curDate);
						flag = 1;
						break;
					}
				}
				if(flag == 0) {
					var row = tableBody.insertRow(-1);
					var cell = row.insertCell(-1);
					cell.innerHTML = metaData["2. From_Currency Name"] + "(" + metaData["1. From_Currency Code"] + ")";
					cell = row.insertCell(-1);
					cell.innerHTML = Number(metaData["5. Exchange Rate"]).toFixed(2);
					cell = row.insertCell(-1);
					cell.innerHTML = formatAMPM(curDate);
				}	
			}
		}
	}			
}
function alphaVantage(APIKey) {
 	this.apiKey = APIKey;
 	this.data = function (tableBody, func, symbol, isCustom = false) {
 		var xhttp = new XMLHttpRequest();
		xhttp.open("GET", "https://www.alphavantage.co/query?function=" + func + "&symbol=" + symbol + "&outputSize=full&interval=5min&apikey=" + this.apiKey);
		xhttp.send();
		loadData(xhttp, tableBody, isCustom);
 		setInterval(function () {
 			var xhttp = new XMLHttpRequest();
 			xhttp.open("GET", "https://www.alphavantage.co/query?function=" + func + "&symbol=" + symbol + "&outputSize=full&interval=5min&apikey=" + this.apiKey);
			xhttp.send();
 			loadData(xhttp, tableBody);
 		}, 300000);		
 	}
 	this.currencyExchangeRate = function (tableBody, fromCurrency, toCurrency, isCustom = false) {
 		var xhttp = new XMLHttpRequest();
		xhttp.open("GET", "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=" + fromCurrency + "&to_currency=" + toCurrency + "&apikey=" + this.apiKey);
		xhttp.send();
		loadCurrencyExchangeRate(xhttp, tableBody, isCustom);
 		setInterval(function() {
 			var xhttp = new XMLHttpRequest();
 			xhttp.open("GET", "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=" + fromCurrency + "&to_currency=" + toCurrency + "&apikey=" + this.apiKey);
 			xhttp.send();
 			loadCurrencyExchangeRate(xhttp, tableBody);
 		}, 60000);
 	}
 	this.getStockData = function (func, symbol, numQuotes = 60) {
 		dataArray = [];
 		chartOptions = {};
 		chartContainer.style.display = 'initial';
		chartContainer.innerHTML = "<strong style='padding-left:3px'>Loading...</strong>";
		var xhttp = new XMLHttpRequest();
			if (func == "day") {
				xhttp.open("GET", "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + symbol + "&outputSize=compact&interval=5min&apikey=" + this.apiKey);	
			}
			else if (func == "week"){
				xhttp.open("GET", "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + symbol + "&outputSize=compact&interval=30min&apikey=" + this.apiKey);
			}
			else {
				xhttp.open("GET", "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + symbol + "&outputSize=full&interval=60min&apikey=" + this.apiKey);		
			}
			xhttp.send();
			xhttp.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 200) {
				var response_data = xhttp.responseText;
				var response_obj = JSON.parse(response_data);
				if("Error Message" in response_obj) {
					$('#stock').popover({content:"Data doesn't exist for this symbol, Plz check symbol and try again", placement:"bottom"});
			        $('#stock').popover("show");
			        	setTimeout(function() {
			        $('#stock').popover('dispose');	
			        }, 3000);
			        return 0;
				}
				else {
					var metaData = response_obj["Meta Data"];
					var dateStr = metaData["3. Last Refreshed"].split(/-| |:/g);
					var curDate = new Date(Number(dateStr[0]), Number(dateStr[1] - 1), Number(dateStr[2]), Number(dateStr[3]), Number(dateStr[4]), Number(dateStr[5]));
					curDate = new Date(curDate.getTime() + 10.5 * 3600000);
					var quotes = response_obj["Time Series (" + metaData["4. Interval"] + ")"];
					var maxRate = 0;
					var minRate = Infinity;
					for(var quote in quotes) {
						var data = Number(Number(quotes[quote]["1. open"]).toFixed(2));
						minRate = minRate < data ? minRate : data;
						maxRate = maxRate > data ? maxRate : data;							
						var dateStr = quote.split(/-| |:/g);
						var date = new Date(Number(dateStr[0]), Number(dateStr[1] - 1), Number(dateStr[2]), Number(dateStr[3]), Number(dateStr[4]), Number(dateStr[5]));
						date = new Date(date.getTime() + 10.5 * 3600000);
						if(curDate.getDate() != date.getDate() && func == "day") {
							break;
						}
						if(curDate.getMonth() != date.getMonth() && func == "month") {
							break;
						}
						if(curDate.getFullYear() != date.getFullYear() && func == "year") {
							break;
						}
						dataArray.push([date, data]);
						numQuotes--;
						if(numQuotes == 0 && func == "week") {
							break;
						}
					}
				}
				chartOptions = {
					title: 'Price of ' + symbol + ' Stock',
					crosshair: {
						trigger: 'both',
						color: '#999'
					},
					pointSize: 2,
			        width: chartContainer.style.width,
			        hAxis: {
			            viewWindow: {
			            	min: dataArray[dataArray.length - 1][0],
			            	max: dataArray[0][0]
			        	},
			            gridlines: {
			            	count: -1,
			            	units: {
			              		days: {format: ['MMM dd']},
			              		hours: {format: ['HH:mm', 'ha']},
			            	}
			          	},
			          	minorGridlines: {
			            	units: {
			            	    hours: {format: ['hh:mm:ss a', 'ha']},
			                	minutes: {format: ['HH:mm a Z', ':mm']}
			            	}
			          	}
			        },
			        vAxis: {
			        	viewWindow: {
			        		min: minRate * 0.9999,
			        		max: maxRate * 1.0001
			        	}
			        }
			    };
				google.charts.setOnLoadCallback(drawChart(dataArray, chartOptions));
 			}
		}
	}
	this.getStockDataMonthorYear = function(func, symbol) {
		dataArray = [];
		chartOptions = {};
		chartContainer.style.display = 'initial';
		chartContainer.innerHTML = "<strong style='padding-left:3px'>Loading...</strong>";
		var xhttp = new XMLHttpRequest();
		if (func == "month") {
			xhttp.open("GET", "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + symbol + "&outputSize=compact&apikey=" + this.apiKey);	
		}
		else {
			xhttp.open("GET", "https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=" + symbol + "&outputSize=full&apikey=" + this.apiKey);		
		}
		xhttp.send();
		xhttp.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 200) {
			var response_data = xhttp.responseText;
			var response_obj = JSON.parse(response_data);
			if("Error Message" in response_obj) {
				$('#stock').popover({content:"Yearly or Monthly Data doesn't exist for this symbol, Fetching Max Data Available", placement:"left"});
		        $('#stock').popover("show");
		        	setTimeout(function() {
		        $('#stock').popover('dispose');	
		        }, 1000);
				detailedQuery.getStockData(func, symbol);
				return 0;
			}
			else {
				var metaData = response_obj["Meta Data"];
				var dateStr = metaData["3. Last Refreshed"].split(/-| |:/g);
				var curDate = new Date(Number(dateStr[0]), Number(dateStr[1] - 1), Number(dateStr[2]));
				var quotes;
				if(func == "month"){
					quotes = response_obj["Time Series (Daily)"];	
				}
				else {
					quotes = response_obj["Weekly Time Series"];	
				}
				var maxRate = 0;
				var minRate = Infinity;
				for(var quote in quotes) {
					var data = Number(Number(quotes[quote]["1. open"]).toFixed(2));
					minRate = minRate < data ? minRate : data;
					maxRate = maxRate > data ? maxRate : data;							
					var dateStr = quote.split(/-| |:/g);
					var date = new Date(Number(dateStr[0]), Number(dateStr[1] - 1), dateStr[2]);
					if(curDate.getMonth() != date.getMonth() && func == "month") {
						break;
					}
					if(curDate.getFullYear() != date.getFullYear() && func == "year") {
						break;
					}
					dataArray.push([date, data]);
				}
			}
			chartOptions = {
				title: 'Price of ' + symbol + ' Stock',
				crosshair: {
						trigger: 'both',
						color: '#999'
				},
				pointSize: 2,
				hAxis: {
		            viewWindow: {
		            	min: dataArray[dataArray.length - 1][0],
		            	max: dataArray[0][0]
		        	},
		            gridlines: {
		            	count: -1,
		            	units: {
		              		days: {format: ['MMM dd']},
		              		hours: {format: ['HH:mm', 'ha']},
		            	}
		          	},
		          	minorGridlines: {
		            	units: {
		            	    hours: {format: ['hh:mm:ss a', 'ha']},
		                	minutes: {format: ['HH:mm a Z', ':mm']}
		            	}
		          	}
		        },
		        vAxis: {
		        	viewWindow: {
		        		min: minRate * 0.9999,
		        		max: maxRate * 1.0001
		        	}
		        }
		    };
			google.charts.setOnLoadCallback(drawChart(dataArray, chartOptions));
			}
		}		
	}
	this.getCurrencyData = function (func, fromCurrency, toCurrency, numQuotes = 2016) {
 		dataArray = [];
 		chartOptions = {};
 		chartContainer.style.display = 'initial';
		chartContainer.innerHTML = "<strong style='padding-left:3px'>Loading...</strong>";
		var xhttp = new XMLHttpRequest();
			if (func == "day") {
				xhttp.open("GET", "https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_INTRADAY&symbol=" + fromCurrency + "&market=" + toCurrency + "&apikey=" + this.apiKey);	
			}
			else if (func == "week"){
				xhttp.open("GET", "https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_INTRADAY&symbol=" + fromCurrency + "&market=" + toCurrency + "&apikey=" + this.apiKey);
			}
			else {
				xhttp.open("GET", "https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_INTRADAY&symbol=" + fromCurrency + "&market=" + toCurrency + "&apikey=" + this.apiKey);		
			}
			xhttp.send();
			xhttp.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 200) {
				var response_data = xhttp.responseText;
				var response_obj = JSON.parse(response_data);
				if("Error Message" in response_obj) {
					$('#fromCurrency').popover({content:"Data doesn't exist for this symbol, Plz check symbol and try again", placement:"bottom"});
			        $('#fromCurrency').popover("show");
			        	setTimeout(function() {
			        $('#fromCurrency').popover('dispose');	
			        }, 3000);
			        return 0;
				}
				else {
					var metaData = response_obj["Meta Data"];
					var dateStr = metaData["7. Last Refreshed"].split(/-| |:/g);
					var curDate = new Date(Number(dateStr[0]), Number(dateStr[1] - 1), Number(dateStr[2]), Number(dateStr[3]), Number(dateStr[4]), Number(dateStr[5]));
					curDate = new Date(curDate.getTime() + 5.5 * 3600000);
					var quotes = response_obj["Time Series (Digital Currency Intraday)"];
					var maxRate = 0;
					var minRate = Infinity;
					for(var quote in quotes) {
						var data = Number(Number(quotes[quote]["1a. price (" + toCurrency +")"]).toFixed(2));
						minRate = minRate < data ? minRate : data;
						maxRate = maxRate > data ? maxRate : data;							
						var dateStr = quote.split(/-| |:/g);
						var date = new Date(Number(dateStr[0]), Number(dateStr[1] - 1), Number(dateStr[2]), Number(dateStr[3]), Number(dateStr[4]), Number(dateStr[5]));
						date = new Date(date.getTime() + 5.5 * 3600000);
						if(curDate.getDate() != date.getDate() && func == "day") {
							break;
						}
						if(curDate.getMonth() != date.getMonth() && func == "month") {
							break;
						}
						if(curDate.getFullYear() != date.getFullYear() && func == "year") {
							break;
						}
						dataArray.push([date, data]);
						numQuotes--;
						if(numQuotes == 0 && func == "week") {
							break;
						}
					}
				}
				chartOptions = {
					title: 'Price of 1' + fromCurrency + ' in ' + toCurrency,
					width: chartContainer.style.width,
			        crosshair: {
						trigger: 'both',
						color: '#999'
					},
					pointSize: 2,
					hAxis: {
			            viewWindow: {
			            	min: dataArray[dataArray.length - 1][0],
			            	max: dataArray[0][0]
			        	},
			            gridlines: {
			            	count: -1,
			            	units: {
			              		days: {format: ['MMM dd']},
			              		hours: {format: ['HH:mm', 'ha']},
			            	}
			          	},
			          	minorGridlines: {
			            	units: {
			            	    hours: {format: ['hh:mm:ss a', 'ha']},
			                	minutes: {format: ['HH:mm a Z', ':mm']}
			            	}
			          	}
			        },
			        vAxis: {
			        	viewWindow: {
			        		min: minRate * 0.9999,
			        		max: maxRate * 1.0001
			        	}
			        }
			    };
				google.charts.setOnLoadCallback(drawChart(dataArray, chartOptions));
 			}
		}
	}
	this.getCurrencyDataMonthorYear = function(func, fromCurrency, toCurrency) {
		dataArray = [];
		chartOptions = {};
		chartContainer.style.display = 'initial';
		chartContainer.innerHTML = "<strong style='padding-left:3px'>Loading...</strong>";
		var xhttp = new XMLHttpRequest();
		if (func == "month") {
			xhttp.open("GET", "https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=" + fromCurrency + "&market=" + toCurrency + "&apikey=" + this.apiKey);	
		}
		else {
			xhttp.open("GET", "https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_WEEKLY&symbol=" + fromCurrency + "&market=" + toCurrency + "&apikey=" + this.apiKey);		
		}
		xhttp.send();
		xhttp.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 200) {
			var response_data = xhttp.responseText;
			var response_obj = JSON.parse(response_data);
			if("Error Message" in response_obj) {
				$('#toCurrency').popover({content:"Yearly or Monthly Data doesn't exist for this symbol, Fetching Max Data Available", placement:"left"});
		        $('#toCurrency').popover("show");
		        	setTimeout(function() {
		        $('#toCurrency').popover('dispose');	
		        }, 1000);
				detailedQuery.getStockData(func,  fromCurrency, toCurrency);
				return 0;
			}
			else {
				var metaData = response_obj["Meta Data"];
				var dateStr = metaData["6. Last Refreshed"].split(/-| |:/g);
				var curDate = new Date(Number(dateStr[0]), Number(dateStr[1] - 1), Number(dateStr[2]));
				var quotes;
				if(func == "month"){
					quotes = response_obj["Time Series (Digital Currency Daily)"];	
				}
				else {
					quotes = response_obj["Time Series (Digital Currency Weekly)"];	
				}
				var maxRate = 0;
				var minRate = Infinity;
				for(var quote in quotes) {
					var data = Number(Number(quotes[quote]["1a. open (" + toCurrency + ")"]).toFixed(2));
					minRate = minRate < data ? minRate : data;
					maxRate = maxRate > data ? maxRate : data;							
					var dateStr = quote.split(/-| |:/g);
					var date = new Date(Number(dateStr[0]), Number(dateStr[1] - 1), dateStr[2]);
					if(curDate.getMonth() != date.getMonth() && func == "month") {
						break;
					}
					if(curDate.getFullYear() != date.getFullYear() && func == "year") {
						break;
					}
					dataArray.push([date, data]);
				}
			}
			chartOptions = {
				title: 'Price of 1' + fromCurrency + ' to ' + toCurrency,
				width: chartContainer.style.width,
		        crosshair: {
						trigger: 'both',
						color: '#999'
				},
				pointSize: 2,
			    hAxis: {
		            viewWindow: {
		            	min: dataArray[dataArray.length - 1][0],
		            	max: dataArray[0][0]
		        	},
		            gridlines: {
		            	count: -1,
		            	units: {
		              		days: {format: ['MMM dd']},
		              		hours: {format: ['HH:mm', 'ha']},
		            	}
		          	},
		          	minorGridlines: {
		            	units: {
		            	    hours: {format: ['hh:mm:ss a', 'ha']},
		                	minutes: {format: ['HH:mm a Z', ':mm']}
		            	}
		          	}
		        },
		        vAxis: {
		        	viewWindow: {
		        		min: minRate * 0.9999,
		        		max: maxRate * 1.0001
		        	}
		        }
		    };
			google.charts.setOnLoadCallback(drawChart(dataArray, chartOptions));
			}
		}		
	}
}
$(document).ready(function(){
  // Add scrollspy to <body>
  $('body').scrollspy({target: ".navbar", offset: 0});   

  // Add smooth scrolling on all links inside the navbar
  $(".navbar a").on('click', function(event) {
    // Make sure this.hash has a value before overriding default behavior
    if (this.hash !== "") {
      // Prevent default anchor click behavior
      event.preventDefault();

      // Store hash
      var hash = this.hash;

      // Using jQuery's animate() method to add smooth page scroll
      // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
      $('html, body').animate({
        scrollTop: $(hash).offset().top
      }, 800, function(){
   
        // Add hash (#) to URL when done scrolling (default click behavior)
        window.location.hash = hash;
      });
    }  // End if
  });
});
var marketIndex = document.getElementById("marketIndex");
var queryMarketIndex = [];
var markets = ["SENSEX", "FTSE", "DAX", "CAC", "NYA"];
for(var i = 0; i < markets.length; i++) {
	queryMarketIndex[i] = new alphaVantage("TKW9PYH77AQ8ITYY");
	queryMarketIndex[i].data(marketIndex, "TIME_SERIES_INTRADAY", markets[i]);	
}

var comapanyIndex = document.getElementById("companiesIndex");
var queryCompanyIndex = [];
var companies = ["RELIANCE", "GOOGL", "BA", "MSFT", "BABA"];
for(var i = 0; i < companies.length; i++) {
	queryCompanyIndex[i] = new alphaVantage("TKW9PYH77AQ8ITYY");
	queryCompanyIndex[i].data(comapanyIndex, "TIME_SERIES_INTRADAY", companies[i]);	
}

var physicalCurrencyRate = document.getElementById("physicalCurrencyRate");
var queryPhysicalCurrencyRate = [];
var physicalCurrencies = ["USD", "EUR", "CNY"];
for(var i = 0; i < physicalCurrencies.length; i++) {
	queryPhysicalCurrencyRate[i] = new alphaVantage("TKW9PYH77AQ8ITYY");
	queryPhysicalCurrencyRate[i].currencyExchangeRate(physicalCurrencyRate, physicalCurrencies[i], "INR");	
}

var digitalCurrencyRate = document.getElementById("digitalCurrencyRate");
var queryDigitalCurrencyRate = [];
var digitalCurrencies = ["BTC", "ETH", "BCH"];
for(var i = 0; i < digitalCurrencies.length; i++) {
	queryDigitalCurrencyRate[i] = new alphaVantage("TKW9PYH77AQ8ITYY");
	queryDigitalCurrencyRate[i].currencyExchangeRate(digitalCurrencyRate, digitalCurrencies[i], "INR");	
}
var customStockSearch = document.getElementById("customStockSearch");
function stockSearch() {
	var inputHolder = document.getElementById('inputCustomStockSearch');
	var symbol = (inputHolder.value).toUpperCase();
	new alphaVantage("TKW9PYH77AQ8ITYY").data(customStockSearch, "TIME_SERIES_INTRADAY", symbol, true);
	inputHolder.value = "";
}
var customCurrencySearch = document.getElementById("customCurrencySearch");
function currencySearch() {
	var inputHolder = document.getElementById('inputCustomCurrencySearch');
	var fromCurrency = (inputHolder.value).toUpperCase();
	new alphaVantage("TKW9PYH77AQ8ITYY").currencyExchangeRate(customCurrencySearch, fromCurrency, "INR", true);
	inputHolder.value = "";
}
var phyCurrencies = {
  "AED": "United Arab Emirates Dirham",
  "AFN": "Afghan Afghani",
  "ALL": "Albanian Lek",
  "AMD": "Armenian Dram",
  "ANG": "Netherlands Antillean Guilder",
  "AOA": "Angolan Kwanza",
  "ARS": "Argentine Peso",
  "AUD": "Australian Dollar",
  "AWG": "Aruban Florin",
  "AZN": "Azerbaijani Manat",
  "BAM": "Bosnia-Herzegovina Convertible Mark",
  "BBD": "Barbadian Dollar",
  "BCH": "Bitcoin-Cash",
  "BDT": "Bangladeshi Taka",
  "BGN": "Bulgarian Lev",
  "BHD": "Bahraini Dinar",
  "BIF": "Burundian Franc",
  "BMD": "Bermudan Dollar",
  "BND": "Brunei Dollar",
  "BOB": "Bolivian Boliviano",
  "BRL": "Brazilian Real",
  "BSD": "Bahamian Dollar",
  "BTN": "Bhutanese Ngultrum",
  "BWP": "Botswanan Pula",
  "BYR": "Belarusian Ruble",
  "BZD": "Belize Dollar",
  "CAD": "Canadian Dollar",
  "CDF": "Congolese Franc",
  "CHF": "Swiss Franc",
  "CLF": "Chilean Unit of Account (UF)",
  "CLP": "Chilean Peso",
  "CNY": "Chinese Yuan",
  "COP": "Colombian Peso",
  "CRC": "Costa Rican Colón",
  "CUP": "Cuban Peso",
  "CVE": "Cape Verdean Escudo",
  "CZK": "Czech Republic Koruna",
  "DJF": "Djiboutian Franc",
  "DKK": "Danish Krone",
  "DOP": "Dominican Peso",
  "DZD": "Algerian Dinar",
  "EEK": "Estonian Kroon",
  "EGP": "Egyptian Pound",
  "ERN": "Eritrean Nakfa",
  "ETB": "Ethiopian Birr",
  "EUR": "Euro",
  "FJD": "Fijian Dollar",
  "FKP": "Falkland Islands Pound",
  "GBP": "British Pound Sterling",
  "GEL": "Georgian Lari",
  "GHS": "Ghanaian Cedi",
  "GIP": "Gibraltar Pound",
  "GMD": "Gambian Dalasi",
  "GNF": "Guinean Franc",
  "GTQ": "Guatemalan Quetzal",
  "GYD": "Guyanaese Dollar",
  "HKD": "Hong Kong Dollar",
  "HNL": "Honduran Lempira",
  "HRK": "Croatian Kuna",
  "HTG": "Haitian Gourde",
  "HUF": "Hungarian Forint",
  "IDR": "Indonesian Rupiah",
  "ILS": "Israeli New Sheqel",
  "INR": "Indian Rupee",
  "IQD": "Iraqi Dinar",
  "IRR": "Iranian Rial",
  "ISK": "Icelandic Króna",
  "JEP": "Jersey Pound",
  "JMD": "Jamaican Dollar",
  "JOD": "Jordanian Dinar",
  "JPY": "Japanese Yen",
  "KES": "Kenyan Shilling",
  "KGS": "Kyrgystani Som",
  "KHR": "Cambodian Riel",
  "KMF": "Comorian Franc",
  "KPW": "North Korean Won",
  "KRW": "South Korean Won",
  "KWD": "Kuwaiti Dinar",
  "KYD": "Cayman Islands Dollar",
  "KZT": "Kazakhstani Tenge",
  "LAK": "Laotian Kip",
  "LBP": "Lebanese Pound",
  "LKR": "Sri Lankan Rupee",
  "LRD": "Liberian Dollar",
  "LSL": "Lesotho Loti",
  "LTL": "Lithuanian Litas",	
  "LVL": "Latvian Lats",	
  "LYD": "Libyan Dinar",
  "MAD": "Moroccan Dirham",
  "MDL": "Moldovan Leu",
  "MGA": "Malagasy Ariary",
  "MKD": "Macedonian Denar",
  "MMK": "Myanma Kyat",
  "MNT": "Mongolian Tugrik",
  "MOP": "Macanese Pataca",
  "MRO": "Mauritanian Ouguiya (pre-2018)",
  "MTL": "Maltese Lira",
  "MUR": "Mauritian Rupee",
  "MVR": "Maldivian Rufiyaa",
  "MWK": "Malawian Kwacha",
  "MXN": "Mexican Peso",
  "MZN": "Mozambican Metical",
  "NAD": "Namibian Dollar",
  "NGN": "Nigerian Naira",
  "NIO": "Nicaraguan Córdoba",
  "NOK": "Norwegian Krone",
  "NPR": "Nepalese Rupee",
  "NZD": "New Zealand Dollar",
  "OMR": "Omani Rial",
  "PAB": "Panamanian Balboa",
  "PEN": "Peruvian Nuevo Sol",
  "PGK": "Papua New Guinean Kina",
  "PHP": "Philippine Peso",
  "PKR": "Pakistani Rupee",
  "PLN": "Polish Zloty",
  "PYG": "Paraguayan Guarani",
  "QAR": "Qatari Rial",
  "RON": "Romanian Leu",
  "RSD": "Serbian Dinar",
  "RUB": "Russian Ruble",
  "RWF": "Rwandan Franc",
  "SAR": "Saudi Riyal",
  "SBD": "Solomon Islands Dollar",
  "SCR": "Seychellois Rupee",
  "SDG": "Sudanese Pound",
  "SEK": "Swedish Krona",
  "SGD": "Singapore Dollar",
  "SHP": "Saint Helena Pound",
  "SLL": "Sierra Leonean Leone",
  "SOS": "Somali Shilling",
  "SRD": "Surinamese Dollar",
  "STD": "São Tomé and Príncipe Dobra (pre-2018)",
  "SVC": "Salvadoran Colón",
  "SYP": "Syrian Pound",
  "SZL": "Swazi Lilangeni",
  "THB": "Thai Baht",
  "TJS": "Tajikistani Somoni",
  "TMT": "Turkmenistani Manat",
  "TND": "Tunisian Dinar",
  "TOP": "Tongan Pa'anga",
  "TRY": "Turkish Lira",
  "TTD": "Trinidad and Tobago Dollar",
  "TWD": "New Taiwan Dollar",
  "TZS": "Tanzanian Shilling",
  "UAH": "Ukrainian Hryvnia",
  "UGX": "Ugandan Shilling",
  "USD": "United States Dollar",
  "UYU": "Uruguayan Peso",
  "UZS": "Uzbekistan Som",
  "VEF": "Venezuelan Bolívar Fuerte",
  "VND": "Vietnamese Dong",
  "VUV": "Vanuatu Vatu",
  "WST": "Samoan Tala",
  "XAF": "CFA Franc BEAC",
  "XAG": "Silver Ounce",
  "XAU": "Gold Ounce",
  "XCD": "East Caribbean Dollar",
  "XDR": "Special Drawing Rights",
  "XOF": "CFA Franc BCEAO",
  "XPF": "CFP Franc",
  "YER": "Yemeni Rial",
  "ZAR": "South African Rand",
  "ZMW": "Zambian Kwacha",
  "ZWL": "Zimbabwean Dollar"
}
var digiCurrencies = {
	"1ST": "FirstBlood",
    "2GIVE": "GiveCoin",
    "808": "808Coin",
    "AC": "AsiaCoin",
    "ACT": "Achain",
    "ADA": "Cardano",
    "ADK": "Aidos-Kuneen",
    "ADL": "Adelphoi",
    "ADT": "adToken",
    "ADX": "AdEx",
    "AE": "Aeternity",
    "AEON": "Aeon",
    "AGRS": "IDNI-Agoras",
    "AMBER": "AmberCoin",
    "AMP": "Synereo",
    "ANC": "Anoncoin",
    "ANS": "NEO",
    "ANT": "Aragon",
    "APX": "APX-Ventures",
    "ARDR": "Ardor",
    "ARK": "Ark",
    "ATB": "ATBCoin",
    "ATCC": "ATC-Coin",
    "AUR": "Auroracoin",
    "AVT": "Aventus",
    "B3": "B3Coin",
    "BAT": "Basic-Attention-Token",
    "BAY": "BitBay",
    "BCAP": "BCAP",
    "BCC": "BitConnect",
    "BCH": "Bitcoin-Cash",
    "BCN": "Bytecoin",
    "BCY": "BitCrystals",
    "BDL": "Bitdeal",
    "BELA": "BelaCoin",
    "BET": "DAO-Casino",
    "BIS": "Bismuth",
    "BIT": "First-Bitcoin",
    "BITB": "BitBean",
    "BITBTC": "BitBTC",
    "BITCNY": "BitCNY",
    "BITEUR": "BitEUR",
    "BITGBP": "BitGBP",
    "BITOK": "Bitok",
    "BITSILVER": "BitSILVER",
    "BITUSD": "BitUSD",
    "BLAS": "BlakeStar",
    "BLK": "Blackcoin",
    "BLN": "Bolenum",
    "BLOCK": "Blocknet",
    "BLOCKPAY": "BlockPay",
    "BMC": "Blackmoon-Crypto",
    "BNB": "Binance-Coin",
    "BNT": "Bancor-Network-Token",
    "BOST": "BoostCoin",
    "BQ": "bitqy",
    "BQX": "Bitquence",
    "BTA": "Bata",
    "BTC": "Bitcoin",
    "BTCD": "BitcoinDark",
    "BTM": "Bitmark",
    "BTS": "BitShares",
    "BTSR": "BTSR",
    "BTX": "Bitcore",
    "BURST": "Burstcoin",
    "BUZZ": "BuzzCoin",
    "BYC": "Bytecent",
    "BYTOM": "Bytom",
    "CANN": "CannabisCoin",
    "CAT": "BlockCAT",
    "CCRB": "CryptoCarbon",
    "CDT": "Coindash",
    "CFI": "Cofound.it",
    "CHIPS": "Chips",
    "CLAM": "Clams",
    "CLOAK": "CloakCoin",
    "CMP": "Compcoin",
    "COSS": "COSS",
    "COVAL": "Circuits-Of-Value",
    "CRBIT": "CreditBIT",
    "CREA": "CreativeCoin",
    "CREDO": "Credo",
    "CRW": "Crown",
    "CTR": "Centra",
    "CURE": "CureCoin",
    "CVC": "Civic",
    "DAR": "Darcrus",
    "DASH": "Dash",
    "DAY": "Chronologic",
    "DCN": "Dentacoin",
    "DCR": "Decred",
    "DCT": "DECENT",
    "DDF": "Digital-Developers-Fund",
    "DENT": "Dent",
    "DFS": "DFSCoin",
    "DGB": "DigiByte",
    "DGC": "Digitalcoin",
    "DGD": "DigixDAO",
    "DICE": "Etheroll",
    "DNT": "district0x",
    "DOGE": "DogeCoin",
    "DOPE": "DopeCoin",
    "DTB": "Databits",
    "DYN": "Dynamic",
    "EAC": "EarthCoin",
    "EBST": "eBoost",
    "EBTC": "eBTC",
    "ECN": "E-coin",
    "EDG": "Edgeless",
    "ELIX": "Elixir",
    "EMB": "Embercoin",
    "EMC": "Emercoin",
    "EMC2": "Einsteinium",
    "EOS": "EOS",
    "EOT": "EOT-Token",
    "EQT": "EquiTrader",
    "ETC": "Ethereum-Classic",
    "ETH": "Ethereum",
    "ETHD": "Ethereum-Dark",
    "ETP": "Metaverse-Entropy",
    "ETT": "EncryptoTel",
    "EXP": "Expanse",
    "FBC": "Fibocoins",
    "FCT": "Factom",
    "FID": "BITFID",
    "FLDC": "FoldingCoin",
    "FLO": "FlorinCoin",
    "FLT": "FlutterCoin",
    "FRST": "FirstCoin",
    "FTC": "Feathercoin",
    "FUN": "FunFair",
    "GAM": "Gambit",
    "GAME": "GameCredits",
    "GAS": "Gas",
    "GBG": "Golos Gold",
    "GBYTE": "Byteball",
    "GCR": "GCRCoin",
    "GLD": "GoldCoin",
    "GNO": "Gnosis-Token",
    "GNT": "Golem-Tokens",
    "GOLOS": "Golos",
    "GRC": "Gridcoin",
    "GRWI": "Growers-International",
    "GUP": "Guppy",
    "GXS": "GXShares",
    "HBN": "HoboNickels",
    "HEAT": "HEAT",
    "HMQ": "Humaniq",
    "HSR": "Hshare",
    "HUSH": "Hush",
    "HVN": "Hive",
    "ICN": "ICONOMI",
    "ICO": "ICOCoin",
    "IFC": "Infinitecoin",
    "IFT": "investFeed",
    "INCNT": "Incent",
    "IND": "Indorse-Token",
    "INF": "InfChain",
    "INPAY": "InPay",
    "INXT": "Internxt",
    "IOC": "IOCoin",
    "ION": "ION",
    "IOP": "Internet-of-People",
    "IOT": "IOTA",
    "IQT": "Iquant-Chain",
    "IXC": "iXcoin",
    "IXT": "InsureX",
    "KEXCOIN": "KexCoin",
    "KICK": "KickCoin",
    "KIN": "KIN",
    "KMD": "Komodo",
    "KNC": "Kyber-Network",
    "KORE": "KoreCoin",
    "KRS": "Krypstal",
    "LBC": "LBRY-Credits",
    "LGD": "Legends-Room",
    "LINDA": "Linda",
    "LINK": "ChainLink",
    "LKK": "Lykke",
    "LMC": "LoMoCoin",
    "LRC": "Loopring",
    "LSK": "Lisk",
    "LTC": "Litecoin",
    "LUN": "Lunyr",
    "MAGN": "Magnetcoin",
    "MAID": "MaidSafeCoin",
    "MANA": "Decentraland",
    "MAX": "Maxcoin",
    "MBRS": "Embers",
    "MCAP": "MCAP",
    "MCO": "Monaco",
    "MDA": "Moeda-Loyalty-Points",
    "MEC": "Megacoin",
    "MEME": "Memetic",
    "MGC": "MergeCoin",
    "MGO": "MobileGo",
    "MINEX": "Minex",
    "MINT": "Mintcoin",
    "MLN": "Melon",
    "MNE": "Minereum",
    "MONA": "MonaCoin",
    "MRT": "Miners-Reward-Token",
    "MSP": "Mothership",
    "MTH": "Monetha",
    "MUE": "MonetaryUnit",
    "MUSIC": "Musicoin",
    "MYB": "MyBit-Token",
    "MYR": "Myriadcoin",
    "MYST": "Mysterium",
    "MZC": "Mazacoin",
    "NAMO": "Namocoin",
    "NAUT": "NautilusCoin",
    "NAV": "Nav-Coin",
    "NBT": "NuBits",
    "NDAO": "NeuroDAO",
    "NDC": "NeverDie-Coin",
    "NEBL": "Neblio",
    "NEOS": "NeosCoin",
    "NET": "Nimiq",
    "NLC2": "NoLimitCoin",
    "NLG": "Gulden",
    "NMC": "Namecoin",
    "NMR": "Numeraire",
    "NOBL": "NobleCoin",
    "NOTE": "DNotes",
    "NSR": "NuShares",
    "NTO": "Fujinto",
    "NVC": "Novacoin",
    "NXC": "Nexium",
    "NXS": "Nexus",
    "NXT": "Nxt",
    "OAX": "openANX",
    "OBITS": "Obits",
    "OCL": "Oceanlab",
    "ODN": "Obsidian",
    "OK": "OKCash",
    "OMG": "OmiseGo",
    "OMNI": "Omni",
    "ONION": "DeepOnion",
    "OPT": "Opus",
    "PART": "Particl",
    "PASC": "PascalCoin",
    "PAY": "TenX",
    "PBT": "Primalbase-Token",
    "PING": "CryptoPing",
    "PINK": "Pinkcoin",
    "PIVX": "PIVX",
    "PIX": "Lampix",
    "PLBT": "Polybius",
    "PLR": "Pillar",
    "PLU": "Pluton",
    "POE": "Poet",
    "POSW": "PoSW-Coin",
    "POT": "PotCoin",
    "PPC": "Peercoin",
    "PPT": "Populous",
    "PPY": "Peerplays",
    "PRO": "Propy",
    "PST": "Primas",
    "PTC": "Pesetacoin",
    "PTOY": "Patientory",
    "PURA": "Pura",
    "QAU": "Quantum",
    "QRK": "Quark",
    "QRL": "Quantum-Resistant-Ledger",
    "QTL": "Quatloo",
    "QTUM": "Qtum",
    "QWARK": "Qwark",
    "RADS": "Radium",
    "RAIN": "Condensate",
    "RBIES": "Rubies",
    "RBX": "Ripto-Bux",
    "RBY": "RubyCoin",
    "RDD": "ReddCoin",
    "REC": "Regalcoin",
    "RED": "Redcoin",
    "REP": "Augur",
    "RIC": "Riecoin",
    "RISE": "Rise",
    "RLC": "RLC-Token",
    "RLT": "RouletteToken",
    "ROUND": "Round",
    "RRT": "Recovery-Right-Tokens",
    "RUP": "Rupee",
    "RVT": "Rivetz",
    "SALT": "Salt",
    "SAN": "Santiment-Network-Token",
    "SBD": "Steem-Dollars",
    "SC": "Siacoin",
    "SDC": "ShadowCash",
    "SEC": "SafeExchangeCoin",
    "SEQ": "Sequence",
    "SHIFT": "SHIFT",
    "SIGMA": "SIGMAcoin",
    "SIGT": "Signatum",
    "SJCX": "Storjcoin-X",
    "SKIN": "SkinCoin",
    "SKY": "Skycoin",
    "SLS": "SaluS",
    "SMART": "SmartCash",
    "SNC": "SunContract",
    "SNGLS": "SingularDTV",
    "SNM": "SONM",
    "SNRG": "Synergy",
    "SNT": "Status-Network-Token",
    "SPR": "SpreadCoin",
    "START": "Startcoin",
    "STEEM": "Steem",
    "STORJ": "Storj",
    "STRAT": "Stratis",
    "STRC": "StarCredits",
    "STX": "Stox",
    "SUB": "Substratum",
    "SWT": "Swarm-City",
    "SYS": "SysCoin",
    "TAAS": "Taas",
    "TCC": "The-ChampCoin",
    "TFL": "True-Flip",
    "TIME": "Time",
    "TIX": "Blocktix",
    "TKN": "TokenCard",
    "TKR": "Trackr",
    "TKS": "Tokes",
    "TNT": "Tierion",
    "TOA": "ToaCoin",
    "TRC": "Terracoin",
    "TRIG": "Triggers",
    "TRST": "Trustcoin",
    "TRX": "Tronix",
    "UBQ": "Ubiq",
    "ULA": "Ulatech",
    "UNITY": "SuperNET",
    "UNO": "Unobtanium",
    "UNY": "Unity-Ingot",
    "URO": "Uro",
    "USDT": "Tether",
    "VEN": "VeChain",
    "VERI": "Veritaseum",
    "VIA": "Viacoin",
    "VIB": "Viberate",
    "VIVO": "VIVO",
    "VOISE": "Voise",
    "VOX": "Voxels",
    "VPN": "VPNCoin",
    "VRC": "Vericoin",
    "VRM": "Verium",
    "VRS": "Veros",
    "VSL": "vSlice",
    "VTC": "Vertcoin",
    "VTR": "vTorrent",
    "WAVES": "Waves",
    "WCT": "Waves-Community",
    "WDC": "WorldCoin",
    "WGO": "WavesGo",
    "WGR": "Wagerr",
    "WINGS": "Wings",
    "WTC": "Walton",
    "WTT": "Giga-Watt-Token",
    "XAS": "Asch",
    "XAUR": "Xaurum",
    "XBC": "Bitcoin-Plus",
    "XBY": "XtraBYtes",
    "XCN": "Cryptonite",
    "XCP": "Counterparty",
    "XDN": "DigitalNote",
    "XEL": "Elastic",
    "XEM": "NEM",
    "XID": "Air",
    "XLM": "Stellar",
    "XMR": "Monero",
    "XMT": "Metal",
    "XPM": "Primecoin",
    "XPY": "PayCoin",
    "XRB": "RaiBlocks",
    "XRL": "Rialto",
    "XRP": "Ripples",
    "XSPEC": "Spectrecoin",
    "XST": "Stealthcoin",
    "XTZ": "Tezos",
    "XVC": "Vcash",
    "XVG": "Verge",
    "XWC": "WhiteCoin",
    "XZC": "ZCoin",
    "XZR": "ZrCoin",
    "YBC": "YbCoin",
    "YOYOW": "YOYOW",
    "ZCC": "ZcCoin",
    "ZCL": "Zclassic",
    "ZEC": "Zcash",
    "ZEN": "ZenCash",
    "ZET": "Zetacoin",
    "ZRX": "0x"
}	
var inputMethod = document.getElementById('method');
var stock = document.getElementById('stock');
var fromCurrency = document.getElementById('fromCurrency');
var toCurrency = document.getElementById('toCurrency');
var timeFrame = document.getElementById('timeFrame');
var submitFormBtn = document.getElementById('submitForm');
var phyCurrenciesDatalist = document.getElementById('phyCurrencies');
var digiCurrenciesDatalist = document.getElementById('digiCurrencies');
var currenciesDatalist = document.getElementById('currencies');
var options = '';
var currenciesOptions = '';
for(var element in phyCurrencies) {
	options += '<option value="' + element + '" />' + phyCurrencies[element] + '</option>';
}
phyCurrenciesDatalist.innerHTML = options;
currenciesOptions = options;
var options = '';
for(var element in digiCurrencies) {
	options += '<option value="' + element + '" />' + digiCurrencies[element] + '</option>';
}
currenciesOptions += options;
currenciesDatalist.innerHTML = currenciesOptions;
digiCurrenciesDatalist.innerHTML = options;
inputMethod.addEventListener("change", function() {
	if(inputMethod.options[inputMethod.selectedIndex].value == "stocks") {
		stock.style.display = "initial";
		fromCurrency.style.display = "none";
		toCurrency.style.display = "none";	
		submitFormBtn.style.display = "none";
		$('#toCurrency').popover('dispose');	
		$('#stock').popover({content:"Sorry couldn't find a list of stock tickers, hence no validation against list of stock tickets has been done. Kindly input the correct stock symbol", title:"Input Expreesion : One to Eight Letters(All Caps)", placement:"bottom"});
        $('#stock').popover("show");
        setTimeout(function() {
    		$('#stock').popover('dispose');	
        }, 6000);	
	}
	else if(inputMethod.options[inputMethod.selectedIndex].value == "currencies") {
		stock.style.display = "none";
		fromCurrency.style.display = "initial";
		toCurrency.style.display = "initial";	
		submitFormBtn.style.display = "none";
		$('#stock').popover('dispose');
		$('#toCurrency').popover({content:"The API currently supports only conversion of some digital to physical currencies over a limited time", placement:"bottom"});
        $('#toCurrency').popover("show");
    	setTimeout(function() {
    	    $('#toCurrency').popover('dispose');	
        }, 6000);
	}
	else {
		stock.style.display = "none";
		fromCurrency.style.display = "none";
		toCurrency.style.display = "none";
		submitFormBtn.style.display = "none";
		timeFrame.style.display = "none";
		$('#stock').popover('dispose');	
		$('#toCurrency').popover('dispose');	
	}
});
fromCurrency.addEventListener("keyup", function() {
	$('#toCurrency').popover('dispose');	
	if(fromCurrency.value in digiCurrencies && toCurrency.value in phyCurrencies) {
		timeFrame.style.display = "initial";
	}
	else {
		submitFormBtn.style.display = "none";	
		timeFrame.style.display = "none";			
	}
});
toCurrency.addEventListener("keyup", function() {
	$('#toCurrency').popover('dispose');	
	if(fromCurrency.value in digiCurrencies && toCurrency.value in phyCurrencies) {
		timeFrame.style.display = "initial";
	}
	else {
		submitFormBtn.style.display = "none";
		timeFrame.style.display = "none";		
	}
});
stock.addEventListener("keyup", function() {
	if(/^[A-Z]+$/.test(stock.value)) {
		timeFrame.style.display = "initial";
		$('#stock').popover('dispose');
	}
	else {
		submitFormBtn.style.display = "none";
		timeFrame.style.display = "none";
		$('#stock').popover({content:"Input Expreesion : One to Eight Letters(All Caps)", placement:"bottom"});
        $('#stock').popover("show");
        	setTimeout(function() {
        $('#stock').popover('dispose');	
        }, 2000);		
	}
});
timeFrame.addEventListener("change", function() {
	if(timeFrame.options[timeFrame.selectedIndex].value != "select") {
		submitFormBtn.style.display = "initial";
	}
	else {
		submitFormBtn.style.display = "none";		
	}
});
var detailedQuery = new alphaVantage("TKW9PYH77AQ8ITYY");
function fetchData() {
	if(inputMethod.options[inputMethod.selectedIndex].value == "stocks") {
		if(timeFrame.value == "day") {
			detailedQuery.getStockData("day", stock.value);
		}
		if(timeFrame.value == "week") {
			detailedQuery.getStockData("week", stock.value);
		}
		if(timeFrame.value == "month") {
			detailedQuery.getStockDataMonthorYear("month", stock.value);
		}
		if(timeFrame.value == "year") {
			detailedQuery.getStockDataMonthorYear("year", stock.value);
		}
	}
	if(inputMethod.options[inputMethod.selectedIndex].value == "currencies") {
		if(timeFrame.value == "day") {
			detailedQuery.getCurrencyData("day", fromCurrency.value, toCurrency.value);
		}
		if(timeFrame.value == "week") {
			detailedQuery.getCurrencyData("week", fromCurrency.value, toCurrency.value);
		}
		if(timeFrame.value == "month") {
			detailedQuery.getCurrencyDataMonthorYear("month", fromCurrency.value, toCurrency.value);
		}
		if(timeFrame.value == "year") {
			detailedQuery.getCurrencyDataMonthorYear("year", fromCurrency.value, toCurrency.value);
		}
	}
}
function drawChart(dataArray, chartOptions) {
	var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('date', 'Time');
    dataTable.addColumn('number', 'Price');
    dataTable.addRows(dataArray);
    var chart = new google.visualization.LineChart(chartContainer);
    chart.draw(dataTable, chartOptions);
}
google.charts.load('current', {'packages':['corechart']});
$(window).resize(function() {
    if(this.resizeTO) clearTimeout(this.resizeTO);
    this.resizeTO = setTimeout(function() {
        $(this).trigger('resizeEnd');
    }, 500);
});
function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return JSON.stringify(obj) === JSON.stringify({});
}
//redraw graph when window resize is completed  
$(window).on('resizeEnd', function() {
	if(dataArray.length != 0 && !isEmpty(chartOptions)){
		drawChart(dataArray, chartOptions);
	}
});