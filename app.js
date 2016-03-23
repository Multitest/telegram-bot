require('prototypes');
var TelegramBot = require('node-telegram-bot-api');
var geocoder = require('geocoder');
var Promise = require('es6-promise').Promise;

var token = '178205201:AAFncviR9rjSmhHhsUzCksA1tlXdsArj5O0';
var bot = new TelegramBot(token, {
  polling: true
});

var code = 'telegram';
var clients = new Array();
var textCaption = 'Мультитест Бот';
var textWelcome =
  'Привет, я Мультитест Бот, помогаю найти интернет где угодно. Мне говорят адрес, я проверяю покрытие по базе провайдеров и показываю что там есть - тарифы, отзывы. Денег не беру, готов попробовать?';
var textError =
  'Упс, я не смог распознать адрес. Введи свой точный адрес, например "Киев, Николая Бажана просп., 32"';
var textResult =
  'Твой адрес %s? Тогда нажимай на ссылку и сравнивай тарифы';


bot.on('message', function(msg) {
  var chatId = msg.chat.id;

  var getCountry = function(arr) {
    return new Promise(function(resolve, reject) {
      for (var i = 0; i < arr.length; i++) {
        var type = arr[i].types[0];
        if (type == "country") {
          var countryCode = arr[i].short_name;
          resolve(countryCode);
        }
      }
      resolve('ua')
    });
  };

  var errorHandler = function() {
    bot.sendMessage(chatId,
      textError, {
        caption: textCaption
      });
  }

  var getSiteUrl = function(country) {
    return new Promise(function(resolve, reject) {
      switch (country.toUpperCase()) {
        case "UA":
          resolve({
            "site": "http://www.multitest.ua",
            "type": "v-kvartiru"
          });
          break;
        case "RU":
          resolve({
            "site": "http://www.multitest.ru",
            "type": "v-kvartiru"
          });
          break;
        case "PL":
          resolve({
            "site": "http://www.multitest.net.pl",
            "type": "w-mieszkanie",
          });
          break;
        case "US":
          resolve({
            "site": "http://www.multitest.co",
            "type": "apartment",
          });
          break;
        default:
          resolve({
            "site": "https://www.multitest.me",
            "type": "apartment",
          });
      }
    });
  };

  var sendMessage = function(data) {
    bot.sendMessage(chatId,
      textResult
      .format(address), {
        caption: textCaption
      }).then(function(result) {
      bot.sendMessage(chatId,
        '%s/coordinates/internet-%s/?lat=%s&lng=%s&address_text=%s&code=%s'
        .format(
          data.site, data.type, lat, lng, encodeURIComponent(
            address),
          code), {
          caption: textCaption
        });
    });

  };

  if (!clients[msg.from.id]) {
    bot.sendMessage(chatId,
      textWelcome, {
        caption: textCaption
      });
    clients[msg.from.id] = true;
  } else {
    geocoder.geocode(msg.text, function(err, data) {
      if (data.status == 'ZERO_RESULTS') {
        errorHandler();
      } else {
        try {
          address = data.results[0].formatted_address;
          lat = data.results[0].geometry.location.lat;
          lng = data.results[0].geometry.location.lng;
          getCountry(data.results[0].address_components).then(function(
            data) {
            return getSiteUrl(data);
          }).catch(function(error) {
            return errorHandler();
          }).then(function(data) {
            return sendMessage(data);
          }).catch(function(error) {
            return errorHandler();
          });
        } catch (e) {
          return errorHandler();
        }
      }
    });
  }
});
